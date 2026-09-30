import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'assignments');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save Base64 file attachment (PDF / Image) to disk
 */
const saveAssignmentAttachment = (base64String, originalName) => {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
    return { url: base64String || null, type: null };
  }

  try {
    const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return { url: null, type: null };

    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    let ext = 'jpg';
    let type = 'Image';

    if (mimeType === 'application/pdf' || (originalName && originalName.toLowerCase().endsWith('.pdf'))) {
      ext = 'pdf';
      type = 'PDF';
    } else if (mimeType.includes('png')) {
      ext = 'png';
      type = 'Image';
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      ext = 'jpg';
      type = 'Image';
    }

    const fileName = `ASSIGNMENT_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, imageBuffer);
    return {
      url: `/uploads/assignments/${fileName}`,
      type
    };
  } catch (error) {
    console.error('Error saving assignment attachment file:', error);
    return { url: null, type: null };
  }
};

/**
 * GET /api/assignments
 * Fetch assignments list with teacher scoping & class/subject filters
 */
export const getAssignments = async (req, res) => {
  try {
    const { standard, subject, teacherId, search } = req.query;

    let targetTeacherDbId = null;
    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (teacherId || req.query.teacher) {
      const tParam = teacherId || req.query.teacher;
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    let sql = `
      SELECT 
        a.id,
        a.id AS _id,
        a.teacher_id,
        a.class_id,
        a.subject_id,
        a.title,
        a.description,
        a.due_date AS dueDate,
        a.attachment_url AS attachmentUrl,
        a.attachment_name AS attachmentName,
        a.attachment_type AS attachmentType,
        a.status,
        a.created_at AS createdAt,
        a.created_at AS postedDate,
        c.class_name AS standard,
        s.subject_name AS subject,
        t.name AS teacher
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN teachers t ON a.teacher_id = t.id
      WHERE a.status = 'Active'
    `;
    const params = [];

    if (targetTeacherDbId) {
      sql += ` AND a.teacher_id = ?`;
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

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (a.title LIKE ? OR a.description LIKE ? OR c.class_name LIKE ? OR s.subject_name LIKE ?)`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY a.id DESC`;

    const rows = await query(sql, params);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayPlus2 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const formattedAssignments = rows.map(r => {
      const dueStr = r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : todayStr;
      let computedStatus = 'Active';
      if (dueStr < todayStr) {
        computedStatus = 'Overdue';
      } else if (dueStr <= todayPlus2) {
        computedStatus = 'Due Soon';
      }

      return {
        id: r.id,
        _id: r.id,
        title: r.title,
        description: r.description || '',
        standard: r.standard,
        subject: r.subject,
        dueDate: r.dueDate,
        attachmentUrl: r.attachmentUrl ? (r.attachmentUrl.startsWith('http') || r.attachmentUrl.startsWith('data:') ? r.attachmentUrl : `http://localhost:5000${r.attachmentUrl}`) : null,
        attachmentName: r.attachmentName || '',
        attachmentType: r.attachmentType || (r.attachmentUrl && r.attachmentUrl.endsWith('.pdf') ? 'PDF' : 'Image'),
        teacher: r.teacher,
        teacher_id: r.teacher_id,
        status: computedStatus,
        createdAt: r.createdAt,
        postedDate: r.postedDate
      };
    });

    return res.json({
      success: true,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching assignments.' });
  }
};

/**
 * GET /api/assignments/allocations
 * Fetch teacher class & subject allocations for assignment creation
 */
export const getTeacherAssignmentAllocations = async (req, res) => {
  try {
    let targetTeacherDbId = null;
    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (req.query.teacherId) {
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [req.query.teacherId, req.query.teacherId]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    if (!targetTeacherDbId) {
      const [firstActiveTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstActiveTeacher) targetTeacherDbId = firstActiveTeacher.id;
    }

    if (!targetTeacherDbId) {
      return res.json({ success: true, allocations: [] });
    }

    const rows = await query(
      `SELECT c.class_name, s.subject_name
       FROM teacher_class_subjects tcs
       JOIN classes c ON tcs.class_id = c.id
       JOIN subjects s ON tcs.subject_id = s.id
       WHERE tcs.teacher_id = ?
       ORDER BY c.class_name, s.subject_name`,
      [targetTeacherDbId]
    );

    const allocMap = new Map();
    rows.forEach(r => {
      const cls = r.class_name;
      if (!allocMap.has(cls)) {
        allocMap.set(cls, []);
      }
      allocMap.get(cls).push(r.subject_name);
    });

    const allocations = Array.from(allocMap.entries()).map(([standard, subjects]) => ({
      standard,
      subjects: [...new Set(subjects)]
    }));

    return res.json({
      success: true,
      allocations
    });
  } catch (error) {
    console.error('Error fetching teacher assignment allocations:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching assignment allocations.' });
  }
};

/**
 * POST /api/assignments
 * Create & publish assignment for students
 */
