// src/controllers/user.controller.js
import { User } from '../models/Users.js'; // Note the .js extension and named import
import Career from '../models/Career.js'; // For validating career ID

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // FIX: Populate 'career' and explicitly select 'name' AND 'semesters'
    // This ensures the frontend gets the full semester structure for the dropdown.
    const user = await User.findById(req.user._id).populate('career', 'name semesters');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Ensure career.semesters is available for frontend logic
    const userCareerData = user.career ? {
      _id: user.career._id,
      name: user.career.name,
      // Map semesters to ensure they are plain objects and don't include embedded subjects
      // which are not needed for the user object in Zustand.
      semesters: user.career.semesters.map(sem => ({
        _id: sem._id,
        number: sem.number,
        name: sem.name,
        // subjects are NOT included here. They are fetched by useSubjectsByCareer (from subject.controller.js)
      }))
    } : null;


    res.status(200).json({
      _id: user._id,
      telegramId: user.telegramId,
      first_name: user.first_name,
      last_name: user.last_name || null,
      username: user.username,
      photo_url: user.photo_url || null,
      career: userCareerData, // Pass the structured career data
      currentSemesterNumber: user.currentSemesterNumber || null, // Keep this as it's used for onboarding
      subjectsOfInterest: user.subjectsOfInterest || [],
      studyGroups: user.studyGroups.map(group => group.toString()) || [],
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin.toISOString(),
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


export {
  getMe,
  setupUserProfile,
  updateSubjectsOfInterest
};