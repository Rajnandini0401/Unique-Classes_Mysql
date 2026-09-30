import { query } from '../config/db.js';
import { processWhatsAppWebAutomation } from '../services/whatsappAutomationService.js';



/**
 * POST /api/results
 * Create or bulk update student marks for a given test
 */
export const createResults = async (req, res) => {
  try {
    const { test, results } = req.body;

    if (!test || !Array.isArray(results)) {
      return res.status(400).json({ success: false, message: 'Test ID and results array are required.' });
    }

    // Resolve test ID
    const [tRow] = await query(`SELECT id FROM tests WHERE id = ?`, [test]);
    if (!tRow) {
      return res.status(404).json({ success: false, message: 'Test record not found.' });
    }
    const testDbId = tRow.id;

    for (const item of results) {
      const { student, status, marksObtained } = item;
      if (!student) continue;

      // Resolve student DB ID
      let studentDbId = null;
      if (typeof student === 'number' || !isNaN(Number(student))) {
        const [sRow] = await query(`SELECT id FROM students WHERE id = ? OR student_id = ?`, [Number(student), student]);
        if (sRow) studentDbId = sRow.id;
      } else if (typeof student === 'string') {
        const [sRow] = await query(`SELECT id FROM students WHERE student_id = ? OR id = ?`, [student, student]);
        if (sRow) studentDbId = sRow.id;
      } else if (typeof student === 'object' && student._id) {
        studentDbId = student._id;
      }

      if (!studentDbId) continue;

      const marksVal = status === 'ABSENT' ? null : (marksObtained !== null && marksObtained !== undefined ? Number(marksObtained) : 0);
      const studentStatus = status === 'ABSENT' ? 'ABSENT' : 'PRESENT';

      await query(
        `INSERT INTO test_results (test_id, student_id, marks_obtained, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), status = VALUES(status), updated_at = NOW()`,
        [testDbId, studentDbId, marksVal, studentStatus]
      );
    }

    // Update test status to Completed
    await query(`UPDATE tests SET status = 'Completed' WHERE id = ?`, [testDbId]);

    return res.json({
      success: true,
      message: 'Student marks saved successfully!'
    });
  } catch (error) {
    console.error('Error saving test results:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving test scores.' });
  }
};

/**
 * GET /api/results/test/:testId
 * Fetch student results for a specific test ID
 */
export const getResultsByTest = async (req, res) => {
  try {
    const { testId } = req.params;

    const rows = await query(
      `SELECT 
        tr.id,
        tr.id AS _id,
        tr.test_id AS test,
        tr.marks_obtained AS marksObtained,
        tr.status,
        tr.notification_sent AS notificationSent,
        tr.created_at AS createdAt,
        st.id AS studentDbId,
        st.student_id AS studentBusinessId,
        st.full_name AS studentName,
        st.roll_no AS rollNo
       FROM test_results tr
       JOIN students st ON tr.student_id = st.id
       WHERE tr.test_id = ?
       ORDER BY CAST(st.roll_no AS UNSIGNED) ASC, st.full_name ASC`,
      [testId]
    );

    const formattedResults = rows.map(r => ({
      id: r.id,
      _id: r.id,
      test: r.test,
      status: r.status,
      marksObtained: r.status === 'ABSENT' ? null : (r.marksObtained !== null ? Number(r.marksObtained) : 0),
      notificationSent: Boolean(r.notificationSent),
      student: {
        id: r.studentDbId,
        _id: r.studentDbId,
        name: r.studentName,
        full_name: r.studentName,
        studentId: r.studentBusinessId,
        rollNo: r.rollNo || '-'
      }
    }));

    return res.json({
      success: true,
      results: formattedResults
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching test results.' });
  }
};

/**
 * GET /api/results/student/:studentId
 * Fetch test result history for a specific student
 */
export const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [sRow] = await query(`SELECT id FROM students WHERE id = ? OR student_id = ?`, [studentId, String(studentId)]);
    if (!sRow) {
      return res.json({ success: true, results: [] });
    }

    const rows = await query(
      `SELECT 
        tr.id,
        tr.id AS _id,
        tr.marks_obtained AS marksObtained,
        tr.status,
        t.title AS testTitle,
        t.title AS testName,
        t.total_marks AS totalMarks,
        t.test_date AS testDate,
        c.class_name AS standard,
        s.subject_name AS subject
       FROM test_results tr
       JOIN tests t ON tr.test_id = t.id
       JOIN classes c ON t.class_id = c.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE tr.student_id = ?
       ORDER BY t.test_date DESC, tr.id DESC`,
      [sRow.id]
    );

    const formattedResults = rows.map(r => {
      const isAbsent = r.status === 'ABSENT' || r.marksObtained === null;
      const obt = isAbsent ? 0 : Number(r.marksObtained);
      const tot = Number(r.totalMarks) || 50;
      const pct = tot > 0 ? ((obt / tot) * 100).toFixed(1) : '0';

      return {
        id: r.id,
        _id: r.id,
        testTitle: r.testTitle || r.testName || 'Test',
        testName: r.testName || r.testTitle || 'Test',
        standard: r.standard,
        subject: r.subject,
        testDate: r.testDate ? new Date(r.testDate).toISOString().slice(0, 10) : '',
        totalMarks: tot,
        marksObtained: isAbsent ? 'ABSENT' : obt,
        percentage: isAbsent ? 'ABSENT' : `${Number(pct)}%`,
        status: isAbsent ? 'ABSENT' : (Number(pct) >= 35 ? 'PASSED' : 'FAILED')
      };
    });

    return res.json({
      success: true,
      results: formattedResults
    });
  } catch (error) {
    console.error('Error fetching student test results:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching student test results.' });
  }
};

