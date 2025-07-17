// src/controllers/subject.controller.js (MODIFIED)
import Career from '../models/Career.js'; // Note the .js extension

// @desc    Get a career's detailed structure including semesters and subjects
// @route   GET /api/subjects/career/:careerId
// @access  Private
const getSubjectsByCareer = async (req, res) => {
  const { careerId } = req.params;

  try {
    // Fetch the entire career document, which includes embedded semesters and subjects
    const career = await Career.findById(careerId);
    if (!career) {
      return res.status(404).json({ message: 'Career not found.' });
    }

    // Return the career object with its full structure
    // Frontend will then process this to display by semester
    res.status(200).json({
      message: `Career structure for '${career.name}' retrieved successfully.`,
      career: career // Return the full career object
    });
  } catch (error) {
    console.error('Error fetching career subjects by ID:', error.message);
    res.status(500).json({ message: 'Server error fetching career subjects.' });
  }
};

export { getSubjectsByCareer };