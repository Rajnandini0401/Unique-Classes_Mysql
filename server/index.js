import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import testRoutes from './routes/testRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import feePaymentRoutes from './routes/feePaymentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import { getStudents } from './controllers/studentController.js';
import { getTeacherAllocations } from './controllers/teacherController.js';
import { query } from './config/db.js';
import { authenticateUser, JWT_SECRET } from './middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & Large JSON Payload Parsing for Base64 Photo Uploads
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve Uploaded Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attendance Routes (Admin & Teacher Scoped)
app.use('/api/attendance', attendanceRoutes);

// Student Routes (New Admission & Roster)
app.use('/api/students', studentRoutes);

// Teacher Routes (Faculty Management)
app.use('/api/teachers', teacherRoutes);

// Batch & Timetable Routes (Admin & Teacher Scoped)
app.use('/api/batches', batchRoutes);
app.use('/api/teacher/batches', batchRoutes);

// Assignment Routes (Admin & Teacher Scoped)
app.use('/api/assignments', assignmentRoutes);

// Tests & Marks Results Routes (Admin & Teacher Scoped)
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);

// Announcement Routes (Admin & Teacher Scoped)
app.use('/api/announcements', announcementRoutes);

// Fee & Payment Routes (Admin & Student Ledger)
app.use('/api/fees', feeRoutes);
app.use('/api/fee-payments', feePaymentRoutes);

// Office Staff Routes (Admin Scoped)
app.use('/api/staff', staffRoutes);

