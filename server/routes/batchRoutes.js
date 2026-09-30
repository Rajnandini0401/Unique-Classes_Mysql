import express from 'express';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch
} from '../controllers/batchController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/batches - List batches (teacher-scoped for teacher role)
router.get('/', authenticateUser, getBatches);

// GET /api/batches/:id - Fetch single batch by ID
router.get('/:id', authenticateUser, getBatchById);

// POST /api/batches - Create batch timetable
router.post('/', authenticateUser, createBatch);

// PUT /api/batches/:id - Update batch timetable
router.put('/:id', authenticateUser, updateBatch);

// DELETE /api/batches/:id - Delete batch timetable
router.delete('/:id', authenticateUser, deleteBatch);

export default router;
