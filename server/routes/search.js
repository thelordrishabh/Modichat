const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { normalizePost } = require('../utils/assets');
const { toPublicUser } = require('../utils/users');

const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', auth, async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) {
      return res.json({ users: [], posts: [] });
    }

    const regex = new RegExp(escapeRegex(query), 'i');

    const currentUser = await User.findById(req.user.id).select('blockedUsers');
    const [users, posts] = await Promise.all([
      User.find({
        $or: [
          { name: regex },
          { username: regex }
        ],
        _id: { $nin: currentUser?.blockedUsers || [] }
      })
        .select('name username avatar profilePicture bio followers following')
        .limit(10),
      Post.find({ caption: regex })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate([
          { path: 'userId', select: 'name username avatar profilePicture' },
          {
            path: 'comments',
            options: { sort: { createdAt: -1 } },
            populate: { path: 'userId', select: 'name username avatar profilePicture' }
          }
        ])
    ]);

    res.json({
      users: users.map((user) => toPublicUser(req, user)),
      posts: posts.map((post) => normalizePost(req, post))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
