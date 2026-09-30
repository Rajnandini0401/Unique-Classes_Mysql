import express from 'express';
import {
  getFeesOverview,
  getFeeByStudent,
  createOrUpdateFeeMaster,
  createPayment,
  deletePayment
} from '../controllers/feeController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/fees/overview (Fee Directory Roster & Aggregated Summary Cards)
router.get('/overview', authenticateUser, getFeesOverview);

// GET /api/fees & GET /api/fees/student/:studentId
router.get('/student/:studentId', authenticateUser, getFeeByStudent);
router.get('/', authenticateUser, getFeesOverview);

// POST /api/fees (Set/Update Student Total Fees)
router.post('/', authenticateUser, createOrUpdateFeeMaster);

export default router;
