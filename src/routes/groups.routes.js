import express from "express";
const router = express.Router();
import {
  getAllGroups,
  getUserGroups,
  createGroup,
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
} from "../controllers/groups.controller.js";

// @route   GET /api/groups
// @desc    Obtener todos los grupos
// @access  Public (puedes agregar middleware de autenticación si es necesario)
router.get("/", getAllGroups);

// @route   GET /api/groups/user/:userId
// @desc    Obtener grupos de un usuario específico
// @access  Public
router.get("/user/:userId", getUserGroups);

// @route   GET /api/groups/:id
// @desc    Obtener un grupo por ID
// @access  Public
router.get("/:id", getGroupById);

// @route   POST /api/groups
// @desc    Crear un nuevo grupo
// @access  Public
router.post("/", createGroup);

// @route   PUT /api/groups/:id/members/add
// @desc    Agregar miembro a un grupo
// @access  Public
router.put("/:id/members/add", addMemberToGroup);

// @route   PUT /api/groups/:id/members/remove
// @desc    Remover miembro de un grupo
// @access  Public
router.put("/:id/members/remove", removeMemberFromGroup);

export default router;
