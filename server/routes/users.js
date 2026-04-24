const router = require('express').Router();
const multer = require('multer');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { toPublicUser, ensureUniqueUsername, normalizeUsername } = require('../utils/users');
const { uploadImage } = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

const runAvatarUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

const toggleFollow = async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({ message: "You can't follow yourself" });
  }

  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = userToFollow.followers.some((followerId) => String(followerId) === req.user.id);

    if (!isFollowing) {
      await Promise.all([
        userToFollow.updateOne({ $addToSet: { followers: req.user.id } }),
        currentUser.updateOne({ $addToSet: { following: req.params.id } }),
        Notification.findOneAndUpdate(
          {
            recipient: userToFollow._id,
            sender: currentUser._id,
            type: 'follow'
          },
          {
            recipient: userToFollow._id,
            sender: currentUser._id,
            type: 'follow',
            read: false,
            post: null
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        )
      ]);
    } else {
      await Promise.all([
        userToFollow.updateOne({ $pull: { followers: req.user.id } }),
        currentUser.updateOne({ $pull: { following: req.params.id } }),
        Notification.deleteOne({
          recipient: userToFollow._id,
          sender: currentUser._id,
          type: 'follow'
        })
      ]);
    }

    const [updatedTargetUser, updatedCurrentUser] = await Promise.all([
      User.findById(req.params.id).select('-password'),
      User.findById(req.user.id).select('-password')
    ]);

    res.json({
      following: !isFollowing,
      profileUser: toPublicUser(req, updatedTargetUser),
      currentUser: toPublicUser(req, updatedCurrentUser)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toPublicUserList = (req, users = []) => users.map((user) => toPublicUser(req, user));

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(toPublicUser(req, user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    await runAvatarUpload(req, res);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextName = req.body.name?.trim();
    const nextBio = req.body.bio?.trim();
    const nextUsernameInput = req.body.username?.trim();
    const removeAvatar = req.body.removeAvatar === 'true';

    if (nextName) {
      user.name = nextName;
    }

    if (typeof nextBio === 'string') {
      user.bio = nextBio;
    }

    if (typeof nextUsernameInput === 'string') {
      if (!normalizeUsername(nextUsernameInput)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
      }

      user.username = await ensureUniqueUsername({
        User,
        desiredUsername: nextUsernameInput,
        fallbackValue: user.name,
        excludeUserId: user._id
      });
    }

    if (removeAvatar) {
      user.avatar = '';
      user.profilePicture = '';
    }

    if (req.file) {
      const avatarUrl = await uploadImage(req.file, { folder: 'modichat/avatars' });
      user.avatar = avatarUrl;
      user.profilePicture = avatarUrl;
    }

    await user.save();

    res.json(toPublicUser(req, user));
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Avatar must be 3MB or smaller' });
    }

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'followers',
      select: 'name username avatar profilePicture bio followers following'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toPublicUserList(req, user.followers));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'following',
      select: 'name username avatar profilePicture bio followers following'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toPublicUserList(req, user.following));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(toPublicUser(req, user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search users
router.get('/', auth, async (req, res) => {
  const query = req.query.q?.trim();
  try {
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    }).select('name username avatar profilePicture bio followers following');
    res.json(users.map((user) => toPublicUser(req, user)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow / Unfollow a user
router.put('/:id/follow', auth, toggleFollow);
router.post('/:id/follow', auth, toggleFollow);

module.exports = router;
