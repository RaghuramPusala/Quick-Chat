import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authHandler = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authMiddleware error:", error.message);
    res.status(401).json({ success: false, message: "Unauthorized: " + error.message });
  }
};

// ✅ Export under both names for backward compatibility
export const authMiddleware = authHandler;
export const protectRoute = authHandler;
