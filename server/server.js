import "dotenv/config"; // must be FIRST!
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoute.js";
import translateRoute from "./routes/translateRoute.js";

const app = express();
const server = http.createServer(app);

// ✅ CORS FIX: Allow only frontend URLs
const allowedOrigins = [
  "https://quickchat-eight.vercel.app",  // ✅ your Vercel domain
  "http://localhost:5173",               // optional: dev local
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Body parser
app.use(express.json({ limit: "4mb" }));

// ✅ Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("✅ User connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("send-message", (msg) => {
    const receiverSocketId = userSocketMap[msg.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", msg);
    }
  });

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

// ✅ Start server (for Render)
const start = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();