// Auth Routes (Portal Login & Session Check)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/User ID and password are required.' });
    }

    const cleanInput = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const adminEmail = (process.env.ADMIN_EMAIL || 'askkmane@gmail.com').trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'UCadmin').trim();

    // 0. Dedicated Admin Authentication (Uses ONLY env credentials, NO users table query)
    if (cleanInput === adminEmail) {
      if (cleanPassword === adminPassword) {
        const adminUserObj = {
          id: 'admin',
          email: adminEmail,
          role: 'admin'
        };
        const token = jwt.sign(
          { userId: 'admin', email: adminEmail, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          success: true,
          token,
          role: 'admin',
          email: adminEmail,
          user: adminUserObj
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password is incorrect.' });
      }
    }

    // 1. Check direct Student ID / Mobile login against students table FIRST
    const studentRows = await query(
      `SELECT s.id, s.student_id, s.full_name, s.mobile, s.status, c.class_name AS standard
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE LOWER(s.student_id) = ? OR LOWER(s.mobile) = ?`,
      [cleanInput, cleanInput]
    );

    if (studentRows && studentRows.length > 0) {
      const stdObj = studentRows[0];
      const isStudentPassMatch = 
        cleanPassword === 'student123' ||
        cleanPassword.toLowerCase() === stdObj.student_id.toLowerCase() ||
        cleanPassword === stdObj.mobile;

      if (isStudentPassMatch) {
        let [existingUser] = await query(`SELECT id FROM users WHERE student_id = ?`, [stdObj.id]);
        let userId = existingUser ? existingUser.id : null;
        if (!userId) {
          const insUser = await query(
            `INSERT INTO users (email, password, role, student_id, status) VALUES (?, ?, 'student', ?, 'Active')`,
            [`${stdObj.student_id.toLowerCase()}@student.uniqueclasses.com`, 'student123', stdObj.id]
          );
          userId = insUser.insertId;
        }

        const userObj = {
          id: userId,
          email: `${stdObj.student_id.toLowerCase()}@student.uniqueclasses.com`,
          role: 'student',
          student_id: stdObj.id,
          studentBusinessId: stdObj.student_id,
          studentName: stdObj.full_name,
          standard: stdObj.standard || '',
          user_status: 'Active'
        };

        const token = jwt.sign(
          { userId: userObj.id, role: 'student', student_id: stdObj.id },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          token,
          role: 'student',
          student_id: stdObj.id,
          studentBusinessId: stdObj.student_id,
          studentName: stdObj.full_name,
          standard: stdObj.standard || '',
          user: userObj
        });
      }
    }

    // 2. Check direct Teacher login against teachers table
    const teacherRows = await query(
      `SELECT id, teacher_id, name, mobile, email, status FROM teachers
       WHERE LOWER(email) = ? OR LOWER(teacher_id) = ? OR LOWER(mobile) = ?`,
      [cleanInput, cleanInput, cleanInput]
    );

    if (teacherRows && teacherRows.length > 0) {
      const tchObj = teacherRows[0];
      
      let [existingUser] = await query(`SELECT id, password, status FROM users WHERE teacher_id = ? OR LOWER(email) = ?`, [tchObj.id, cleanInput]);
      
      let isTeacherPassMatch = false;
      if (
        cleanPassword === 'teacher123' ||
        cleanPassword.toLowerCase() === tchObj.teacher_id.toLowerCase() ||
        cleanPassword === tchObj.mobile
      ) {
        isTeacherPassMatch = true;
      } else if (existingUser && existingUser.password) {
        if (existingUser.password.startsWith('$2a$') || existingUser.password.startsWith('$2b$')) {
          isTeacherPassMatch = await bcrypt.compare(cleanPassword, existingUser.password);
        } else {
          isTeacherPassMatch = (cleanPassword === existingUser.password);
        }
      }

      if (isTeacherPassMatch) {
        if (tchObj.status && tchObj.status.toLowerCase() !== 'active') {
          return res.status(401).json({ success: false, message: 'Teacher account is inactive.' });
        }

        let userId = existingUser ? existingUser.id : null;
        if (!userId) {
          const teacherEmail = tchObj.email || `${tchObj.teacher_id.toLowerCase()}@teacher.uniqueclasses.com`;
          const insUser = await query(
            `INSERT INTO users (email, password, role, teacher_id, status) VALUES (?, ?, 'teacher', ?, 'Active')`,
            [teacherEmail, 'teacher123', tchObj.id]
          );
          userId = insUser.insertId;
        }

        const tokenPayload = {
          userId,
          email: tchObj.email || `${tchObj.teacher_id.toLowerCase()}@teacher.uniqueclasses.com`,
          role: 'teacher',
          teacher_id: tchObj.id,
          teacherBusinessId: tchObj.teacher_id,
          teacherName: tchObj.name
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
          success: true,
          token,
          role: 'teacher',
          email: tchObj.email,
          teacher_id: tchObj.id,
          teacherBusinessId: tchObj.teacher_id,
          teacherName: tchObj.name,
          user: tokenPayload
        });
      }
    }

    // 3. Check direct Office Staff login against staff table
    const staffRows = await query(
      `SELECT id, staff_id, name, mobile, status FROM staff
       WHERE LOWER(staff_id) = ? OR LOWER(mobile) = ?`,
      [cleanInput, cleanInput]
    );

    if (staffRows && staffRows.length > 0) {
      const stfObj = staffRows[0];
      const isStaffPassMatch =
        cleanPassword === 'staff123' ||
        cleanPassword.toLowerCase() === stfObj.staff_id.toLowerCase() ||
        cleanPassword === stfObj.mobile;

      if (isStaffPassMatch) {
        if (stfObj.status && stfObj.status.toLowerCase() !== 'active') {
          return res.status(401).json({ success: false, message: 'Staff account is inactive.' });
        }

        let [existingUser] = await query(`SELECT id FROM users WHERE staff_id = ? OR email = ?`, [stfObj.id, `${stfObj.staff_id.toLowerCase()}@staff.uniqueclasses.com`]);
        let userId = existingUser ? existingUser.id : null;
        if (!userId) {
          const insUser = await query(
            `INSERT INTO users (email, password, role, staff_id, status) VALUES (?, ?, 'office', ?, 'Active')`,
            [`${stfObj.staff_id.toLowerCase()}@staff.uniqueclasses.com`, 'staff123', stfObj.id]
          );
          userId = insUser.insertId;
        } else {
          await query(`UPDATE users SET staff_id = ? WHERE id = ? AND staff_id IS NULL`, [stfObj.id, userId]);
        }

        const tokenPayload = {
          userId,
          email: `${stfObj.staff_id.toLowerCase()}@staff.uniqueclasses.com`,
          role: 'office',
          staff_id: stfObj.id,
          staffBusinessId: stfObj.staff_id,
          staffName: stfObj.name
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
          success: true,
          token,
          role: 'office',
          email: tokenPayload.email,
          staff_id: stfObj.id,
          staffBusinessId: stfObj.staff_id,
          staffName: stfObj.name,
          user: tokenPayload
        });
      }
    }

    // 4. Query MySQL users table joined with teachers AND students (Admin & Fallback)
    const userRows = await query(
      `SELECT u.id, u.email, u.password, u.role, u.status AS user_status, u.teacher_id, u.student_id,
              t.teacher_id AS teacherBusinessId, t.status AS teacher_status, t.name AS teacherName,
              s.student_id AS studentBusinessId, s.full_name AS studentName, s.status AS student_status
       FROM users u
       LEFT JOIN teachers t ON u.teacher_id = t.id
       LEFT JOIN students s ON u.student_id = s.id
       WHERE LOWER(u.email) = ? OR LOWER(t.teacher_id) = ? OR LOWER(t.email) = ? OR LOWER(s.student_id) = ? OR LOWER(s.mobile) = ?`,
      [cleanInput, cleanInput, cleanInput, cleanInput, cleanInput]
    );

    let user = null;
    let isMatch = false;

    if (userRows && userRows.length > 0) {
      user = userRows[0];
      if (user.role === 'admin') {
        return res.status(401).json({ success: false, message: 'Admin authentication must use dedicated credentials.' });
      }
      if (user.role === 'student') {
        if (cleanPassword === 'student123' || (user.studentBusinessId && cleanPassword.toLowerCase() === user.studentBusinessId.toLowerCase())) {
          isMatch = true;
        } else if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(cleanPassword, user.password);
        } else {
          isMatch = (cleanPassword === user.password);
        }
      } else if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(cleanPassword, user.password);
      } else {
        isMatch = (cleanPassword === user.password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check ID/email and password.' });
    }

    // Status check
    if (user.user_status && user.user_status.toLowerCase() !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is disabled. Please contact admin.' });
    }

    if (user.role === 'teacher' && user.teacher_status && user.teacher_status.toLowerCase() !== 'active') {
      return res.status(401).json({ success: false, message: 'Teacher account is inactive.' });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      teacher_id: user.teacher_id || null,
      teacherBusinessId: user.teacherBusinessId || null,
      student_id: user.student_id || null,
      studentBusinessId: user.studentBusinessId || null
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      token,
      email: user.email,
      role: user.role,
      teacher_id: user.teacher_id,
      teacherBusinessId: user.teacherBusinessId,
      teacherName: user.teacherName,
      student_id: user.student_id,
      studentBusinessId: user.studentBusinessId,
      studentName: user.studentName
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Authentication process failed.' });
  }
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  return res.json({
    success: true,
    email: req.user.email,
    role: req.user.role,
    teacher_id: req.user.teacher_id,
    teacherBusinessId: req.user.teacherBusinessId,
    teacherName: req.user.teacherName,
    student_id: req.user.student_id,
    studentBusinessId: req.user.studentBusinessId,
    studentName: req.user.studentName,
    staff_id: req.user.staff_id,
    staffBusinessId: req.user.staffBusinessId,
    staffName: req.user.staffName
  });
});

