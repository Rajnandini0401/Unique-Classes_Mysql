import { query } from '../config/db.js';
import { normalizeSubject } from '../src/utils/subjectUtils.js';

/**
 * GET /api/tests
 * Fetch tests list with teacher scoping & class/subject filters
 */
export const getTests = async (req, res) => {
  try {
    const { standard, subject, teacher, date, search } = req.query;

    let targetTeacherDbId = null;
    if (req.user && req.user.role === 'teacher' && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (teacher) {
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [teacher, teacher]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    let sql = `
      SELECT 
        t.id,
        t.id AS _id,
        t.teacher_id,
        t.class_id,
        t.subject_id,
        t.title,
        t.title AS testName,
        t.description,
        DATE_FORMAT(t.test_date, '%Y-%m-%d') AS testDate,
        DATE_FORMAT(t.test_date, '%Y-%m-%d') AS date,
        t.total_marks AS totalMarks,
        t.status AS dbStatus,
        t.created_at AS createdAt,
        c.class_name AS standard,
        c.class_name AS className,
        s.subject_name AS subject,
        tech.name AS teacher,
        (SELECT COUNT(*) FROM test_results tr WHERE tr.test_id = t.id) AS resultsCount
      FROM tests t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN teachers tech ON t.teacher_id = tech.id
      WHERE 1=1
    `;
    const params = [];

    if (targetTeacherDbId) {
      sql += ` AND t.teacher_id = ?`;
      params.push(targetTeacherDbId);
    }

    if (standard && standard !== 'Select Class' && standard !== 'All Classes' && standard !== 'All Standards' && standard !== 'All') {
      sql += ` AND c.class_name = ?`;
      params.push(standard);
    }

    if (subject && subject !== 'All Subjects' && subject !== 'All') {
      sql += ` AND s.subject_name = ?`;
      params.push(subject);
    }

    if (date) {
      sql += ` AND t.test_date = ?`;
      params.push(date);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (t.title LIKE ? OR c.class_name LIKE ? OR s.subject_name LIKE ?)`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY t.test_date DESC, t.id DESC`;

    const rows = await query(sql, params);

    const formattedTests = rows.map(r => {
      const formattedDate = r.testDate ? String(r.testDate).slice(0, 10) : '';
      const marksSubmitted = r.resultsCount > 0;
      const computedStatus = marksSubmitted ? 'Completed' : (r.dbStatus || 'Scheduled');

      return {
        id: r.id,
        _id: r.id,
        title: r.title,
        testName: r.testName,
        standard: r.standard,
        className: r.className,
        subject: r.subject,
        testDate: formattedDate,
        date: formattedDate,
        totalMarks: r.totalMarks,
        description: r.description || '',
        teacher: r.teacher,
        teacher_id: r.teacher_id,
        status: computedStatus,
        marksSubmitted,
        resultsCount: r.resultsCount,
        createdAt: r.createdAt
      };
    });

    return res.json({
      success: true,
      tests: formattedTests
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching tests.' });
  }
};

/**
 * GET /api/tests/:id
 * Fetch single test details by ID
 */
export const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await query(
      `SELECT 
        t.id,
        t.id AS _id,
        t.teacher_id,
        t.class_id,
        t.subject_id,
        t.title,
        t.title AS testName,
        t.description,
        DATE_FORMAT(t.test_date, '%Y-%m-%d') AS testDate,
        DATE_FORMAT(t.test_date, '%Y-%m-%d') AS date,
        t.total_marks AS totalMarks,
        t.status AS dbStatus,
        c.class_name AS standard,
        c.class_name AS className,
        s.subject_name AS subject,
        tech.name AS teacher,
        (SELECT COUNT(*) FROM test_results tr WHERE tr.test_id = t.id) AS resultsCount
       FROM tests t
       JOIN classes c ON t.class_id = c.id
       JOIN subjects s ON t.subject_id = s.id
       JOIN teachers tech ON t.teacher_id = tech.id
       WHERE t.id = ?`,
      [id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    const formattedDate = row.testDate ? String(row.testDate).slice(0, 10) : '';
    const marksSubmitted = row.resultsCount > 0;

    return res.json({
      success: true,
      test: {
        id: row.id,
        _id: row.id,
        title: row.title,
        testName: row.testName,
        standard: row.standard,
        className: row.className,
        subject: row.subject,
        testDate: formattedDate,
        date: formattedDate,
        totalMarks: row.totalMarks,
        description: row.description || '',
        teacher: row.teacher,
        teacher_id: row.teacher_id,
        status: marksSubmitted ? 'Completed' : (row.dbStatus || 'Scheduled'),
        marksSubmitted,
        resultsCount: row.resultsCount
      }
    });
  } catch (error) {
    console.error('Error fetching test by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching test.' });
  }
};

/**
 * POST /api/tests
 * Create a new examination/test
 */
export const createTest = async (req, res) => {
  try {
    const { title, testName, standard, className, subject, teacher, testDate, date, totalMarks, description } = req.body;

    const testTitle = (title || testName || '').trim();
    const targetClass = (standard || className || '').trim();
    const rawSubject = (subject || '').trim();
    const targetDate = testDate || date;
    const marks = Number(totalMarks) || 50;

    if (!testTitle || !targetClass || !rawSubject || !targetDate) {
      return res.status(400).json({ success: false, message: 'Test Name, Standard, Subject, and Test Date are required.' });
    }

    const canonicalSubject = normalizeSubject ? normalizeSubject(rawSubject, targetClass) : rawSubject;

    // Resolve class_id & subject_id
    const [cRow] = await query(`SELECT id FROM classes WHERE class_name = ?`, [targetClass]);
    if (!cRow) return res.status(400).json({ success: false, message: `Class '${targetClass}' not found.` });

    const [sRow] = await query(`SELECT id FROM subjects WHERE subject_name = ?`, [canonicalSubject]);
    if (!sRow) return res.status(400).json({ success: false, message: `Subject '${canonicalSubject}' not found.` });

    const classId = cRow.id;
    const subjectId = sRow.id;

    let targetTeacherDbId = null;
    if (req.user && req.user.role === 'teacher' && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (teacher) {
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [teacher, teacher]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    if (!targetTeacherDbId) {
      // Find assigned teacher for class and subject if available, or first active teacher
      const [assignedRow] = await query(
        `SELECT tcs.teacher_id FROM teacher_class_subjects tcs WHERE tcs.class_id = ? AND tcs.subject_id = ? LIMIT 1`,
        [classId, subjectId]
      );
      if (assignedRow) {
        targetTeacherDbId = assignedRow.teacher_id;
      } else {
        const [firstTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
        if (firstTeacher) targetTeacherDbId = firstTeacher.id;
      }
    }

    if (!targetTeacherDbId) {
      return res.status(400).json({ success: false, message: 'Valid Teacher profile is required to create tests.' });
    }

    // Verify Teacher Permission if request is made by a teacher
    if (req.user && req.user.role === 'teacher') {
      const [permRow] = await query(
        `SELECT id FROM teacher_class_subjects WHERE teacher_id = ? AND class_id = ? AND subject_id = ?`,
        [targetTeacherDbId, classId, subjectId]
      );
      if (!permRow) {
        return res.status(400).json({
          success: false,
          message: `PERMISSION DENIED: You are not authorized to create tests for ${targetClass} - ${canonicalSubject}.`
        });
      }
    }

    const result = await query(
      `INSERT INTO tests (teacher_id, class_id, subject_id, title, description, test_date, total_marks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [targetTeacherDbId, classId, subjectId, testTitle, description ? description.trim() : `${targetClass} - ${canonicalSubject} Test`, targetDate, marks]
    );

    return res.json({
      success: true,
      message: 'Test created successfully!',
      testId: result.insertId,
      _id: result.insertId
    });
  } catch (error) {
    console.error('Error creating test:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating test.' });
  }
};

/**
 * PUT /api/tests/:id
 * Update test details
 */
export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, testName, standard, className, subject, testDate, date, totalMarks, description, status } = req.body;

    const [tRow] = await query(`SELECT * FROM tests WHERE id = ?`, [id]);
    if (!tRow) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    if (req.user && req.user.role === 'teacher' && req.user.teacher_id && String(tRow.teacher_id) !== String(req.user.teacher_id)) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot edit another teacher\'s test.' });
    }

    const newTitle = (title || testName || tRow.title).trim();
    const newDate = testDate || date || tRow.test_date;
    const newMarks = totalMarks ? Number(totalMarks) : tRow.total_marks;
    const newDesc = description !== undefined ? description : tRow.description;
    const newStatus = status || tRow.status;

    await query(
      `UPDATE tests SET title = ?, description = ?, test_date = ?, total_marks = ?, status = ? WHERE id = ?`,
      [newTitle, newDesc, newDate, newMarks, newStatus, id]
    );

    return res.json({
      success: true,
      message: 'Test updated successfully!'
    });
  } catch (error) {
    console.error('Error updating test:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating test.' });
  }
};

/**
 * DELETE /api/tests/:id
 * Delete test record and associated results
 */
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const [tRow] = await query(`SELECT * FROM tests WHERE id = ?`, [id]);
    if (!tRow) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    if (req.user && req.user.role === 'teacher' && req.user.teacher_id && String(tRow.teacher_id) !== String(req.user.teacher_id)) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot delete another teacher\'s test.' });
    }

    await query(`DELETE FROM test_results WHERE test_id = ?`, [id]);
    await query(`DELETE FROM tests WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Test and associated student marks deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting test.' });
  }
};
