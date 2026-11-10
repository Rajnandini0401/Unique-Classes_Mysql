import { query } from '../config/db.js';

/**
 * GET /api/announcements
 * Fetch announcements with role-aware and class-aware filtering
 */
export const getAnnouncements = async (req, res) => {
  try {
    const { search, status, date, role, teacherId, standard, audience, creatorRole, createdByRole } = req.query;

    const headerRole = req.headers['x-user-role'];
    const queryRole = role;
    const tokenRole = req.headers.authorization ? req.user?.role : null;
    const effectiveRole = String(headerRole || queryRole || tokenRole || 'admin').toLowerCase();

    let targetTeacherDbId = null;
    if (effectiveRole === 'teacher') {
      if (req.user && req.user.teacher_id) {
        targetTeacherDbId = req.user.teacher_id;
      } else if (teacherId || req.headers['x-user-id']) {
        const tParam = teacherId || req.headers['x-user-id'];
        const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
        if (tRow) targetTeacherDbId = tRow.id;
      }
    }

    let teacherClasses = [];
    if (targetTeacherDbId) {
      const tcRows = await query(
        `SELECT DISTINCT c.class_name 
         FROM teacher_class_subjects tcs 
         JOIN classes c ON tcs.class_id = c.id 
         WHERE tcs.teacher_id = ?`,
        [targetTeacherDbId]
      );
      teacherClasses = tcRows.map(r => r.class_name);
    }

    let sql = `
      SELECT 
        a.id,
        a.id AS _id,
        a.title,
        a.content,
        a.content AS message,
        a.audience,
        a.target_class AS targetClass,
        a.target_subject AS targetSubject,
        a.announcement_date AS announcementDate,
        a.expiry_date AS expiryDate,
        a.attachment,
        a.status,
        a.created_by_role AS createdByRole,
        a.created_by AS createdBy,
        a.created_by_name AS createdByName,
        a.created_at AS createdAt
      FROM announcements a
      WHERE 1=1
    `;
    const params = [];

    // Filter by Status (default Published for non-admin)
    if (status && status !== 'All Status' && status !== 'All') {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    // Role-specific scoping
    if (effectiveRole === 'admin') {
      // Admin strictly sees Admin notices only
      sql += ` AND (a.created_by_role = 'Admin' OR a.created_by_role IS NULL OR a.created_by_role = '')`;
    } else if (effectiveRole === 'teacher') {
      // Teacher sees their OWN created announcements AND Published Admin notices targeted to Teachers
      if (targetTeacherDbId) {
        sql += ` AND (
          (a.created_by_role = 'Teacher' AND a.created_by = ?) 
          OR 
          (a.created_by_role = 'Admin' AND a.status = 'Published' AND (
            a.audience IN ('Teachers', 'Teacher + Staff', 'Teacher + Student + Staff', 'All') 
            OR a.audience LIKE '%Teacher%'
          ))
        )`;
        params.push(targetTeacherDbId);
      } else {
        sql += ` AND (
          a.created_by_role = 'Teacher' 
          OR 
          (a.created_by_role = 'Admin' AND a.status = 'Published' AND (
            a.audience IN ('Teachers', 'Teacher + Staff', 'Teacher + Student + Staff', 'All') 
            OR a.audience LIKE '%Teacher%'
          ))
        )`;
      }
    } else if (effectiveRole === 'staff' || effectiveRole === 'office') {
      // Staff Panel sees Published notices targeted to Staff
      sql += ` AND a.status = 'Published' AND (
        a.audience IN ('Staff', 'Teacher + Staff', 'Teacher + Student + Staff', 'All') 
        OR a.audience LIKE '%Staff%'
      )`;
    }

    if (standard && standard !== 'Select Class' && standard !== 'All Classes' && standard !== 'All Students' && standard !== 'All') {
      sql += ` AND (a.target_class = ? OR a.target_class = 'All Students' OR a.target_class = 'All')`;
      params.push(standard);
    }

    if (audience && audience !== 'All Audience' && audience !== 'All') {
      sql += ` AND (a.audience = ? OR a.audience = 'All')`;
      params.push(audience);
    }

    const cRole = creatorRole || createdByRole || req.query.creatorType;
    if (cRole && cRole !== 'All') {
      sql += ` AND a.created_by_role = ?`;
      params.push(cRole);
    }

    if (date) {
      sql += ` AND a.announcement_date = ?`;
      params.push(date);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (a.title LIKE ? OR a.content LIKE ? OR a.target_class LIKE ?)`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY a.announcement_date DESC, a.id DESC`;

    console.log('[DEBUG getAnnouncements] effectiveRole:', effectiveRole, 'targetTeacherDbId:', targetTeacherDbId, 'teacherClasses:', teacherClasses);
    console.log('[DEBUG getAnnouncements] SQL:', sql);
    console.log('[DEBUG getAnnouncements] Params:', params);

    const rows = await query(sql, params);
    console.log('[DEBUG getAnnouncements] Rows count:', rows.length);

    const safeFormatDate = (val) => {
      if (!val) return '';
      const d = new Date(val);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const formattedAnnouncements = rows.map(r => ({
      id: r.id,
      _id: r.id,
      title: r.title,
      content: r.content,
      message: r.message,
      audience: r.audience,
      targetClass: r.targetClass,
      targetSubject: r.targetSubject || '',
      announcementDate: safeFormatDate(r.announcementDate),
      expiryDate: safeFormatDate(r.expiryDate),
      attachment: r.attachment || '',
      status: r.status,
      createdByRole: r.createdByRole,
      createdBy: r.createdBy,
      createdByName: r.createdByName || (r.createdByRole === 'Admin' ? 'Management' : 'Faculty'),
      createdAt: r.createdAt
    }));

    return res.json({
      success: true,
      announcements: formattedAnnouncements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching announcements.' });
  }
};

/**
 * GET /api/announcements/public
 * Fetch strictly public announcements intended for the public website
 */
export const getPublicAnnouncements = async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.id,
        a.id AS _id,
        a.title,
        a.content,
        a.content AS message,
        a.audience,
        a.announcement_date AS announcementDate,
        a.attachment,
        a.status,
        a.created_by_role AS createdByRole,
        a.created_by_name AS createdByName,
        a.created_at AS createdAt
      FROM announcements a
      WHERE a.status = 'Published' 
        AND (a.audience = 'Public Website' OR a.audience = 'Public')
      ORDER BY a.announcement_date DESC, a.id DESC
    `;
    const rows = await query(sql);

    return res.json({
      success: true,
      announcements: rows.map(r => ({
        id: r.id,
        _id: r.id,
        title: r.title,
        content: r.content,
        message: r.content,
        audience: r.audience,
        announcementDate: r.announcementDate ? new Date(r.announcementDate).toISOString().split('T')[0] : '',
        attachment: r.attachment || '',
        status: r.status,
        createdByName: r.createdByName || 'Unique Classes'
      }))
    });
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching public announcements.' });
  }
};

/**
 * GET /api/announcements/student
 * Fetch announcements intended for students
 */
export const getStudentAnnouncements = async (req, res) => {
  try {
    const { standard } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.id AS _id,
        a.title,
        a.content,
        a.content AS message,
        a.audience,
        a.target_class AS targetClass,
        a.target_subject AS targetSubject,
        a.announcement_date AS announcementDate,
        a.attachment,
        a.status,
        a.created_by_role AS createdByRole,
        a.created_by_name AS createdByName,
        a.created_at AS createdAt
      FROM announcements a
      WHERE a.status = 'Published' AND (
        a.audience IN ('Students', 'All', 'Teacher + Student + Staff', 'Public Website') 
        OR a.audience LIKE '%Student%' 
        OR a.audience = 'All'
      )
    `;
    const params = [];

    const targetStudentId = req.query.studentId || req.user?.student_id;

    if (standard && standard !== 'All') {
      sql += ` AND (a.target_class = ? OR a.target_class = 'All Students' OR a.target_class = 'All')`;
      params.push(standard);
    }

    if (targetStudentId) {
      sql += ` AND (
        a.target_subject IS NULL 
        OR a.target_subject = '' 
        OR a.target_subject = 'All' 
        OR a.target_subject = 'All Subjects' 
        OR a.target_subject = 'General'
        OR a.target_subject IN (
          SELECT sub.subject_name 
          FROM student_subjects ss 
          JOIN subjects sub ON ss.subject_id = sub.id 
          WHERE ss.student_id = ?
        )
      )`;
      params.push(targetStudentId);
    }

    sql += ` ORDER BY a.announcement_date DESC, a.id DESC`;

    const rows = await query(sql, params);

    return res.json({
      success: true,
      announcements: rows.map(r => ({
        id: r.id,
        _id: r.id,
        title: r.title,
        content: r.content,
        message: r.message,
        audience: r.audience,
        targetClass: r.targetClass,
        targetSubject: r.targetSubject || '',
        announcementDate: r.announcementDate ? new Date(r.announcementDate).toISOString().split('T')[0] : '',
        attachment: r.attachment || '',
        status: r.status,
        createdByRole: r.createdByRole,
        createdByName: r.createdByName || 'Unique Classes'
      }))
    });
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching student announcements.' });
  }
};

/**
 * GET /api/announcements/:id
 * Fetch single announcement details
 */
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const [r] = await query(`SELECT * FROM announcements WHERE id = ?`, [id]);
    if (!r) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    return res.json({
      success: true,
      announcement: {
        id: r.id,
        _id: r.id,
        title: r.title,
        content: r.content,
        message: r.content,
        audience: r.audience,
        targetClass: r.target_class,
        targetSubject: r.target_subject || '',
        announcementDate: r.announcement_date ? new Date(r.announcement_date).toISOString().split('T')[0] : '',
        expiryDate: r.expiry_date ? new Date(r.expiry_date).toISOString().split('T')[0] : '',
        attachment: r.attachment || '',
        status: r.status,
        createdByRole: r.created_by_role,
        createdBy: r.created_by,
        createdByName: r.created_by_name
      }
    });
  } catch (error) {
    console.error('Error fetching announcement by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching announcement details.' });
  }
};

