const mongoose = require('mongoose');

const TipSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Tip', TipSchema);
