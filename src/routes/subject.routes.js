// src/routes/subject.routes.js
import express from 'express';
import { getSubjectsByCareer } from '../controllers/subject.controller.js'; // Import your controller
import { protect } from '../middlewares/auth.js'; // Assuming you want this route protected

const router = express.Router();

// @route   GET /api/subjects/career/:careerId
// @access  Private (requires authentication)
router.get('/career/:careerId', protect, getSubjectsByCareer);

export default router;