import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { getConnection, query } from '../config/db.js';
import { normalizeSubject } from '../../src/utils/subjectUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'students');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Class Code Lookup for Student ID Generation
 * - 5th -> 52
 * - 6th -> 62
 * - 7th -> 72
 * - 8th -> 82
 * - 9th -> 92
 * - 10th -> 10
 * - 11th -> 11
 * - 12th -> 12
 * - Navodaya -> NAV
 */
export const getClassCode = (standard) => {
  if (!standard) return '00';
  const s = String(standard).trim();
  if (s === '5th') return '52';
  if (s === '6th') return '62';
  if (s === '7th') return '72';
  if (s === '8th') return '82';
  if (s === '9th') return '92';
  if (s === '10th') return '10';
  if (s === '11th') return '11';
  if (s === '12th') return '12';
  if (s.toLowerCase() === 'navodaya') return 'NAV';
  const digits = s.replace(/\D/g, '');
  if (digits.length === 1) return `${digits}2`;
  return digits || '00';
};

/**
 * Single Source of Truth for Student ID Formatting
 * Format: UC + CURRENT_YEAR + CLASS_CODE + SERIAL (No hyphens)
 * Examples (Year 2026):
 * - 6th: UC202662001
 * - 7th: UC202672001
 * - 9th: UC202692001
 * - 10th: UC202610001
 * - 12th: UC202612001
 */
export const formatStudentId = (year, standard, serialNum) => {
  const classCode = getClassCode(standard);
  const serialStr = String(serialNum).padStart(3, '0');
  return `UC${year}${classCode}${serialStr}`;
};

