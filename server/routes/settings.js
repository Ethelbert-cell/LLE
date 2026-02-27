const express = require("express");
const router = express.Router();
const SystemSettings = require("../models/SystemSettings");
const { protect, adminOnly } = require("../middleware/auth");

// ─── Ensure the singleton document always exists ──────────────────────────────
const getSettings = async () => {
  let s = await SystemSettings.findById("global");
  if (!s) {
    s = await SystemSettings.create({ _id: "global" });
  }
  return s;
};

// @route  GET /api/settings
// @desc   Get system settings (public — needed by student booking page)
// @access Public
router.get("/", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/settings
// @desc   Update system settings
// @access Admin
router.put("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      maxBookingDuration,
      maxAdvanceDays,
      libraryName,
      supportEmail,
      librarianCode,
    } = req.body;

    const settings = await getSettings();
    if (maxBookingDuration !== undefined)
      settings.maxBookingDuration = maxBookingDuration;
    if (maxAdvanceDays !== undefined) settings.maxAdvanceDays = maxAdvanceDays;
    if (libraryName !== undefined) settings.libraryName = libraryName;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (librarianCode !== undefined) settings.librarianCode = librarianCode;

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
