import Group from "../models/Groups.js";

// Obtener todos los grupos
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({}).sort({ createdAt: -1 }).select("-__v");

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    console.error("Error al obtener todos los grupos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener grupos de un usuario específico
const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario es requerido",
      });
    }

    const groups = await Group.find({
      members: { $in: [userId] },
    })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    console.error("Error al obtener grupos del usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Crear un nuevo grupo
const createGroup = async (req, res) => {
  try {
    const { telegramID, name, members, telegramLink } = req.body;

    // Validar campos requeridos
    if (!telegramID || !name || !telegramLink) {
      return res.status(400).json({
        success: false,
        message: "telegramID, name y telegramLink son requeridos",
      });
    }

    // Verificar si ya existe un grupo con ese telegramID
    const existingGroup = await Group.findByTelegramID(telegramID);
    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un grupo con ese telegramID",
      });
    }

    const newGroup = new Group({
      telegramID,
      name,
      members: members || [],
      telegramLink,
    });

    const savedGroup = await newGroup.save();

    res.status(201).json({
      success: true,
      message: "Grupo creado exitosamente",
      data: savedGroup,
    });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener un grupo por ID
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id).select("-__v");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error al obtener grupo por ID:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Agregar miembro a un grupo
const addMemberToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberID } = req.body;

    if (!memberID) {
      return res.status(400).json({
        success: false,
        message: "memberID es requerido",
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    await group.addMember(memberID);

    res.status(200).json({
      success: true,
      message: "Miembro agregado exitosamente",
      data: group,
    });
  } catch (error) {
    console.error("Error al agregar miembro:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Remover miembro de un grupo
const removeMemberFromGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberID } = req.body;

    if (!memberID) {
      return res.status(400).json({
        success: false,
        message: "memberID es requerido",
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    await group.removeMember(memberID);

    res.status(200).json({
      success: true,
      message: "Miembro removido exitosamente",
      data: group,
    });
  } catch (error) {
    console.error("Error al remover miembro:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

export {
  getAllGroups,
  getUserGroups,
  createGroup,
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
};
