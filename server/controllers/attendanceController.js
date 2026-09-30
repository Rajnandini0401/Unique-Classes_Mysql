import { query, getConnection } from '../config/db.js';
import {
  processWhatsAppWebAutomation,
  getWhatsAppWebStatus,
  launchWhatsAppQRScanWindow
} from '../services/whatsappAutomationService.js';

/**
 * Format 24h time string ("10:00" or "13:00") to 12h format ("10:00 AM" or "01:00 PM")
 */
export const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${minutes} ${ampm}`;
};

/**
 * Format any time string ("05:00 PM", "5:00 PM", "17:00") to 24h format ("17:00")
 */
export const formatTime24h = (timeStr) => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed.includes('AM') && !trimmed.includes('PM')) {
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return trimmed;
  }
  const isPM = trimmed.toUpperCase().includes('PM');
  const clean = trimmed.toUpperCase().replace('AM', '').replace('PM', '').trim();
  const parts = clean.split(':');
  if (parts.length < 2) return trimmed;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return trimmed;
  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Auto-migration helper to ensure start_time, end_time, and attendance_type columns exist in attendance_sessions table
let isSchemaMigrated = false;
export const ensureAttendanceSchema = async () => {
  if (isSchemaMigrated) return;
  try {
    await query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS start_time VARCHAR(20) NULL;`);
    await query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS end_time VARCHAR(20) NULL;`);
    await query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(20) DEFAULT 'ATTENDANCE';`);
    isSchemaMigrated = true;
  } catch (e) {
    try { await query(`ALTER TABLE attendance_sessions ADD COLUMN start_time VARCHAR(20) NULL;`); } catch (e1) {}
    try { await query(`ALTER TABLE attendance_sessions ADD COLUMN end_time VARCHAR(20) NULL;`); } catch (e2) {}
    try { await query(`ALTER TABLE attendance_sessions ADD COLUMN attendance_type VARCHAR(20) DEFAULT 'ATTENDANCE';`); } catch (e3) {}
    isSchemaMigrated = true;
  }
};

/**
 * GET /api/attendance/assigned-teacher
 * Get teacher assigned to class and subject
 */
export const getAssignedTeacher = async (req, res) => {
  try {
    const { standard, subject } = req.query;
    if (!standard || !subject) {
      return res.json({ success: true, teacher: null, multiple: false });
    }

    const rows = await query(
      `SELECT t.id, t.id AS _id, t.name, t.teacher_id AS teacherId
       FROM teacher_class_subjects tcs
       JOIN teachers t ON tcs.teacher_id = t.id
       JOIN classes c ON tcs.class_id = c.id
       JOIN subjects s ON tcs.subject_id = s.id
       WHERE c.class_name = ? AND (s.subject_name LIKE ? OR s.subject_name = ?)
         AND (LOWER(t.status) = 'active' OR t.status IS NULL)`,
      [standard, `%${subject}%`, subject]
    );

    if (rows && rows.length === 1) {
      return res.json({ success: true, teacher: rows[0], multiple: false });
    } else if (rows && rows.length > 1) {
      return res.json({ success: true, teacher: rows[0], multiple: true, count: rows.length });
    }

    const batchRows = await query(
      `SELECT t.id, t.id AS _id, t.name, t.teacher_id AS teacherId
       FROM batches b
       JOIN teachers t ON b.teacher_id = t.id
       JOIN classes c ON b.class_id = c.id
       JOIN subjects s ON b.subject_id = s.id
       WHERE c.class_name = ? AND (s.subject_name LIKE ? OR s.subject_name = ?)
         AND (LOWER(t.status) = 'active' OR t.status IS NULL)`,
      [standard, `%${subject}%`, subject]
    );

    if (batchRows && batchRows.length > 0) {
      return res.json({ success: true, teacher: batchRows[0], multiple: batchRows.length > 1 });
    }

    return res.json({ success: true, teacher: null, multiple: false });
  } catch (error) {
    console.error('Error fetching assigned teacher:', error);
    return res.json({ success: true, teacher: null, multiple: false });
  }
};

/**
 * GET /api/attendance/progress
 * Get today's attendance progress for class
 */
