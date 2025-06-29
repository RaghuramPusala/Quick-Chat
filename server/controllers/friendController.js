import User from "../models/User.js";

// Send Friend Request
export const sendFriendRequest = async (req, res) => {
  const { targetUserId } = req.body;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    return res.status(400).json({ message: "Cannot send request to yourself" });
  }

  const sender = await User.findById(currentUserId);
  const receiver = await User.findById(targetUserId);

  if (!receiver || !sender) {
    return res.status(404).json({ message: "User not found" });
  }

  if (
    receiver.friendRequests.includes(currentUserId) ||
    receiver.friends.includes(currentUserId)
  ) {
    return res.status(400).json({ message: "Already requested or already friends" });
  }

  receiver.friendRequests.push(currentUserId);
  sender.sentRequests.push(targetUserId);

  await receiver.save();
  await sender.save();

  res.json({ success: true, message: "Request sent" });
};

// Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
  const { fromUserId } = req.body;
  const toUserId = req.user._id;

  const user = await User.findById(toUserId);
  const fromUser = await User.findById(fromUserId);

  if (!user || !fromUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.friendRequests.includes(fromUserId)) {
    return res.status(400).json({ message: "No request from this user" });
  }

  user.friendRequests = user.friendRequests.filter(id => id.toString() !== fromUserId);
  fromUser.sentRequests = fromUser.sentRequests.filter(id => id.toString() !== toUserId.toString());

  user.friends.push(fromUserId);
  fromUser.friends.push(toUserId);

  await user.save();
  await fromUser.save();

  res.json({ success: true, message: "Friend request accepted" });
};

// Cancel/Reject Friend Request
export const cancelFriendRequest = async (req, res) => {
  const { otherUserId } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const otherUser = await User.findById(otherUserId);

  if (!user || !otherUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // Remove from both sides
  user.friendRequests = user.friendRequests.filter(id => id.toString() !== otherUserId);
  user.sentRequests = user.sentRequests.filter(id => id.toString() !== otherUserId);
  otherUser.friendRequests = otherUser.friendRequests.filter(id => id.toString() !== userId.toString());
  otherUser.sentRequests = otherUser.sentRequests.filter(id => id.toString() !== userId.toString());

  await user.save();
  await otherUser.save();

  res.json({ success: true, message: "Friend request canceled/rejected" });
};

// Get All Friends
export const getFriends = async (req, res) => {
  const user = await User.findById(req.user._id).populate("friends", "-password");
  res.json({ success: true, friends: user.friends });
};
