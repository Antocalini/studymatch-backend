// src/routes/auth.routes.js
import express from 'express';
import { verifyTelegramUser } from '../controllers/auth.controller.js'; // Note the .js extension and named import

const router = express.Router();

router.post('/sign-in', verifyTelegramUser);

export default router;