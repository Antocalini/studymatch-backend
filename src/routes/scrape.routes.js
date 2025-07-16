// src/routes/scrape.routes.js
import express from 'express';
import { triggerCollegeDataScrape } from '../controllers/scrape.controller.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';

const router = express.Router();

// This endpoint should be protected and only accessible by administrators
router.post('/college-data', protect, authorize(['admin']), triggerCollegeDataScrape);

export default router;