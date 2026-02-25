const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const { protect, adminOnly } = require("../middleware/auth");

// @route  GET /api/meetings/my
// @access Student
router.get("/my", protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ student: req.user._id }).sort({
      date: -1,
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/meetings  (all — admin)
// @access Admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate("student", "name email studentId")
      .sort({ date: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/meetings
// @access Student
router.post("/", protect, async (req, res) => {
  try {
    const { date, time, topic, notes } = req.body;
    const meeting = await Meeting.create({
      student: req.user._id,
      date,
      time,
      topic,
      notes,
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/meetings/:id  (admin approves/rejects)
// @access Admin
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true },
    );
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/meetings/:id  (student cancels)
// @access Student (own) or Admin
router.delete("/:id", protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const isOwner = meeting.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Not authorized" });

    await meeting.deleteOne();
    res.json({ message: "Meeting request removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
