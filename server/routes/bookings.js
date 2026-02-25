const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { protect, adminOnly } = require("../middleware/auth");

// Helper: check for time collision on a room
const hasCollision = async (
  roomId,
  date,
  startTime,
  endTime,
  excludeId = null,
) => {
  const query = {
    room: roomId,
    date,
    status: { $ne: "cancelled" },
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
  };
  if (excludeId) query._id = { $ne: excludeId };
  const conflict = await Booking.findOne(query);
  return !!conflict;
};

// @route  GET /api/bookings/my
// @access Student (own bookings)
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate("room", "name location capacity")
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/bookings
// @access Admin only
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("student", "name email studentId")
      .populate("room", "name location")
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/bookings
// @access Student
router.post("/", protect, async (req, res) => {
  try {
    const { room, date, startTime, endTime, purpose } = req.body;

    const collision = await hasCollision(room, date, startTime, endTime);
    if (collision) {
      return res
        .status(409)
        .json({
          message: "This room is already booked for the selected time.",
        });
    }

    const booking = await Booking.create({
      student: req.user._id,
      room,
      date,
      startTime,
      endTime,
      purpose,
    });

    const populated = await booking.populate("room", "name location capacity");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/bookings/:id
// @access Student (own) or Admin
router.put("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Not authorized" });

    const { date, startTime, endTime, purpose, status } = req.body;
    const checkDate = date || booking.date;
    const checkStart = startTime || booking.startTime;
    const checkEnd = endTime || booking.endTime;

    if (date || startTime || endTime) {
      const collision = await hasCollision(
        booking.room,
        checkDate,
        checkStart,
        checkEnd,
        req.params.id,
      );
      if (collision)
        return res
          .status(409)
          .json({ message: "Time slot conflict detected." });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("room", "name location capacity");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/bookings/:id  (Cancel)
// @access Student (own) or Admin
router.delete("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Not authorized" });

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
