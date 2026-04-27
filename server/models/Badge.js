const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  giver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  level: { type: String, enum: ['bronze', 'silver', 'gold'], required: true },
  livestream: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Badge', BadgeSchema);
