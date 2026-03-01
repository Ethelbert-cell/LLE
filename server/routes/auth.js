const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SystemSettings = require("../models/SystemSettings");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// @route  POST /api/auth/register
// @access Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, accessCode } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // Validate access codes
    const settings = (await SystemSettings.findById("global")) || {};

    if (role === "admin" || role === "librarian") {
      const expectedAdminCode = settings.librarianCode || "ADMIN2026";
      if (accessCode !== expectedAdminCode) {
        return res
          .status(403)
          .json({ message: "Invalid Librarian access code." });
      }
    } else if (role === "student") {
      const expectedStudentCode = settings.studentCode || "STUDENT2026";
      if (accessCode !== expectedStudentCode) {
        return res
          .status(403)
          .json({ message: "Invalid Student access code." });
      }
    }

    // Generate Student ID
    let finalStudentId = undefined;
    if (role === "student" || role === undefined) {
      finalStudentId = Math.floor(100000 + Math.random() * 900000).toString();
      // Ensure it's unique
      while (await User.findOne({ studentId: finalStudentId })) {
        finalStudentId = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }

    // Use .save() so the pre-save bcrypt hook fires (Mongoose 8 + bcryptjs 3)
    const user = new User({
      name,
      email,
      password,
      studentId: finalStudentId,
      role,
    });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/auth/login
// @access Public
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Role validation
    if (role && role === "student" && user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Access denied. Please use the Librarian login." });
    }
    if (
      role &&
      role === "admin" &&
      user.role !== "admin" &&
      user.role !== "librarian"
    ) {
      return res
        .status(403)
        .json({ message: "Access denied. Please use the Student login." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
