import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
  getChatUsers,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.get("/users", protectRoute, getChatUsers);
router.get("/:id", protectRoute, getMessages);
router.put("/mark/:id", protectRoute, markMessageAsSeen);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
