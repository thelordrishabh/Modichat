const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get a user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search users
router.get('/', auth, async (req, res) => {
  const query = req.query.q;
  try {
    const users = await User.find({
      name: { $regex: query, $options: 'i' }
    }).select('name profilePicture bio');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow / Unfollow a user
router.post('/:id/follow', auth, async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({ message: "You can't follow yourself" });
  }
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow.followers.includes(req.user.id)) {
      await userToFollow.updateOne({ $push: { followers: req.user.id } });
      await currentUser.updateOne({ $push: { following: req.params.id } });
      res.json({ message: "User has been followed" });
    } else {
      await userToFollow.updateOne({ $pull: { followers: req.user.id } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      res.json({ message: "User has been unfollowed" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
