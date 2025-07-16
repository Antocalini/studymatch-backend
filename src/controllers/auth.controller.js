import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/Users.js";

// Función para generar JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

// Endpoint para verificar y crear usuarios de Telegram
export const verifyTelegramUser = async (req, res) => {
  try {
    const { first_name, hash, id, photo_url, username } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!first_name || !hash || !id) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: first_name, hash, id",
      });
    }

    // Verificar el hash de Telegram
    const isValidTelegramHash = verifyTelegramHash({
      first_name,
      hash,
      id,
      photo_url,
      username,
    });

    if (!isValidTelegramHash) {
      return res.status(401).json({
        success: false,
        message: "Hash de Telegram inválido",
      });
    }

    // Buscar si el usuario ya existe en la base de datos
    let user = await User.findOne({ telegramId: id });

    if (user) {
      // Usuario existe, actualizar información si es necesario
      user.first_name = first_name;
      user.username = username || user.username;
      user.photo_url = photo_url || user.photo_url;
      user.lastLogin = new Date();

      await user.save();

      // Generar JWT token
      const token = signToken(user._id);

      return res.status(200).json({
        success: true,
        message: "Usuario verificado exitosamente",
        token,
        user: {
          id: user._id,
          telegramId: user.telegramId,
          first_name: user.first_name,
          username: user.username,
          photo_url: user.photo_url,
          isNewUser: false,
        },
      });
    } else {
      // Usuario no existe, crear nuevo usuario
      user = new User({
        telegramId: id,
        first_name: first_name,
        username: username,
        photo_url: photo_url,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      await user.save();

      // Generar JWT token
      const token = signToken(user._id);

      return res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        token,
        user: {
          id: user._id,
          telegramId: user.telegramId,
          first_name: user.first_name,
          username: user.username,
          photo_url: user.photo_url,
          isNewUser: true,
        },
      });
    }
  } catch (error) {
    console.error("Error en verify-telegram-user:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Función para verificar el hash de Telegram
function verifyTelegramHash(data) {
  const { hash, ...userData } = data;

  // Crear data_check_string
  const dataCheckString = Object.keys(userData)
    .filter((key) => userData[key] !== undefined && userData[key] !== null)
    .sort()
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  // Obtener el bot token desde variables de entorno
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  console.log(botToken);
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN no está configurado");
    return false;
  }

  // Crear secret_key = SHA256(<bot_token>)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Crear HMAC_SHA256(data_check_string, secret_key)
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(dataCheckString);
  const calculatedHash = hmac.digest("hex");

  // Comparar con el hash recibido
  return calculatedHash === hash;
}

export default verifyTelegramUser;
