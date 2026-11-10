import express from 'express';
import {
  createResults,
  getResultsByTest,
  getStudentResults,
  getClassLeaderboard,
  updateResult,
  sendTestAbsentWhatsApp,
  getPublicTestToppers
} from '../controllers/resultController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/results/public-toppers - Public website Weekly Test Toppers (No auth required)
router.get('/public-toppers', getPublicTestToppers);

// POST /api/results - Save/Update student test scores
router.post('/', authenticateUser, createResults);

// GET /api/results/test/:testId - Fetch results for a specific test
router.get('/test/:testId', authenticateUser, getResultsByTest);

// GET /api/results/student/:studentId - Fetch test results for a specific student
router.get('/student/:studentId', authenticateUser, getStudentResults);

// GET /api/results/leaderboard - Fetch top performers leaderboard
router.get('/leaderboard', authenticateUser, getClassLeaderboard);

// PUT /api/results/:id - Update single student score
router.put('/:id', authenticateUser, updateResult);

// POST /api/results/send-whatsapp - Send WhatsApp notice to absent students
router.post('/send-whatsapp', authenticateUser, sendTestAbsentWhatsApp);

export default router;
