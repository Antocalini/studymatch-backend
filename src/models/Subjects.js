import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

subjectSchema.index({ code: 1 });



export const Subject = mongoose.model("Subject", subjectSchema);
