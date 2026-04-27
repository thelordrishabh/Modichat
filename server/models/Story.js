const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  live: { type: Boolean, default: false },
  musicTrack: {
    title: { type: String, default: '' },
    artist: { type: String, default: '' },
    previewUrl: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);
