const mongoose = require("mongoose");

// Singleton system-wide settings document
const settingsSchema = new mongoose.Schema(
  {
    // Only one document ever exists — identified by this key
    _id: { type: String, default: "global" },

    // Max duration a student can book a study room (hours)
    maxBookingDuration: { type: Number, default: 4, min: 1, max: 12 },

    // Max days into the future a student can make a booking
    maxAdvanceDays: { type: Number, default: 7, min: 1, max: 60 },

    // Library contact / display settings
    libraryName: { type: String, default: "University Central Library" },
    supportEmail: { type: String, default: "library@university.edu" },
    librarianCode: { type: String, default: "ADMIN2026" },
    studentCode: { type: String, default: "STUDENT2026" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemSettings", settingsSchema);
