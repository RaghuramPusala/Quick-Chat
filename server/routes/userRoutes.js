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

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/users", protectRoute, getAllUsers);
router.put("/set-language", protectRoute, setLanguage); // ✅ fixed

export default router;