/**
 * POST /api/announcements
 * Create new announcement with strict class assignment security check for Teachers
 */
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      message,
      audience,
      targetClass,
      targetSubject,
      announcementDate,
      expiryDate,
      attachment,
      status,
      createdByRole,
      createdBy,
      createdByName
    } = req.body;

    const annTitle = (title || '').trim();
    const annContent = (content || message || '').trim();
    const annTargetClass = (targetClass || 'All Students').trim();
    const annDate = announcementDate || new Date().toISOString().split('T')[0];

    const headerRole = req.headers['x-user-role'];
    const bodyRole = createdByRole;
    const userRole = req.user?.role;
    const isTeacherRole = (headerRole && String(headerRole).toLowerCase() === 'teacher') ||
                          (bodyRole && String(bodyRole).toLowerCase() === 'teacher') ||
                          (userRole && String(userRole).toLowerCase() === 'teacher');

    const senderRole = isTeacherRole ? 'Teacher' : 'Admin';

    let teacherDbId = null;
    let teacherName = createdByName || 'Teacher';

    if (senderRole === 'teacher' || senderRole === 'Teacher') {
      if (req.user && req.user.teacher_id) {
        teacherDbId = req.user.teacher_id;
      } else if (createdBy || req.headers['x-user-id']) {
        const tParam = createdBy || req.headers['x-user-id'];
        const [tRow] = await query(`SELECT id, name FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
        if (tRow) {
          teacherDbId = tRow.id;
          teacherName = tRow.name;
        }
      }

      if (!teacherDbId) {
        const [firstActiveTeacher] = await query(`SELECT id, name FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
        if (firstActiveTeacher) {
          teacherDbId = firstActiveTeacher.id;
          teacherName = firstActiveTeacher.name;
        }
      }

      if (teacherDbId) {
        // Fetch teacher's assigned classes
        const tcRows = await query(
          `SELECT DISTINCT c.class_name 
           FROM teacher_class_subjects tcs 
           JOIN classes c ON tcs.class_id = c.id 
           WHERE tcs.teacher_id = ?`,
          [teacherDbId]
        );
        let assignedClasses = tcRows.map(r => r.class_name);
        if (assignedClasses.length === 0) {
          const tcRows2 = await query(
            `SELECT DISTINCT c.class_name 
             FROM teacher_classes tc 
             JOIN classes c ON tc.class_id = c.id 
             WHERE tc.teacher_id = ?`,
            [teacherDbId]
          );
          assignedClasses = tcRows2.map(r => r.class_name);
        }

        // Security Validation: Ensure targetClass is within assigned classes
        if (annTargetClass !== 'All Students' && annTargetClass !== 'All' && assignedClasses.length > 0 && !assignedClasses.includes(annTargetClass)) {
          return res.status(400).json({
            success: false,
            message: `PERMISSION DENIED: You can only publish announcements for your assigned classes (${assignedClasses.join(', ')}). Cannot post to ${annTargetClass}.`
          });
        }
      }
    }

    let finalTargetSubject = targetSubject || null;
    if (senderRole === 'Teacher' && teacherDbId && (!finalTargetSubject || finalTargetSubject === 'All' || finalTargetSubject === 'All Subjects')) {
      const tsRows = await query(
        `SELECT DISTINCT sub.subject_name 
         FROM teacher_class_subjects tcs 
         JOIN subjects sub ON tcs.subject_id = sub.id 
         JOIN classes c ON tcs.class_id = c.id 
         WHERE tcs.teacher_id = ? AND (c.class_name = ? OR ? = 'All Students' OR ? = 'All')`,
        [teacherDbId, annTargetClass, annTargetClass, annTargetClass]
      );
      if (tsRows.length > 0) {
        finalTargetSubject = tsRows[0].subject_name;
      }
    }

    const roleTag = (senderRole === 'teacher' || senderRole === 'Teacher') ? 'Teacher' : 'Admin';

    const result = await query(
      `INSERT INTO announcements 
        (title, content, audience, target_class, target_subject, announcement_date, expiry_date, attachment, status, created_by_role, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        annTitle,
        annContent,
        audience || (roleTag === 'Teacher' ? 'Students' : 'All'),
        annTargetClass,
        finalTargetSubject,
        annDate,
        expiryDate || null,
        attachment || null,
        status || 'Published',
        roleTag,
        teacherDbId || createdBy || null,
        teacherName || (roleTag === 'Admin' ? 'Management' : 'Faculty')
      ]
    );

    return res.json({
      success: true,
      message: 'Announcement published successfully!',
      announcementId: result.insertId,
      _id: result.insertId
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating announcement.' });
  }
};

/**
 * PUT /api/announcements/:id
 * Update announcement record with teacher permission check
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, message, targetClass, targetSubject, announcementDate, expiryDate, attachment, status } = req.body;

    const [aRow] = await query(`SELECT * FROM announcements WHERE id = ?`, [id]);
    if (!aRow) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const headerRole = req.headers['x-user-role'];
    const tokenRole = req.user?.role;
    const senderRole = String(tokenRole || headerRole || 'Admin').toLowerCase();

    if (senderRole === 'teacher') {
      if (aRow.created_by_role === 'Admin') {
        return res.status(403).json({ success: false, message: 'ACCESS DENIED: Teachers cannot edit Admin announcements.' });
      }

      if (req.user && req.user.teacher_id && aRow.created_by && String(aRow.created_by) !== String(req.user.teacher_id)) {
        return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot edit another teacher\'s announcement.' });
      }

      if (targetClass && targetClass !== aRow.target_class && targetClass !== 'All Students') {
        const teacherDbId = req.user?.teacher_id || aRow.created_by;
        if (teacherDbId) {
          const tcRows = await query(
            `SELECT DISTINCT c.class_name FROM teacher_class_subjects tcs JOIN classes c ON tcs.class_id = c.id WHERE tcs.teacher_id = ?`,
            [teacherDbId]
          );
          const assignedClasses = tcRows.map(r => r.class_name);
          if (assignedClasses.length > 0 && !assignedClasses.includes(targetClass)) {
            return res.status(400).json({
              success: false,
              message: `PERMISSION DENIED: You can only target assigned classes (${assignedClasses.join(', ')}).`
            });
          }
        }
      }
    }

    const newTitle = title !== undefined ? title.trim() : aRow.title;
    const newContent = content !== undefined ? content.trim() : (message !== undefined ? message.trim() : aRow.content);
    const newClass = targetClass !== undefined ? targetClass : aRow.target_class;
    const newSubject = targetSubject !== undefined ? targetSubject : aRow.target_subject;
    const newDate = announcementDate !== undefined ? announcementDate : aRow.announcement_date;
    const newExpDate = expiryDate !== undefined ? expiryDate : aRow.expiry_date;
    const newAttachment = attachment !== undefined ? attachment : aRow.attachment;
    const newStatus = status !== undefined ? status : aRow.status;

    await query(
      `UPDATE announcements 
       SET title = ?, content = ?, target_class = ?, target_subject = ?, announcement_date = ?, expiry_date = ?, attachment = ?, status = ?
       WHERE id = ?`,
      [newTitle, newContent, newClass, newSubject, newDate, newExpDate, newAttachment, newStatus, id]
    );

    return res.json({
      success: true,
      message: 'Announcement updated successfully!'
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error updating announcement.' });
  }
};

/**
 * DELETE /api/announcements/:id
 * Delete announcement record
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const [aRow] = await query(`SELECT * FROM announcements WHERE id = ?`, [id]);
    if (!aRow) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const headerRole = req.headers['x-user-role'];
    const tokenRole = req.user?.role;
    const senderRole = String(tokenRole || headerRole || 'Admin').toLowerCase();

    if (senderRole === 'teacher') {
      if (aRow.created_by_role === 'Admin') {
        return res.status(403).json({ success: false, message: 'ACCESS DENIED: Teachers cannot delete Admin announcements.' });
      }

      if (req.user && req.user.teacher_id && aRow.created_by && String(aRow.created_by) !== String(req.user.teacher_id)) {
        return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot delete another teacher\'s announcement.' });
      }
    }

    await query(`DELETE FROM announcements WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Announcement deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting announcement.' });
  }
};
