// src/controllers/auth.controller.js (Minor correction for currentSemesterNumber)
import jwt from "jsonwebtoken";
import { User } from "../models/Users.js"; // Named import for User
import Career from "../models/Career.js"; // Import Career model to validate careerId
import { verifyTelegramHash } from "../utils/telegramAuth.js"; // Import the utility function
import dotenv from 'dotenv';

dotenv.config();

// Function to generate JWT token (remains here for now, as discussed)
const signToken = (id) => {
  // The expiresIn option (e.g., "15m") is handled by jsonwebtoken internally
  // to calculate the 'exp' claim in the JWT payload.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h", // Ensure JWT_EXPIRE is correctly set in .env
  });
};

// @desc    Authenticate user with Telegram Widget data and handle profile setup for new users
// @route   POST /api/auth/telegram-login
// @access  Public
export const verifyTelegramUser = async (req, res) => {
  try {
    const {
      first_name,
      hash,
      id,
      photo_url,
      username,
      last_name,
      auth_date,
      careerId,
      currentSemesterNumber // Corrected spelling here
    } = req.body;

    // Validate that required Telegram fields are present
    if (!first_name || !hash || !id || auth_date === undefined || auth_date === null) {
      return res.status(400).json({
        success: false,
        message: "Missing required Telegram data: first_name, hash, id, auth_date",
      });
    }

    // Verify the Telegram hash for data integrity and authenticity using the utility
    const isValidTelegramHash = verifyTelegramHash({
      first_name, hash, id, photo_url, username, last_name, auth_date
    });
    if (!isValidTelegramHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid Telegram data hash.",
      });
    }

    // Search if the user already exists in the database
    let user = await User.findOne({ telegramId: id });
    let isNewUser = false;

    if (user) {
      // User exists, update information if necessary
      user.first_name = first_name;
      user.last_name = last_name || user.last_name;
      user.username = username || user.username;
      user.photo_url = photo_url || user.photo_url;
      user.lastLogin = new Date(); // Update lastLogin on every login
      await user.save();
      console.log(`User ${username} logged in.`);
    } else {
      // User does not exist, create new user
      isNewUser = true;
      let userCareer = null;
      let userSemester = null;

      if (careerId && currentSemesterNumber !== undefined && currentSemesterNumber !== null) {
        const existingCareer = await Career.findById(careerId);
        if (!existingCareer) {
          return res.status(400).json({
            success: false,
            message: "Invalid Career ID provided for new user registration.",
          });
        }
        if (typeof currentSemesterNumber !== 'number' || currentSemesterNumber < 1) {
            return res.status(400).json({
                success: false,
                message: "Current semester number must be a positive number."
            });
        }
        userCareer = careerId;
        userSemester = currentSemesterNumber;
      } else {
        console.log("New user registered without initial career/semester. Will need to set up profile later.");
      }

      user = new User({
        telegramId: id,
        first_name: first_name,
        last_name: last_name || null, // Ensure last_name is set, even if null
        username: username,
        photo_url: photo_url || null, // Ensure photo_url is set, even if null
        career: userCareer,
        currentSemesterNumber: userSemester, // Corrected spelling here
        createdAt: new Date(),
        lastLogin: new Date(),
        role: 'user', // Default role for new users
        subjectsOfInterest: [],
        studyGroups: []
      });
      await user.save();
      console.log(`New user ${username} registered.`);
    }

    // Generate JWT token
    const token = signToken(user._id);

    // Return the FULL user object as defined in your backend's User model
    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? "User created successfully" : "User verified successfully",
      token,
      user: {
        id: user._id.toString(), // Convert ObjectId to string for frontend
        telegramId: user.telegramId,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username,
        photo_url: user.photo_url || null,
        career: user.career ? user.career.toString() : null, // Convert ObjectId to string
        currentSemesterNumber: user.currentSemesterNumber || null, // Corrected spelling here
        role: user.role,
        subjectsOfInterest: user.subjectsOfInterest || [],
        studyGroups: user.studyGroups.map(group => group.toString()) || [],
        createdAt: user.createdAt.toISOString(), // Convert Date to ISO string
        lastLogin: user.lastLogin.toISOString(), // Convert Date to ISO string
        isNewUser: isNewUser,
      },
    });

  } catch (error) {
    console.error("Error in verifyTelegramUser:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
      error: error.message,
    });
  }
};