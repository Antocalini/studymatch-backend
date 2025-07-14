import { User } from "../models/Users.js";
import mongoose from "mongoose";

// Función para agregar una materia al perfil del usuario
export const addUserSubject = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const subjectData = req.body;

    // Validar telegramId
    if (!telegramId || isNaN(parseInt(telegramId))) {
      return res.status(400).json({
        success: false,
        message: "ID de Telegram inválido",
      });
    }

    // Validar datos de entrada
    const validationErrors = validateSubjectData(subjectData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Datos de materia inválidos",
        errors: validationErrors,
      });
    }

    // Buscar usuario
    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar si la materia ya existe por código
    const existingSubject = user.subjects.find(
      (subject) => subject.code.toUpperCase() === subjectData.code.toUpperCase()
    );

    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: `La materia con código ${subjectData.code} ya existe en tu perfil`,
        existingSubject: {
          id: existingSubject._id,
          name: existingSubject.name,
          code: existingSubject.code,
          status: existingSubject.status,
        },
      });
    }

    // Preparar datos de la materia
    const newSubject = {
      name: subjectData.name.trim(),
      code: subjectData.code.trim().toUpperCase(),
      semester: parseInt(subjectData.semester),
      credits: parseInt(subjectData.credits),
      status: subjectData.status || "pendiente",
      grade: subjectData.grade || null,
    };

    // Agregar materia al array de materias del usuario
    user.subjects.push(newSubject);
    await user.save();

    // Obtener la materia recién agregada
    const addedSubject = user.subjects[user.subjects.length - 1];

    res.status(201).json({
      success: true,
      message: "Materia agregada exitosamente a tu perfil",
      data: {
        subject: addedSubject,
        totalSubjects: user.subjects.length,
      },
    });
  } catch (error) {
    console.error("Error al agregar materia:", error);

    // Manejar errores de validación de MongoDB
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al agregar la materia",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Función para editar una materia del perfil del usuario
export const editUserSubject = async (req, res) => {
  try {
    const { telegramId, subjectId } = req.params;
    const updateData = req.body;

    // Validar telegramId
    if (!telegramId || isNaN(parseInt(telegramId))) {
      return res.status(400).json({
        success: false,
        message: "ID de Telegram inválido",
      });
    }

    // Validar subjectId
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "ID de materia inválido",
      });
    }

    // Validar que hay datos para actualizar
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos para actualizar",
      });
    }

    // Validar datos de actualización
    const validationErrors = validateSubjectData(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Datos de actualización inválidos",
        errors: validationErrors,
      });
    }

    // Buscar usuario
    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Buscar la materia específica
    const subject = user.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Materia no encontrada en tu perfil",
      });
    }

    // Verificar si se está cambiando el código y ya existe otra materia con ese código
    if (updateData.code && updateData.code.toUpperCase() !== subject.code) {
      const existingSubject = user.subjects.find(
        (s) =>
          s._id.toString() !== subjectId &&
          s.code.toUpperCase() === updateData.code.toUpperCase()
      );

      if (existingSubject) {
        return res.status(409).json({
          success: false,
          message: `Ya existe otra materia con el código ${updateData.code}`,
          existingSubject: {
            id: existingSubject._id,
            name: existingSubject.name,
            code: existingSubject.code,
          },
        });
      }
    }

    // Campos permitidos para actualizar
    const allowedUpdates = [
      "name",
      "code",
      "semester",
      "credits",
      "status",
      "grade",
    ];
    const updates = {};

    // Procesar actualizaciones
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "name" && updateData[key]) {
          updates[key] = updateData[key].trim();
        } else if (key === "code" && updateData[key]) {
          updates[key] = updateData[key].trim().toUpperCase();
        } else if (key === "semester" || key === "credits") {
          updates[key] = parseInt(updateData[key]);
        } else {
          updates[key] = updateData[key];
        }
      }
    });

    // Aplicar actualizaciones
    Object.keys(updates).forEach((key) => {
      subject[key] = updates[key];
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Materia actualizada exitosamente",
      data: {
        subject: subject,
        updatedFields: Object.keys(updates),
      },
    });
  } catch (error) {
    console.error("Error al editar materia:", error);

    // Manejar errores de validación de MongoDB
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al editar la materia",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Función para obtener todas las materias del usuario
export const getUserSubjects = async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Validar telegramId
    if (!telegramId || isNaN(parseInt(telegramId))) {
      return res.status(400).json({
        success: false,
        message: "ID de Telegram inválido",
      });
    }

    // Buscar usuario
    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    let subjects = [...user.subjects];

    res.status(200).json({
      success: true,
      message: "Materias obtenidas exitosamente",
      data: {
        user: {
          telegramId: user.telegramId,
          first_name: user.first_name,
          subjects: user.subjects,
        },
        subjects: subjects,
        totalSubjects: subjects.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener materias:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener las materias",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Función para eliminar una materia del perfil del usuario
export const deleteUserSubject = async (req, res) => {
  try {
    const { telegramId, subjectId } = req.params;

    // Validar telegramId
    if (!telegramId || isNaN(parseInt(telegramId))) {
      return res.status(400).json({
        success: false,
        message: "ID de Telegram inválido",
      });
    }

    // Validar subjectId
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "ID de materia inválido",
      });
    }

    // Buscar usuario
    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Buscar la materia específica
    const subject = user.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Materia no encontrada en tu perfil",
      });
    }

    // Guardar información de la materia antes de eliminarla
    const deletedSubjectInfo = {
      name: subject.name,
      code: subject.code,
      semester: subject.semester,
    };

    // Eliminar la materia
    subject.deleteOne();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Materia eliminada exitosamente de tu perfil",
      data: {
        deletedSubject: deletedSubjectInfo,
        remainingSubjects: user.subjects.length,
      },
    });
  } catch (error) {
    console.error("Error al eliminar materia:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al eliminar la materia",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
