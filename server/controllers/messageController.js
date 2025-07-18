import axios from "axios";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// ✅ Helper: Translate message if needed
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

// ✅ 1. Get friends + unseen message counts
const getChatUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate("friends", "-password");

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const unseenMessages = {};
    await Promise.all(
      currentUser.friends.map(async (friend) => {
        const unseen = await Message.countDocuments({
          senderId: friend._id,
          receiverId: currentUser._id,
          seen: false,
        });
        if (unseen > 0) unseenMessages[friend._id] = unseen;
      })
    );

    console.log("📦 Returning friends:", currentUser.friends.map(f => `${f.username || f.fullName} (${f._id})`));

    return res.json({
      success: true,
      users: currentUser.friends,
      unseenMessages,
    });
  } catch (err) {
    console.error("Get Chat Users Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (!receiverId || receiverId === senderId.toString()) {
      return res.status(400).json({ success: false, message: "Invalid user IDs" });
    }

    let imageUrl = null;
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

    // ✅ Emit to both sender and receiver
    const io = req.app.get("io");
    const userSocketMap = global.userSocketMap;

    const receiverSocketId = userSocketMap?.[receiverId];
    const senderSocketId = userSocketMap?.[senderId];

    console.log("📨 SENDING MESSAGE:");
    console.log("senderId:", senderId);
    console.log("receiverId:", receiverId);
    console.log("userSocketMap:", userSocketMap);
    console.log("receiverSocketId:", receiverSocketId);
    console.log("senderSocketId:", senderSocketId);

    if (receiverSocketId) {
      console.log("📤 Emitting to receiver...");
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      console.warn("❌ Receiver is not connected via socket.");
    }

    if (senderSocketId) {
      console.log("📤 Emitting to sender...");
      io.to(senderSocketId).emit("newMessage", newMessage);
    } else {
      console.warn("❌ Sender is not connected via socket.");
    }

    res.json({ success: true, newMessage });
  } catch (err) {
    console.error("Send Message Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 3. Get all messages between two users
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
  } catch (err) {
    console.error("Get Messages Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 4. Mark a message as seen (by ID)
const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Mark Seen Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  getChatUsers,
  sendMessage,
  getMessages,
  markMessageAsSeen,
  translateMessage,
};
