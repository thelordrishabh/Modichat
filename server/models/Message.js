const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, default: '' },
  messageType: { type: String, enum: ['text', 'voice'], default: 'text' },
  audioUrl: { type: String, default: '' },
  seen: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
