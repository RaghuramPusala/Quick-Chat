import axios from "axios";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// ✅ Translate helper (optional for reuse)
const translateMessage = async (text, sourceLang, targetLang) => {
  if (!text || sourceLang === targetLang) return text;
  try {
    const res = await axios.post("http://localhost:8080/translate", {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    });
    return res.data.translatedText;
  } catch (err) {
    console.error("Translation failed:", err?.response?.data || err.message);
    return text;
  }
};

// ✅ Get list of chat friends (used in ChatContext)
const getChatUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate("friends", "-password");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ users: currentUser.friends, unseenMessages: {} });
  } catch (err) {
    console.error("Get Chat Users Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Send message (text and optional image)
const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (!receiverId || !senderId || receiverId === senderId.toString()) {
      return res.status(400).json({ success: false, message: "Invalid user IDs" });
    }

    let imageUrl;
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log("Send Message Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all messages between two users
const getMessages = async (req, res) => {
  try {
    const selectedUserId = req.params.id;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log("Get Messages Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Mark a single message as seen
const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log("Mark Seen Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all users except self with unseen message counts (sidebar list)
const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find({ _id: { $ne: userId } }).select("-password");

    const unseenMessages = {};
    await Promise.all(
      users.map(async (user) => {
        const unseen = await Message.countDocuments({
          senderId: user._id,
          receiverId: userId,
          seen: false,
        });
        if (unseen > 0) unseenMessages[user._id] = unseen;
      })
    );

    res.json({ success: true, users, unseenMessages });
  } catch (error) {
    console.log("Get Users Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Exports
export {
  getChatUsers,
  sendMessage,
  getMessages,
  markMessageAsSeen,
  getUsersForSidebar,
};
