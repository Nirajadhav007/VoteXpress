// ✅ server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDatabase = require("./config/connection");
const { register, login, userDetails } = require("./controllers/user.controller");
const authenticate = require("./middlewares/auth");
const isAdmin = require("./middlewares/adminAuth");
const Vote = require("./models/vote.model");
const User = require("./models/user.model");

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ✅ Allowed Origins
const allowedOrigins = [
  "http://localhost:3000",
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,
  "https://votexpress-fron.onrender.com", // your frontend domain
];

// ✅ Database Connection
connectDatabase();

// ✅ CORS Setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy does not allow this origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// ✅ JSON Parser
app.use(express.json());

// ✅ Socket.io Setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

// ✅ Test Route
app.get("/", (req, res) => {
  res.json({ message: "API running successfully 🎉" });
});

// ========================
// 🔐 AUTH ROUTES
// ========================
app.post("/api/register", register);
app.post("/api/login", login);
app.get("/api/me", authenticate, userDetails);

// ========================
// 🗳️ VOTE ROUTES
// ========================

// ➕ Create vote (Admin)
app.post("/api/votes", authenticate, isAdmin, async (req, res) => {
  try {
    const { option } = req.body;
    if (!option) return res.status(400).json({ error: "Option is required" });

    const vote = await Vote.create({
      option,
      createdBy: req.user?._id,
    });

    io.emit("voteCreated", vote);
    res.status(201).json(vote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📋 Get all votes
app.get("/api/votes", async (req, res) => {
  try {
    const votes = await Vote.find().populate("createdBy", "email");
    res.status(200).json(votes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗳️ Cast a vote (User)
app.post("/api/vote/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // check if user already voted
    if (req.user.votedFor) {
      return res.status(400).json({ error: "You have already voted" });
    }

    const vote = await Vote.findByIdAndUpdate(
      id,
      { $inc: { votes: 1 } },
      { new: true }
    );

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { votedFor: id },
      { new: true }
    );

    io.emit("voteUpdated", vote);
    res.status(200).json({ vote, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ❌ Delete vote (Admin)
app.delete("/api/vote/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Vote.findByIdAndDelete(id);

    io.emit("voteDeleted", id);
    res.status(200).json({ message: "Vote deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// 🔌 SOCKET.IO EVENTS
// ========================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ========================
// 🚀 START SERVER
// ========================
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
