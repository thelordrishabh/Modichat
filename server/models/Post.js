const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caption: { type: String, default: "" },
  imageUrl: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  videoDuration: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['heart', 'laugh', 'wow', 'sad', 'angry', 'clap'], required: true }
  }],
  poll: {
    question: { type: String, default: '' },
    options: [{
      text: { type: String, required: true },
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
  },
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  repostCount: { type: Number, default: 0 },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hideLikes: { type: Boolean, default: false },
  filter: { type: String, default: 'normal' },
  collaborator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  collabStatus: { type: String, enum: ['none', 'pending', 'accepted', 'rejected'], default: 'none' },
  isExclusive: { type: Boolean, default: false },
  isPromoted: { type: Boolean, default: false },
  promotedUntil: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId'
});

module.exports = mongoose.model('Post', PostSchema);
