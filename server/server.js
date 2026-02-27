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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
