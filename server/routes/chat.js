const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const ChatSession = require("../models/ChatSession");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// @route  GET /api/chat/status
// @access Protected
// @desc   Gets active sessions for the user (1 for student, multiple for admin/librarian)
router.get("/status", protect, async (req, res) => {
  try {
    if (req.user.role === "student") {
      const session = await ChatSession.findOne({
        studentId: req.user._id,
        status: "Ongoing",
      }).populate("librarianId", "name email avatar");
      return res.json({ activeSession: session });
    } else if (req.user.role === "librarian" || req.user.role === "admin") {
      const sessions = await ChatSession.find({
        status: "Ongoing",
        librarianId: req.user._id,
      }).populate("studentId", "name email studentId");

      const queuedSessions = await ChatSession.find({
        status: "Ongoing",
        librarianId: null,
      }).populate("studentId", "name email studentId");

      return res.json({ activeSessions: sessions, queuedSessions });
    }
    res.status(403).json({ message: "Unauthorized role" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/chat/request
// @access Protected (Student only)
// @desc   Start a new live chat session
router.post("/request", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can request a chat." });
    }

    // Check if student already has an ongoing session
    const existing = await ChatSession.findOne({
      studentId: req.user._id,
      status: "Ongoing",
    });
    if (existing) {
      return res
        .status(400)
        .json({
          message: "You already have an active chat session.",
          session: existing,
        });
    }

    // See if any librarian is available
    const availableLibrarian = await User.findOne({
      role: "librarian",
      chatAvailable: true,
    });

    // Create session (unassigned if no librarian available)
    const roomId = `live-${req.user._id}-${Date.now()}`;
    const session = await ChatSession.create({
      studentId: req.user._id,
      librarianId: availableLibrarian ? availableLibrarian._id : null,
      roomId,
      status: "Ongoing",
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/chat/availability
// @access Protected (Librarian only)
// @desc   Toggle chat availability for self
router.put("/availability", protect, async (req, res) => {
  try {
    if (req.user.role !== "librarian") {
      return res
        .status(403)
        .json({ message: "Only librarians can toggle chat availability." });
    }

    const { chatAvailable } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { chatAvailable },
      { new: true },
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/chat/session/:id/end
// @access Protected
// @desc   Manually end a chat session
router.put("/session/:id/end", protect, async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session)
      return res.status(404).json({ message: "Session not found." });

    // Verify ownership
    if (
      req.user.role === "student" &&
      session.studentId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized." });
    }
    if (
      (req.user.role === "librarian" || req.user.role === "admin") &&
      session.librarianId &&
      session.librarianId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    session.status = "Completed";
    session.endTime = new Date();
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/chat/session/:id/join
// @access Protected (Librarian/Admin)
// @desc   Join an unassigned/queued session
router.put("/session/:id/join", protect, async (req, res) => {
  try {
    if (req.user.role !== "librarian" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const session = await ChatSession.findById(req.params.id);
    if (!session)
      return res.status(404).json({ message: "Session not found." });
    if (session.librarianId)
      return res.status(400).json({ message: "Session already assigned." });

    session.librarianId = req.user._id;
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/chat/history/:roomId
// @access Protected
router.get("/history/:roomId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/chat/message
// @access Protected
router.post("/message", protect, async (req, res) => {
  try {
    const { content, roomId } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      content,
      roomId,
    });

    // Update last activity on session
    await ChatSession.findOneAndUpdate(
      { roomId, status: "Ongoing" },
      { lastActivity: new Date() },
    );

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