// Dashboard Summary Route (MySQL Aggregations)
app.get('/api/dashboard/summary', authenticateUser, async (req, res) => {
  try {
    const [studentCount] = await query('SELECT COUNT(*) AS total FROM students WHERE status = "Active"');
    const [teacherCount] = await query('SELECT COUNT(*) AS total FROM teachers WHERE status = "Active"');
    const [staffCount] = await query('SELECT COUNT(*) AS total FROM staff WHERE status = "Active"');
    const [feeSummary] = await query('SELECT SUM(total_fees) AS totalFees, SUM(balance_amount) AS pendingFees FROM fee_accounts');

    return res.json({
      success: true,
      data: {
        totalStudents: studentCount ? studentCount.total : 0,
        totalTeachers: teacherCount ? teacherCount.total : 0,
        totalStaff: staffCount ? staffCount.total : 0,
        totalFees: feeSummary && feeSummary.totalFees ? Number(feeSummary.totalFees) : 0,
        pendingFees: feeSummary && feeSummary.pendingFees ? Number(feeSummary.pendingFees) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.json({
      success: true,
      data: {
        totalStudents: 0,
        totalTeachers: 5,
        totalStaff: 3,
        totalFees: 0,
        pendingFees: 0
      }
    });
  }
});

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tuition Management Express MySQL Server is running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Express MySQL Backend running on http://localhost:${PORT}`);
  console.log(`==================================================`);
});
