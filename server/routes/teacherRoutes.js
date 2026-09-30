import express from 'express';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherPermissions,
  getAuthenticatedTeacherProfile,
  getTeacherAllocations
} from '../controllers/teacherController.js';
import { authenticateUser, requireRole, verifyTeacherOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/teachers/me - Fetch teacher profile (unauthenticated or session teacher)
router.get('/me', authenticateUser, getAuthenticatedTeacherProfile);

// GET /api/teachers/me/permissions - Fetch teacher Class + Subject permissions
router.get('/me/permissions', authenticateUser, getTeacherPermissions);

// GET /api/teachers/allocations - Fetch Class & Subject allocations for teacher
router.get('/allocations', authenticateUser, getTeacherAllocations);

// GET /api/teachers - List teachers
router.get('/', authenticateUser, getTeachers);

// GET /api/teachers/:id - Fetch single teacher by ID
router.get('/:id', authenticateUser, getTeacherById);

// POST /api/teachers - Create new teacher
router.post('/', authenticateUser, createTeacher);

// PUT /api/teachers/:id - Update teacher
router.put('/:id', authenticateUser, updateTeacher);

// DELETE /api/teachers/:id - Delete teacher
router.delete('/:id', authenticateUser, deleteTeacher);

export default router;
