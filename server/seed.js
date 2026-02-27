/**
 * Seed Script — seeds initial rooms, users (admin + student + 3 librarians),
 * and system settings into MongoDB.
 * Run:  node seed.js   (from /server directory)
 * WARNING: Clears all existing Rooms, Users, and SystemSettings first.
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Room = require("./models/Room");
const User = require("./models/User");
const SystemSettings = require("./models/SystemSettings");

// ─── Rooms ────────────────────────────────────────────────────────────────────
const rooms = [
  {
    name: "Study Room A",
    location: "Floor 2 — East Wing",
    capacity: 6,
    amenities: ["Whiteboard", "Projector", "Power Outlets"],
    description: "Ideal for group study sessions.",
  },
  {
    name: "Quiet Pod 1",
    location: "Floor 1 — Silent Zone",
    capacity: 2,
    amenities: ["Power Outlets", "Soundproofed"],
    description: "Perfect for focused individual work.",
  },
  {
    name: "Collaboration Suite",
    location: "Floor 3 — North",
    capacity: 12,
    amenities: ["Whiteboard", "Smart TV", "Conference Phone", "Power Outlets"],
    description: "Large space for team projects.",
  },
  {
    name: "Reading Room B",
    location: "Floor 1 — West Wing",
    capacity: 4,
    amenities: ["Natural Lighting", "Power Outlets"],
    description: "Comfortable reading and research space.",
  },
  {
    name: "Media Lab",
    location: "Floor 2 — North",
    capacity: 8,
    amenities: ["iMacs", "Green Screen", "Audio Booth", "Power Outlets"],
    description: "For video editing, podcasting and media projects.",
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("✅ MongoDB connected");

    // Clear existing data
    await Promise.all([
      Room.deleteMany({}),
      User.deleteMany({}),
      SystemSettings.deleteMany({}),
    ]);
    console.log("🗑  Cleared existing data");

    // ── Rooms ─────────────────────────────────────────────────────────────────
    await Room.insertMany(rooms);
    console.log(`✅ Seeded ${rooms.length} rooms`);

    // ── System Settings ───────────────────────────────────────────────────────
    await SystemSettings.create({
      _id: "global",
      maxBookingDuration: 4,
      maxAdvanceDays: 7,
      libraryName: "University Central Library",
      supportEmail: "library@university.edu",
      librarianCode: "ADMIN2026",
    });
    console.log("✅ Seeded system settings");

    // ── Admin ─────────────────────────────────────────────────────────────────
    const admin = new User({
      name: "Library Admin",
      email: "admin@library.edu",
      password: "admin123",
      role: "admin",
    });
    await admin.save();

    // ── Student ───────────────────────────────────────────────────────────────
    const student = new User({
      name: "Alex Morgan",
      email: "alex.morgan@university.edu",
      password: "student123",
      studentId: "482910",
      role: "student",
    });
    await student.save();

    // ── Librarians ────────────────────────────────────────────────────────────
    // Sarah Collins — Mon–Fri 9–17, Sat 9–13
    const sarah = new User({
      name: "Sarah Collins",
      email: "sarah.collins@library.edu",
      password: "librarian123",
      role: "librarian",
      specialty: "Research & Academic Writing",
      isAvailable: true,
      workingHours: {
        mon: { enabled: true, open: "09:00", close: "17:00" },
        tue: { enabled: true, open: "09:00", close: "17:00" },
        wed: { enabled: true, open: "09:00", close: "17:00" },
        thu: { enabled: true, open: "09:00", close: "17:00" },
        fri: { enabled: true, open: "09:00", close: "17:00" },
        sat: { enabled: true, open: "09:00", close: "13:00" },
        sun: { enabled: false, open: "09:00", close: "13:00" },
      },
    });
    await sarah.save();

    // James Okafor — Mon–Thu 8–16, Fri 10–15
    const james = new User({
      name: "James Okafor",
      email: "james.okafor@library.edu",
      password: "librarian123",
      role: "librarian",
      specialty: "Digital Resources & Databases",
      isAvailable: true,
      workingHours: {
        mon: { enabled: true, open: "08:00", close: "16:00" },
        tue: { enabled: true, open: "08:00", close: "16:00" },
        wed: { enabled: true, open: "08:00", close: "16:00" },
        thu: { enabled: true, open: "08:00", close: "16:00" },
        fri: { enabled: true, open: "10:00", close: "15:00" },
        sat: { enabled: false, open: "09:00", close: "13:00" },
        sun: { enabled: false, open: "09:00", close: "13:00" },
      },
    });
    await james.save();

    // Amara Nwosu — Tue–Fri 9–18, off Mon/Sat/Sun
    const amara = new User({
      name: "Amara Nwosu",
      email: "amara.nwosu@library.edu",
      password: "librarian123",
      role: "librarian",
      specialty: "Special Collections & Archives",
      isAvailable: true,
      workingHours: {
        mon: { enabled: false, open: "09:00", close: "17:00" },
        tue: { enabled: true, open: "09:00", close: "18:00" },
        wed: { enabled: true, open: "09:00", close: "18:00" },
        thu: { enabled: true, open: "09:00", close: "18:00" },
        fri: { enabled: true, open: "09:00", close: "18:00" },
        sat: { enabled: false, open: "09:00", close: "13:00" },
        sun: { enabled: false, open: "09:00", close: "13:00" },
      },
    });
    await amara.save();

    console.log("✅ Seeded admin, student, and 3 librarians");

    console.log("\n📋 Login credentials:");
    console.log("  Admin      → admin@library.edu             / admin123");
    console.log("  Student    → alex.morgan@university.edu    / student123");
    console.log("  Librarian  → sarah.collins@library.edu     / librarian123");
    console.log("  Librarian  → james.okafor@library.edu      / librarian123");
    console.log("  Librarian  → amara.nwosu@library.edu       / librarian123");

    await mongoose.disconnect();
    console.log("\n🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

seed();
