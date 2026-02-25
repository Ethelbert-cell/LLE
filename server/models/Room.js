const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    location: { type: String, required: true },
    amenities: [{ type: String }], // e.g. ['Whiteboard', 'Projector', 'Power Outlets']
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Room", roomSchema);
