const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const SystemSettings = require("../models/SystemSettings");
const { protect, adminOnly } = require("../middleware/auth");

// ─── Day-of-week key from "YYYY-MM-DD" ────────────────────────────────────────
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const dayKey = (dateStr) => DAY_KEYS[new Date(dateStr + "T12:00:00").getDay()];

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route  GET /api/meetings/slots
// @desc   Returns taken time slots for a given librarian on a given date.
//         Used by the student SchedulingPage — public, no auth needed.
//         Query params: librarianId, date (YYYY-MM-DD)
// @access Public
router.get("/slots", async (req, res) => {
  try {
    const { librarianId, date } = req.query;
    if (!librarianId || !date)
      return res
        .status(400)
        .json({ message: "librarianId and date are required." });

    const meetings = await Meeting.find({
      librarian: librarianId,
      requestedDate: date,
      status: { $in: ["pending", "approved"] },
    }).select("preferredTime");

    res.json(meetings.map((m) => m.preferredTime));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/meetings/my
// @desc   Student's own meeting requests
// @access Protected (student)
router.get("/my", protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ student: req.user._id })
      .populate("librarian", "name email")
      .sort({ requestedDate: -1, preferredTime: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/meetings
// @desc   All meetings — admin gets everything; librarian gets only their own.
// @access Admin | Librarian (own only)
router.get("/", protect, async (req, res) => {
  try {
    const { role, _id } = req.user;

    // Only admin and librarian can access this endpoint
    if (role !== "admin" && role !== "librarian") {
      return res.status(403).json({ message: "Access denied." });
    }

    const filter = role === "librarian" ? { librarian: _id } : {};

    const meetings = await Meeting.find(filter)
      .populate("student", "name email studentId")
      .populate("librarian", "name email")
      .sort({ requestedDate: -1, preferredTime: -1 });

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/meetings
// @desc   Create a new meeting request (student)
// @access Protected
router.post("/", protect, async (req, res) => {
  try {
    const {
      librarian: librarianId,
      requestedDate,
      preferredTime,
      topic,
      notes,
    } = req.body;

    // 1. Load settings for maxAdvanceDays
    const settings = (await SystemSettings.findById("global")) || {
      maxAdvanceDays: 7,
    };
    const today = new Date().toISOString().split("T")[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.maxAdvanceDays);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    if (requestedDate <= today) {
      return res
        .status(400)
        .json({
          message: "Meetings must be scheduled at least one day in advance.",
        });
    }
    if (requestedDate > maxDateStr) {
      return res
        .status(400)
        .json({
          message: `You can only book up to ${settings.maxAdvanceDays} days in advance.`,
        });
    }

    // 2. Load the librarian and check availability
    const librarian = await User.findById(librarianId);
    if (!librarian || librarian.role !== "librarian") {
      return res.status(404).json({ message: "Librarian not found." });
    }
    if (!librarian.isAvailable) {
      return res
        .status(400)
        .json({ message: `${librarian.name} is currently unavailable.` });
    }

    // 3. Check the librarian works on the requested day
    const dk = dayKey(requestedDate);
    const dayHours = librarian.workingHours?.[dk];
    if (!dayHours?.enabled) {
      return res.status(400).json({
        message: `${librarian.name} does not work on ${dk.charAt(0).toUpperCase() + dk.slice(1)}days.`,
      });
    }

    // 4. Check time is within working hours
    if (preferredTime < dayHours.open || preferredTime >= dayHours.close) {
      return res.status(400).json({
        message: `${librarian.name}'s hours on this day are ${dayHours.open} – ${dayHours.close}.`,
      });
    }

    // 5. Prevent librarian double-booking (same slot)
    const librarianConflict = await Meeting.findOne({
      librarian: librarianId,
      requestedDate,
      preferredTime,
      status: { $in: ["pending", "approved"] },
    });
    if (librarianConflict) {
      return res.status(409).json({
        message: `${librarian.name} is already booked at this time. Please choose a different slot.`,
      });
    }

    // 6. ONE meeting per day per student — regardless of librarian
    //    Students cannot book two meetings on the same day with different librarians.
    const studentDayConflict = await Meeting.findOne({
      student: req.user._id,
      requestedDate,
      status: { $in: ["pending", "approved"] },
    });
    if (studentDayConflict) {
      return res.status(409).json({
        message:
          "You already have a meeting scheduled on this day. You can only book one meeting per day.",
      });
    }

    const meeting = new Meeting({
      student: req.user._id,
      librarian: librarianId,
      requestedDate,
      preferredTime,
      topic,
      notes,
    });
    await meeting.save();

    const populated = await meeting.populate("librarian", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/meetings/:id
// @desc   Approve / reject a meeting + add a note.
//         Admin: any meeting.
//         Librarian: only meetings assigned to them.
// @access Admin | Librarian (own only)
router.put("/:id", protect, async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role !== "admin" && role !== "librarian") {
      return res.status(403).json({ message: "Access denied." });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting)
      return res.status(404).json({ message: "Meeting not found." });

    // Librarian can only act on their own meetings
    if (
      role === "librarian" &&
      meeting.librarian.toString() !== _id.toString()
    ) {
      return res.status(403).json({
        message: "You can only approve or reject meetings assigned to you.",
      });
    }

    const { status, librarianNote } = req.body;
    const allowed = ["pending", "approved", "rejected", "cancelled"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({
          message: `Invalid status. Must be one of: ${allowed.join(", ")}`,
        });
    }

    const updated = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status, librarianNote, reviewedBy: _id, reviewedAt: new Date() },
      { new: true },
    )
      .populate("student", "name email studentId")
      .populate("librarian", "name email");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/meetings/:id
// @desc   Cancel a meeting (student own or admin)
// @access Protected
router.delete("/:id", protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting)
      return res.status(404).json({ message: "Meeting not found." });

    const isOwner = meeting.student.toString() === req.user._id.toString();
    const isStaff = ["admin", "librarian"].includes(req.user.role);
    // Librarian can only cancel their own assigned meetings
    const isOwnLibrarian =
      req.user.role === "librarian" &&
      meeting.librarian.toString() === req.user._id.toString();

    if (!isOwner && !isStaff && !isOwnLibrarian) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (req.user.role === "librarian" && !isOwnLibrarian && !isOwner) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own meetings." });
    }

    meeting.status = "cancelled";
    await meeting.save();
    res.json({ message: "Meeting cancelled." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
