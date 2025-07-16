// src/routes/index.js
import express from 'express';
import authRoutes from './auth.routes.js'; // Note the .js extension
import groupsRoutes from './groups.routes.js'; // Note the .js extension
import userRoutes from './user.routes.js'; // Note the .js extension
import careerRoutes from './career.routes.js';
import scrapeRoutes from './scrape.routes.js'; // NEW: Import scrape routes

const router = express.Router();

// Mount all specific routes under /api prefix (handled in src/index.js)
router.use('/auth', authRoutes);
router.use('/groups', groupsRoutes);
router.use('/users', userRoutes);
router.use('/careers', careerRoutes);
router.use('/scrape', scrapeRoutes); // NEW: Mount scrape routes


// You can add more routes here for other resources if needed

export default router;