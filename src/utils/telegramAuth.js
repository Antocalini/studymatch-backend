// src/utils/telegramAuth.js
import crypto from "crypto";
import dotenv from 'dotenv';

dotenv.config(); // Ensure dotenv is loaded to access TELEGRAM_BOT_TOKEN

/**
 * Verifies the integrity and authenticity of Telegram widget data using the bot token.
 * @param {object} data - The object containing data from the Telegram widget, including the 'hash'.
 * @returns {boolean} True if the hash is valid, false otherwise.
 */
function verifyTelegramHash(data) {
  const { hash, ...userData } = data; // Destructure hash, keep other data

  // Reconstruct the data_check_string as per Telegram's guidelines
  // Filter out any fields that are not part of the original Telegram auth_data hash calculation
  const fieldsToHash = [
    'auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username'
  ].sort(); // Ensure consistent order for hashing

  const dataCheckString = fieldsToHash
    .filter(key => userData[key] !== undefined && userData[key] !== null) // Only include existing fields
    .map(key => `${key}=${userData[key]}`)
    .join("\n");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not configured in .env");
    return false;
  }

  // Create secret_key = SHA256(<bot_token>)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Create HMAC_SHA256(data_check_string, secret_key)
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(dataCheckString);
  const calculatedHash = hmac.digest("hex");

  return calculatedHash === hash;
}

export { verifyTelegramHash };