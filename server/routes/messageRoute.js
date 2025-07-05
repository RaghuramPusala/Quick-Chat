import express from "express";
import {
  getChatUsers,
  sendMessage,
  getMessages,
  markMessageAsSeen,
} from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Get all mutual friends + unseen counts (used for chat list)
router.get("/users", authMiddleware, getChatUsers);

// ✅ Send a message (text or image)
router.post("/send/:id", authMiddleware, sendMessage);

// ✅ Get chat history with a user
router.get("/:id", authMiddleware, getMessages);

// ✅ Mark message as seen
router.put("/mark/:id", authMiddleware, markMessageAsSeen);

export default router;
