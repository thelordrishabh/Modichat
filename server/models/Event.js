const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['going', 'interested', 'not_going'], required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
