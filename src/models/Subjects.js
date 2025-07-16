// src/models/Subject.js
import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
}, { _id: true }); // Ensure embedded documents get their own _id

export { SubjectSchema }; // Export for use in Semester.js