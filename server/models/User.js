// /models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true }, // ✅ Added
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    bio: { type: String },
    language: { type: String, default: 'en' },
    countryCode: { type: String }, // optional auto-set from language

    profilePic: {
      type: String,
      default: "", // e.g., "https://res.cloudinary.com/yourcloud/image/upload/v123456/profile.jpg"
    },

    // ✅ Friend system fields
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ✅ Optional social field
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
