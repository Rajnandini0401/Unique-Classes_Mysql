import express from 'express';
import {
  getTeacherAllocatedClassesAndSubjects,
  getAttendanceStudents,
  getAttendanceByClassAndDate,
  markAttendance,
  getAttendanceHistory,
  exportAttendanceExcel,
  getStudentAttendanceSummary,
  sendAttendanceWhatsApp,
  getWhatsAppStatus,
  launchWhatsAppQRSetup,
  checkAttendanceSchedule,
  getAssignedTeacher,
  getAttendanceProgress,
  getSubjectsByClass
} from '../controllers/attendanceController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/attendance/assigned-teacher - Get assigned teacher for class and subject
router.get('/assigned-teacher', authenticateUser, getAssignedTeacher);

// GET /api/attendance/progress - Get today's attendance progress for class
router.get('/progress', authenticateUser, getAttendanceProgress);

// GET /api/attendance/subjects - Get subjects list for class
router.get('/subjects', authenticateUser, getSubjectsByClass);

// GET /api/attendance/check-schedule - Check if an active batch timetable schedule exists
router.get('/check-schedule', authenticateUser, checkAttendanceSchedule);

// GET /api/attendance/whatsapp-status - Check Playwright WhatsApp Web login status
router.get('/whatsapp-status', authenticateUser, getWhatsAppStatus);

// POST /api/attendance/whatsapp-qr-setup - Open interactive browser QR code setup window
router.post('/whatsapp-qr-setup', authenticateUser, launchWhatsAppQRSetup);

// GET /api/attendance/teacher-allocations/:teacherId - Get authorized classes & subjects for teacher
router.get('/teacher-allocations/:teacherId', authenticateUser, getTeacherAllocatedClassesAndSubjects);

// GET /api/attendance/students - Get active students roster for class & subject
router.get('/students', authenticateUser, getAttendanceStudents);

// GET /api/attendance/session - Get existing attendance session for class & date
router.get('/session', authenticateUser, getAttendanceByClassAndDate);

// POST /api/attendance - Save or update attendance session & records
router.post('/', authenticateUser, markAttendance);

// POST /api/attendance/send-whatsapp - Send WhatsApp notification links to absent students
router.post('/send-whatsapp', authenticateUser, sendAttendanceWhatsApp);

// GET /api/attendance/history - Fetch monthly attendance grid & history
router.get('/history', authenticateUser, getAttendanceHistory);

// GET /api/attendance/export - Export attendance report as CSV/Excel
router.get('/export', authenticateUser, exportAttendanceExcel);

// GET /api/attendance/student/:studentId - Get personal attendance stats for Student Panel
router.get('/student/:studentId', getStudentAttendanceSummary);

export default router;


