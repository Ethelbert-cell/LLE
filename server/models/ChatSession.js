const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    librarianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    roomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["Ongoing", "Completed", "Missed"],
      default: "Ongoing",
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);