export const getAttendanceProgress = async (req, res) => {
  try {
    const { standard, date } = req.query;
    const cleanDate = (date || new Date().toISOString().split('T')[0]).split('T')[0];
    const std = standard || '10th';

    const subRows = await query(
      `SELECT DISTINCT s.subject_name 
       FROM teacher_class_subjects tcs
       JOIN classes c ON tcs.class_id = c.id
       JOIN subjects s ON tcs.subject_id = s.id
       WHERE c.class_name = ?`,
      [std]
    );

    let requiredSubjects = subRows.map(r => r.subject_name);
    if (requiredSubjects.length === 0) {
      if (['9th', '10th'].includes(std)) {
        requiredSubjects = ['Mathematics', 'Science', 'English'];
      } else if (['11th', '12th'].includes(std)) {
        requiredSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
      } else {
        requiredSubjects = ['Mathematics', 'Science', 'English'];
      }
    }

    const sessionRows = await query(
      `SELECT DISTINCT subject FROM attendance_sessions WHERE standard = ? AND attendance_date = ?`,
      [std, cleanDate]
    );

    const completedSubjects = sessionRows.map(r => r.subject);
    const pendingSubjects = requiredSubjects.filter(sub => !completedSubjects.includes(sub));
    const completedCount = completedSubjects.length;
    const totalRequired = requiredSubjects.length;
    const allCompleted = totalRequired > 0 && pendingSubjects.length === 0;

    return res.json({
      success: true,
      standard: std,
      date: cleanDate,
      requiredSubjects,
      completedSubjects,
      pendingSubjects,
      completedCount,
      totalRequired,
      allCompleted
    });
  } catch (error) {
    console.error('Error fetching attendance progress:', error);
    return res.status(500).json({ success: false, message: 'Server error checking attendance progress.' });
  }
};

/**
 * GET /api/attendance/subjects
 * Get available subjects for class
 */
export const getSubjectsByClass = async (req, res) => {
  try {
    const { standard } = req.query;
    if (!standard || standard === 'All Standards' || standard === 'All Classes' || standard === 'All') {
      const allSubjects = await query(`SELECT DISTINCT subject_name FROM subjects ORDER BY subject_name ASC`);
      return res.json({ success: true, subjects: allSubjects.map(s => s.subject_name) });
    }

    const rows = await query(
      `SELECT DISTINCT s.subject_name
       FROM teacher_class_subjects tcs
       JOIN classes c ON tcs.class_id = c.id
       JOIN subjects s ON tcs.subject_id = s.id
       WHERE c.class_name = ?
       ORDER BY s.subject_name ASC`,
      [standard]
    );

    let subjectsList = rows.map(r => r.subject_name);

    if (subjectsList.length === 0) {
      const fallbackRows = await query(`SELECT DISTINCT subject_name FROM subjects ORDER BY subject_name ASC`);
      subjectsList = fallbackRows.map(r => r.subject_name);
    }

    if (subjectsList.length === 0) {
      subjectsList = ['Mathematics', 'Science', 'English'];
    }

    return res.json({ success: true, subjects: subjectsList });
  } catch (error) {
    console.error('Error fetching subjects by class:', error);
    return res.json({ success: true, subjects: ['Mathematics', 'Science', 'English'] });
  }
};

/**
 * Check if a date falls into a batch schedule pattern (e.g. 'Monday-Friday', 'Saturday', 'All Days')
 */