// Helper: Save Base64 Photo to Disk
const saveBase64Photo = (base64String, studentId) => {
  if (!base64String || typeof base64String !== 'string') return null;
  if (!base64String.startsWith('data:image')) {
    return base64String; // Return as-is if already a file path or URL
  }

  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    const filename = `${studentId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, dataBuffer);
    return `/uploads/students/${filename}`;
  } catch (error) {
    console.error('Error saving base64 photo:', error);
    return null;
  }
};

/**
 * GET /api/students/next-id?standard=6th
 * Previews next Student ID without incrementing or reserving DB counters
 */
export const getNextStudentId = async (req, res) => {
  try {
    const standard = (req.query.standard && req.query.standard.trim()) ? req.query.standard.trim() : '10th';
    const currentYear = new Date().getFullYear();

    // Find or create class record to get class_id
    let classRows = await query('SELECT id FROM classes WHERE class_name = ?', [standard]);
    let classId;
    if (classRows.length > 0) {
      classId = classRows[0].id;
    } else {
      const insertRes = await query('INSERT INTO classes (class_name) VALUES (?)', [standard]);
      classId = insertRes.insertId;
    }

    let nextSerial = 1;
    if (classId) {
      const counterRows = await query(
        'SELECT last_serial FROM student_id_counters WHERE academic_year = ? AND class_id = ?',
        [currentYear, classId]
      );
      if (counterRows.length > 0) {
        nextSerial = counterRows[0].last_serial + 1;
      }
    }

    let nextRollNo = 1;
    if (classId) {
      const rollCounterRows = await query(
        'SELECT last_roll_no FROM roll_no_counters WHERE class_id = ?',
        [classId]
      );
      if (rollCounterRows.length > 0) {
        nextRollNo = rollCounterRows[0].last_roll_no + 1;
      }
    }

    const generatedId = formatStudentId(currentYear, standard, nextSerial);
    return res.status(200).json({
      success: true,
      studentId: generatedId,
      rollNo: nextRollNo,
      previewOnly: true
    });
  } catch (error) {
    console.warn('DB connection notice during ID preview:', error.message);
    const standard = (req.query.standard && req.query.standard.trim()) ? req.query.standard.trim() : '10th';
    const currentYear = new Date().getFullYear();
    const fallbackId = formatStudentId(currentYear, standard, 1);
    return res.status(200).json({
      success: true,
      studentId: fallbackId,
      rollNo: 1,
      previewOnly: true,
      fallback: true
    });
  }
};

/**
 * POST /api/students
 * Creates new student registration in atomic MySQL Transaction
 * Enforces mandatory field checks & 10-digit phone validation
 */
export const createStudent = async (req, res) => {
  const conn = await getConnection();

  try {
    const {
      fullname,
      name,
      full_name,
      standard,
      medium,
      subjects = [],
      mobile,
      parentName,
      parentMobile,
      address,
      dateOfBirth,
      schoolName,
      courseStream,
      admissionDate,
      totalFees,
      amountPaid,
      paymentMode,
      photo
    } = req.body;

    const studentFullName = (fullname || name || full_name || '').trim();

    // Strict Backend Validation Rules (All Admission Fields Mandatory)
    if (!photo || !String(photo).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Student Photo is required.' });
    }
    if (!studentFullName) {
      return res.status(400).json({ success: false, message: 'Validation Error: Student Full Name is required.' });
    }
    if (!standard || !String(standard).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Class / Standard is required.' });
    }
    if (!medium || !String(medium).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Medium selection is required.' });
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: At least one subject must be selected.' });
    }
    if (!schoolName || !String(schoolName).trim() || String(schoolName).trim() === 'Select School') {
      return res.status(400).json({ success: false, message: 'Validation Error: School Name selection is required.' });
    }
    if (!dateOfBirth || !String(dateOfBirth).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Date of Birth is required.' });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Address is required.' });
    }
    if (!mobile || !String(mobile).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Student Mobile Number is required.' });
    }
    // 10-Digit Mobile Regex Validation
    const mobileClean = String(mobile).trim();
    if (!/^[0-9]{10}$/.test(mobileClean)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Student Mobile Number must be exactly 10 digits (e.g. 9876543210).'
      });
    }

    const whatsAppClean = parentMobile ? String(parentMobile).trim() : mobileClean;
    if (!/^[0-9]{10}$/.test(whatsAppClean)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: WhatsApp Number must be exactly 10 digits (e.g. 9876543210).'
      });
    }

    if (!admissionDate || !String(admissionDate).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Admission Date is required.' });
    }
    if (totalFees === undefined || totalFees === null || String(totalFees).trim() === '' || isNaN(Number(totalFees))) {
      return res.status(400).json({ success: false, message: 'Validation Error: Total Fees is required.' });
    }
    if (amountPaid === undefined || amountPaid === null || String(amountPaid).trim() === '' || isNaN(Number(amountPaid))) {
      return res.status(400).json({ success: false, message: 'Validation Error: Amount Paid is required.' });
    }

    const totalFeesNum = Number(totalFees);
    const amountPaidNum = Number(amountPaid);

    if (totalFeesNum < 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Total Fees cannot be negative.' });
    }
    if (amountPaidNum < 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Amount Paid cannot be negative.' });
    }
    if (amountPaidNum > totalFeesNum) {
      return res.status(400).json({ success: false, message: 'Validation Error: Amount Paid cannot exceed Total Fees.' });
    }

    if (!paymentMode || !String(paymentMode).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Payment Mode is required.' });
    }

    // START ATOMIC MYSQL TRANSACTION
    await conn.beginTransaction();

    // 1. Resolve or Create Class ID
    const cleanStandard = String(standard).trim();
    let [classRows] = await conn.execute('SELECT id FROM classes WHERE class_name = ?', [cleanStandard]);
    let classId;
    if (classRows.length > 0) {
      classId = classRows[0].id;
    } else {
      const [newClass] = await conn.execute('INSERT INTO classes (class_name) VALUES (?)', [cleanStandard]);
      classId = newClass.insertId;
    }

    // 2. Concurrency-Safe Class-Wise Roll Number Generation via Row Lock (FOR UPDATE)
    const [rollCounterRows] = await conn.execute(
      'SELECT id, last_roll_no FROM roll_no_counters WHERE class_id = ? FOR UPDATE',
      [classId]
    );

    let generatedRollNo = 1;
    if (rollCounterRows.length > 0) {
      generatedRollNo = rollCounterRows[0].last_roll_no + 1;
      await conn.execute(
        'UPDATE roll_no_counters SET last_roll_no = ? WHERE id = ?',
        [generatedRollNo, rollCounterRows[0].id]
      );
    } else {
      await conn.execute(
        'INSERT INTO roll_no_counters (class_id, last_roll_no) VALUES (?, 1)',
        [classId]
      );
    }

    // 3. Concurrency-Safe Class-Wise Student ID Generation via Row Lock (FOR UPDATE)
    const currentYear = new Date().getFullYear();
    const [counterRows] = await conn.execute(
      'SELECT id, last_serial FROM student_id_counters WHERE academic_year = ? AND class_id = ? FOR UPDATE',
      [currentYear, classId]
    );

    let serialNum = 1;
    if (counterRows.length > 0) {
      serialNum = counterRows[0].last_serial + 1;
      await conn.execute(
        'UPDATE student_id_counters SET last_serial = ? WHERE id = ?',
        [serialNum, counterRows[0].id]
      );
    } else {
      await conn.execute(
        'INSERT INTO student_id_counters (academic_year, class_id, last_serial) VALUES (?, ?, 1)',
        [currentYear, classId]
      );
    }

    const officialStudentId = formatStudentId(currentYear, cleanStandard, serialNum);

    // 4. Process Photo File Storage
    const savedPhotoPath = saveBase64Photo(photo, officialStudentId);
    if (!savedPhotoPath) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Validation Error: Failed to process student photo file.' });
    }

    // 5. Format Dates
    const formattedDob = new Date(dateOfBirth).toISOString().slice(0, 10);
    const formattedAdmissionDate = new Date(admissionDate).toISOString().slice(0, 10);

    // 6. Insert Student Master Record with Automatic Class-Wise Roll Number
    const [studentResult] = await conn.execute(
      `INSERT INTO students (
        student_id, roll_no, full_name, class_id, medium, school_name, 
        date_of_birth, address, mobile, whatsapp_number, course_stream, 
        photo, admission_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        officialStudentId,
        generatedRollNo,
        studentFullName,
        classId,
        medium.trim(),
        schoolName.trim(),
        formattedDob,
        address.trim(),
        mobileClean,
        whatsAppClean,
        courseStream || null,
        savedPhotoPath,
        formattedAdmissionDate
      ]
    );

    const insertedStudentDbId = studentResult.insertId;

    // 6. Map and Insert Selected Subjects into Junction Table
    for (const subName of subjects) {
      if (!subName || typeof subName !== 'string') continue;
      const cleanSubName = subName.trim();

      let [subRows] = await conn.execute('SELECT id FROM subjects WHERE subject_name = ?', [cleanSubName]);
      let subjectId;
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
      } else {
        const [newSub] = await conn.execute('INSERT INTO subjects (subject_name) VALUES (?)', [cleanSubName]);
        subjectId = newSub.insertId;
      }

      await conn.execute(
        'INSERT IGNORE INTO student_subjects (student_id, subject_id) VALUES (?, ?)',
        [insertedStudentDbId, subjectId]
      );
    }

    // 7. Initialize Fee Account Ledger
    const balanceFeesNum = Math.max(0, totalFeesNum - amountPaidNum);
    const [feeAccResult] = await conn.execute(
      `INSERT INTO fee_accounts (student_id, total_fees, amount_paid, balance_amount) 
       VALUES (?, ?, ?, ?)`,
      [insertedStudentDbId, totalFeesNum, amountPaidNum, balanceFeesNum]
    );

    const feeAccountId = feeAccResult.insertId;

    // 8. Record Initial Fee Payment
    if (amountPaidNum > 0) {
      const receiptNo = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(insertedStudentDbId).padStart(4, '0')}`;
      await conn.execute(
        `INSERT INTO fee_payments (student_id, fee_account_id, amount, payment_mode, payment_date, receipt_number, notes)
         VALUES (?, ?, ?, ?, NOW(), ?, 'Initial Admission Payment')`,
        [insertedStudentDbId, feeAccountId, amountPaidNum, paymentMode.trim(), receiptNo]
      );
    }

    // COMMIT ATOMIC TRANSACTION
    await conn.commit();

    const responseData = {
      id: insertedStudentDbId,
      studentId: officialStudentId,
      rollNo: generatedRollNo,
      fullname: studentFullName,
      name: studentFullName,
      standard: cleanStandard,
      medium: medium.trim(),
      subjects: subjects,
      mobile: mobileClean,
      parentName: parentName ? parentName.trim() : `${studentFullName} (Parent/Guardian)`,
      parentMobile: whatsAppClean,
      schoolName: schoolName.trim(),
      address: address.trim(),
      dateOfBirth: formattedDob,
      admissionDate: formattedAdmissionDate,
      totalFees: totalFeesNum,
      amountPaid: amountPaidNum,
      paymentMode: paymentMode.trim(),
      photo: savedPhotoPath,
      status: 'Active'
    };

    return res.status(201).json({
      success: true,
      message: 'Student admitted successfully!',
      student: responseData
    });

  } catch (error) {
    // ROLLBACK TRANSACTION ON ERROR
    await conn.rollback();
    console.error('Error during student admission transaction:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error during student admission transaction.'
    });
  } finally {
    conn.release();
  }
};

/**
 * GET /api/students & GET /api/attendance/students
 * Fetches registered students list from MySQL with teacher (Class + Subject) scoping
 */
export const getStudents = async (req, res) => {
  try {
    const { standard, subject, search, teacherId, teacher, status } = req.query;

    // Determine target teacher database ID
    let targetTeacherDbId = null;
    if (req.user && req.user.teacher_id) {
      targetTeacherDbId = req.user.teacher_id;
    } else if (teacherId || teacher) {
      const tParam = teacherId || teacher;
      const [tRow] = await query(`SELECT id FROM teachers WHERE id = ? OR teacher_id = ?`, [tParam, tParam]);
      if (tRow) targetTeacherDbId = tRow.id;
    }

    const isTeacherRoute = (req.originalUrl && (req.originalUrl.includes('/teacher/') || req.originalUrl.includes('/attendance/'))) || (req.user && req.user.role === 'teacher');

    if (!targetTeacherDbId && isTeacherRoute) {
      const [firstActiveTeacher] = await query(`SELECT id FROM teachers WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstActiveTeacher) targetTeacherDbId = firstActiveTeacher.id;
    }

    let sql = ``;
    const params = [];

    if (targetTeacherDbId) {
      // Strictly scope to students matching (teacher_id, class_id, subject_id) in teacher_class_subjects
      sql = `
        SELECT DISTINCT
          s.id,
          s.id AS _id,
          s.student_id AS studentId,
          s.roll_no AS rollNo,
          s.full_name AS fullname,
          s.full_name AS name,
          c.class_name AS standard,
          s.medium,
          s.school_name AS schoolName,
          s.mobile,
          s.whatsapp_number AS parentMobile,
          s.photo,
          s.admission_date AS admissionDate,
          s.status,
          fa.total_fees AS totalFees,
          fa.amount_paid AS amountPaid
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN student_subjects ss ON s.id = ss.student_id
        JOIN teacher_class_subjects tcs ON (tcs.class_id = s.class_id AND tcs.subject_id = ss.subject_id)
        LEFT JOIN fee_accounts fa ON s.id = fa.student_id
        WHERE tcs.teacher_id = ?
      `;
      params.push(targetTeacherDbId);
    } else {
      // General Admin listing query
      sql = `
        SELECT DISTINCT
          s.id,
          s.id AS _id,
          s.student_id AS studentId,
          s.roll_no AS rollNo,
          s.full_name AS fullname,
          s.full_name AS name,
          c.class_name AS standard,
          s.medium,
          s.school_name AS schoolName,
          s.mobile,
          s.whatsapp_number AS parentMobile,
          s.photo,
          s.admission_date AS admissionDate,
          s.status,
          fa.total_fees AS totalFees,
          fa.amount_paid AS amountPaid
        FROM students s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN fee_accounts fa ON s.id = fa.student_id
        WHERE 1=1
      `;
    }

    if (standard && standard !== 'Select Class' && standard !== 'All Classes' && standard !== 'All Standards' && standard !== 'All') {
      sql += ' AND c.class_name = ?';
      params.push(standard);
    }

    if (subject && subject !== 'All Subjects' && subject !== 'All') {
      sql += ' AND s.id IN (SELECT ss2.student_id FROM student_subjects ss2 JOIN subjects sub ON ss2.subject_id = sub.id WHERE sub.subject_name = ?)';
      params.push(subject);
    }

    if (status && status !== 'All') {
      sql += ' AND s.status = ?';
      params.push(status);
    } else if (targetTeacherDbId) {
      sql += " AND s.status = 'Active'";
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (s.full_name LIKE ? OR s.student_id LIKE ? OR s.roll_no LIKE ? OR s.mobile LIKE ?)';
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY s.id DESC';

    const students = await query(sql, params);

    for (const student of students) {
      const subRows = await query(
        `SELECT sub.subject_name 
         FROM student_subjects ss 
         JOIN subjects sub ON ss.subject_id = sub.id 
         WHERE ss.student_id = ?`,
        [student.id]
      );
      student.subjects = subRows.map(r => r.subject_name);
    }

    return res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student directory from database.'
    });
  }
};

