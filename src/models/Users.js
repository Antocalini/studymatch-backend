// src/models/Users.js
import mongoose from 'mongoose';

const UsersSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  first_name: { type: String }, // Matches auth.controller.js field name
  last_name: { type: String }, // Added for completeness if available from Telegram
  photo_url: { type: String }, // Matches auth.controller.js field name
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ['user', 'admin'], // Only 'user' or 'admin' allowed
    default: 'user'          // Default role for new users
  },

  // Fields that will be set AFTER initial Telegram login/signup
  career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', default: null }, // Optional initially
  currentSemesterNumber: { type: Number, min: 1, default: null }, // Optional initially
  subjectsOfInterest: [{ type: String }], // Array of Subject Names
  studyGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Groups' }], // Reference the 'Groups' model
});

const User = mongoose.model('User', UsersSchema); // The model name will be 'User' internally

export { User }; // Export as named export to match auth.controller.js