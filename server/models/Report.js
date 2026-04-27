const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: ['Spam', 'Harassment', 'Inappropriate content', 'Fake account', 'Other'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
