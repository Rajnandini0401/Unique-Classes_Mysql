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

/**
 * GET /api/results/public-toppers
 * Fetch Weekly Test Toppers for public website (Home Page & Results Page)
 * Automatically groups tests, computes top scorers per test, and identifies joint toppers.
 */
export const getPublicTestToppers = async (req, res) => {
  try {
    const { standard, latestOnly } = req.query;

    let sql = `
      SELECT 
        t.id AS testId,
        t.title AS testTitle,
        c.class_name AS standard,
        s.subject_name AS subjectName,
        t.total_marks AS totalMarks,
        DATE_FORMAT(t.test_date, '%d %b %Y') AS testDate,
        CAST(tr.marks_obtained AS DECIMAL(5,2)) AS marksObtained,
        st.id AS studentDbId,
        st.student_id AS studentBusinessId,
        st.full_name AS studentName,
        st.photo AS studentPhoto,
        COALESCE(st.school_name, 'Unique Classes - Nilanga') AS schoolName
      FROM tests t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN test_results tr ON t.id = tr.test_id
      JOIN students st ON tr.student_id = st.id
      WHERE tr.status = 'PRESENT'
    `;
    const params = [];

    if (standard && standard !== 'ALL' && standard !== 'All' && standard !== 'All Classes') {
      sql += ` AND c.class_name = ?`;
      params.push(standard);
    }

    sql += ` ORDER BY t.test_date DESC, t.id DESC, marksObtained DESC`;

    const rows = await query(sql, params);

    // Group rows by testId
    const testMap = new Map();
    for (const r of rows) {
      if (!testMap.has(r.testId)) {
        const rawClass = r.standard || '';
        const formattedClass = rawClass.endsWith('th')
          ? `${rawClass} Standard`
          : (rawClass.toLowerCase().includes('science') || rawClass.toLowerCase().includes('navodaya') ? rawClass : `${rawClass} Class`);

        let testDisplayTitle = r.testTitle || `${r.subjectName} Test`;
        if (
          !testDisplayTitle.toLowerCase().includes('test') &&
          !testDisplayTitle.toLowerCase().includes('exam') &&
          !testDisplayTitle.toLowerCase().includes('assessment')
        ) {
          testDisplayTitle = `${testDisplayTitle} Assessment`;
        }

        testMap.set(r.testId, {
          id: `res-${r.testId}`,
          testId: r.testId,
          class: formattedClass,
          classKey: r.standard,
          testName: testDisplayTitle,
          subject: r.subjectName,
          totalMarks: Number(r.totalMarks) || 50,
          testDate: r.testDate,
          allRows: []
        });
      }
      testMap.get(r.testId).allRows.push(r);
    }

    // If latestOnly is requested, retain only the latest test per class
    let testGroups = Array.from(testMap.values());
    if (latestOnly === 'true' || latestOnly === true) {
      const seenClasses = new Set();
      testGroups = testGroups.filter(g => {
        const cKey = (g.classKey || '').toLowerCase();
        if (!seenClasses.has(cKey)) {
          seenClasses.add(cKey);
          return true;
        }
        return false;
      });
    }

    const dynamicResults = [];
    for (const group of testGroups) {
      if (!group.allRows.length) continue;

      // Extract unique marks obtained in descending order to identify 1st and 2nd rank
      const uniqueScores = [...new Set(group.allRows.map(x => Number(x.marksObtained)))].sort((a, b) => b - a);
      if (uniqueScores.length === 0) continue;

      const rank1Score = uniqueScores[0];
      const rank2Score = uniqueScores.length > 1 ? uniqueScores[1] : null;
      const rank3Score = uniqueScores.length > 2 ? uniqueScores[2] : null;

      const rank1Rows = group.allRows.filter(x => Number(x.marksObtained) === rank1Score);
      const rank2Rows = rank2Score !== null ? group.allRows.filter(x => Number(x.marksObtained) === rank2Score) : [];
      const rank3Rows = rank3Score !== null ? group.allRows.filter(x => Number(x.marksObtained) === rank3Score) : [];

      const isJoint1 = rank1Rows.length > 1;
      const isJoint2 = rank2Rows.length > 1;
      const isJoint3 = rank3Rows.length > 1;

      // Map 1st, 2nd, and 3rd rankers
      const toppers = [
        ...rank1Rows.map(s => {
          const marks = Number(s.marksObtained);
          const pctVal = group.totalMarks > 0 ? ((marks / group.totalMarks) * 100).toFixed(0) : '0';
          return {
            id: s.studentBusinessId || `student-${s.studentDbId}`,
            name: s.studentName,
            marks: marks,
            percentage: `${pctVal}%`,
            rank: 1,
            badge: isJoint1 ? 'Joint 1st Rank' : '1st Rank',
            school: s.schoolName,
            photo: s.studentPhoto || ''
          };
        }),
        ...rank2Rows.map(s => {
          const marks = Number(s.marksObtained);
          const pctVal = group.totalMarks > 0 ? ((marks / group.totalMarks) * 100).toFixed(0) : '0';
          return {
            id: s.studentBusinessId || `student-${s.studentDbId}`,
            name: s.studentName,
            marks: marks,
            percentage: `${pctVal}%`,
            rank: 2,
            badge: isJoint2 ? 'Joint 2nd Rank' : '2nd Rank',
            school: s.schoolName,
            photo: s.studentPhoto || ''
          };
        }),
        ...rank3Rows.map(s => {
          const marks = Number(s.marksObtained);
          const pctVal = group.totalMarks > 0 ? ((marks / group.totalMarks) * 100).toFixed(0) : '0';
          return {
            id: s.studentBusinessId || `student-${s.studentDbId}`,
            name: s.studentName,
            marks: marks,
            percentage: `${pctVal}%`,
            rank: 3,
            badge: isJoint3 ? 'Joint 3rd Rank' : '3rd Rank',
            school: s.schoolName,
            photo: s.studentPhoto || ''
          };
        })
      ];

      dynamicResults.push({
        id: group.id,
        testId: group.testId,
        class: group.class,
        classKey: group.classKey,
        testName: group.testName,
        totalMarks: group.totalMarks,
        testDate: group.testDate,
        isJointToppers: isJoint1,
        hasRank2: rank2Rows.length > 0,
        toppers: toppers
      });
    }

    // Build distinct student toppers list directly from database rows for showcase cards
    const studentMap = new Map();
    for (const r of rows) {
      const studentKey = r.studentBusinessId || `student-${r.studentDbId}`;
      const marks = Number(r.marksObtained);
      const totalMarks = Number(r.totalMarks) || 50;
      const pct = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;

      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          id: studentKey,
          name: r.studentName,
          board: r.standard || '10th',
          classKey: r.standard || '10th',
          category: r.standard || '10th',
          school: r.schoolName || 'Unique Classes Nilanga',
          photo: r.studentPhoto || '',
          highestPct: pct,
          marks: `${marks}/${totalMarks}`,
          rank: '1st Rank',
          subjects: [],
          year: '2026'
        });
      }

      const stObj = studentMap.get(studentKey);
      if (pct > stObj.highestPct) {
        stObj.highestPct = pct;
        stObj.marks = `${marks}/${totalMarks}`;
      }
      // Add subject if not already recorded
      if (!stObj.subjects.some(sub => sub.name === (r.subjectName || r.testTitle))) {
        stObj.subjects.push({
          name: r.subjectName || r.testTitle || 'Main Subject',
          score: `${marks}/${totalMarks}`
        });
      }
    }

    const studentToppers = Array.from(studentMap.values())
      .map(s => ({
        ...s,
        percentage: `${Math.round(s.highestPct)}%`,
        review: `Scored top marks in ${s.subjects.map(x => x.name).slice(0, 2).join(' & ')} with regular mock test series and faculty guidance at Unique Classes Nilanga.`
      }))
      .sort((a, b) => b.highestPct - a.highestPct);

    return res.json({
      success: true,
      count: dynamicResults.length,
      data: dynamicResults,
      studentToppers: studentToppers
    });
  } catch (error) {
    console.error('Error fetching public test toppers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching test toppers.',
      error: error.message
    });
  }
};



