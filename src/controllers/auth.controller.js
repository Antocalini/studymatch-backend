// src/controllers/auth.controller.js (Updated to use utils)
import jwt from "jsonwebtoken";
import { User } from "../models/Users.js"; // Named import for User
import Career from "../models/Career.js"; // Import Career model to validate careerId
import { verifyTelegramHash } from "../utils/telegramAuth.js"; // Import the utility function
import dotenv from 'dotenv';

dotenv.config();

// Function to generate JWT token (remains here for now, as discussed)
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

// @desc    Authenticate user with Telegram Widget data and handle profile setup for new users
// @route   POST /api/auth/sign-in
// @access  Public
export const verifyTelegramUser = async (req, res) => {
  try {
    const {
      first_name,
      hash,
      id,
      photo_url,
      username,
      careerId,           // New: Expected for new users
      currentSemesterNumber // New: Expected for new users
    } = req.body;

    // Validate that required Telegram fields are present
    if (!first_name || !hash || !id) {
      return res.status(400).json({
        success: false,
        message: "Missing required Telegram data: first_name, hash, id",
      });
    }

    // Verify the Telegram hash for data integrity and authenticity using the utility
    const isValidTelegramHash = verifyTelegramHash({
      first_name, hash, id, photo_url, username, // Only pass Telegram-related fields for hash verification
      // Note: careerId and currentSemesterNumber are NOT passed to verifyTelegramHash
      // as they are not part of Telegram's original hash calculation.
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
      user.username = username || user.username;
      user.photo_url = photo_url || user.photo_url;
      user.lastLogin = new Date();
      await user.save();
      console.log(`User ${username} logged in.`);
    } else {
      // User does not exist, create new user
      isNewUser = true;
      let userCareer = null;
      let userSemester = null;

      // If careerId and currentSemesterNumber are provided for a new user, validate and assign them
      if (careerId && currentSemesterNumber !== undefined && currentSemesterNumber !== null) {
        // Validate if careerId exists in your database
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
        username: username,
        photo_url: photo_url,
        career: userCareer,                 // Set if provided and valid
        currentSemesterNumber: userSemester, // Set if provided and valid
        createdAt: new Date(),
        lastLogin: new Date(),
        subjectsOfInterest: [], // Initialize empty
        studyGroups: [] // Initialize empty
      });
      await user.save();
      console.log(`New user ${username} registered.`);
    }

    // Generate JWT token
    const token = signToken(user._id);

    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? "User created successfully" : "User verified successfully",
      token,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        first_name: user.first_name,
        username: user.username,
        photo_url: user.photo_url,
        career: user.career, // Will be the ID
        currentSemesterNumber: user.currentSemesterNumber,
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