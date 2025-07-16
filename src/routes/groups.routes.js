// src/routes/groups.routes.js
import express from 'express';
import { findOrCreateGroup, joinGroup, getMyGroups } from '../controllers/groups.controller.js'; // Note the .js extension
import { protect } from '../middlewares/auth.js'; // Note the .js extension

const router = express.Router();

router.post('/find-or-create', protect, findOrCreateGroup);
router.post('/join/:groupId', protect, joinGroup);
router.get('/my-groups', protect, getMyGroups);


export default router;