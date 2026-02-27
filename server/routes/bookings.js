const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { protect, adminOnly } = require("../middleware/auth");

// ─── Library Opening Hours ────────────────────────────────────────────────────
// Used for server-side validation — matches the client rules exactly
const LIBRARY_HOURS = {
  0: { open: "12:00", close: "18:00" }, // Sunday
  1: { open: "08:00", close: "22:00" }, // Monday
  2: { open: "08:00", close: "22:00" }, // Tuesday
  3: { open: "08:00", close: "22:00" }, // Wednesday
  4: { open: "08:00", close: "22:00" }, // Thursday
  5: { open: "08:00", close: "22:00" }, // Friday
  6: { open: "09:00", close: "18:00" }, // Saturday
};

// Get day index from "YYYY-MM-DD" string (noon to avoid TZ issues)
const dayIdx = (dateStr) => new Date(`${dateStr}T12:00:00`).getDay();

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Room collision: returns true if any NON-cancelled booking on the same room/date
 * overlaps the requested start–end window.
 */
const roomHasCollision = async (
  roomId,
  date,
  startTime,
  endTime,
  excludeId = null,
) => {
  const query = {
    room: roomId,
    date,
    status: { $nin: ["cancelled"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await Booking.findOne(query));
};

/**
 * Student self-overlap: returns true if this student already has a NON-cancelled
 * booking on the same date whose window overlaps the requested slot.
 */
const studentHasOverlap = async (
  studentId,
  date,
  startTime,
  endTime,
  excludeId = null,
) => {
  const query = {
    student: studentId,
    date,
    status: { $nin: ["cancelled"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await Booking.findOne(query));
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route  GET /api/bookings/slots?date=YYYY-MM-DD
// @desc   Get all booked slots for a given date (public — no auth needed)
//         Returns: { [roomId]: [{ startTime, endTime, status }] }
// @access Public
router.get("/slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date)
      return res.status(400).json({ message: "date query param required" });

    const booked = await Booking.find({
      date,
      status: { $in: ["confirmed", "pending"] },
    }).select("room startTime endTime status");

    // Group by roomId
    const grouped = {};
    booked.forEach((b) => {
      const rid = b.room.toString();
      if (!grouped[rid]) grouped[rid] = [];
      grouped[rid].push({
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      });
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/bookings/my
// @desc   Student's own bookings
// @access Protected (student)
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate("room", "name location capacity")
      .sort({ date: -1, startTime: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/bookings
// @desc   All bookings (admin only)
// @access Admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("student", "name email studentId")
      .populate("room", "name location")
      .sort({ date: -1, startTime: -1 });

    // Auto-mark completed: any confirmed/pending booking whose endTime has passed
    const now = new Date();
    const updates = bookings
      .filter((b) => ["confirmed", "pending"].includes(b.status))
      .filter((b) => new Date(`${b.date}T${b.endTime}:00`) < now);

    if (updates.length) {
      await Booking.updateMany(
        { _id: { $in: updates.map((b) => b._id) } },
        { $set: { status: "completed" } },
      );
      updates.forEach((b) => {
        b.status = "completed";
      });
    }

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/bookings
// @desc   Create a booking (student)
// @access Protected
router.post("/", protect, async (req, res) => {
  try {
    const { room, date, startTime, endTime, purpose } = req.body;

    // 1. No same-day bookings
    const today = new Date().toISOString().split("T")[0];
    if (date <= today) {
      return res.status(400).json({
        message: "Bookings must be made at least one day in advance.",
      });
    }

    // 2. Library hours validation
    const hours = LIBRARY_HOURS[dayIdx(date)];
    if (startTime < hours.open || endTime > hours.close) {
      return res.status(400).json({
        message: `Booking must be within library hours (${hours.open} – ${hours.close}) on this day.`,
      });
    }

    // 3. End time must be after start time
    if (startTime >= endTime) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    // 3b. Max session duration (from SystemSettings, default 4 hrs)
    const SystemSettings = require("../models/SystemSettings");
    const settings = (await SystemSettings.findById("global")) || {
      maxBookingDuration: 4,
    };
    const toMins = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const sessionMins = toMins(endTime) - toMins(startTime);
    const maxMins = (settings.maxBookingDuration || 4) * 60;
    if (sessionMins > maxMins) {
      return res.status(400).json({
        message: `Maximum booking duration is ${settings.maxBookingDuration} hour${settings.maxBookingDuration !== 1 ? "s" : ""} per session.`,
      });
    }

    // 4. Max 1 booking per day — student cannot book two rooms on the same date
    const sameDay = await Booking.findOne({
      student: req.user._id,
      date,
      status: { $in: ["pending", "confirmed"] },
    });
    if (sameDay) {
      return res.status(409).json({
        message:
          "You already have a booking on this day. Only one room booking per day is allowed.",
      });
    }

    // 5. Max 2 bookings per calendar week (Mon–Sun)
    //    Find the Monday and Sunday of the requested date's week
    const reqDate = new Date(date + "T12:00:00");
    const dow = reqDate.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(reqDate);
    weekStart.setDate(reqDate.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const weeklyCount = await Booking.countDocuments({
      student: req.user._id,
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: weekStartStr, $lte: weekEndStr },
    });
    if (weeklyCount >= 2) {
      return res.status(409).json({
        message:
          "You have reached the maximum of 2 room bookings per week. Please cancel an existing booking first.",
      });
    }

    if (await roomHasCollision(room, date, startTime, endTime)) {
      return res
        .status(409)
        .json({ message: "This room is already booked for that time slot." });
    }

    // 6. Student self-overlap (prevent same student booking two rooms at once)
    if (await studentHasOverlap(req.user._id, date, startTime, endTime)) {
      return res.status(409).json({
        message: "You already have a booking that overlaps this time slot.",
      });
    }

    const booking = new Booking({
      student: req.user._id,
      room,
      date,
      startTime,
      endTime,
      purpose,
    });
    await booking.save();

    const populated = await booking.populate("room", "name location capacity");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PATCH /api/bookings/:id/status
// @desc   Admin updates booking status (confirm / pending / cancel / complete)
// @access Admin
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowed.join(", ")}`,
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    )
      .populate("student", "name email")
      .populate("room", "name location");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/bookings/:id
// @desc   Update booking details (student own or admin)
// @access Protected
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
      if (
        await roomHasCollision(
          booking.room,
          checkDate,
          checkStart,
          checkEnd,
          req.params.id,
        )
      ) {
        return res
          .status(409)
          .json({ message: "Time slot conflict detected." });
      }
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("room", "name location capacity");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/bookings/:id
// @desc   Cancel a booking
// @access Protected (owner or admin)
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
