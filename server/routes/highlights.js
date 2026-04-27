const router = require('express').Router();
const auth = require('../middleware/auth');
const Highlight = require('../models/Highlight');
const Story = require('../models/Story');

router.post('/', auth, async (req, res) => {
  try {
    const highlight = await Highlight.create({
      author: req.user.id,
      title: req.body.title?.trim() || 'Highlights',
      coverImage: req.body.coverImage || '',
      stories: req.body.stories || []
    });
    res.status(201).json(highlight);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = req.query.userId ? { author: req.query.userId } : { author: req.user.id };
    const highlights = await Highlight.find(filter)
      .sort({ createdAt: -1 })
      .populate('stories');
    res.json(highlights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    if (String(highlight.author) !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (typeof req.body.title === 'string') highlight.title = req.body.title.trim();
    if (typeof req.body.coverImage === 'string') highlight.coverImage = req.body.coverImage;
    if (Array.isArray(req.body.stories)) {
      const validStories = await Story.find({ _id: { $in: req.body.stories } }).select('_id');
      highlight.stories = validStories.map((story) => story._id);
    }

    await highlight.save();
    res.json(highlight);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    if (String(highlight.author) !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    await highlight.deleteOne();
    res.json({ message: 'Highlight deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
