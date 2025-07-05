import express from "express";
import {
  signup,
  login,
  checkAuth,
  updateProfile,
  getAllUsers,
  setLanguage,
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/users", protectRoute, getAllUsers);
router.put("/set-language", protectRoute, setLanguage);

// ✅ NEW: Get current logged-in user
router.get("/me", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
