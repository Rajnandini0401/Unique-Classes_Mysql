import express from 'express';
import {
  getFeeByStudent,
  createPayment,
  deletePayment
} from '../controllers/feeController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/fee-payments/student/:studentId
router.get('/student/:studentId', authenticateUser, getFeeByStudent);

// POST /api/fee-payments (Record New Payment Installment)
router.post('/', authenticateUser, createPayment);

// DELETE /api/fee-payments/:id (Delete Payment Installment)
router.delete('/:id', authenticateUser, deletePayment);

export default router;
