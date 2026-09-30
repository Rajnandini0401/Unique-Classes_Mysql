import { query, pool } from '../config/db.js';

/**
 * Expand schedule pattern into individual day strings
 */
const expandDays = (pattern) => {
  if (!pattern) return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const p = pattern.trim();
  if (p === 'Monday-Friday') {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }
  if (p === 'Saturday') return ['Saturday'];
  if (p === 'Sunday') return ['Sunday'];
  return [p];
};

/**
 * Check if two day patterns overlap
 */
const daysOverlap = (pattern1, pattern2) => {
  const days1 = expandDays(pattern1);
  const days2 = expandDays(pattern2);
  return days1.some(day => days2.includes(day));
};

/**
 * Convert time string ("05:00" or "17:30") to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

/**
 * Check if two time ranges overlap (start1 < end2 && start2 < end1)
 */
const timesOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

/**
 * GET /api/batches
 * Fetch batches list with role-based scoping and filters
 */
export const getBatches = async (req, res) => {
  try {
    const { standard, subject, teacher, schedulePattern, scheduleType, search } = req.query;

    let sql = `
      SELECT 
        b.id,
        b.id AS _id,
        b.teacher_id,
        b.class_id,
        b.subject_id,
        b.schedule_pattern,
        b.schedule_pattern AS schedulePattern,
        b.schedule_type,
        b.schedule_type AS scheduleType,
        b.start_time AS startTime,
        b.end_time AS endTime,
        b.status,
        b.created_at,
        c.class_name AS standard,
        s.subject_name AS subject,
        t.teacher_id AS teacherBusinessId,
        t.name AS teacherName
      FROM batches b
      JOIN classes c ON b.class_id = c.id
      JOIN subjects s ON b.subject_id = s.id
      JOIN teachers t ON b.teacher_id = t.id
      WHERE b.status = 'Active'
    `;
    const params = [];

    // Security Scoping: Logged-in Teacher can ONLY see their own batches
    if (req.user && req.user.role === 'teacher') {
      let tId = req.user.teacher_id;
      if (!tId) {
        const [firstTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
        if (firstTeacher) tId = firstTeacher.id;
      }
      if (tId) {
        sql += ` AND b.teacher_id = ?`;
        params.push(tId);
      }
    } else if (teacher && teacher !== 'All Teachers' && teacher !== 'All') {
      sql += ` AND (b.teacher_id = ? OR t.teacher_id = ?)`;
      params.push(teacher, teacher);
    }

    if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
      sql += ` AND c.class_name = ?`;
      params.push(standard);
    }

    if (subject && subject !== 'All Subjects' && subject !== 'All') {
      sql += ` AND s.subject_name = ?`;
      params.push(subject);
    }

    if (schedulePattern && schedulePattern !== 'All Patterns') {
      sql += ` AND b.schedule_pattern = ?`;
      params.push(schedulePattern);
    }

    if (scheduleType && scheduleType !== 'All Types') {
      sql += ` AND b.schedule_type = ?`;
      params.push(scheduleType);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (c.class_name LIKE ? OR s.subject_name LIKE ? OR t.name LIKE ? OR b.schedule_type LIKE ?)`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY b.id DESC`;

    const rows = await query(sql, params);

    const formattedBatches = rows.map(r => ({
      id: r.id,
      _id: r.id,
      standard: r.standard,
      subject: r.subject,
      teacher: {
        id: r.teacher_id,
        _id: r.teacher_id,
        name: r.teacherName,
        teacher_id: r.teacherBusinessId
      },
      teacher_id: r.teacher_id,
      schedulePattern: r.schedule_pattern,
      scheduleType: r.schedule_type,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      created_at: r.created_at
    }));

    return res.json({
      success: true,
      batches: formattedBatches
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching batches.' });
  }
};

/**
 * GET /api/batches/:id
 * Fetch single batch by ID
 */
export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        b.id,
        b.teacher_id,
        b.class_id,
        b.subject_id,
        b.schedule_pattern,
        b.schedule_type,
        b.start_time AS startTime,
        b.end_time AS endTime,
        b.status,
        c.class_name AS standard,
        s.subject_name AS subject,
        t.name AS teacherName,
        t.teacher_id AS teacherBusinessId
      FROM batches b
      JOIN classes c ON b.class_id = c.id
      JOIN subjects s ON b.subject_id = s.id
      JOIN teachers t ON b.teacher_id = t.id
      WHERE b.id = ? AND b.status = 'Active'
    `;

    const rows = await query(sql, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const b = rows[0];

    // Security Check: Teacher can only access their own batch
    if (req.user && req.user.role === 'teacher' && String(b.teacher_id) !== String(req.user.teacher_id)) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot access another teacher\'s batch.' });
    }

    return res.json({
      success: true,
      batch: {
        id: b.id,
        _id: b.id,
        standard: b.standard,
        subject: b.subject,
        teacher: {
          id: b.teacher_id,
          _id: b.teacher_id,
          name: b.teacherName,
          teacher_id: b.teacherBusinessId
        },
        schedulePattern: b.schedule_pattern,
        scheduleType: b.schedule_type,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status
      }
    });
  } catch (error) {
    console.error('Error fetching batch by ID:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching batch.' });
  }
};

/**
 * POST /api/batches
 * Create new batch schedule with permission & overlap validation
 */
export const createBatch = async (req, res) => {
  try {
    const { standard, subject, teacher, schedulePattern, scheduleType, startTime, endTime } = req.body;

    if (!standard || !subject || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Standard, Subject, Start Time, and End Time are required.' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'Start Time must be earlier than End Time.' });
    }

    // Determine target teacher ID safely
    let targetTeacherDbId = null;
    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    }
    if (!targetTeacherDbId && teacher) {
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [teacher, teacher]);
      if (tRow) targetTeacherDbId = tRow.id;
    }
    if (!targetTeacherDbId) {
      const [firstActiveTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstActiveTeacher) {
        targetTeacherDbId = firstActiveTeacher.id;
      }
    }

    if (!targetTeacherDbId) {
      return res.status(400).json({ success: false, message: 'Valid Teacher profile is required.' });
    }

    // Resolve class_id
    const [cRow] = await query(`SELECT id, class_name FROM classes WHERE class_name = ?`, [standard]);
    if (!cRow) {
      return res.status(400).json({ success: false, message: `Class '${standard}' not found.` });
    }
    const classId = cRow.id;

    // Resolve subject_id
    const [sRow] = await query(`SELECT id, subject_name FROM subjects WHERE subject_name = ?`, [subject]);
    if (!sRow) {
      return res.status(400).json({ success: false, message: `Subject '${subject}' not found.` });
    }
    const subjectId = sRow.id;



    // Conflict & Overlap Check for the teacher
    const existingBatches = await query(
      `SELECT b.id, b.schedule_pattern, b.schedule_type, b.start_time, b.end_time, b.class_id, b.subject_id, c.class_name, s.subject_name
       FROM batches b
       JOIN classes c ON b.class_id = c.id
       JOIN subjects s ON b.subject_id = s.id
       WHERE b.teacher_id = ? AND b.status = 'Active'`,
      [targetTeacherDbId]
    );

    const pattern = schedulePattern || 'Monday-Friday';
    const type = scheduleType || 'Regular Class';

    // Conflict Check: Regular Class batches must not overlap with other Regular Classes.
    // Exam batches allow simultaneous multi-class exam scheduling, BUT prevent duplicate exam batches for the SAME CLASS on the SAME DAY pattern.
    if (type === 'Exam') {
      const classExamRows = await query(
        `SELECT b.id, b.schedule_pattern, b.start_time, b.end_time, c.class_name, s.subject_name
         FROM batches b
         JOIN classes c ON b.class_id = c.id
         JOIN subjects s ON b.subject_id = s.id
         WHERE b.class_id = ? AND b.schedule_type = 'Exam' AND b.status = 'Active'`,
        [classId]
      );

      for (const eb of classExamRows) {
        if (daysOverlap(pattern, eb.schedule_pattern)) {
          return res.status(400).json({
            success: false,
            message: `DUPLICATE CLASS EXAM: An exam batch for ${eb.class_name} (${eb.subject_name}) is already scheduled on ${eb.schedule_pattern} from ${eb.start_time} to ${eb.end_time}. Same class cannot have multiple exam batches on the same day.`
          });
        }
      }
    } else {
      for (const eb of existingBatches) {
        if (eb.schedule_type !== 'Exam' && daysOverlap(pattern, eb.schedule_pattern) && timesOverlap(startTime, endTime, eb.start_time, eb.end_time)) {
          return res.status(400).json({
            success: false,
            message: `SCHEDULE CONFLICT: Teacher already has a regular batch (${eb.class_name} - ${eb.subject_name}) on ${eb.schedule_pattern} from ${eb.start_time} to ${eb.end_time}.`
          });
        }
      }
    }

    // Insert Batch
    const result = await query(
      `INSERT INTO batches (teacher_id, class_id, subject_id, schedule_pattern, schedule_type, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [targetTeacherDbId, classId, subjectId, pattern, type, startTime, endTime]
    );

    return res.json({
      success: true,
      message: 'Batch timetable created successfully!',
      batchId: result.insertId
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating batch.' });
  }
};

/**
 * PUT /api/batches/:id
 * Update batch timetable with ownership, permission, and overlap validation
 */
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { standard, subject, teacher, schedulePattern, scheduleType, startTime, endTime } = req.body;

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'Start Time must be earlier than End Time.' });
    }

    // Check existing batch
    const [bRow] = await query(`SELECT * FROM batches WHERE id = ? AND status = 'Active'`, [id]);
    if (!bRow) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    // Security Ownership Check for Teacher
    if (req.user && req.user.role === 'teacher' && String(bRow.teacher_id) !== String(req.user.teacher_id)) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot edit another teacher\'s batch.' });
    }

    const targetTeacherDbId = (req.user && req.user.role === 'teacher') ? req.user.teacher_id : bRow.teacher_id;

    // Resolve class_id & subject_id
    const [cRow] = await query(`SELECT id FROM classes WHERE class_name = ?`, [standard]);
    if (!cRow) return res.status(400).json({ success: false, message: `Class '${standard}' not found.` });

    const [sRow] = await query(`SELECT id FROM subjects WHERE subject_name = ?`, [subject]);
    if (!sRow) return res.status(400).json({ success: false, message: `Subject '${subject}' not found.` });

    const classId = cRow.id;
    const subjectId = sRow.id;

    // Conflict & Overlap Check against OTHER batches of this teacher
    const existingBatches = await query(
      `SELECT b.id, b.schedule_pattern, b.schedule_type, b.start_time, b.end_time, b.class_id, b.subject_id, c.class_name, s.subject_name
       FROM batches b
       JOIN classes c ON b.class_id = c.id
       JOIN subjects s ON b.subject_id = s.id
       WHERE b.teacher_id = ? AND b.id != ? AND b.status = 'Active'`,
      [targetTeacherDbId, id]
    );

    const pattern = schedulePattern || bRow.schedule_pattern;
    const type = scheduleType || bRow.schedule_type;

    if (type === 'Exam') {
      const classExamRows = await query(
        `SELECT b.id, b.schedule_pattern, b.start_time, b.end_time, c.class_name, s.subject_name
         FROM batches b
         JOIN classes c ON b.class_id = c.id
         JOIN subjects s ON b.subject_id = s.id
         WHERE b.class_id = ? AND b.id != ? AND b.schedule_type = 'Exam' AND b.status = 'Active'`,
        [classId, id]
      );

      for (const eb of classExamRows) {
        if (daysOverlap(pattern, eb.schedule_pattern)) {
          return res.status(400).json({
            success: false,
            message: `DUPLICATE CLASS EXAM: An exam batch for ${eb.class_name} (${eb.subject_name}) is already scheduled on ${eb.schedule_pattern} from ${eb.start_time} to ${eb.end_time}. Same class cannot have multiple exam batches on the same day.`
          });
        }
      }
    } else {
      for (const eb of existingBatches) {
        if (eb.schedule_type !== 'Exam' && daysOverlap(pattern, eb.schedule_pattern) && timesOverlap(startTime, endTime, eb.start_time, eb.end_time)) {
          return res.status(400).json({
            success: false,
            message: `SCHEDULE CONFLICT: Overlaps with existing regular batch (${eb.class_name} - ${eb.subject_name}) on ${eb.schedule_pattern} from ${eb.start_time} to ${eb.end_time}.`
          });
        }
      }
    }

    await query(
      `UPDATE batches 
       SET class_id = ?, subject_id = ?, schedule_pattern = ?, schedule_type = ?, start_time = ?, end_time = ?
       WHERE id = ?`,
      [classId, subjectId, pattern, type, startTime, endTime, id]
    );

    return res.json({
      success: true,
      message: 'Batch timetable updated successfully!'
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating batch.' });
  }
};

/**
 * DELETE /api/batches/:id
 * Delete batch timetable with ownership check
 */
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const [bRow] = await query(`SELECT * FROM batches WHERE id = ? AND status = 'Active'`, [id]);
    if (!bRow) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    // Security Ownership Check
    if (req.user && req.user.role === 'teacher' && String(bRow.teacher_id) !== String(req.user.teacher_id)) {
      return res.status(403).json({ success: false, message: 'ACCESS DENIED: You cannot delete another teacher\'s batch.' });
    }

    await query(`DELETE FROM batches WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Batch timetable schedule deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting batch.' });
  }
};
