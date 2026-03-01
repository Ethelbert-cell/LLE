const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/meetings", require("./routes/meetings"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/users", require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));

// Health check
app.get("/", (req, res) =>
  res.json({ message: "LLE Library API is running 🚀" }),
);

// Socket.IO — Live Chat (Pillar 3, Tier 3)
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("send_message", (data) => {
    // Broadcast to everyone in the room
    io.to(data.roomId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// ── Background Cron tasks ──
const ChatSession = require("./models/ChatSession");

setInterval(async () => {
  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find sessions that timed out
    const expiredSessions = await ChatSession.find({
      status: "Ongoing",
      $or: [
        { lastActivity: { $lt: fiveMinsAgo } },
        { startTime: { $lt: thirtyMinsAgo } },
      ],
    });

    for (const session of expiredSessions) {
      session.status = session.librarianId ? "Completed" : "Missed";
      session.endTime = new Date();
      await session.save();

      // Notify via socket
      io.to(session.roomId).emit("session_ended", {
        reason: "timeout",
        message:
          "This chat session has automatically ended due to time limits or inactivity.",
      });
      console.log(`⏳ Auto-closed chat session ${session._id}`);
    }
  } catch (err) {
    console.error("Cron Error capturing expired sessions:", err);
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