/**
 * GET /api/students/:id
 * Fetches single student record with subjects, fee accounts, and payment history.
 * Supports numeric primary key `s.id` or string business `s.student_id`.
 */
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !String(id).trim()) {
      return res.status(400).json({ success: false, message: 'Student ID parameter is required.' });
    }

    const cleanId = String(id).trim();

    let sql = `
      SELECT 
        s.id,
        s.student_id AS studentId,
        s.roll_no AS rollNo,
        s.full_name AS fullname,
        s.full_name AS name,
        c.class_name AS standard,
        s.medium,
        s.school_name AS schoolName,
        s.date_of_birth AS dateOfBirth,
        s.address,
        s.mobile,
        s.whatsapp_number AS parentMobile,
        s.course_stream AS courseStream,
        s.photo,
        s.admission_date AS admissionDate,
        s.status,
        fa.total_fees AS totalFees,
        fa.amount_paid AS amountPaid,
        fa.balance_amount AS balanceAmount
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_accounts fa ON s.id = fa.student_id
      WHERE 
    `;

    let params = [];
    if (/^\d+$/.test(cleanId)) {
      sql += ' (s.id = ? OR s.student_id = ?)';
      params = [parseInt(cleanId, 10), cleanId];
    } else {
      sql += ' s.student_id = ?';
      params = [cleanId];
    }

    const studentRows = await query(sql, params);
    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = studentRows[0];

    // Fetch subjects from student_subjects junction table
    const subRows = await query(
      `SELECT sub.subject_name 
       FROM student_subjects ss 
       JOIN subjects sub ON ss.subject_id = sub.id 
       WHERE ss.student_id = ?`,
      [student.id]
    );
    student.subjects = subRows.map(r => r.subject_name);

    // Fetch payment history log from fee_payments table
    const paymentRows = await query(
      `SELECT receipt_number, amount, payment_mode, payment_date, notes
       FROM fee_payments 
       WHERE student_id = ? 
       ORDER BY id DESC`,
      [student.id]
    );
    student.payments = paymentRows;
    if (paymentRows.length > 0) {
      student.paymentMode = paymentRows[0].payment_mode;
    } else {
      student.paymentMode = 'Cash';
    }

    // Attach nested fee summary object
    student.fees = {
      total_fees: Number(student.totalFees) || 0,
      amount_paid: Number(student.amountPaid) || 0,
      balance_amount: Number(student.balanceAmount) || 0
    };

    return res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load student details. Database error.'
    });
  }
};

/**
 * PUT /api/students/:id
 * Updates existing student record in atomic MySQL Transaction
 * Preserves student_id, roll_no, class_id, and fee_payments history log
 */
