const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

// @route  GET /api/chat/history/:roomId
// @access Protected (student or admin in that conversation)
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

// @route  POST /api/chat/message  (persist message to DB)
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
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