/**
 * GET /api/results/leaderboard
 * Fetch class leaderboard based on top performers
 */
export const getClassLeaderboard = async (req, res) => {
  try {
    const { standard } = req.query;

    let sql = `
      SELECT 
        st.id AS studentDbId,
        st.student_id AS studentBusinessId,
        st.full_name AS studentName,
        c.class_name AS standard,
        SUM(CASE WHEN tr.status = 'PRESENT' THEN tr.marks_obtained ELSE 0 END) AS totalScored,
        SUM(CASE WHEN tr.status = 'PRESENT' THEN t.total_marks ELSE 0 END) AS maxTotal,
        COUNT(tr.id) AS testsCount
      FROM students st
      JOIN classes c ON st.class_id = c.id
      JOIN test_results tr ON st.id = tr.student_id
      JOIN tests t ON tr.test_id = t.id
      WHERE st.status = 'Active'
    `;
    const params = [];

    if (standard && standard !== 'All') {
      sql += ` AND c.class_name = ?`;
      params.push(standard);
    }

    sql += ` GROUP BY st.id HAVING testsCount > 0 ORDER BY totalScored DESC LIMIT 10`;

    const rows = await query(sql, params);

    const leaderboard = rows.map((r, index) => {
      const percentage = r.maxTotal > 0 ? ((r.totalScored / r.maxTotal) * 100).toFixed(1) : 0;
      return {
        rank: index + 1,
        studentId: r.studentBusinessId,
        name: r.studentName,
        standard: r.standard,
        totalScored: Number(r.totalScored),
        maxTotal: Number(r.maxTotal),
        percentage: Number(percentage)
      };
    });

    return res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching leaderboard.' });
  }
};

/**
 * PUT /api/results/:id
 * Update individual test result entry
 */
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, status } = req.body;

    const [rRow] = await query(`SELECT * FROM test_results WHERE id = ?`, [id]);
    if (!rRow) {
      return res.status(404).json({ success: false, message: 'Result record not found.' });
    }

    const marksVal = status === 'ABSENT' ? null : (marksObtained !== undefined ? Number(marksObtained) : rRow.marks_obtained);
    const newStatus = status || rRow.status;

    await query(`UPDATE test_results SET marks_obtained = ?, status = ? WHERE id = ?`, [marksVal, newStatus, id]);

    return res.json({
      success: true,
      message: 'Student score updated successfully!'
    });
  } catch (error) {
    console.error('Error updating result:', error);
    return res.status(500).json({ success: false, message: 'Server error updating student score.' });
  }
};

/**
 * POST /api/results/send-whatsapp
 * Send WhatsApp Web notification to absent students for a test
 */
export const sendTestAbsentWhatsApp = async (req, res) => {
  try {
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({ success: false, message: 'Test ID is required.' });
    }

    const [tRow] = await query(
      `SELECT t.id, t.title, DATE_FORMAT(t.test_date, '%Y-%m-%d') AS test_date, c.class_name AS standard, s.subject_name AS subject
       FROM tests t
       JOIN classes c ON t.class_id = c.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.id = ?`,
      [testId]
    );

    if (!tRow) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    const absentees = await query(
      `SELECT tr.id AS resultId, st.id AS studentDbId, st.full_name AS studentName, st.mobile, st.whatsapp_number
       FROM test_results tr
       JOIN students st ON tr.student_id = st.id
       WHERE tr.test_id = ? AND tr.status = 'ABSENT'`,
      [testId]
    );

    if (absentees.length === 0) {
      return res.json({
        success: true,
        message: 'No absent students found for this test.',
        whatsappNotifications: {
          total: 0,
          sent: 0,
          failed: 0,
          code: 'NO_ABSENT_STUDENTS',
          results: []
        }
      });
    }

    // Call Playwright WhatsApp Web Browser Automation Engine
    const automationResult = await processWhatsAppWebAutomation({
      absentees,
      date: tRow.test_date,
      subject: `${tRow.subject || 'Mathematics'} (${tRow.title || 'Test'})`,
      classTime: 'Test Assessment'
    });

    for (const std of absentees) {
      await query(`UPDATE test_results SET notification_sent = 1 WHERE id = ?`, [std.resultId]);
    }

    return res.json({
      success: automationResult.success !== false,
      message: automationResult.message,
      whatsappNotifications: {
        total: automationResult.total,
        sent: automationResult.sent,
        failed: automationResult.failed,
        code: automationResult.code,
        isAutomated: true,
        results: automationResult.results
      }
    });
  } catch (error) {
    console.error('Error sending WhatsApp notifications:', error);
    return res.status(500).json({ success: false, message: 'Server error sending WhatsApp notices via automation.' });
  }
};



