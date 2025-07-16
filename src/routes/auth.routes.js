import express from "express";
import { verifyTelegramUser } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/verify-telegram-user", verifyTelegramUser);

export default router;