export const isDayInSchedulePattern = (pattern, dateStr) => {
  if (!pattern) return true;
  const normPattern = pattern.trim().toLowerCase();
  if (normPattern === 'all days' || normPattern === 'everyday' || normPattern === 'daily' || normPattern === 'all') {
    return true;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;

  const dayIndex = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const fullDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const currentFullDay = fullDays[dayIndex];
  const currentShortDay = shortDays[dayIndex];

  if (normPattern === 'monday-friday' || normPattern === 'mon-fri') {
    return dayIndex >= 1 && dayIndex <= 5;
  }
  if (normPattern === 'saturday-sunday' || normPattern === 'sat-sun' || normPattern === 'weekend') {
    return dayIndex === 0 || dayIndex === 6;
  }

  const parts = normPattern.split(/[\s,]+/).map(p => p.trim());
  return parts.some(p => p === currentFullDay || p === currentShortDay);
};

/**
 * Verify if an active Batch/Timetable schedule exists in database for specified Class, Subject, Teacher & Date
 */
export const getBatchScheduleForAttendance = async ({ standard, subject, teacherId, date }) => {
  if (!standard || standard === 'Select Class' || standard === 'All') {
    return {
      hasSchedule: false,
      formattedTime: null,
      message: 'Attendance cannot be taken because no Class is selected.'
    };
  }

  const normSubject = (subject && subject !== 'All Subjects' && subject !== 'All') ? subject.trim() : '';

  let sql = `
    SELECT b.id, b.teacher_id, t.name AS teacher_name, b.class_id, c.class_name,
           b.subject_id, s.subject_name, b.schedule_pattern, b.start_time, b.end_time, b.status
    FROM batches b
    JOIN classes c ON b.class_id = c.id
    JOIN subjects s ON b.subject_id = s.id
    JOIN teachers t ON b.teacher_id = t.id
    WHERE c.class_name = ?
      AND b.status = 'Active'
  `;
  const params = [standard];

  if (normSubject) {
    sql += ` AND (s.subject_name LIKE ? OR s.subject_name = ?)`;
    params.push(`%${normSubject}%`, normSubject);
  }

  if (teacherId) {
    sql += ` AND (b.teacher_id = ? OR t.teacher_id = ?)`;
    params.push(teacherId, teacherId);
  }

  const batches = await query(sql, params);

  if (!batches || batches.length === 0) {
    return {
      hasSchedule: false,
      formattedTime: null,
      message: 'Attendance cannot be taken because no batch schedule is configured for this Class and Subject.'
    };
  }

  // Filter by date day of week if date provided
  let matchedBatches = batches;
  if (date) {
    matchedBatches = batches.filter(b => isDayInSchedulePattern(b.schedule_pattern, date));
  }

  if (matchedBatches.length === 0) {
    return {
      hasSchedule: false,
      formattedTime: null,
      message: 'Attendance cannot be taken because no batch schedule is configured for this Class and Subject.'
    };
  }

  const matched = matchedBatches[0];
  const startFormatted = formatTime12h(matched.start_time);
  const endFormatted = formatTime12h(matched.end_time);
  const formattedTime = `${startFormatted} - ${endFormatted}`;

  return {
    hasSchedule: true,
    batchId: matched.id,
    teacherId: matched.teacher_id,
    teacherName: matched.teacher_name,
    startTime: matched.start_time,
    endTime: matched.end_time,
    formattedTime,
    schedulePattern: matched.schedule_pattern,
    message: ''
  };
};

/**
 * GET /api/attendance/check-schedule
 * Check if a valid Batch/Timetable schedule exists for Class, Subject, Teacher & Date
 */
export const checkAttendanceSchedule = async (req, res) => {
  try {
    const { standard, subject, teacherId, date } = req.query;
    const scheduleRes = await getBatchScheduleForAttendance({
      standard,
      subject,
      teacherId,
      date: date || new Date().toISOString().split('T')[0]
    });

    if (!scheduleRes.hasSchedule) {
      return res.json({
        success: false,
        hasSchedule: false,
        classTime: null,
        message: scheduleRes.message
      });
    }

    return res.json({
      success: true,
      hasSchedule: true,
      classTime: scheduleRes.formattedTime,
      schedule: scheduleRes
    });
  } catch (error) {
    console.error('Error checking attendance batch schedule:', error);
    return res.status(500).json({
      success: false,
      hasSchedule: false,
      classTime: null,
      message: 'Server error checking batch schedule.'
    });
  }
};

/**
 * GET /api/attendance/teacher-allocations/:teacherId
 * Fetch authorized classes and subjects for a teacher
 */
export const getTeacherAllocatedClassesAndSubjects = async (req, res) => {
  try {
    const { teacherId } = req.params;
    let targetTeacherDbId = null;

    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (teacherId) {
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [teacherId, teacherId]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    if (!targetTeacherDbId) {
      const [firstTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstTeacher) targetTeacherDbId = firstTeacher.id;
    }

    if (!targetTeacherDbId) {
      return res.json({ success: true, allocations: [], classes: [], subjects: [] });
    }

    const tcsRows = await query(
      `SELECT c.class_name AS standard, s.subject_name AS subject
       FROM teacher_class_subjects tcs
       JOIN classes c ON tcs.class_id = c.id
       JOIN subjects s ON tcs.subject_id = s.id
       WHERE tcs.teacher_id = ?
       ORDER BY c.id ASC, s.subject_name ASC`,
      [targetTeacherDbId]
    );

    const allocMap = {};
    const classesSet = new Set();
    const subjectsSet = new Set();

    tcsRows.forEach(r => {
      classesSet.add(r.standard);
      subjectsSet.add(r.subject);

      if (!allocMap[r.standard]) {
        allocMap[r.standard] = [];
      }
      if (!allocMap[r.standard].includes(r.subject)) {
        allocMap[r.standard].push(r.subject);
      }
    });

    const allocations = Object.keys(allocMap).map(std => ({
      standard: std,
      subjects: allocMap[std]
    }));

    return res.json({
      success: true,
      allocations,
      classes: Array.from(classesSet),
      subjects: Array.from(subjectsSet)
    });
  } catch (error) {
    console.error('Error fetching teacher allocations for attendance:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching teacher allocations.' });
  }
};

/**
 * GET /api/attendance/students
 * Fetch active students for specified standard/class & subject
 */
export const getAttendanceStudents = async (req, res) => {
  try {
    const { standard, subject } = req.query;

    if (!standard || standard === 'Select Class' || standard === 'All') {
      return res.json({ success: true, students: [] });
    }

    // Match class_id for the standard string (e.g. '10th')
    const [cRow] = await query(`SELECT id FROM classes WHERE class_name = ?`, [standard]);
    if (!cRow) {
      return res.json({ success: true, students: [] });
    }

    let sql = `
      SELECT 
        s.id,
        s.student_id,
        s.student_id AS studentId,
        s.student_id AS student_code,
        s.student_id AS studentCode,
        s.full_name AS student_name,
        s.full_name AS fullname,
        s.full_name AS name,
        s.roll_no,
        s.roll_no AS rollNo,
        c.class_name AS standard,
        c.class_name AS className,
        s.mobile,
        s.mobile AS phone,
        s.whatsapp_number,
        s.whatsapp_number AS parentMobile,
        s.whatsapp_number AS parent_phone,
        s.photo AS photo
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.class_id = ? AND (s.status = 'Active' OR s.status IS NULL)
    `;
    const params = [cRow.id];

    if (subject && subject !== 'All Subjects' && subject !== 'All') {
      const [sRow] = await query(`SELECT id FROM subjects WHERE subject_name LIKE ?`, [`%${subject}%`]);
      if (sRow) {
        sql += ` AND (s.id IN (SELECT student_id FROM student_subjects WHERE subject_id = ?) OR NOT EXISTS (SELECT 1 FROM student_subjects WHERE student_id = s.id))`;
        params.push(sRow.id);
      }
    }

    sql += ` ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.full_name ASC`;

    const students = await query(sql, params);

    return res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Error fetching attendance roster students:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching students roster.' });
  }
};

/**
 * GET /api/attendance/session
 * Get existing attendance session and student records for class, subject & date
 */
export const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { standard, subject, date } = req.query;

    if (!standard || !date) {
      return res.status(400).json({ success: false, message: 'Standard and date are required.' });
    }

    const normSubject = (subject && subject !== 'All Subjects' && subject !== 'All') ? subject.trim() : '';
    const cleanDate = String(date).split('T')[0];

    await ensureAttendanceSchema();

    const [session] = await query(
      `SELECT * FROM attendance_sessions WHERE standard = ? AND subject = ? AND attendance_date = ?`,
      [standard, normSubject, cleanDate]
    );

    if (!session) {
      const [closedSession] = await query(
        `SELECT * FROM attendance_sessions WHERE attendance_date = ? AND attendance_type = 'CLOSED' LIMIT 1`,
        [cleanDate]
      );

      if (closedSession) {
        const records = await query(
          `SELECT ar.id, ar.student_id AS studentId, ar.student_code AS studentCode, ar.student_name AS studentName, ar.roll_no AS rollNo, ar.status, ar.remarks
           FROM attendance_records ar
           WHERE ar.attendance_session_id = ?`,
          [closedSession.id]
        );

        return res.json({
          success: true,
          hasSchedule: true,
          isTuitionClosed: true,
          scheduleMessage: 'Tuition is closed for this date.',
          classTime: 'N/A',
          startTime: 'N/A',
          endTime: 'N/A',
          isSubmitted: true,
          session: {
            id: closedSession.id,
            standard: closedSession.standard,
            subject: closedSession.subject,
            attendanceDate: cleanDate,
            startTime: 'N/A',
            endTime: 'N/A',
            classTime: 'N/A',
            attendanceType: 'CLOSED',
            totalStudents: closedSession.total_students,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0,
            teacherId: closedSession.teacher_id,
            teacherName: closedSession.teacher_name
          },
          records
        });
      }

      return res.json({
        success: true,
        hasSchedule: true,
        scheduleMessage: '',
        classTime: '',
        startTime: '',
        endTime: '',
        isSubmitted: false,
        session: null,
        records: []
      });
    }

    const records = await query(
      `SELECT 
        ar.id,
        ar.student_id AS studentId,
        ar.student_code AS studentCode,
        ar.student_name AS studentName,
        ar.roll_no AS rollNo,
        ar.status,
        ar.remarks
       FROM attendance_records ar
       WHERE ar.attendance_session_id = ?
       ORDER BY CAST(ar.roll_no AS UNSIGNED) ASC, ar.student_name ASC`,
      [session.id]
    );

    let dateStr = session.attendance_date;
    if (session.attendance_date instanceof Date) {
      const y = session.attendance_date.getFullYear();
      const m = String(session.attendance_date.getMonth() + 1).padStart(2, '0');
      const d = String(session.attendance_date.getDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    } else if (typeof session.attendance_date === 'string') {
      dateStr = session.attendance_date.split('T')[0];
    }

    return res.json({
      success: true,
      hasSchedule: true,
      scheduleMessage: '',
      classTime: session.class_time,
      startTime: session.start_time,
      endTime: session.end_time,
      isSubmitted: true,
      session: {
        id: session.id,
        standard: session.standard,
        subject: session.subject,
        attendanceDate: dateStr,
        startTime: session.start_time,
        endTime: session.end_time,
        classTime: session.class_time,
        attendanceType: session.attendance_type,
        totalStudents: session.total_students,
        presentCount: session.present_count,
        absentCount: session.absent_count,
        lateCount: session.late_count,
        excusedCount: session.excused_count,
        teacherId: session.teacher_id,
        teacherName: session.teacher_name
      },
      records
    });
  } catch (error) {
    console.error('Error fetching attendance session:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching attendance session.' });
  }
};

