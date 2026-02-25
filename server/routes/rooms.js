const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const { protect, adminOnly } = require("../middleware/auth");

// @route  GET /api/rooms
// @access Public (students can view)
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/rooms
// @access Admin only
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/rooms/:id
// @access Admin only
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/rooms/:id
// @access Admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Room deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
