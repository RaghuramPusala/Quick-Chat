import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoute.js";
import translateRoute from "./routes/translateRoute.js";
import friendRoutes from "./routes/friendRoutes.js";

const app = express();
const server = http.createServer(app);

// ✅ Allowed origins for CORS
const allowedOrigins = [
  "https://quickchat-eight.vercel.app",
  "http://localhost:5173",
  "http://localhost:8081",
];

// ✅ CORS Middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ JSON body parsing
app.use(express.json({ limit: "4mb" }));

// ✅ Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// ✅ Set io in app (for controller access)
app.set("io", io);

// ✅ Global socket map
export const userSocketMap = {}; // userId: socket.id

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("✅ User connected:", userId);

  if (userId) {
    console.log("📌 Setting userSocketMap:", userId, socket.id);
    userSocketMap[userId] = socket.id;
    socket.join(userId); // per-user room
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // ✅ Handle new message
  socket.on("send-message", (msg) => {
    const receiverSocketId = userSocketMap[msg.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", msg);
    }
  });

  // ✅ Seen update
  socket.on("markSeen", ({ from, to }) => {
    io.to(from).emit("seenUpdate", { userId: to });
  });

  // ✅ Typing indicator
  socket.on("typing", ({ to }) => {
    if (to && userSocketMap[to]) {
      io.to(userSocketMap[to]).emit("typing", { from: userId });
    }
  });

  // ✅ Disconnect cleanup
  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/message", messageRoutes);
app.use("/api/translate", translateRoute);
app.use("/api/friends", friendRoutes);

// ✅ Start server
const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();
