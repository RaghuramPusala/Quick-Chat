import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

// ✅ Signup a new user
export const signup = async (req, res) => {
  const { fullName, username, email, password, bio, language } = req.body;

  try {
    if (!fullName || !username || !email || !password || !bio || !language) {
      return res.status(400).json({ success: false, message: "Missing Details" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already taken" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const languageToCountry = {
      en: "US", hi: "IN", fr: "FR", es: "ES", zh: "CN",
      ja: "JP", de: "DE", ru: "RU", ko: "KR", pt: "BR", it: "IT",
    };
    const country = languageToCountry[language] || "US";

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      bio,
      language,
      country,
    });

    const token = generateToken(newUser._id);

    res.json({
      success: true,
      userData: newUser,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(401).json({ success: false, message: "Wrong password or email" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Wrong password or email" });
    }

    const token = generateToken(userData._id);

    res.json({
      success: true,
      userData,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Check Auth
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// ✅ Update Profile (with real-time socket emit)
export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, profilePic } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic);
      user.profilePic = upload.secure_url;
      console.log("✅ Profile uploaded:", user.profilePic);
    }

    await user.save();

    // ✅ Emit real-time update to friends & followers
    const io = req.app.get("io");
    const userIdsToNotify = [...user.friends, ...user.followers];

    // 🔎 Debug emit targets
    console.log("friends:", user.friends);
    console.log("followers:", user.followers);
    console.log("🔁 Emitting profile-pic-updated to:", userIdsToNotify);

    userIdsToNotify.forEach((id) => {
      const socketId = global.userSocketMap[id];
      if (socketId) {
        io.to(socketId).emit("profile-pic-updated", {
          userId: user._id,
          profilePic: user.profilePic,
        });
      }
    });

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get all users except current
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Set Preferred Language + Country
export const setLanguage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ success: false, message: "Language is required" });
    }

    const languageToCountry = {
      en: "US", hi: "IN", fr: "FR", es: "ES", zh: "CN",
      ja: "JP", de: "DE", ru: "RU", ko: "KR", pt: "BR", it: "IT",
    };
    const country = languageToCountry[language] || "US";

    const user = await User.findByIdAndUpdate(
      userId,
      { language, country },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
