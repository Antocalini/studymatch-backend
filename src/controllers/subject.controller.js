// src/controllers/subject.controller.js
import Career from '../models/Career.js'; // Note the .js extension

// @desc    Get all unique subject names for a given career
// @route   GET /api/subjects/career/:careerId
// @access  Private (or Public, depending on whether you want unauthenticated users to see subjects)
const getSubjectsByCareer = async (req, res) => {
  const { careerId } = req.params;

  try {
    const career = await Career.findById(careerId);
    if (!career) {
      return res.status(404).json({ message: 'Career not found.' });
    }

    // Use flatMap to get all subjects from all semesters, then a Set for uniqueness
    const allSubjectNames = career.semesters.flatMap(sem =>
      sem.subjects.map(sub => sub.name)
    );

    res.status(200).json({
      message: `Subjects for career '${career.name}' retrieved successfully.`,
      subjects: [...new Set(allSubjectNames)] // Ensure unique subject names
    });
  } catch (error) {
    console.error('Error fetching subjects by career:', error.message);
    res.status(500).json({ message: 'Server error fetching subjects.' });
  }
};

export { getSubjectsByCareer };