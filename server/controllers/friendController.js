import User from "../models/User.js";
import { userSocketMap, io } from "../server.js";

// ✅ Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.body;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const sender = await User.findById(currentUserId);
    const receiver = await User.findById(targetUserId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      receiver.friendRequests.includes(currentUserId) ||
      receiver.friends.includes(currentUserId)
    ) {
      return res.status(400).json({ message: "Request already sent or already friends" });
    }

    receiver.friendRequests.push(currentUserId);
    sender.sentRequests.push(targetUserId);

    await receiver.save();
    await sender.save();

    res.json({ success: true, message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Accept friend request + emit to both users
export const acceptFriendRequest = async (req, res) => {
  try {
    const toUserId = req.user._id;
    const { fromUserId } = req.body;

    const receiver = await User.findById(toUserId);
    const sender = await User.findById(fromUserId);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!receiver.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: "No request from this user" });
    }

    // Remove request
    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== fromUserId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== toUserId.toString());

    // Add to friends
    receiver.friends.push(fromUserId);
    sender.friends.push(toUserId);

    await receiver.save();
    await sender.save();

    // 🔥 Emit real-time updates to both users
    const senderSocketId = userSocketMap[fromUserId];
    const receiverSocketId = userSocketMap[toUserId];

    if (senderSocketId) {
      io.to(senderSocketId).emit("friend-accepted", { userId: toUserId });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friend-accepted", { userId: fromUserId });
    }

    res.json({ success: true, message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Cancel or Decline friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.body;

    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!user || !otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== otherUserId);
    user.sentRequests = user.sentRequests.filter(id => id.toString() !== otherUserId);

    otherUser.friendRequests = otherUser.friendRequests.filter(id => id.toString() !== userId.toString());
    otherUser.sentRequests = otherUser.sentRequests.filter(id => id.toString() !== userId.toString());

    await user.save();
    await otherUser.save();

    res.json({ success: true, message: "Friend request canceled or declined" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get list of friends
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "username fullName profilePic");
    res.json({ success: true, friends: user.friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get pending requests (received and sent)
export const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friendRequests", "username fullName profilePic")
      .populate("sentRequests", "username fullName profilePic");

    res.json({
      success: true,
      received: user.friendRequests,
      sent: user.sentRequests,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
