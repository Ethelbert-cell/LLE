const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The specific librarian the student booked with
    librarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedDate: { type: String, required: true }, // "YYYY-MM-DD"
    preferredTime: { type: String, required: true }, // "HH:MM"
    topic: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    librarianNote: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

// Collision index: prevent same librarian double-book
meetingSchema.index({ librarian: 1, requestedDate: 1, preferredTime: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
