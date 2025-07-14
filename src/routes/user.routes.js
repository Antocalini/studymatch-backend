import express from "express";
import {
  getUserSubjects,
  addUserSubject,
  editUserSubject,
} from "../controllers/user.controller";

const router = express.Router();

router.get("/", getUserSubjects);
router.post("/", addUserSubject);
router.put("/", editUserSubject);

export default router;
