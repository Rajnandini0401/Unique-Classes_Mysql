import express from 'express';
import {
  getStaff,
  getStaffById,
  getAuthenticatedStaffProfile,
  createStaff,
  updateStaff,
  deleteStaff
} from '../controllers/staffController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/staff/me - Authenticated staff profile
router.get('/me', authenticateUser, getAuthenticatedStaffProfile);

// GET /api/staff - List staff members
router.get('/', authenticateUser, getStaff);

// GET /api/staff/:id - Fetch single staff member
router.get('/:id', authenticateUser, getStaffById);

// POST /api/staff - Create new staff member
router.post('/', authenticateUser, createStaff);

// PUT /api/staff/:id - Update staff member
router.put('/:id', authenticateUser, updateStaff);

// DELETE /api/staff/:id - Delete staff member
router.delete('/:id', authenticateUser, deleteStaff);

export default router;
