// src/controllers/user.controller.js
import { User } from '../models/Users.js'; // Note the .js extension and named import
import Career from '../models/Career.js'; // For validating career ID

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  // req.user is populated by the protect middleware
  try {
    const user = await User.findById(req.user._id).populate('career', 'name'); // Populate career name
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({
      _id: user._id,
      telegramId: user.telegramId,
      first_name: user.first_name, // Matches Users.js
      username: user.username,
      photo_url: user.photo_url,
      career: user.career, // Will be populated with name
      currentSemesterNumber: user.currentSemesterNumber,
      subjectsOfInterest: user.subjectsOfInterest,
      studyGroups: user.studyGroups // Only IDs, can be populated in a separate call or specific group routes
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Server error retrieving profile.' });
  }
};

// @desc    Update user's career and current semester number (for onboarding)
// @route   PUT /api/users/me/profile-setup
// @access  Private
const setupUserProfile = async (req, res) => {
  const { careerId, currentSemesterNumber } = req.body;

  if (!careerId || !currentSemesterNumber) {
    return res.status(400).json({ message: 'Career ID and current semester number are required.' });
  }

  if (typeof currentSemesterNumber !== 'number' || currentSemesterNumber < 1) {
    return res.status(400).json({ message: 'Current semester number must be a positive number.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Validate if careerId exists
    const careerExists = await Career.findById(careerId);
    if (!careerExists) {
      return res.status(400).json({ message: 'Invalid Career ID provided.' });
    }

    user.career = careerId;
    user.currentSemesterNumber = currentSemesterNumber;
    await user.save();

    res.status(200).json({
      message: 'User profile setup successfully.',
      career: user.career,
      currentSemesterNumber: user.currentSemesterNumber
    });
  } catch (error) {
    console.error('Error setting up user profile:', error.message);
    res.status(500).json({ message: 'Server error setting up profile.' });
  }
};


// @desc    Update user's general subjects of interest
// @route   PUT /api/users/me/interests
// @access  Private
const updateSubjectsOfInterest = async (req, res) => {
  const { subjects } = req.body; // Array of subject names

  if (!Array.isArray(subjects)) {
    return res.status(400).json({ message: 'Subjects must be an array.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.subjectsOfInterest = subjects;
    await user.save();

    res.status(200).json({
      message: 'Subjects of interest updated successfully.',
      subjectsOfInterest: user.subjectsOfInterest
    });
  } catch (error) {
    console.error('Error updating subjects of interest:', error.message);
    res.status(500).json({ message: 'Server error updating interests.' });
  }
};

// @desc    Get total count of active users
// @route   GET /api/users/count
// @access  Public (or Private)
const getUserCount = async (req, res) => {
  try {
    const userCount = await User.countDocuments({}); // Count all documents in the User collection
    res.status(200).json({ count: userCount });
  } catch (error) {
    console.error('Error fetching user count:', error.message);
    res.status(500).json({ message: 'Server error fetching user count.' });
  }
};


export {
  getMe,
  setupUserProfile,
  updateSubjectsOfInterest,
  getUserCount
};