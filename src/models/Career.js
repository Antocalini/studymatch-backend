// src/models/Career.js
import mongoose from 'mongoose';
import { SemesterSchema } from './Semester.js'; // Note the .js extension for imports

const CareerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  semesters: [SemesterSchema], // Array of embedded Semester documents
});

const Career = mongoose.model('Career', CareerSchema);

export default Career;