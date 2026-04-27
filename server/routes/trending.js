const router = require('express').Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [trendingPosts, trendingUsers] = await Promise.all([
      Post.aggregate([
        { $match: { createdAt: { $gte: dayAgo } } },
        {
          $addFields: {
            engagementScore: {
              $add: [{ $size: '$likes' }, { $size: '$comments' }]
            }
          }
        },
        { $sort: { engagementScore: -1 } },
        { $limit: 10 }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $addFields: { followersCount: { $size: '$followers' } } },
        { $sort: { followersCount: -1 } },
        { $limit: 10 },
        { $project: { password: 0 } }
      ])
    ]);

    res.json({ trendingPosts, trendingUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
