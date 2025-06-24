import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages); // supports ?olderThan=
router.put("/mark/:id", protectRoute, markMessageAsSeen);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
