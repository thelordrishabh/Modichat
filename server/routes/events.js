const router = require('express').Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

router.post('/', auth, async (req, res) => {
  try {
    const event = await Event.create({
      creator: req.user.id,
      title: req.body.title,
      date: req.body.date,
      location: req.body.location || '',
      description: req.body.description || '',
      coverImage: req.body.coverImage || ''
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('following');
    const events = await Event.find({ creator: { $in: [req.user.id, ...(currentUser?.following || [])] } })
      .sort({ date: 1 })
      .populate('creator', 'name username avatar profilePicture isVerified');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/rsvp', auth, async (req, res) => {
  try {
    const status = req.body.status;
    if (!['going', 'interested', 'not_going'].includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.attendees = event.attendees.filter((entry) => String(entry.user) !== req.user.id);
    event.attendees.push({ user: req.user.id, status });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.creator) !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    ['title', 'date', 'location', 'description', 'coverImage'].forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.creator) !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
