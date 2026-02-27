const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * selfOrAdmin — allows the request if:
 *   - User is an admin, OR
 *   - User is a librarian and the :id param matches their own _id
 *
 * Used for PATCH /availability and PUT /hours so librarians can only
 * modify their own record, never another librarian's.
 */
const selfOrAdmin = (req, res, next) => {
  const { role, _id } = req.user || {};
  if (role === "admin") return next(); // Admin: full access
  if (role === "librarian" && _id.toString() === req.params.id) return next(); // Self: OK
  return res
    .status(403)
    .json({ message: "Access denied: you can only modify your own settings." });
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route  GET /api/users
// @desc   All users (admin only)
// @access Admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/users/librarians
// @desc   Available librarians for student scheduling (isAvailable=true only)
// @access Public
router.get("/librarians", async (req, res) => {
  try {
    const librarians = await User.find({ role: "librarian", isAvailable: true })
      .select("-password")
      .sort({ name: 1 });
    res.json(librarians);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/users/librarians/all
// @desc   All librarians regardless of availability
//         Admin gets all; a librarian only gets their own record.
// @access Admin | Librarian (own only)
router.get("/librarians/all", protect, async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role === "admin") {
      // Admin sees everyone
      const librarians = await User.find({ role: "librarian" })
        .select("-password")
        .sort({ name: 1 });
      return res.json(librarians);
    }

    if (role === "librarian") {
      // Librarian sees only themselves
      const self = await User.findById(_id).select("-password");
      return res.json(self ? [self] : []);
    }

    return res.status(403).json({ message: "Access denied." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PATCH /api/users/librarians/:id/availability
// @desc   Toggle librarian isAvailable
// @access Admin (any)  |  Librarian (own only)
router.patch(
  "/librarians/:id/availability",
  protect,
  selfOrAdmin,
  async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const librarian = await User.findOneAndUpdate(
        { _id: req.params.id, role: "librarian" },
        { isAvailable },
        { new: true },
      ).select("-password");

      if (!librarian)
        return res.status(404).json({ message: "Librarian not found." });
      res.json(librarian);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// @route  PUT /api/users/librarians/:id/hours
// @desc   Update librarian working hours / specialty
// @access Admin (any)  |  Librarian (own only)
router.put("/librarians/:id/hours", protect, selfOrAdmin, async (req, res) => {
  try {
    const { workingHours, specialty } = req.body;
    const updateFields = {};
    if (workingHours) updateFields.workingHours = workingHours;
    if (specialty !== undefined) updateFields.specialty = specialty;

    const librarian = await User.findOneAndUpdate(
      { _id: req.params.id, role: "librarian" },
      { $set: updateFields },
      { new: true },
    ).select("-password");

    if (!librarian)
      return res.status(404).json({ message: "Librarian not found." });
    res.json(librarian);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
