const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    date: { type: String, required: true }, // e.g. "2026-02-25"
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true }, // e.g. "11:00"
    purpose: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

// Collision detection: ensure same room is not double-booked
bookingSchema.index({ room: 1, date: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
