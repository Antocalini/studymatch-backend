// src/routes/career.routes.js
import express from 'express';
import {
  createCareer,
  getAllCareers,
  getCareerById,
  updateCareer,
  deleteCareer
} from '../controllers/career.controller.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';

const router = express.Router();

// Routes requiring admin authorization
router.post('/', protect, authorize(['admin']), createCareer);
router.put('/:id', protect, authorize(['admin']), updateCareer);
router.delete('/:id', protect, authorize(['admin']), deleteCareer);

// Routes accessible by anyone (or just authenticated users, depending on your app's public visibility)
router.get('/', getAllCareers); // Could be protect, authorize(['user', 'admin']) if you prefer
router.get('/:id', getCareerById); // Could be protect, authorize(['user', 'admin']) if you prefer


export default router;