const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// @route  GET /api/notifications
// @access Protected
// @desc   Get all notifications for current user (sorted newest first)
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/notifications/:id/read
// @access Protected
// @desc   Mark a single notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true },
    );
    if (!notification)
      return res.status(404).json({ message: "Notification not found." });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/notifications/read-all
// @access Protected
// @desc   Mark ALL unread notifications as read
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true },
    );
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
