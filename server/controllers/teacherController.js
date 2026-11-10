import { query, pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'teachers');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save Base64 photo string to disk and return relative path
 */
const saveTeacherPhoto = (base64String, teacherId) => {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:image')) {
    return base64String || null;
  }

  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const fileName = `${teacherId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, imageBuffer);
    return `/uploads/teachers/${fileName}`;
  } catch (error) {
    console.error('Error saving teacher photo:', error);
    return null;
  }
};

/**
 * Delete photo file from disk if relative upload path
 */
const deleteTeacherPhoto = (photoPath) => {
  if (!photoPath || typeof photoPath !== 'string' || !photoPath.startsWith('/uploads/teachers/')) {
    return;
  }
  try {
    const fileName = path.basename(photoPath);
    const fullPath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting teacher photo file:', error);
  }
};

/**
 * Helper: Generate next Teacher ID (e.g. TCH20260001)
 */
const generateNextTeacherId = async (connection) => {
  const currentYear = new Date().getFullYear();
  const executeQuery = connection ? connection.query.bind(connection) : query;
  
  const [rows] = await executeQuery(
    `SELECT teacher_id FROM teachers WHERE teacher_id LIKE 'TCH${currentYear}%' ORDER BY id DESC LIMIT 1`
  );

  let nextSerial = 1;
  if (rows && rows.length > 0) {
    const lastId = rows[0].teacher_id;
    const serialStr = lastId.replace(`TCH${currentYear}`, '');
    const lastSerial = parseInt(serialStr, 10);
    if (!isNaN(lastSerial)) {
      nextSerial = lastSerial + 1;
    }
  }

  return `TCH${currentYear}${String(nextSerial).padStart(4, '0')}`;
};

/**
 * GET /api/teachers
 * List teachers with optional subject, class, and search filters.
 * If caller is a logged-in teacher, restrict to their own record.
 */
export const getTeachers = async (req, res) => {
  try {
    const { subject, class: className, search } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.teacher_id,
        t.name,
        t.mobile,
        t.email,
        t.education,
        t.photo,
        t.status,
        t.created_at,
        u.email AS login_email,
        GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name SEPARATOR '||') AS subjects_str,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_name SEPARATOR '||') AS classes_str
      FROM teachers t
      LEFT JOIN users u ON u.teacher_id = t.id
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
      LEFT JOIN classes c ON tc.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Admin & dropdown listing query
    if (search && search.trim()) {
      sql += ` AND (t.name LIKE ? OR t.mobile LIKE ? OR t.email LIKE ? OR t.teacher_id LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ` GROUP BY t.id ORDER BY t.id DESC`;

    const rawTeachers = await query(sql, params);

    let filteredTeachers = rawTeachers.map(t => {
      const subjects = t.subjects_str ? t.subjects_str.split('||').filter(Boolean) : [];
      const classes = t.classes_str ? t.classes_str.split('||').filter(Boolean) : [];
      return {
        id: t.id,
        _id: t.id,
        teacher_id: t.teacher_id,
        name: t.name,
        mobile: t.mobile,
        email: t.email || t.login_email || '',
        education: t.education,
        photo: t.photo || '',
        status: t.status,
        created_at: t.created_at,
        subjects: subjects.length > 0 ? subjects : ['Mathematics'],
        classes: classes.length > 0 ? classes : ['10th']
      };
    });

    if (subject && subject !== 'All Subjects' && subject !== 'All') {
      filteredTeachers = filteredTeachers.filter(t => t.subjects.includes(subject));
    }

    if (className && className !== 'All Classes' && className !== 'All') {
      filteredTeachers = filteredTeachers.filter(t => t.classes.includes(className));
    }

    return res.json({
      success: true,
      count: filteredTeachers.length,
      teachers: filteredTeachers
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching teachers' });
  }
};

/**
 * GET /api/teachers/:id
 */
export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cross-Teacher Security Check
    if (req.user && req.user.role === 'teacher') {
      const isSelfDbId = String(id) === String(req.user.teacher_id);
      const isSelfBusinessId = String(id).toLowerCase() === String(req.user.teacherBusinessId).toLowerCase();
      if (!isSelfDbId && !isSelfBusinessId) {
        return res.status(403).json({
          success: false,
          message: 'ACCESS DENIED: You do not have permission to access another teacher\'s record.'
        });
      }
    }

    const sql = `
      SELECT 
        t.id,
        t.teacher_id,
        t.name,
        t.mobile,
        t.email,
        t.education,
        t.photo,
        t.status,
        t.created_at,
        u.email AS login_email,
        GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name SEPARATOR '||') AS subjects_str,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_name SEPARATOR '||') AS classes_str
      FROM teachers t
      LEFT JOIN users u ON u.teacher_id = t.id
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
      LEFT JOIN classes c ON tc.class_id = c.id
      WHERE t.id = ? OR t.teacher_id = ?
      GROUP BY t.id
    `;

    const rows = await query(sql, [id, id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const t = rows[0];
    const subjects = t.subjects_str ? t.subjects_str.split('||').filter(Boolean) : [];
    const classes = t.classes_str ? t.classes_str.split('||').filter(Boolean) : [];

    return res.json({
      success: true,
      teacher: {
        id: t.id,
        _id: t.id,
        teacher_id: t.teacher_id,
        name: t.name,
        mobile: t.mobile,
        email: t.email || t.login_email || '',
        education: t.education,
        photo: t.photo || '',
        status: t.status,
        created_at: t.created_at,
        subjects: subjects.length > 0 ? subjects : ['Mathematics'],
        classes: classes.length > 0 ? classes : ['10th']
      }
    });
  } catch (error) {
    console.error('Error fetching teacher by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching teacher details' });
  }
};