export const updateStudent = async (req, res) => {
  const conn = await getConnection();

  try {
    const { id } = req.params;
    if (!id || !String(id).trim()) {
      return res.status(400).json({ success: false, message: 'Student ID parameter is required.' });
    }

    const cleanId = String(id).trim();

    // Check if student exists in database
    let findSql = `SELECT s.id, s.student_id, s.roll_no, s.class_id, s.photo FROM students s WHERE `;
    let findParams = [];
    if (/^\d+$/.test(cleanId)) {
      findSql += ' (s.id = ? OR s.student_id = ?)';
      findParams = [parseInt(cleanId, 10), cleanId];
    } else {
      findSql += ' s.student_id = ?';
      findParams = [cleanId];
    }

    const [existingStudents] = await conn.execute(findSql, findParams);
    if (!existingStudents || existingStudents.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const existingStudent = existingStudents[0];
    const studentDbId = existingStudent.id;
    const existingStudentIdStr = existingStudent.student_id;

    const {
      fullname,
      name,
      full_name,
      medium,
      subjects = [],
      mobile,
      parentMobile,
      address,
      dateOfBirth,
      schoolName,
      admissionDate,
      totalFees,
      amountPaid,
      paymentMode,
      photo
    } = req.body;

    const studentFullName = (fullname || name || full_name || '').trim();

    // Strict Backend Validation Rules
    if (!studentFullName) {
      return res.status(400).json({ success: false, message: 'Validation Error: Student Full Name is required.' });
    }
    if (!medium || !String(medium).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Medium selection is required.' });
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: At least one subject must be selected.' });
    }
    if (!schoolName || !String(schoolName).trim() || String(schoolName).trim() === 'Select School') {
      return res.status(400).json({ success: false, message: 'Validation Error: School Name selection is required.' });
    }
    if (!dateOfBirth || !String(dateOfBirth).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Date of Birth is required.' });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Address is required.' });
    }
    if (!mobile || !String(mobile).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Student Mobile Number is required.' });
    }

    const mobileClean = String(mobile).trim();
    if (!/^[0-9]{10}$/.test(mobileClean)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Student Mobile Number must be exactly 10 digits (e.g. 9876543210).'
      });
    }

    const whatsAppClean = parentMobile ? String(parentMobile).trim() : mobileClean;
    if (!/^[0-9]{10}$/.test(whatsAppClean)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: WhatsApp Number must be exactly 10 digits (e.g. 9876543210).'
      });
    }

    if (!admissionDate || !String(admissionDate).trim()) {
      return res.status(400).json({ success: false, message: 'Validation Error: Admission Date is required.' });
    }
    if (totalFees === undefined || totalFees === null || String(totalFees).trim() === '' || isNaN(Number(totalFees))) {
      return res.status(400).json({ success: false, message: 'Validation Error: Total Fees is required.' });
    }
    if (amountPaid === undefined || amountPaid === null || String(amountPaid).trim() === '' || isNaN(Number(amountPaid))) {
      return res.status(400).json({ success: false, message: 'Validation Error: Amount Paid is required.' });
    }

    const totalFeesNum = Number(totalFees);
    const amountPaidNum = Number(amountPaid);

    if (totalFeesNum < 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Total Fees cannot be negative.' });
    }
    if (amountPaidNum < 0) {
      return res.status(400).json({ success: false, message: 'Validation Error: Amount Paid cannot be negative.' });
    }
    if (amountPaidNum > totalFeesNum) {
      return res.status(400).json({ success: false, message: 'Validation Error: Amount Paid cannot exceed Total Fees.' });
    }

    // START ATOMIC TRANSACTION
    await conn.beginTransaction();

    // Photo Handling: If new base64 photo provided, save it; otherwise keep existing photo path
    let finalPhotoPath = existingStudent.photo;
    if (photo && typeof photo === 'string' && photo.startsWith('data:image')) {
      const newSavedPath = saveBase64Photo(photo, existingStudentIdStr);
      if (newSavedPath) {
        finalPhotoPath = newSavedPath;
      }
    }

    const formattedDob = new Date(dateOfBirth).toISOString().slice(0, 10);
    const formattedAdmissionDate = new Date(admissionDate).toISOString().slice(0, 10);

    // 1. Update Master Student Table (Keep student_id, roll_no, class_id intact)
    await conn.execute(
      `UPDATE students SET
        full_name = ?,
        medium = ?,
        school_name = ?,
        date_of_birth = ?,
        address = ?,
        mobile = ?,
        whatsapp_number = ?,
        photo = ?,
        admission_date = ?
      WHERE id = ?`,
      [
        studentFullName,
        medium.trim(),
        schoolName.trim(),
        formattedDob,
        address.trim(),
        mobileClean,
        whatsAppClean,
        finalPhotoPath,
        formattedAdmissionDate,
        studentDbId
      ]
    );

    // 2. Synchronize student_subjects Junction Table (Remove unselected, insert new)
    await conn.execute('DELETE FROM student_subjects WHERE student_id = ?', [studentDbId]);

    for (const subName of subjects) {
      if (!subName || typeof subName !== 'string') continue;
      const cleanSubName = subName.trim();

      let [subRows] = await conn.execute('SELECT id FROM subjects WHERE subject_name = ?', [cleanSubName]);
      let subjectId;
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
      } else {
        const [newSub] = await conn.execute('INSERT INTO subjects (subject_name) VALUES (?)', [cleanSubName]);
        subjectId = newSub.insertId;
      }

      await conn.execute(
        'INSERT IGNORE INTO student_subjects (student_id, subject_id) VALUES (?, ?)',
        [studentDbId, subjectId]
      );
    }

    // 3. Update Fee Account (total_fees, amount_paid, balance_amount)
    const balanceFeesNum = Math.max(0, totalFeesNum - amountPaidNum);
    const [feeAccRows] = await conn.execute('SELECT id FROM fee_accounts WHERE student_id = ?', [studentDbId]);

    if (feeAccRows.length > 0) {
      await conn.execute(
        `UPDATE fee_accounts 
         SET total_fees = ?, amount_paid = ?, balance_amount = ?
         WHERE student_id = ?`,
        [totalFeesNum, amountPaidNum, balanceFeesNum, studentDbId]
      );
    } else {
      await conn.execute(
        `INSERT INTO fee_accounts (student_id, total_fees, amount_paid, balance_amount)
         VALUES (?, ?, ?, ?)`,
        [studentDbId, totalFeesNum, amountPaidNum, balanceFeesNum]
      );
    }

    // Commit Transaction (fee_payments transaction log is preserved intact)
    await conn.commit();

    return res.status(200).json({
      success: true,
      message: 'Student details updated successfully.',
      student: {
        id: studentDbId,
        studentId: existingStudentIdStr,
        rollNo: existingStudent.roll_no,
        fullname: studentFullName,
        name: studentFullName,
        medium: medium.trim(),
        subjects,
        schoolName: schoolName.trim(),
        address: address.trim(),
        mobile: mobileClean,
        parentMobile: whatsAppClean,
        dateOfBirth: formattedDob,
        admissionDate: formattedAdmissionDate,
        totalFees: totalFeesNum,
        amountPaid: amountPaidNum,
        photo: finalPhotoPath
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error updating student record:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error while updating student.'
    });
  } finally {
    conn.release();
  }
};

/**
 * GET /api/students/export
 * Generates and downloads a multi-worksheet Excel (.xlsx) workbook for student records from MySQL.
 * Query Parameters:
 * - scope: 'all' | 'filtered' (default: 'all')
 * - standard: Class name filter (when scope = 'filtered')
 * - search: Search term filter (when scope = 'filtered')
 * - status: Status filter (when scope = 'filtered')
 */
