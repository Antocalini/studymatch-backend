import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    first_name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: null,
    },
    photo_url: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    subjects: {
      type: []  ,
      default: [],
    }
  
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar el rendimiento
userSchema.index({ telegramId: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model("User", userSchema);
