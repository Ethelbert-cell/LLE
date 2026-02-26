/**
 * Seed Script — seeds initial rooms and a test admin user into MongoDB.
 * Run once: node seed.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Room = require("./models/Room");
const User = require("./models/User");

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

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("✅ MongoDB connected");

    // Clear existing data
    await Room.deleteMany({});
    await User.deleteMany({});
    console.log("🗑  Cleared existing data");

    // Seed rooms
    await Room.insertMany(rooms);
    console.log(`✅ Seeded ${rooms.length} rooms`);

    // Seed users using .save() so bcrypt pre-save hook fires
    const admin = new User({
      name: "Library Admin",
      email: "admin@library.edu",
      password: "admin123",
      role: "admin",
    });
    await admin.save();

    const student = new User({
      name: "Alex Morgan",
      email: "alex.morgan@university.edu",
      password: "student123",
      studentId: "482910",
      role: "student",
    });
    await student.save();

    console.log("✅ Seeded admin + student users");

    console.log("\n📋 Login credentials:");
    console.log("  Admin   → admin@library.edu    / admin123");
    console.log("  Student → alex.morgan@university.edu / student123");

    await mongoose.disconnect();
    console.log("\n🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

seed();
