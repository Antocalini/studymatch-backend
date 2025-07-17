// src/models/Groups.js (Corrected - Removed semesterNumber from index)
import mongoose from 'mongoose';

const GroupsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true },
  subjectName: { type: String, required: true }, // Single subject name
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Reference the 'User' model
  telegramChatId: { type: String, unique: true, sparse: true }, // Store as string
  telegramInviteLink: { type: String, unique: true, sparse: true }, // New: Store the invite link
  description: { type: String }, // Optional description for the group
  createdAt: { type: Date, default: Date.now },
});

// FIX: Removed semesterNumber from the index, as it's no longer in the schema
GroupsSchema.index({ career: 1, subjectName: 1 });

const Group = mongoose.model('Groups', GroupsSchema); // Model name 'Groups'

export { Group }; // Named export