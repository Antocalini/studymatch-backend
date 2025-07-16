// src/routes/user.routes.js
import express from 'express';
import { getMe, setupUserProfile, updateSubjectsOfInterest } from '../controllers/user.controller.js'; // Note the .js extension
import { getSubjectsByCareer } from '../controllers/subject.controller.js'; // Named import
import { protect } from '../middlewares/auth.js'; // Note the .js extension

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/me/profile-setup', protect, setupUserProfile); // New route for initial setup
router.put('/me/interests', protect, updateSubjectsOfInterest);

// Route for fetching subjects for a career
router.get('/careers/:careerId/subjects', protect, getSubjectsByCareer);


export default router;