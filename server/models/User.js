const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  themeColor: { type: String, default: 'blue' },
  websiteUrl: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profileViews: [{
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, default: Date.now }
  }],
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  coins: { type: Number, default: 100, min: 0 },
  coinsReceived: { type: Number, default: 0, min: 0 },
  subscriptionPrice: { type: Number, default: 0, min: 0 },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);