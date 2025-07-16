// src/models/Semester.js
import mongoose from 'mongoose';
import { SubjectSchema } from './Subject.js'; // Note the .js extension for imports

const SemesterSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  name: { type: String },
  subjects: [SubjectSchema], // Array of embedded Subject documents
}, { _id: true });

export { SemesterSchema }; // Export for use in Career.js