/**
 * POST /api/attendance
 * Save or Update Attendance Session and Student Records (with manual time validation and teacher authorization)
 */
export const markAttendance = async (req, res) => {
  let conn;
  try {
    const {
      standard,
      subject,
      date,
      attendanceDate,
      startTime,
      endTime,
      classTime,
      attendanceType,
      records,
      teacherId
    } = req.body;

    const annDateRaw = date || attendanceDate || new Date().toISOString().split('T')[0];
    const annDate = String(annDateRaw).split('T')[0]; // Clean YYYY-MM-DD
    const annStandard = (standard || '').trim();
    const type = attendanceType || 'ATTENDANCE';
    const annSubject = (subject && subject !== 'All Subjects' && subject !== 'All') ? subject.trim() : (type === 'CLOSED' ? 'All' : '');

    if (!annStandard) {
      return res.status(400).json({ success: false, message: 'Class/Standard is required.' });
    }
    if (!annSubject && type !== 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }
    if (!annDate) {
      return res.status(400).json({ success: false, message: 'Attendance Date is required.' });
    }

    // Role-specific authorization check for Teacher
    const headerRole = req.headers['x-user-role'];
    const bodyRole = req.body.createdByRole || req.body.role;
    const tokenRole = req.user?.role;
    const effectiveRole = String(headerRole || bodyRole || tokenRole || 'admin').toLowerCase();

    let targetTeacherDbId = null;
    let targetTeacherName = 'Teacher';

    if (effectiveRole === 'teacher') {
      if (req.user && req.user.teacher_id) {
        targetTeacherDbId = req.user.teacher_id;
      } else if (teacherId || req.headers['x-user-id']) {
        const tParam = teacherId || req.headers['x-user-id'];
        const [tRow] = await query(`SELECT id, name FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
        if (tRow) {
          targetTeacherDbId = tRow.id;
          targetTeacherName = tRow.name;
        }
      }

      if (!targetTeacherDbId) {
        const [firstActive] = await query(`SELECT id, name FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
        if (firstActive) {
          targetTeacherDbId = firstActive.id;
          targetTeacherName = firstActive.name;
        }
      }

      // Security Check: Verify Teacher is assigned to target standard and subject
      if (targetTeacherDbId) {
        const tcsRows = await query(
          `SELECT c.class_name AS standard, s.subject_name AS subject
           FROM teacher_class_subjects tcs
           JOIN classes c ON tcs.class_id = c.id
           JOIN subjects s ON tcs.subject_id = s.id
           WHERE tcs.teacher_id = ?`,
          [targetTeacherDbId]
        );

        if (tcsRows.length > 0) {
          const isAllocated = tcsRows.some(r => {
            const stdMatch = r.standard.toLowerCase() === annStandard.toLowerCase();
            const subMatch = !annSubject || 
                             r.subject.toLowerCase() === annSubject.toLowerCase() ||
                             r.subject.toLowerCase().includes(annSubject.toLowerCase()) ||
                             annSubject.toLowerCase().includes(r.subject.toLowerCase());
            return stdMatch && subMatch;
          });

          if (!isAllocated) {
            return res.status(403).json({
              success: false,
              message: `PERMISSION DENIED: You are not assigned to mark attendance or holiday for ${annStandard} (${annSubject}).`
            });
          }
        }
      }
    }

    // MANUAL TIME VALIDATION (only required for standard class attendance)
    let start24 = 'N/A';
    let end24 = 'N/A';
    let formattedClassTime = 'N/A';

    if (type === 'ATTENDANCE') {
      const reqStartTime = (startTime || '').trim();
      const reqEndTime = (endTime || '').trim();

      if (!reqStartTime || !reqEndTime) {
        return res.status(400).json({
          success: false,
          message: 'Start Time and End Time are required.'
        });
      }

      start24 = formatTime24h(reqStartTime);
      end24 = formatTime24h(reqEndTime);

      const getMinutes = (t24) => {
        const parts = t24.split(':');
        if (parts.length < 2) return 0;
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      };

      const startMins = getMinutes(start24);
      const endMins = getMinutes(end24);

      if (endMins <= startMins) {
        return res.status(400).json({
          success: false,
          message: 'End Time must be later than Start Time.'
        });
      }

      const start12 = formatTime12h(start24);
      const end12 = formatTime12h(end24);
      formattedClassTime = classTime || `${start12} - ${end12}`;
    }

    await ensureAttendanceSchema();

    // Calculate Summary Counts
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    const studentRecords = Array.isArray(records) ? records : (Array.isArray(req.body.attendance) ? req.body.attendance : []);
    const totalStudents = studentRecords.length;

    studentRecords.forEach(r => {
      const st = (r.status || 'Present').toLowerCase();
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'late') lateCount++;
      else if (st === 'excused') excusedCount++;
    });

    conn = await getConnection();
    await conn.beginTransaction();

    // 1. Check or Insert Attendance Session Header
    const [sessionRows] = await conn.execute(
      `SELECT id FROM attendance_sessions WHERE standard = ? AND subject = ? AND attendance_date = ?`,
      [annStandard, annSubject, annDate]
    );

    let sessionId;
    if (sessionRows && sessionRows.length > 0) {
      sessionId = sessionRows[0].id;
      await conn.execute(
        `UPDATE attendance_sessions 
         SET start_time = ?, end_time = ?, class_time = ?, attendance_type = ?, total_students = ?, present_count = ?, absent_count = ?, late_count = ?, excused_count = ?, teacher_id = ?, teacher_name = ?
         WHERE id = ?`,
        [start24, end24, formattedClassTime, attendanceType || 'ATTENDANCE', totalStudents, presentCount, absentCount, lateCount, excusedCount, targetTeacherDbId, targetTeacherName, sessionId]
      );
    } else {
      const [insertRes] = await conn.execute(
        `INSERT INTO attendance_sessions 
         (standard, subject, teacher_id, teacher_name, attendance_date, start_time, end_time, class_time, attendance_type, total_students, present_count, absent_count, late_count, excused_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [annStandard, annSubject, targetTeacherDbId, targetTeacherName, annDate, start24, end24, formattedClassTime, attendanceType || 'ATTENDANCE', totalStudents, presentCount, absentCount, lateCount, excusedCount]
      );
      sessionId = insertRes.insertId;
    }

    // 2. Insert or Update Student Detail Records
    for (const rec of studentRecords) {
      const sId = rec.studentId || rec.id;
      const sCode = rec.studentCode || rec.student_code || `STU${sId}`;
      const sName = rec.studentName || rec.name || rec.full_name || 'Student';
      const sRoll = rec.rollNo || rec.roll_no || '';
      const sStatus = rec.status || 'Present';
      const sRemarks = rec.remarks || null;

      if (sId) {
        await conn.execute(
          `INSERT INTO attendance_records 
           (attendance_session_id, student_id, student_code, student_name, roll_no, status, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           status = VALUES(status), remarks = VALUES(remarks), student_name = VALUES(student_name), roll_no = VALUES(roll_no)`,
          [sessionId, sId, sCode, sName, sRoll, sStatus, sRemarks]
        );
      }
    }

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: 'Attendance recorded successfully!',
      sessionId,
      summary: {
        standard: annStandard,
        subject: annSubject,
        date: annDate,
        startTime: start24,
        endTime: end24,
        classTime: formattedClassTime,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        excusedCount
      }
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    console.error('Error marking attendance:', error);
    return res.status(500).json({ success: false, message: 'Server error saving attendance.' });
  }
};

/**
 * GET /api/attendance/history
 * Fetch Monthly Attendance History & Grid Data
 */
export const getAttendanceHistory = async (req, res) => {
  try {
    const { standard, subject, month, year } = req.query;

    const targetMonth = parseInt(month || new Date().getMonth() + 1, 10);
    const targetYear = parseInt(year || new Date().getFullYear(), 10);
    const normSubject = (subject && subject !== 'All Subjects' && subject !== 'All') ? subject : '';

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDayNum = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

    let sessionSql = `SELECT * FROM attendance_sessions WHERE attendance_date BETWEEN ? AND ?`;
    const sessionParams = [startDate, endDate];

    if (standard && standard !== 'All Classes' && standard !== 'All') {
      sessionSql += ` AND standard = ?`;
      sessionParams.push(standard);
    }
    if (normSubject) {
      sessionSql += ` AND subject = ?`;
      sessionParams.push(normSubject);
    }

    sessionSql += ` ORDER BY attendance_date ASC`;
    const sessions = await query(sessionSql, sessionParams);

    if (sessions.length === 0) {
      return res.json({
        success: true,
        month: targetMonth,
        year: targetYear,
        totalDays: 0,
        gridData: [],
        historyRecords: []
      });
    }

    const sessionIds = sessions.map(s => s.id);
    const placeholders = sessionIds.map(() => '?').join(', ');

    const records = await query(
      `SELECT ar.*, DATE_FORMAT(s.attendance_date, '%Y-%m-%d') as attendanceDate
       FROM attendance_records ar
       JOIN attendance_sessions s ON ar.attendance_session_id = s.id
       WHERE ar.attendance_session_id IN (${placeholders})
       ORDER BY CAST(ar.roll_no AS UNSIGNED) ASC, ar.student_name ASC`,
      sessionIds
    );

    // Group by Student for Grid Display
    const studentMap = {};
    records.forEach(r => {
      if (!studentMap[r.student_id]) {
        studentMap[r.student_id] = {
          studentId: r.student_id,
          studentCode: r.student_code,
          name: r.student_name,
          rollNo: r.roll_no,
          presentCount: 0,
          absentCount: 0,
          totalHeld: 0,
          dailyStatus: {}
        };
      }

      const st = r.status;
      const dayNum = parseInt(r.attendanceDate.split('-')[2], 10);
      studentMap[r.student_id].dailyStatus[dayNum] = st;
      studentMap[r.student_id].totalHeld++;

      if (st === 'Present') studentMap[r.student_id].presentCount++;
      else if (st === 'Absent') studentMap[r.student_id].absentCount++;
    });

    const gridData = Object.values(studentMap).map(s => ({
      ...s,
      percentage: s.totalHeld > 0 ? ((s.presentCount / s.totalHeld) * 100).toFixed(1) : 0
    }));

    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      totalDays: sessions.length,
      historyRecords: sessions,
      gridData
    });
  } catch (error) {
    console.error('Error fetching attendance history grid:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching attendance history.' });
  }
};

/**
 * GET /api/attendance/export
 * Export Attendance Report as CSV / Excel format
 */
export const exportAttendanceExcel = async (req, res) => {
  try {
    const { standard, subject, month, year } = req.query;

    const targetMonth = parseInt(month || new Date().getMonth() + 1, 10);
    const targetYear = parseInt(year || new Date().getFullYear(), 10);
    const normSubject = (subject && subject !== 'All Subjects' && subject !== 'All') ? subject : '';

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDayNum = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

    let sessionSql = `SELECT * FROM attendance_sessions WHERE attendance_date BETWEEN ? AND ?`;
    const sessionParams = [startDate, endDate];

    if (standard && standard !== 'All Classes' && standard !== 'All') {
      sessionSql += ` AND standard = ?`;
      sessionParams.push(standard);
    }
    if (normSubject) {
      sessionSql += ` AND subject = ?`;
      sessionParams.push(normSubject);
    }

    sessionSql += ` ORDER BY attendance_date ASC`;
    const sessions = await query(sessionSql, sessionParams);

    if (sessions.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${standard}_${targetMonth}_${targetYear}.csv`);
      return res.send('No attendance records found for the selected filters.');
    }

    const sessionIds = sessions.map(s => s.id);
    const placeholders = sessionIds.map(() => '?').join(', ');

    const records = await query(
      `SELECT ar.*, DATE_FORMAT(s.attendance_date, '%d-%m-%Y') as dateFormatted
       FROM attendance_records ar
       JOIN attendance_sessions s ON ar.attendance_session_id = s.id
       WHERE ar.attendance_session_id IN (${placeholders})
       ORDER BY CAST(ar.roll_no AS UNSIGNED) ASC, ar.student_name ASC`,
      sessionIds
    );

    let csvContent = `Roll No,Student ID,Student Name,Class,Subject,Present Count,Absent Count,Total Classes,Attendance %\n`;

    const studentMap = {};
    records.forEach(r => {
      if (!studentMap[r.student_id]) {
        studentMap[r.student_id] = {
          rollNo: r.roll_no || '',
          studentCode: r.student_code,
          name: r.student_name,
          presentCount: 0,
          absentCount: 0,
          totalHeld: 0
        };
      }
      studentMap[r.student_id].totalHeld++;
      if (r.status === 'Present') studentMap[r.student_id].presentCount++;
      else if (r.status === 'Absent') studentMap[r.student_id].absentCount++;
    });

    Object.values(studentMap).forEach(s => {
      const pct = s.totalHeld > 0 ? ((s.presentCount / s.totalHeld) * 100).toFixed(1) : 0;
      csvContent += `"${s.rollNo}","${s.studentCode}","${s.name}","${standard || 'All'}","${normSubject || 'All'}",${s.presentCount},${s.absentCount},${s.totalHeld},"${pct}%"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${standard || 'All'}_${targetMonth}_${targetYear}.csv`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting attendance report:', error);
    return res.status(500).send('Server error generating attendance export file.');
  }
};

/**
 * GET /api/attendance/student/:studentId
 * Get personal attendance summary for Student Panel
 */
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    let targetStudentDbId = studentId;
    const [sRow] = await query(`SELECT id, class_id, full_name, student_id FROM students WHERE id = ? OR student_id = ?`, [studentId, studentId]);
    if (sRow) targetStudentDbId = sRow.id;

    let sql = `
      SELECT 
        ar.status,
        ar.remarks,
        s.standard,
        s.subject,
        s.attendance_date AS attendanceDate,
        s.attendance_type AS attendanceType,
        s.teacher_name AS teacherName
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.attendance_session_id = s.id
      WHERE ar.student_id = ?
    `;
    const params = [targetStudentDbId];

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      sql += ` AND s.attendance_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    sql += ` ORDER BY s.attendance_date DESC`;

    const records = await query(sql, params);

    let totalHeld = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    records.forEach(r => {
      const st = (r.status || '').toLowerCase();
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'late') lateCount++;
      else if (st === 'excused') excusedCount++;
    });

    const percentage = totalHeld > 0 ? ((presentCount / totalHeld) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      studentId: sRow ? sRow.student_id : studentId,
      studentName: sRow ? sRow.full_name : '',
      summary: {
        totalHeld,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        percentage
      },
      records
    });
  } catch (error) {
    console.error('Error fetching student attendance summary:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching student attendance.' });
  }
};

/**
 * POST /api/attendance/send-whatsapp
 * Send WhatsApp notification links to absent students for a specific class attendance session
 */
export const sendAttendanceWhatsApp = async (req, res) => {
  try {
    const { standard, subject, date, studentIds } = req.body;

    if (!standard || !date) {
      return res.status(400).json({ success: false, message: 'Standard and Date are required.' });
    }

    const normSubject = (subject && subject !== 'All Subjects' && subject !== 'All') ? subject.trim() : '';

    let sessions = [];
    if (normSubject) {
      sessions = await query(
        `SELECT * FROM attendance_sessions WHERE standard = ? AND (subject LIKE ? OR subject = ?) AND attendance_date = ?`,
        [standard, `%${normSubject}%`, normSubject, date]
      );
    } else {
      sessions = await query(
        `SELECT * FROM attendance_sessions WHERE standard = ? AND attendance_date = ?`,
        [standard, date]
      );
    }

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found for specified date and class.' });
    }

    // Filter out holiday/closed sessions if all are holiday
    const activeSessions = sessions.filter(s => s.attendance_type !== 'HOLIDAY' && s.attendance_type !== 'CLOSED');
    if (activeSessions.length === 0) {
      return res.json({
        success: true,
        message: 'No WhatsApp notifications are sent for Holiday or Closed dates.',
        whatsappNotifications: {
          total: 0,
          sent: 0,
          failed: 0,
          code: 'HOLIDAY_NO_WHATSAPP',
          results: []
        }
      });
    }

    const sessionIds = activeSessions.map(s => s.id);
    const placeholders = sessionIds.map(() => '?').join(',');

    const rawAbsentRecords = await query(
      `SELECT 
         ar.id AS recordId, 
         st.id AS studentDbId, 
         st.full_name AS studentName, 
         st.mobile, 
         st.whatsapp_number,
         sess.subject AS sessionSubject,
         sess.class_time AS sessionClassTime,
         sess.start_time AS sessionStartTime,
         sess.end_time AS sessionEndTime
       FROM attendance_records ar
       JOIN students st ON ar.student_id = st.id
       JOIN attendance_sessions sess ON ar.attendance_session_id = sess.id
       WHERE ar.attendance_session_id IN (${placeholders}) AND LOWER(ar.status) = 'absent'`,
      sessionIds
    );

    // Group absent records by studentDbId to compile ONLY the subjects in which the student was absent
    const studentMap = {};

    for (const rec of rawAbsentRecords) {
      const stdId = String(rec.studentDbId);
      if (!studentMap[stdId]) {
        studentMap[stdId] = {
          studentDbId: rec.studentDbId,
          studentName: rec.studentName,
          mobile: rec.mobile,
          whatsapp_number: rec.whatsapp_number,
          absentSubjectsList: []
        };
      }

      let formattedTime = rec.sessionClassTime;
      if (!formattedTime || formattedTime === 'N/A') {
        if (rec.sessionStartTime && rec.sessionEndTime) {
          formattedTime = `${formatTime12h(rec.sessionStartTime)} - ${formatTime12h(rec.sessionEndTime)}`;
        } else {
          formattedTime = 'Class Time';
        }
      }

      let subjName = (rec.sessionSubject || 'Subject').trim();
      if (subjName.toLowerCase() === 'math' || subjName.toLowerCase() === 'mathematics') {
        subjName = 'Mathematics';
      }

      const exists = studentMap[stdId].absentSubjectsList.some(
        s => s.subject.toLowerCase() === subjName.toLowerCase()
      );
      if (!exists) {
        studentMap[stdId].absentSubjectsList.push({
          subject: subjName,
          classTime: formattedTime
        });
      }
    }

    let absentees = Object.values(studentMap);

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const idSet = new Set(studentIds.map(id => String(id)));
      absentees = absentees.filter(a => idSet.has(String(a.studentDbId)));
    }

    if (absentees.length === 0) {
      return res.json({
        success: true,
        message: 'No absent students found for this session.',
        whatsappNotifications: {
          total: 0,
          sent: 0,
          failed: 0,
          code: 'NO_ABSENT_STUDENTS',
          results: []
        }
      });
    }

    const firstSession = activeSessions[0];

    // Call Playwright WhatsApp Web Browser Automation Engine
    const automationResult = await processWhatsAppWebAutomation({
      absentees,
      date,
      subject: normSubject || 'Tuition Assessment',
      classTime: firstSession.class_time
    });

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
    console.error('Error sending Attendance WhatsApp notifications:', error);
    return res.status(500).json({ success: false, message: 'Server error sending WhatsApp notices via automation.' });
  }
};

/**
 * GET /api/attendance/whatsapp-status
 * Check if WhatsApp Web session is logged in (WHATSAPP_CONNECTED, WHATSAPP_QR_REQUIRED, WHATSAPP_NOT_CONNECTED)
 */
export const getWhatsAppStatus = async (req, res) => {
  try {
    const statusResult = await getWhatsAppWebStatus();
    return res.json(statusResult);
  } catch (error) {
    console.error('Error checking WhatsApp Web status:', error);
    return res.status(500).json({
      success: false,
      status: 'WHATSAPP_NOT_CONNECTED',
      isConnected: false,
      message: 'Failed to verify WhatsApp Web status.'
    });
  }
};

/**
 * POST /api/attendance/whatsapp-qr-setup
 * Open interactive browser window on server for user to scan WhatsApp QR code
 */
export const launchWhatsAppQRSetup = async (req, res) => {
  try {
    const setupResult = await launchWhatsAppQRScanWindow();
    return res.json(setupResult);
  } catch (error) {
    console.error('Error in WhatsApp QR setup:', error);
    return res.status(500).json({
      success: false,
      status: 'WHATSAPP_NOT_CONNECTED',
      message: 'Failed to complete QR setup.'
    });
  }
};




