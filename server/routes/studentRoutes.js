import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getNextStudentId, 
  createStudent, 
  getStudents, 
  getStudentById, 
  updateStudent, 
  exportStudentsToExcel, 
  deleteStudent,
  getStudentProfile,
  getStudentDashboard
} from '../controllers/studentController.js';

const router = express.Router();

// GET /api/students/me (Current Authenticated Student Profile)
router.get('/me', protect, getStudentProfile);

// GET /api/students/dashboard (Authenticated Student Dashboard)
router.get('/dashboard', protect, getStudentDashboard);

// GET /api/students/next-id?standard=10th
router.get('/next-id', protect, getNextStudentId);

// GET /api/students/export (Export Excel .xlsx)
router.get('/export', protect, exportStudentsToExcel);

// POST /api/students (Create Student Admission)
router.post('/', protect, createStudent);

// GET /api/students (List Students)
router.get('/', protect, getStudents);

// GET /api/students/:id (Get Single Student Details)
router.get('/:id', protect, getStudentById);

// PUT /api/students/:id (Update Existing Student)
router.put('/:id', protect, updateStudent);

// DELETE /api/students/:id (Delete Student Record)
router.delete('/:id', protect, deleteStudent);

export default router;


