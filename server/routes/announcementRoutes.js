import express from 'express';
import {
  getAnnouncements,
  getStudentAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/announcements - Fetch announcements (role & class scoped)
router.get('/', authenticateUser, getAnnouncements);

// GET /api/announcements/public & /api/announcements/student - Student announcements
router.get('/public', getStudentAnnouncements);
router.get('/student', getStudentAnnouncements);

// GET /api/announcements/:id - Fetch single announcement details
router.get('/:id', authenticateUser, getAnnouncementById);

// POST /api/announcements - Create new announcement
router.post('/', authenticateUser, createAnnouncement);

// PUT /api/announcements/:id - Update announcement
router.put('/:id', authenticateUser, updateAnnouncement);

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', authenticateUser, deleteAnnouncement);

export default router;