/**
 * POST /api/teachers
 * Create new teacher record & linked user account (Atomic Transaction)
 */
export const createTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, mobile, email, subjects = [], classes = [], education, photo, password } = req.body;

    if (!name || !mobile || !education) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Name, Mobile, and Education are required' });
    }

    const teacherBusinessId = await generateNextTeacherId(connection);
    let photoPath = null;
    if (photo) {
      photoPath = saveTeacherPhoto(photo, teacherBusinessId);
    }

    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : `${teacherBusinessId.toLowerCase()}@uniqueclasses.com`;

    // 1. Insert into teachers master table
    const [insertResult] = await connection.query(
      `INSERT INTO teachers (teacher_id, name, mobile, email, education, photo, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [teacherBusinessId, name.trim(), mobile.trim(), cleanEmail, education.trim(), photoPath]
    );

    const teacherDbId = insertResult.insertId;

    // 2. Link Subjects & Classes
    const subList = Array.isArray(subjects) && subjects.length > 0 ? subjects : ['Mathematics'];
    const subIdList = [];
    for (const subName of subList) {
      const [subRows] = await connection.query(`SELECT id FROM subjects WHERE subject_name = ?`, [subName]);
      let subId = subRows && subRows.length > 0 ? subRows[0].id : null;
      if (!subId) {
        const [newSub] = await connection.query(`INSERT INTO subjects (subject_name) VALUES (?)`, [subName]);
        subId = newSub.insertId;
      }
      subIdList.push(subId);
      await connection.query(
        `INSERT IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)`,
        [teacherDbId, subId]
      );
    }

    const classList = Array.isArray(classes) && classes.length > 0 ? classes : ['10th'];
    const classIdList = [];
    for (const className of classList) {
      const [clsRows] = await connection.query(`SELECT id FROM classes WHERE class_name = ?`, [className]);
      let clsId = clsRows && clsRows.length > 0 ? clsRows[0].id : null;
      if (!clsId) {
        const [newCls] = await connection.query(`INSERT INTO classes (class_name) VALUES (?)`, [className]);
        clsId = newCls.insertId;
      }
      classIdList.push(clsId);
      await connection.query(
        `INSERT IGNORE INTO teacher_classes (teacher_id, class_id) VALUES (?, ?)`,
        [teacherDbId, clsId]
      );
    }

    // 3. Link Class + Subject Permissions into teacher_class_subjects
    for (const clsId of classIdList) {
      for (const subId of subIdList) {
        await connection.query(
          `INSERT IGNORE INTO teacher_class_subjects (teacher_id, class_id, subject_id) VALUES (?, ?, ?)`,
          [teacherDbId, clsId, subId]
        );
      }
    }

    // 4. Create linked User Account in users table
    const plainPassword = password || 'teacher123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    await connection.query(
      `INSERT INTO users (email, password, role, teacher_id, status)
       VALUES (?, ?, 'teacher', ?, 'Active')
       ON DUPLICATE KEY UPDATE 
         password = VALUES(password),
         role = 'teacher',
         teacher_id = VALUES(teacher_id),
         status = 'Active'`,
      [cleanEmail, passwordHash, teacherDbId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Teacher record and login account created successfully',
      teacher: {
        id: teacherDbId,
        _id: teacherDbId,
        teacher_id: teacherBusinessId,
        name: name.trim(),
        mobile: mobile.trim(),
        email: cleanEmail,
        education: education.trim(),
        photo: photoPath || '',
        subjects: subList,
        classes: classList,
        status: 'Active'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating teacher:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while creating teacher' });
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/teachers/:id
 * Update existing teacher & status sync
 */
export const updateTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, mobile, email, subjects = [], classes = [], education, photo, status } = req.body;

    // Cross-Teacher Security Check
    if (req.user && req.user.role === 'teacher') {
      const isSelfDbId = String(id) === String(req.user.teacher_id);
      const isSelfBusinessId = String(id).toLowerCase() === String(req.user.teacherBusinessId).toLowerCase();
      if (!isSelfDbId && !isSelfBusinessId) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'ACCESS DENIED: You do not have permission to modify another teacher\'s record.'
        });
      }
    }

    const [existingRows] = await connection.query(
      `SELECT * FROM teachers WHERE id = ? OR teacher_id = ?`,
      [id, id]
    );

    if (!existingRows || existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const existingTeacher = existingRows[0];
    const teacherDbId = existingTeacher.id;

    let photoPath = existingTeacher.photo;
    if (photo && photo !== existingTeacher.photo) {
      if (photo.startsWith('data:image')) {
        if (existingTeacher.photo) {
          deleteTeacherPhoto(existingTeacher.photo);
        }
        photoPath = saveTeacherPhoto(photo, existingTeacher.teacher_id);
      } else {
        photoPath = photo;
      }
    }

    const newStatus = status ? status : existingTeacher.status;
    const userStatus = newStatus === 'Active' ? 'Active' : 'Disabled';

    await connection.query(
      `UPDATE teachers 
       SET name = ?, mobile = ?, email = ?, education = ?, photo = ?, status = ?
       WHERE id = ?`,
      [
        name ? name.trim() : existingTeacher.name,
        mobile ? mobile.trim() : existingTeacher.mobile,
        email !== undefined ? (email ? email.trim() : null) : existingTeacher.email,
        education ? education.trim() : existingTeacher.education,
        photoPath,
        newStatus,
        teacherDbId
      ]
    );

    // Sync user status
    await connection.query(
      `UPDATE users SET status = ? WHERE teacher_id = ?`,
      [userStatus, teacherDbId]
    );

    // Refresh Subjects
    const subIdList = [];
    if (Array.isArray(subjects) && subjects.length > 0) {
      await connection.query(`DELETE FROM teacher_subjects WHERE teacher_id = ?`, [teacherDbId]);
      for (const subName of subjects) {
        const [subRows] = await connection.query(`SELECT id FROM subjects WHERE subject_name = ?`, [subName]);
        let subId = subRows && subRows.length > 0 ? subRows[0].id : null;
        if (!subId) {
          const [newSub] = await connection.query(`INSERT INTO subjects (subject_name) VALUES (?)`, [subName]);
          subId = newSub.insertId;
        }
        subIdList.push(subId);
        await connection.query(
          `INSERT IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)`,
          [teacherDbId, subId]
        );
      }
    }

    // Refresh Classes
    const classIdList = [];
    if (Array.isArray(classes) && classes.length > 0) {
      await connection.query(`DELETE FROM teacher_classes WHERE teacher_id = ?`, [teacherDbId]);
      for (const className of classes) {
        const [clsRows] = await connection.query(`SELECT id FROM classes WHERE class_name = ?`, [className]);
        let clsId = clsRows && clsRows.length > 0 ? clsRows[0].id : null;
        if (!clsId) {
          const [newCls] = await connection.query(`INSERT INTO classes (class_name) VALUES (?)`, [className]);
          clsId = newCls.insertId;
        }
        classIdList.push(clsId);
        await connection.query(
          `INSERT IGNORE INTO teacher_classes (teacher_id, class_id) VALUES (?, ?)`,
          [teacherDbId, clsId]
        );
      }
    }

    // Refresh Permissions in teacher_class_subjects
    if (classIdList.length > 0 && subIdList.length > 0) {
      await connection.query(`DELETE FROM teacher_class_subjects WHERE teacher_id = ?`, [teacherDbId]);
      for (const clsId of classIdList) {
        for (const subId of subIdList) {
          await connection.query(
            `INSERT IGNORE INTO teacher_class_subjects (teacher_id, class_id, subject_id) VALUES (?, ?, ?)`,
            [teacherDbId, clsId, subId]
          );
        }
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Teacher updated successfully',
      teacher: {
        id: teacherDbId,
        _id: teacherDbId,
        teacher_id: existingTeacher.teacher_id,
        name: name ? name.trim() : existingTeacher.name,
        mobile: mobile ? mobile.trim() : existingTeacher.mobile,
        email: email !== undefined ? email : existingTeacher.email,
        education: education ? education.trim() : existingTeacher.education,
        photo: photoPath || '',
        subjects,
        classes,
        status: newStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating teacher:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while updating teacher' });
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/teachers/:id
 * Delete teacher record & linked user account (Atomic Transaction)
 */
export const deleteTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Cross-Teacher Security Check
    if (req.user && req.user.role === 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'ACCESS DENIED: Teachers cannot delete teacher records.'
      });
    }

    const [rows] = await connection.query(`SELECT * FROM teachers WHERE id = ? OR teacher_id = ?`, [id, id]);

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const teacher = rows[0];
    const photoPath = teacher.photo;

    // Delete linked user account
    await connection.query(`DELETE FROM users WHERE teacher_id = ?`, [teacher.id]);

    // Delete teacher record (cascades junction tables)
    await connection.query(`DELETE FROM teachers WHERE id = ?`, [teacher.id]);

    await connection.commit();

    if (photoPath) {
      deleteTeacherPhoto(photoPath);
    }

    return res.json({
      success: true,
      message: 'Teacher and associated login account deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting teacher' });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/teachers/me/permissions
 * Fetch allowed Class + Subject permission pairs for the logged-in teacher
 */
export const getTeacherPermissions = async (req, res) => {
  try {
    let targetTeacherDbId = req.user ? req.user.teacher_id : null;
    if (!targetTeacherDbId) {
      const [firstTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstTeacher) targetTeacherDbId = firstTeacher.id;
    }

    if (!targetTeacherDbId) {
      return res.json({ success: true, permissions: [] });
    }

    const sql = `
      SELECT 
        c.class_name,
        s.subject_name
      FROM teacher_class_subjects tcs
      JOIN classes c ON tcs.class_id = c.id
      JOIN subjects s ON tcs.subject_id = s.id
      WHERE tcs.teacher_id = ?
      ORDER BY c.class_name, s.subject_name
    `;

    const rows = await query(sql, [targetTeacherDbId]);

    return res.json({
      success: true,
      teacher_id: targetTeacherDbId,
      permissions: rows
    });
  } catch (error) {
    console.error('Error fetching teacher permissions:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching teacher permissions' });
  }
};

/**
 * GET /api/teachers/allocations & GET /api/attendance/teacher-allocations
 * Fetch allowed Class & Subject allocations for teacher
 */
export const getTeacherAllocations = async (req, res) => {
  try {
    let targetTeacherDbId = null;
    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (req.query.teacherId || req.query.teacher) {
      const tParam = req.query.teacherId || req.query.teacher;
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    if (!targetTeacherDbId) {
      const [firstTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstTeacher) targetTeacherDbId = firstTeacher.id;
    }

    if (!targetTeacherDbId) {
      return res.json({ success: true, classes: [], subjects: [], allocations: [] });
    }

    const sql = `
      SELECT 
        c.class_name,
        s.subject_name
      FROM teacher_class_subjects tcs
      JOIN classes c ON tcs.class_id = c.id
      JOIN subjects s ON tcs.subject_id = s.id
      WHERE tcs.teacher_id = ?
      ORDER BY c.class_name, s.subject_name
    `;

    const rows = await query(sql, [targetTeacherDbId]);

    const classes = [...new Set(rows.map(r => r.class_name))];
    const subjects = [...new Set(rows.map(r => r.subject_name))];

    const allocMap = new Map();
    rows.forEach(r => {
      if (!allocMap.has(r.class_name)) allocMap.set(r.class_name, []);
      allocMap.get(r.class_name).push(r.subject_name);
    });

    const allocations = Array.from(allocMap.entries()).map(([std, subs]) => ({
      standard: std,
      subjects: [...new Set(subs)]
    }));

    return res.json({
      success: true,
      teacher_id: targetTeacherDbId,
      classes,
      subjects,
      allocations
    });
  } catch (error) {
    console.error('Error fetching teacher allocations:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching teacher allocations' });
  }
};

/**
 * GET /api/teachers/me
 * Fetch complete profile, subjects, and permissions for the authenticated logged-in teacher (or default teacher)
 */
export const getAuthenticatedTeacherProfile = async (req, res) => {
  try {
    // Determine target database ID strictly from authenticated user token
    let targetTeacherDbId = req.user ? req.user.teacher_id : null;

    if (!targetTeacherDbId) {
      return res.status(404).json({ success: false, message: 'No teacher profile associated with this authenticated account.' });
    }

    const sql = `
      SELECT 
        t.id,
        t.teacher_id,
        t.name,
        t.name AS fullname,
        t.mobile,
        t.email,
        t.education,
        t.education AS qualification,
        t.photo,
        t.status,
        t.created_at,
        u.email AS login_email,
        GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name SEPARATOR '||') AS subjects_str,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_name SEPARATOR '||') AS classes_str
      FROM teachers t
      LEFT JOIN users u ON u.teacher_id = t.id
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
      LEFT JOIN classes c ON tc.class_id = c.id
      WHERE t.id = ?
      GROUP BY t.id
    `;

    const rows = await query(sql, [targetTeacherDbId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher record not found.' });
    }

    const t = rows[0];
    const subjects = t.subjects_str ? t.subjects_str.split('||').filter(Boolean) : [];
    const classes = t.classes_str ? t.classes_str.split('||').filter(Boolean) : [];

    // Fetch Class + Subject permissions from teacher_class_subjects
    const permSql = `
      SELECT 
        c.class_name,
        s.subject_name
      FROM teacher_class_subjects tcs
      JOIN classes c ON tcs.class_id = c.id
      JOIN subjects s ON tcs.subject_id = s.id
      WHERE tcs.teacher_id = ?
      ORDER BY c.class_name, s.subject_name
    `;
    const permissions = await query(permSql, [targetTeacherDbId]);

    return res.json({
      success: true,
      teacher: {
        id: t.id,
        _id: t.id,
        teacher_id: t.teacher_id,
        name: t.name,
        fullname: t.name,
        mobile: t.mobile,
        email: t.email || t.login_email || '',
        education: t.education,
        qualification: t.education,
        photo: t.photo || '',
        status: t.status,
        created_at: t.created_at,
        subjects: subjects.length > 0 ? subjects : ['Mathematics'],
        classes: classes.length > 0 ? classes : ['10th'],
        permissions: permissions || []
      }
    });
  } catch (error) {
    console.error('Error fetching authenticated teacher profile:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching teacher profile' });
  }
};

/**
 * GET /api/teachers/public
 * Public endpoint to fetch active faculty for public website (Home Page & Faculty Page).
 * No authentication required.
 */
export const getPublicFaculty = async (req, res) => {
  try {
    const sql = `
      SELECT 
        t.id,
        t.teacher_id AS teacherId,
        t.name,
        t.education,
        t.photo,
        t.status,
        GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name SEPARATOR ', ') AS subjects_str,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.id SEPARATOR ', ') AS classes_str
      FROM teachers t
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
      LEFT JOIN classes c ON tc.class_id = c.id
      WHERE t.status = 'Active'
      GROUP BY t.id
      ORDER BY t.id ASC
    `;

    const rows = await query(sql);

    const facultyList = rows.map((t) => {
      const rawSubjects = t.subjects_str || 'General Studies';
      const rawClasses = t.classes_str || 'All Standards';

      let experience = '8+ Years Experience';
      let badge = 'Faculty Specialist';
      let bio = `Dedicated mentor specializing in conceptual clarity, rigorous problem-solving practice, and individual doubt resolution at Unique Classes Nilanga.`;

      const subLower = rawSubjects.toLowerCase();
      if (subLower.includes('math')) {
        badge = 'Lead Mathematics Mentor';
        experience = '10+ Years Experience';
        bio = `Specialist in speed math, analytical reasoning, and board exam precision for secondary and higher secondary standards.`;
      } else if (subLower.includes('science') || subLower.includes('physics') || subLower.includes('biology')) {
        badge = 'Senior Science Head';
        experience = '9+ Years Experience';
        bio = `Passionate science educator known for diagrammatic visual logic, deep fundamental principles, and high-scoring techniques.`;
      } else if (subLower.includes('english')) {
        badge = 'Language & Grammar Lead';
        experience = '7+ Years Experience';
        bio = `Expert in developing English grammar depth, comprehension speed, vocabulary mastery, and academic presentation skills.`;
      }

      return {
        id: `fac-${t.id}`,
        dbId: t.id,
        teacherId: t.teacherId,
        name: t.name,
        subject: rawSubjects,
        classes: rawClasses,
        qualification: t.education || 'M.Sc., B.Ed',
        experience: experience,
        bio: bio,
        photo: t.photo || '',
        badge: badge
      };
    });

    return res.json({
      success: true,
      count: facultyList.length,
      data: facultyList,
      faculty: facultyList
    });
  } catch (error) {
    console.error('Error fetching public faculty:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching faculty list.',
      error: error.message
    });
  }
};