export const createAssignment = async (req, res) => {
  try {
    const { title, standard, subject, description, dueDate, attachment, attachmentName } = req.body;

    if (!title || !standard || !subject || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, Standard, Subject, and Due Date are required.' });
    }

    let targetTeacherDbId = null;
    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (req.body.teacherId || req.body.teacher) {
      const tParam = req.body.teacherId || req.body.teacher;
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    if (!targetTeacherDbId) {
      const [firstActiveTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstActiveTeacher) targetTeacherDbId = firstActiveTeacher.id;
    }

    if (!targetTeacherDbId) {
      return res.status(400).json({ success: false, message: 'Valid Teacher profile is required to publish assignments.' });
    }

    // Resolve class_id & subject_id
    const [cRow] = await query(`SELECT id FROM classes WHERE class_name = ?`, [standard]);
    if (!cRow) return res.status(400).json({ success: false, message: `Class '${standard}' not found.` });

    const [sRow] = await query(`SELECT id FROM subjects WHERE subject_name = ?`, [subject]);
    if (!sRow) return res.status(400).json({ success: false, message: `Subject '${subject}' not found.` });

    const classId = cRow.id;
    const subjectId = sRow.id;

    // Verify Teacher Permission
    const [permRow] = await query(
      `SELECT id FROM teacher_class_subjects WHERE teacher_id = ? AND class_id = ? AND subject_id = ?`,
      [targetTeacherDbId, classId, subjectId]
    );

    if (!permRow && req.user && req.user.role === 'teacher') {
      return res.status(400).json({
        success: false,
        message: `PERMISSION DENIED: You are not authorized to create assignments for ${standard} - ${subject}.`
      });
    }

    // Handle File Attachment
    let savedAttachmentUrl = null;
    let savedAttachmentType = null;
    if (attachment) {
      const saved = saveAssignmentAttachment(attachment, attachmentName);
      savedAttachmentUrl = saved.url;
      savedAttachmentType = saved.type;
    }

    const result = await query(
      `INSERT INTO assignments (teacher_id, class_id, subject_id, title, description, due_date, attachment_url, attachment_name, attachment_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [targetTeacherDbId, classId, subjectId, title.trim(), description ? description.trim() : null, dueDate, savedAttachmentUrl, attachmentName || null, savedAttachmentType || null]
    );

    return res.json({
      success: true,
      message: 'Assignment published successfully!',
      assignmentId: result.insertId
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating assignment.' });
  }
};

/**
 * DELETE /api/assignments/:id
 * Delete assignment record
 */
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const [aRow] = await query(`SELECT * FROM assignments WHERE id = ? AND status = 'Active'`, [id]);
    if (!aRow) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (req.user && req.user.role === 'teacher' && req.user.teacher_id && String(aRow.teacher_id) !== String(req.user.teacher_id)) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot delete another teacher\'s assignment.' });
    }

    await query(`DELETE FROM assignments WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Assignment deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting assignment.' });
  }
};

/**
 * GET /api/assignments/student/:studentId
 * Fetch list of assignments for a student's class
 */
export const getStudentAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;

    let targetStudentId = studentId || req.user?.student_id || req.user?.id;
    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const [stdRow] = await query(
      `SELECT s.id, s.class_id, c.class_name AS standard
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = ? OR s.student_id = ?`,
      [targetStudentId, String(targetStudentId)]
    );

    if (!stdRow) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    let sql = `
      SELECT 
        a.id,
        a.id AS _id,
        a.teacher_id,
        a.class_id,
        a.subject_id,
        a.title,
        a.description,
        a.due_date AS dueDate,
        a.attachment_url AS attachmentUrl,
        a.attachment_name AS attachmentName,
        a.attachment_type AS attachmentType,
        a.status,
        a.created_at AS createdAt,
        a.created_at AS postedDate,
        c.class_name AS standard,
        s.subject_name AS subject,
        t.name AS teacher
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN teachers t ON a.teacher_id = t.id
      WHERE a.class_id = ? 
        AND a.status = 'Active'
        AND (
          a.subject_id IN (SELECT subject_id FROM student_subjects WHERE student_id = ?)
          OR NOT EXISTS (SELECT 1 FROM student_subjects WHERE student_id = ?)
        )
    `;
    const params = [stdRow.class_id, stdRow.id, stdRow.id];

    if (subject && subject !== 'All Subjects' && subject !== 'All') {
      sql += ` AND s.subject_name = ?`;
      params.push(subject);
    }

    sql += ` ORDER BY a.id DESC`;

    const rows = await query(sql, params);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayPlus2 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const formattedAssignments = rows.map(r => {
      const dueStr = r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : todayStr;
      let computedStatus = 'Active';
      if (dueStr < todayStr) {
        computedStatus = 'Overdue';
      } else if (dueStr <= todayPlus2) {
        computedStatus = 'Due Soon';
      }

      return {
        id: r.id,
        _id: r.id,
        title: r.title,
        description: r.description || '',
        standard: r.standard,
        subject: r.subject,
        dueDate: r.dueDate,
        attachmentUrl: r.attachmentUrl ? (r.attachmentUrl.startsWith('http') || r.attachmentUrl.startsWith('data:') ? r.attachmentUrl : `http://localhost:5000${r.attachmentUrl}`) : null,
        attachmentName: r.attachmentName || '',
        attachmentType: r.attachmentType || (r.attachmentUrl && r.attachmentUrl.endsWith('.pdf') ? 'PDF' : 'Image'),
        teacher: r.teacher,
        teacher_id: r.teacher_id,
        status: computedStatus,
        createdAt: r.createdAt,
        postedDate: r.postedDate
      };
    });

    return res.json({
      success: true,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching student assignments.' });
  }
};
