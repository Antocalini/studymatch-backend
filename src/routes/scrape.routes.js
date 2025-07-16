// src/routes/scrape.routes.js (Updated)
import express from 'express';
import {
  triggerCollegeDataScrape,
  previewCollegeDataScrape // Import the new controller function
} from '../controllers/scrape.controller.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';

const router = express.Router();

// Endpoint to trigger scrape and save to DB
router.post('/college-data', protect, authorize(['admin']), triggerCollegeDataScrape);

// NEW: Endpoint to trigger scrape and only return data (no DB save)
router.post('/preview-college-data', protect, authorize(['admin']), previewCollegeDataScrape);

export default router;