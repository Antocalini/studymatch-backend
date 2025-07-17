// src/utils/telegramAuth.js (No changes needed, it was already correct)
import crypto from "crypto";
import dotenv from 'dotenv';

dotenv.config();

/**
 * Verifies the integrity and authenticity of Telegram widget data using the bot token.
 * @param {object} data - The object containing data from the Telegram widget, including the 'hash'.
 * @returns {boolean} True if the hash is valid, false otherwise.
 */
function verifyTelegramHash(data) {
  const { hash, ...userData } = data; // Destructure hash, keep other data

  // Reconstruct the data_check_string as per Telegram's guidelines
  // Ensure all fields that Telegram uses for hash calculation are listed and sorted
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