// src/controllers/career.controller.js
import Career from '../models/Career.js'; // Import the Career model

// @desc    Create a new Career with embedded Semesters and Subjects
// @route   POST /api/careers
// @access  Private (Admin only)
export const createCareer = async (req, res) => {
  try {
    const { name, semesters } = req.body;

    if (!name || !semesters || !Array.isArray(semesters)) {
      return res.status(400).json({ message: 'Career name and an array of semesters are required.' });
    }

    // Basic validation for semesters and subjects structure (can be extended)
    for (const semester of semesters) {
      if (!semester.number || !Array.isArray(semester.subjects)) {
        return res.status(400).json({ message: 'Each semester must have a number and an array of subjects.' });
      }
      for (const subject of semester.subjects) {
        if (!subject.name) {
          return res.status(400).json({ message: 'Each subject must have a name.' });
        }
      }
    }

    const newCareer = new Career({
      name,
      semesters
    });

    const savedCareer = await newCareer.save();
    res.status(201).json({ message: 'Career created successfully', career: savedCareer });

  } catch (error) {
    if (error.code === 11000) { // Duplicate key error for unique 'name'
      return res.status(409).json({ message: `A career with the name '${req.body.name}' already exists.` });
    }
    console.error('Error creating career:', error);
    res.status(500).json({ message: 'Server error creating career.', error: error.message });
  }
};

// @desc    Get all Careers
// @route   GET /api/careers
// @access  Public (or Private based on your needs, but common to list them)
export const getAllCareers = async (req, res) => {
  try {
    const careers = await Career.find({});
    res.status(200).json({ count: careers.length, careers });
  } catch (error) {
    console.error('Error fetching careers:', error);
    res.status(500).json({ message: 'Server error fetching careers.', error: error.message });
  }
};

// @desc    Get a single Career by ID
// @route   GET /api/careers/:id
// @access  Public (or Private)
export const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ message: 'Career not found.' });
    }
    res.status(200).json({ career });
  } catch (error) {
    console.error('Error fetching career by ID:', error);
    res.status(500).json({ message: 'Server error fetching career.', error: error.message });
  }
};

// @desc    Update a Career by ID
// @route   PUT /api/careers/:id
// @access  Private (Admin only)
export const updateCareer = async (req, res) => {
  try {
    const { name, semesters } = req.body; // Expect updated name and possibly semesters

    // Note: Updating embedded documents (semesters, subjects) can be complex.
    // This example performs a full replacement of 'semesters' array if provided.
    // For partial updates to embedded documents, you might need more specific logic
    // or separate sub-endpoints (e.g., /api/careers/:careerId/semesters/:semesterId).
    const updateData = {};
    if (name) updateData.name = name;
    if (semesters) {
        if (!Array.isArray(semesters)) {
            return res.status(400).json({ message: 'Semesters must be an array.' });
        }
        // Basic validation for semesters and subjects structure (can be extended)
        for (const semester of semesters) {
            if (!semester.number || !Array.isArray(semester.subjects)) {
                return res.status(400).json({ message: 'Each semester must have a number and an array of subjects.' });
            }
            for (const subject of semester.subjects) {
                if (!subject.name) {
                    return res.status(400).json({ message: 'Each subject must have a name.' });
                }
            }
        }
        updateData.semesters = semesters;
    }


    const updatedCareer = await Career.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedCareer) {
      return res.status(404).json({ message: 'Career not found.' });
    }

    res.status(200).json({ message: 'Career updated successfully', career: updatedCareer });

  } catch (error) {
    if (error.code === 11000) {
        return res.status(409).json({ message: `A career with the name '${req.body.name}' already exists.` });
    }
    console.error('Error updating career:', error);
    res.status(500).json({ message: 'Server error updating career.', error: error.message });
  }
};

// @desc    Delete a Career by ID
// @route   DELETE /api/careers/:id
// @access  Private (Admin only)
export const deleteCareer = async (req, res) => {
  try {
    const deletedCareer = await Career.findByIdAndDelete(req.params.id);
    if (!deletedCareer) {
      return res.status(404).json({ message: 'Career not found.' });
    }
    res.status(200).json({ message: 'Career deleted successfully', career: deletedCareer });
  } catch (error) {
    console.error('Error deleting career:', error);
    res.status(500).json({ message: 'Server error deleting career.', error: error.message });
  }
};