const router = require('express').Router();
const Post = require('../models/Post');
const { normalizePost } = require('../utils/assets');

router.get('/trending', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tags = await Post.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(tags.map((tag) => ({ tag: tag._id, count: tag.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:tag', async (req, res) => {
  try {
    const normalizedTag = req.params.tag.toLowerCase();
    const posts = await Post.find({ hashtags: normalizedTag })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username avatar profilePicture isVerified');
    res.json(posts.map((post) => normalizePost(req, post)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
