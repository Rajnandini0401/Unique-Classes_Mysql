import express from 'express';
import {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest
} from '../controllers/testController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/tests - List tests (scoped & filtered)
router.get('/', authenticateUser, getTests);

// GET /api/tests/:id - Single test detail
router.get('/:id', authenticateUser, getTestById);

// POST /api/tests - Create new test
router.post('/', authenticateUser, createTest);

// PUT /api/tests/:id - Update test
router.put('/:id', authenticateUser, updateTest);

// DELETE /api/tests/:id - Delete test
router.delete('/:id', authenticateUser, deleteTest);

export default router;
