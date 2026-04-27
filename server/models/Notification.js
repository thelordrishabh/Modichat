const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'like',
      'comment',
      'follow',
      'mention',
      'collab',
      'tip',
      'badge',
      'live',
      'follow_request'
    ],
    required: true
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  message: { type: String, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
