import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingRequests
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/send", protectRoute, sendFriendRequest);
router.post("/accept", protectRoute, acceptFriendRequest);
router.post("/cancel", protectRoute, cancelFriendRequest);
router.get("/list", protectRoute, getFriends);
router.get("/pending", protectRoute, getPendingRequests);

export default router;
