import express from 'express';
import {
  getAssignments,
  getTeacherAssignmentAllocations,
  getStudentAssignments,
  createAssignment,
  deleteAssignment
} from '../controllers/assignmentController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/assignments - Fetch list of assignments (scoped & filtered)
router.get('/', authenticateUser, getAssignments);

// GET /api/assignments/allocations - Fetch class & subject allocations for teacher
router.get('/allocations', authenticateUser, getTeacherAssignmentAllocations);

// GET /api/assignments/student/:studentId - Fetch class assignments for student
router.get('/student/:studentId', authenticateUser, getStudentAssignments);

// POST /api/assignments - Create and publish a new assignment
router.post('/', authenticateUser, createAssignment);

// DELETE /api/assignments/:id - Delete an assignment
router.delete('/:id', authenticateUser, deleteAssignment);

export default router;