export const exportStudentsToExcel = async (req, res) => {
  try {
    const { scope, standard, search, status } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.student_id AS studentId,
        s.roll_no AS rollNo,
        s.full_name AS fullname,
        s.full_name AS name,
        c.class_name AS standard,
        s.medium,
        s.school_name AS schoolName,
        s.date_of_birth AS dateOfBirth,
        s.address,
        s.mobile,
        s.whatsapp_number AS parentMobile,
        s.admission_date AS admissionDate,
        s.status,
        fa.total_fees AS totalFees,
        fa.amount_paid AS amountPaid,
        fa.balance_amount AS balanceAmount
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_accounts fa ON s.id = fa.student_id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters if scope is 'filtered'
    if (scope === 'filtered') {
      if (standard && standard !== 'Select Class' && standard !== 'All Classes' && standard !== 'All') {
        sql += ' AND c.class_name = ?';
        params.push(standard);
      }
      if (status && status !== 'All') {
        sql += ' AND s.status = ?';
        params.push(status);
      }
      if (search && search.trim()) {
        sql += ' AND (s.full_name LIKE ? OR s.student_id LIKE ? OR s.mobile LIKE ?)';
        const term = `%${search.trim()}%`;
        params.push(term, term, term);
      }
    }

    sql += ' ORDER BY s.id DESC';

    const students = await query(sql, params);

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No student data available for export.'
      });
    }

    // Fetch subjects and recent payment mode for each student
    const studentDbIds = students.map((s) => s.id);

    for (const student of students) {
      // Subjects combined into ONE cell per student
      const subRows = await query(
        `SELECT sub.subject_name 
         FROM student_subjects ss 
         JOIN subjects sub ON ss.subject_id = sub.id 
         WHERE ss.student_id = ?
         ORDER BY sub.id ASC`,
        [student.id]
      );
      student.subjectsStr = subRows.map((r) => r.subject_name).join(', ') || '-';

      // Payment Mode from recent fee_payments record
      const payRows = await query(
        `SELECT payment_mode FROM fee_payments WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
        [student.id]
      );
      student.paymentMode = payRows.length > 0 ? payRows[0].payment_mode : 'Cash';
    }

    // Fetch Payment History for Worksheet 2
    let paymentSql = `
      SELECT 
        fp.receipt_number AS receiptNumber,
        s.student_id AS studentId,
        s.full_name AS fullname,
        s.full_name AS studentName,
        fp.amount,
        fp.payment_mode AS paymentMode,
        fp.payment_date AS paymentDate
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
    `;
    const payParams = [];

    if (scope === 'filtered' && studentDbIds.length > 0) {
      paymentSql += ` WHERE fp.student_id IN (${studentDbIds.map(() => '?').join(',')})`;
      payParams.push(...studentDbIds);
    }
    paymentSql += ` ORDER BY fp.id DESC`;

    const paymentRecords = await query(paymentSql, payParams);

    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Unique Classes Tuition Management System';
    workbook.created = new Date();

    // ====================================================
    // WORKSHEET 1: Students (1 row per student)
    // ====================================================
    const studentsSheet = workbook.addWorksheet('Students', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    studentsSheet.columns = [
      { header: 'Student ID', key: 'studentId', width: 16 },
      { header: 'Roll No', key: 'rollNo', width: 10 },
      { header: 'fullname', key: 'fullname', width: 25 },
      { header: 'Class', key: 'standard', width: 12 },
      { header: 'Medium', key: 'medium', width: 15 },
      { header: 'Subjects', key: 'subjectsStr', width: 30 },
      { header: 'School Name', key: 'schoolName', width: 28 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 14 },
      { header: 'Address', key: 'address', width: 35 },
      { header: 'Mobile Number', key: 'mobile', width: 16 },
      { header: 'WhatsApp Number', key: 'parentMobile', width: 16 },
      { header: 'Admission Date', key: 'admissionDate', width: 14 },
      { header: 'Total Fees', key: 'totalFees', width: 14 },
      { header: 'Amount Paid', key: 'amountPaid', width: 14 },
      { header: 'Balance Amount', key: 'balanceAmount', width: 14 },
      { header: 'Payment Mode', key: 'paymentMode', width: 14 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Header Row Formatting (Bold, Blue Fill, Centered)
    const headerRow = studentsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    // Header Auto-Filter
    studentsSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 17 }
    };

    // Populate Student Rows
    students.forEach((std) => {
      const dobStr = std.dateOfBirth ? new Date(std.dateOfBirth).toISOString().slice(0, 10) : '-';
      const admStr = std.admissionDate ? new Date(std.admissionDate).toISOString().slice(0, 10) : '-';

      const row = studentsSheet.addRow({
        studentId: String(std.studentId || ''),
        rollNo: Number(std.rollNo) || 0,
        fullname: std.fullname || std.name || '',
        standard: std.standard || '',
        medium: std.medium || '',
        subjectsStr: std.subjectsStr || '-',
        schoolName: std.schoolName || '',
        dateOfBirth: dobStr,
        address: std.address || '',
        mobile: String(std.mobile || ''),
        parentMobile: String(std.parentMobile || ''),
        admissionDate: admStr,
        totalFees: Number(std.totalFees) || 0,
        amountPaid: Number(std.amountPaid) || 0,
        balanceAmount: Number(std.balanceAmount) || 0,
        paymentMode: std.paymentMode || 'Cash',
        status: std.status || 'Active'
      });

      row.height = 20;

      // Text formatting for phone numbers and IDs so leading zeros are preserved
      row.getCell('studentId').numFmt = '@';
      row.getCell('mobile').numFmt = '@';
      row.getCell('parentMobile').numFmt = '@';

      // Number formatting for numeric fields
      row.getCell('rollNo').numFmt = '0';
      row.getCell('totalFees').numFmt = '#,##0.00';
      row.getCell('amountPaid').numFmt = '#,##0.00';
      row.getCell('balanceAmount').numFmt = '#,##0.00';

      row.getCell('studentId').alignment = { horizontal: 'center' };
      row.getCell('rollNo').alignment = { horizontal: 'center' };
      row.getCell('standard').alignment = { horizontal: 'center' };
      row.getCell('dateOfBirth').alignment = { horizontal: 'center' };
      row.getCell('admissionDate').alignment = { horizontal: 'center' };
      row.getCell('mobile').alignment = { horizontal: 'center' };
      row.getCell('parentMobile').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };
      row.getCell('paymentMode').alignment = { horizontal: 'center' };
    });

    // ====================================================
    // WORKSHEET 2: Payment History
    // ====================================================
    const paymentsSheet = workbook.addWorksheet('Payment History', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    paymentsSheet.columns = [
      { header: 'Receipt Number', key: 'receiptNumber', width: 22 },
      { header: 'Student ID', key: 'studentId', width: 16 },
      { header: 'fullname', key: 'fullname', width: 25 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Payment Mode', key: 'paymentMode', width: 16 },
      { header: 'Payment Date', key: 'paymentDate', width: 20 }
    ];

    const payHeaderRow = paymentsSheet.getRow(1);
    payHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    payHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }
    };
    payHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    payHeaderRow.height = 24;

    paymentsSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 6 }
    };

    paymentRecords.forEach((pay) => {
      const pDateStr = pay.paymentDate ? new Date(pay.paymentDate).toISOString().slice(0, 10) : '-';

      const pRow = paymentsSheet.addRow({
        receiptNumber: String(pay.receiptNumber || ''),
        studentId: String(pay.studentId || ''),
        fullname: pay.fullname || pay.studentName || '',
        amount: Number(pay.amount) || 0,
        paymentMode: pay.paymentMode || '',
        paymentDate: pDateStr
      });

      pRow.height = 20;

      pRow.getCell('receiptNumber').numFmt = '@';
      pRow.getCell('studentId').numFmt = '@';
      pRow.getCell('amount').numFmt = '#,##0.00';

      pRow.getCell('receiptNumber').alignment = { horizontal: 'center' };
      pRow.getCell('studentId').alignment = { horizontal: 'center' };
      pRow.getCell('paymentMode').alignment = { horizontal: 'center' };
      pRow.getCell('paymentDate').alignment = { horizontal: 'center' };
    });

    // Dynamic Filename using Current Date (Students_YYYY-MM-DD.xlsx)
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Students_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel export:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Unable to export student data.'
      });
    }
  }
};

/**
 * DELETE /api/students/:id
 * Safely deletes student record and all associated records inside an atomic MySQL transaction.
 * Supports numeric database primary key `s.id` or string business ID `s.student_id`.
 */
export const deleteStudent = async (req, res) => {
  const conn = await getConnection();
  try {
    const { id } = req.params;
    if (!id || !String(id).trim()) {
      return res.status(400).json({ success: false, message: 'Student ID parameter is required.' });
    }

    const cleanId = String(id).trim();

    // 1. Find existing student record
    let findSql = `SELECT id, student_id, photo FROM students WHERE `;
    let findParams = [];
    if (/^\d+$/.test(cleanId)) {
      findSql += ' (id = ? OR student_id = ?)';
      findParams.push(parseInt(cleanId, 10), cleanId);
    } else {
      findSql += ' student_id = ?';
      findParams.push(cleanId);
    }

    const [existingStudents] = await conn.execute(findSql, findParams);
    if (!existingStudents || existingStudents.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const targetStudent = existingStudents[0];
    const studentDbId = targetStudent.id;
    const photoPath = targetStudent.photo;

    // 2. Start Atomic Transaction
    await conn.beginTransaction();

    // Delete dependent records from student_subjects junction table
    await conn.execute('DELETE FROM student_subjects WHERE student_id = ?', [studentDbId]);

    // Delete fee payment records
    await conn.execute('DELETE FROM fee_payments WHERE student_id = ?', [studentDbId]);

    // Delete fee account record
    await conn.execute('DELETE FROM fee_accounts WHERE student_id = ?', [studentDbId]);

    // Delete master student record
    await conn.execute('DELETE FROM students WHERE id = ?', [studentDbId]);

    // Commit Transaction
    await conn.commit();

    // Clean up student photo file from disk if unreferenced
    if (photoPath && typeof photoPath === 'string' && photoPath.startsWith('/uploads/students/')) {
      const fullDiskPath = path.join(UPLOADS_DIR, path.basename(photoPath));
      if (fs.existsSync(fullDiskPath)) {
        try {
          fs.unlinkSync(fullDiskPath);
        } catch (fileErr) {
          console.warn('Notice: Failed to delete photo file from disk:', fileErr.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully.'
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error deleting student:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to delete student.'
    });
  } finally {
    conn.release();
  }
};

/**
 * GET /api/students/me
 * Fetches the currently authenticated student profile using JWT session token
 */
export const getStudentProfile = async (req, res) => {
  try {
    const studentDbId = req.user?.student_id || req.user?.id;
    if (!studentDbId) {
      return res.status(401).json({ success: false, message: 'Unauthorized student session.' });
    }

    const studentRows = await query(
      `SELECT 
        s.id,
        s.id AS _id,
        s.student_id AS studentId,
        s.roll_no AS rollNo,
        s.full_name AS fullname,
        s.full_name AS name,
        c.class_name AS standard,
        s.class_id AS classId,
        s.medium,
        s.school_name AS schoolName,
        s.date_of_birth AS dateOfBirth,
        s.address,
        s.mobile,
        s.whatsapp_number AS parentMobile,
        s.course_stream AS courseStream,
        s.photo,
        s.admission_date AS admissionDate,
        s.status,
        fa.total_fees AS totalFees,
        fa.amount_paid AS amountPaid,
        fa.balance_amount AS balanceAmount
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_accounts fa ON s.id = fa.student_id
      WHERE s.id = ? OR s.student_id = ?`,
      [studentDbId, String(studentDbId)]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile record not found.' });
    }

    const student = studentRows[0];

    const subRows = await query(
      `SELECT sub.subject_name 
       FROM student_subjects ss 
       JOIN subjects sub ON ss.subject_id = sub.id 
       WHERE ss.student_id = ?`,
      [student.id]
    );
    student.subjects = subRows.map(r => r.subject_name);

    return res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to load student profile.' });
  }
};

/**
 * GET /api/students/dashboard
 * Aggregates all dashboard data for logged-in student (or specified studentId for admin)
 */
export const getStudentDashboard = async (req, res) => {
  try {
    let targetStudentId = req.user?.role === 'student' ? (req.user.student_id || req.user.id) : (req.query.studentId || req.user?.student_id || req.user?.id);

    if (!targetStudentId) {
      const [firstStudent] = await query(`SELECT id FROM students WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (firstStudent) targetStudentId = firstStudent.id;
    }

    if (!targetStudentId) {
      return res.status(404).json({ success: false, message: 'No student record found.' });
    }

    // 1. Fetch Student Profile
    const studentRows = await query(
      `SELECT 
        s.id,
        s.id AS _id,
        s.student_id AS studentId,
        s.roll_no AS rollNo,
        s.full_name AS fullname,
        s.full_name AS name,
        c.class_name AS standard,
        s.class_id AS classId,
        s.medium,
        s.school_name AS schoolName,
        s.date_of_birth AS dateOfBirth,
        s.address,
        s.mobile,
        s.whatsapp_number AS parentMobile,
        s.course_stream AS courseStream,
        s.photo,
        s.admission_date AS admissionDate,
        s.status
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ? OR s.student_id = ?`,
      [targetStudentId, String(targetStudentId)]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = studentRows[0];

    // Get Student Subjects
    const subRows = await query(
      `SELECT sub.subject_name 
       FROM student_subjects ss 
       JOIN subjects sub ON ss.subject_id = sub.id 
       WHERE ss.student_id = ?`,
      [student.id]
    );
    student.subjects = subRows.map(r => r.subject_name);

    // Month & Year parsing
    const now = new Date();
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
    const year = parseInt(req.query.year || now.getFullYear(), 10);

    // 2. Fetch Monthly Attendance Activity Grid
    const daysInMonth = new Date(year, month, 0).getDate();
    const attRows = await query(
      `SELECT 
        DATE_FORMAT(aset.attendance_date, '%d') AS dayNum,
        aset.subject AS subjectName,
        ar.status,
        aset.attendance_type AS attendanceType
       FROM attendance_records ar
       JOIN attendance_sessions aset ON ar.attendance_session_id = aset.id
       WHERE ar.student_id = ? 
         AND MONTH(aset.attendance_date) = ? 
         AND YEAR(aset.attendance_date) = ?`,
      [student.id, month, year]
    );

    const gridMap = {};
    let presentCount = 0;
    let absentCount = 0;

    student.subjects.forEach(subName => {
      gridMap[subName] = {};
    });

    attRows.forEach(r => {
      const day = parseInt(r.dayNum, 10);
      const sub = r.subjectName;
      if (!gridMap[sub]) gridMap[sub] = {};
      const statusVal = r.attendanceType === 'HOLIDAY' ? 'Holiday' : (r.attendanceType === 'CLOSED' ? 'Closed' : r.status);
      gridMap[sub][day] = statusVal;

      if (statusVal === 'PRESENT' || statusVal === 'Present') presentCount++;
      if (statusVal === 'ABSENT' || statusVal === 'Absent') absentCount++;
    });

    const totalRecorded = presentCount + absentCount;
    const overallPct = totalRecorded > 0 ? `${Math.round((presentCount / totalRecorded) * 100)}%` : '0%';

    // 3. Attendance Streak Calculation
    const allAttRows = await query(
      `SELECT aset.attendance_date AS session_date, ar.status, aset.attendance_type
       FROM attendance_records ar
       JOIN attendance_sessions aset ON ar.attendance_session_id = aset.id
       WHERE ar.student_id = ? AND (aset.attendance_type IS NULL OR aset.attendance_type != 'Holiday')
       ORDER BY aset.attendance_date DESC`,
      [student.id]
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Group all session statuses for each date
    const dateMap = {};
    allAttRows.forEach(r => {
      const dStr = new Date(r.session_date).toISOString().slice(0, 10);
      if (!dateMap[dStr]) {
        dateMap[dStr] = [];
      }
      if (r.status) {
        dateMap[dStr].push(String(r.status).toUpperCase());
      }
    });

    const sortedDates = Object.keys(dateMap).sort().reverse();
    let isCurrentCounting = true;

    sortedDates.forEach(dStr => {
      const statuses = dateMap[dStr];
      const totalSessions = statuses.length;
      const presentCount = statuses.filter(s => s === 'PRESENT').length;

      // Rule: Student must be PRESENT in at least 2 subjects/lectures (or 1 if only 1 session conducted that day)
      const minRequiredPresent = totalSessions >= 2 ? 2 : 1;
      const isDayPresent = presentCount >= minRequiredPresent;

      if (isDayPresent) {
        tempStreak++;
        if (isCurrentCounting) currentStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        isCurrentCounting = false;
        tempStreak = 0;
      }
    });

    // 4. Assignments (Class + Enrolled Subject Scoped)
    let assignments = [];
    try {
      const assRows = await query(
        `SELECT a.id, a.title, a.description, a.due_date AS dueDate, sub.subject_name AS subject, a.status
         FROM assignments a
         LEFT JOIN subjects sub ON a.subject_id = sub.id
         WHERE a.class_id = ?
           AND (a.status = 'Active' OR a.status IS NULL)
           AND (
             a.subject_id IN (SELECT subject_id FROM student_subjects WHERE student_id = ?)
             OR NOT EXISTS (SELECT 1 FROM student_subjects WHERE student_id = ?)
           )
         ORDER BY a.id DESC LIMIT 5`,
        [student.classId, student.id, student.id]
      );
      assignments = assRows;
    } catch (e) {
      assignments = [];
    }

    // 5. Test Results & Average Percentage
    let testResults = [];
    let avgMarksPct = '--';
    try {
      const resRows = await query(
        `SELECT 
          t.title AS testTitle,
          t.test_date AS testDate,
          t.total_marks AS totalMarks,
          sub.subject_name AS subject,
          tr.marks_obtained AS marksObtained,
          tr.status
         FROM test_results tr
         JOIN tests t ON tr.test_id = t.id
         LEFT JOIN subjects sub ON t.subject_id = sub.id
         WHERE tr.student_id = ?
         ORDER BY t.test_date DESC LIMIT 10`,
        [student.id]
      );

      testResults = resRows.map(r => ({
        testTitle: r.testTitle,
        testDate: r.testDate ? new Date(r.testDate).toISOString().slice(0, 10) : '',
        totalMarks: Number(r.totalMarks) || 100,
        subject: r.subject || 'General',
        marksObtained: r.status === 'ABSENT' ? 'ABSENT' : Number(r.marksObtained) || 0,
        status: r.status
      }));

      let validCount = 0;
      let sumPct = 0;
      testResults.forEach(r => {
        if (r.status !== 'ABSENT' && r.totalMarks > 0) {
          sumPct += (r.marksObtained / r.totalMarks) * 100;
          validCount++;
        }
      });
      if (validCount > 0) {
        avgMarksPct = `${Math.round(sumPct / validCount)}%`;
      }
    } catch (e) {
      testResults = [];
    }

    // 6. Fee Summary
    let fee = { totalFee: '₹0', paidFee: '₹0', remainingFee: '₹0' };
    const [feeRow] = await query(`SELECT total_fees, amount_paid, balance_amount FROM fee_accounts WHERE student_id = ?`, [student.id]);
    if (feeRow) {
      fee = {
        totalFee: `₹${Number(feeRow.total_fees || 0).toLocaleString('en-IN')}`,
        paidFee: `₹${Number(feeRow.amount_paid || 0).toLocaleString('en-IN')}`,
        remainingFee: `₹${Number(feeRow.balance_amount || 0).toLocaleString('en-IN')}`
      };
    }

    // 7. Today Schedule (Uses exact logic as StudentSchedule / My Schedule section)
    let todaySchedule = [];
    try {
      const schedRows = await query(
        `SELECT 
          s.subject_name AS subject,
          b.schedule_type AS scheduleType,
          b.schedule_type AS batchName,
          b.start_time AS startTime,
          b.end_time AS endTime,
          t.name AS teacherName,
          b.schedule_pattern AS schedulePattern,
          b.status
         FROM batches b
         JOIN subjects s ON b.subject_id = s.id
         JOIN teachers t ON b.teacher_id = t.id
         WHERE b.class_id = ? AND (b.status = 'Active' OR b.status IS NULL)
         ORDER BY b.start_time ASC`,
        [student.classId]
      );

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[new Date().getDay()];
      const isWeekend = ['Saturday', 'Sunday'].includes(todayName);

      // Student normalized registered subjects
      const sSubjects = (Array.isArray(student.subjects) && student.subjects.length > 0
        ? student.subjects
        : ['Mathematics', 'Science', 'English']
      ).map(s => normalizeSubject(s).toLowerCase());

      const filteredSchedule = schedRows.filter((b) => {
        if (b.status === 'Inactive') return false;

        // Check subject match
        if (b.subject) {
          const normBSub = normalizeSubject(b.subject).toLowerCase();
          if (!sSubjects.includes(normBSub)) return false;
        }

        // Check day pattern match
        const pat = b.schedulePattern || 'Monday-Friday';
        if (pat === 'Monday-Friday') {
          return !isWeekend;
        } else if (pat === 'Saturday') {
          return todayName === 'Saturday';
        } else if (pat === 'Sunday') {
          return todayName === 'Sunday';
        } else if (pat === todayName) {
          return true;
        }

        return true;
      });

      // Time formatting helpers
      const formatTime12Hour = (timeStr) => {
        if (!timeStr) return '';
        const trimmed = String(timeStr).trim();
        if (/am|pm/i.test(trimmed)) return trimmed;
        const parts = trimmed.split(':');
        if (parts.length < 2) return trimmed;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        if (isNaN(hours)) return trimmed;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedH = String(hours).padStart(2, '0');
        return `${formattedH}:${minutes} ${ampm}`;
      };

      const getSortMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const trimmed = String(timeStr).trim();
        let hours = 0;
        let minutes = 0;
        if (/am|pm/i.test(trimmed)) {
          const isPM = /pm/i.test(trimmed);
          const clean = trimmed.replace(/am|pm/gi, '').trim();
          const parts = clean.split(':');
          hours = parseInt(parts[0], 10) || 0;
          minutes = parseInt(parts[1], 10) || 0;
          if (isPM && hours < 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
        } else {
          const parts = trimmed.split(':');
          hours = parseInt(parts[0], 10) || 0;
          minutes = parseInt(parts[1], 10) || 0;
        }
        return hours * 60 + minutes;
      };

      filteredSchedule.sort((a, b) => getSortMinutes(a.startTime) - getSortMinutes(b.startTime));

      todaySchedule = filteredSchedule.map(r => {
        const normSub = normalizeSubject(r.subject);
        const start12 = formatTime12Hour(r.startTime);
        const end12 = formatTime12Hour(r.endTime);
        return {
          subject: normSub,
          batchName: r.scheduleType || 'Regular Class',
          startTime: start12,
          endTime: end12,
          timeDisplay: `${start12} – ${end12}`,
          teacherName: r.teacherName,
          teacher: { name: r.teacherName },
          schedulePattern: r.schedulePattern
        };
      });
    } catch (e) {
      console.error('Error fetching todaySchedule:', e);
      todaySchedule = [];
    }

    // 8. Latest Announcement (Class + Enrolled Subject Scoped)
    let latestAnnouncement = null;
    try {
      const [annRow] = await query(
        `SELECT title, content, target_class AS targetClass, target_subject AS targetSubject, announcement_date AS announcementDate
         FROM announcements
         WHERE (target_class = ? OR target_class = 'All Students' OR target_class = 'All Classes' OR target_class = 'All' OR target_class IS NULL) 
           AND (status = 'Published' OR status = 'Active')
           AND (
             target_subject IS NULL 
             OR target_subject = '' 
             OR target_subject = 'All' 
             OR target_subject = 'All Subjects' 
             OR target_subject = 'General'
             OR target_subject IN (
               SELECT sub.subject_name 
               FROM student_subjects ss 
               JOIN subjects sub ON ss.subject_id = sub.id 
               WHERE ss.student_id = ?
             )
           )
         ORDER BY id DESC LIMIT 1`,
        [student.standard, student.id]
      );
      if (annRow) {
        latestAnnouncement = {
          title: annRow.title,
          content: annRow.content,
          targetClass: annRow.targetClass,
          targetSubject: annRow.targetSubject || '',
          date: annRow.announcementDate ? new Date(annRow.announcementDate).toISOString().slice(0, 10) : ''
        };
      }
    } catch (e) {
      latestAnnouncement = null;
    }

    // 9. Subject-wise Leaderboards (Latest conducted exam per subject)
    let subjectLeaderboards = [];
    try {
      let targetSubjects = [];
      if (Array.isArray(student.subjects) && student.subjects.length > 0) {
        targetSubjects = [...student.subjects];
      } else {
        const isSenior = ['11th', '12th'].includes(String(student.standard || '').trim());
        targetSubjects = isSenior ? ['Physics', 'Chemistry', 'Biology', 'Mathematics'] : ['Mathematics', 'Science', 'English'];
      }

      // Collect any other subjects for which tests exist for this class
      const classTestsSubjects = await query(
        `SELECT DISTINCT sub.subject_name
         FROM tests t
         JOIN subjects sub ON t.subject_id = sub.id
         WHERE t.class_id = ?`,
        [student.classId]
      );
      classTestsSubjects.forEach(r => {
        if (r.subject_name && !targetSubjects.includes(r.subject_name)) {
          targetSubjects.push(r.subject_name);
        }
      });

      targetSubjects = [...new Set(targetSubjects.map(s => String(s).trim()))].filter(Boolean);

      for (const subj of targetSubjects) {
        const [latestTest] = await query(
          `SELECT t.id AS testId, t.title AS testTitle, t.test_date AS testDate, t.total_marks AS totalMarks, sub.subject_name AS subjectName
           FROM tests t
           JOIN subjects sub ON t.subject_id = sub.id
           JOIN test_results tr ON tr.test_id = t.id
           WHERE t.class_id = ? AND (sub.subject_name = ? OR LOWER(sub.subject_name) = LOWER(?))
           ORDER BY t.test_date DESC, t.id DESC
           LIMIT 1`,
          [student.classId, subj, subj]
        );

        if (!latestTest) {
          subjectLeaderboards.push({
            subject: subj,
            hasExam: false,
            testTitle: null,
            testDate: null,
            totalMarks: null,
            top3: [],
            studentRank: null,
            rankings: []
          });
          continue;
        }

        const lbRows = await query(
          `SELECT 
            s.id AS studentDbId,
            s.student_id AS studentId,
            s.full_name AS name,
            s.photo,
            tr.marks_obtained AS marksObtained,
            tr.status,
            t.total_marks AS totalMarks
           FROM students s
           JOIN test_results tr ON s.id = tr.student_id
           JOIN tests t ON tr.test_id = t.id
           WHERE t.id = ? AND s.class_id = ? AND tr.status = 'PRESENT' AND t.total_marks > 0
           ORDER BY CAST(tr.marks_obtained AS DECIMAL(10,2)) DESC, s.full_name ASC`,
          [latestTest.testId, student.classId]
        );

        const rankings = lbRows.map((r, idx) => ({
          rank: idx + 1,
          studentDbId: r.studentDbId,
          studentId: r.studentId,
          name: r.name,
          photo: r.photo,
          marksObtained: Number(r.marksObtained),
          totalMarks: Number(r.totalMarks),
          percentage: Number(((Number(r.marksObtained) / Number(r.totalMarks)) * 100).toFixed(1))
        }));

        const top3 = rankings.slice(0, 3);
        const myIndex = rankings.findIndex(r => String(r.studentDbId) === String(student.id) || String(r.studentId) === String(student.studentId));
        const studentRank = myIndex !== -1 ? rankings[myIndex] : null;

        subjectLeaderboards.push({
          subject: subj,
          hasExam: true,
          testId: latestTest.testId,
          testTitle: latestTest.testTitle,
          testDate: latestTest.testDate ? new Date(latestTest.testDate).toISOString().slice(0, 10) : '',
          totalMarks: Number(latestTest.totalMarks),
          top3,
          studentRank,
          rankings
        });
      }
    } catch (e) {
      console.error('Error fetching subject leaderboards:', e);
      subjectLeaderboards = [];
    }

    return res.status(200).json({
      success: true,
      student,
      attendance: {
        subjects: student.subjects,
        daysInMonth,
        gridMap,
        presentCount,
        absentCount,
        unrecordedCount: Math.max(0, (daysInMonth * student.subjects.length) - (presentCount + absentCount)),
        overallPct
      },
      streak: { currentStreak, longestStreak },
      assignments,
      testResults,
      avgMarksPct,
      fee,
      todaySchedule,
      latestAnnouncement,
      subjectLeaderboards,
      leaderboard: subjectLeaderboards
    });

  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to load student dashboard.' });
  }
};



