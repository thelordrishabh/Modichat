const router = require('express').Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
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
      if (userToFollow.blockedUsers.some((blockedId) => String(blockedId) === req.user.id)) {
        return res.status(403).json({ message: 'You are blocked by this user' });
      }

      if (userToFollow.isPrivate) {
        await Promise.all([
          userToFollow.updateOne({ $addToSet: { followRequests: req.user.id } }),
          Notification.create({
            recipient: userToFollow._id,
            sender: currentUser._id,
            type: 'follow_request',
            message: `${currentUser.name} requested to follow you`
          })
        ]);

        const updatedTargetUser = await User.findById(req.params.id).select('-password');
        return res.json({
          requested: true,
          following: false,
          profileUser: toPublicUser(req, updatedTargetUser),
          currentUser: toPublicUser(req, currentUser)
        });
      }

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

router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.json([]);
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('name username avatar profilePicture isVerified');
    res.json(users.map((user) => toPublicUser(req, user)));
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
    const nextEmail = req.body.email?.trim().toLowerCase();
    const nextPassword = req.body.password;
    const nextWebsiteUrl = req.body.websiteUrl?.trim();
    const nextThemeColor = req.body.themeColor?.trim();
    const removeAvatar = req.body.removeAvatar === 'true';

    if (nextName) {
      user.name = nextName;
    }

    if (typeof nextBio === 'string') {
      user.bio = nextBio;
    }

    if (typeof nextWebsiteUrl === 'string') {
      user.websiteUrl = nextWebsiteUrl;
    }

    if (typeof nextThemeColor === 'string') {
      user.themeColor = nextThemeColor;
    }

    if (typeof req.body.isPrivate !== 'undefined') {
      user.isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;
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

    if (typeof nextEmail === 'string' && nextEmail) {
      user.email = nextEmail;
    }

    if (typeof nextPassword === 'string' && nextPassword.trim()) {
      user.password = await bcrypt.hash(nextPassword.trim(), 10);
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

router.get('/profile-views', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('profileViews.viewer', 'name username avatar profilePicture isVerified')
      .select('profileViews');

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekViews = user.profileViews.filter((entry) => new Date(entry.viewedAt) >= weekAgo);
    res.json({
      weekCount: weekViews.length,
      viewers: user.profileViews.slice(0, 20)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a user
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let query = User.findById(req.params.id).select('-password');

    if (req.user && String(req.user.id) === String(req.params.id)) {
      query = query.populate({
        path: 'savedPosts',
        populate: [
          { path: 'userId', select: 'name username avatar profilePicture' },
          {
            path: 'comments',
            options: { sort: { createdAt: -1 } },
            populate: { path: 'userId', select: 'name username avatar profilePicture' }
          }
        ]
      });
    }

    const user = await query;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toPublicUser(req, user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/view', optionalAuth, async (req, res) => {
  try {
    if (req.user && req.params.id === req.user.id) {
      return res.json({ message: 'Own profile view ignored' });
    }

    const profileUser = await User.findById(req.params.id);
    if (!profileUser) return res.status(404).json({ message: 'User not found' });

    if (req.user) {
      profileUser.profileViews = (profileUser.profileViews || []).filter(
        (view) => String(view.viewer) !== req.user.id
      );
      profileUser.profileViews.unshift({ viewer: req.user.id, viewedAt: new Date() });
    } else {
      const isGuest = req.body.isGuest === true || req.body.isGuest === 'true';
      if (!isGuest) {
        return res.status(400).json({ message: 'Guest view requires guest information' });
      }

      const guestName = req.body.guestName?.trim() || null;
      const guestInstagram = req.body.guestInstagram?.trim() || null;

      profileUser.profileViews.unshift({
        viewer: null,
        guestName,
        guestInstagram,
        isGuest: true,
        viewedAt: new Date()
      });
    }

    profileUser.profileViews = (profileUser.profileViews || []).slice(0, 100);
    await profileUser.save();
    res.json({ message: 'Profile view tracked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/profile-views', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('profileViews.viewer', 'name username avatar profilePicture isVerified')
      .select('profileViews');

    const sortedViews = (user.profileViews || [])
      .slice()
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 50);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekCount = (user.profileViews || []).filter((entry) => new Date(entry.viewedAt) >= weekAgo).length;

    res.json({
      weekCount,
      viewers: sortedViews
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/block', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot block yourself' });
    const [currentUser, targetUser] = await Promise.all([User.findById(req.user.id), User.findById(req.params.id)]);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    currentUser.blockedUsers = [...new Set([...(currentUser.blockedUsers || []), targetUser._id])];
    currentUser.following = currentUser.following.filter((id) => String(id) !== String(targetUser._id));
    currentUser.followers = currentUser.followers.filter((id) => String(id) !== String(targetUser._id));
    targetUser.following = targetUser.following.filter((id) => String(id) !== req.user.id);
    targetUser.followers = targetUser.followers.filter((id) => String(id) !== req.user.id);
    await Promise.all([currentUser.save(), targetUser.save()]);
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/unblock', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.blockedUsers = user.blockedUsers.filter((id) => String(id) !== req.params.id);
    await user.save();
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/accept-request', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (String(currentUser._id) !== String(req.params.id)) return res.status(403).json({ message: 'Unauthorized' });
    const requesterId = req.body.requesterId;
    const requester = await User.findById(requesterId);
    if (!requester) return res.status(404).json({ message: 'Requester not found' });

    currentUser.followRequests = currentUser.followRequests.filter((id) => String(id) !== String(requesterId));
    currentUser.followers = [...new Set([...(currentUser.followers || []), requesterId])];
    requester.following = [...new Set([...(requester.following || []), req.params.id])];
    await Promise.all([currentUser.save(), requester.save()]);
    res.json({ message: 'Request accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/reject-request', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (String(currentUser._id) !== String(req.params.id)) return res.status(403).json({ message: 'Unauthorized' });
    currentUser.followRequests = currentUser.followRequests.filter((id) => String(id) !== String(req.body.requesterId));
    await currentUser.save();
    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/verify', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin?.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isVerified: req.body.isVerified !== false } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublicUser(req, user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/subscribe', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    const [subscriber, creator] = await Promise.all([User.findById(req.user.id), User.findById(req.params.id)]);
    if (!subscriber || !creator) return res.status(404).json({ message: 'User not found' });

    if (!creator.subscriptionPrice || creator.subscriptionPrice <= 0) {
      return res.status(400).json({ message: 'Creator has no subscription enabled' });
    }
    if (subscriber.coins < creator.subscriptionPrice) {
      return res.status(400).json({ message: 'Not enough coins' });
    }

    subscriber.coins -= creator.subscriptionPrice;
    creator.coins += creator.subscriptionPrice;
    creator.subscribers = [...new Set([...(creator.subscribers || []), req.user.id])];
    await Promise.all([subscriber.save(), creator.save()]);
    res.json({ message: 'Subscribed successfully', remainingCoins: subscriber.coins });
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

    const currentUser = await User.findById(req.user.id).select('blockedUsers');
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ],
      _id: { $nin: currentUser?.blockedUsers || [] }
    }).select('name username avatar profilePicture bio followers following isVerified isPrivate');
    res.json(users.map((user) => toPublicUser(req, user)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow / Unfollow a user
router.put('/:id/follow', auth, toggleFollow);
router.post('/:id/follow', auth, toggleFollow);

module.exports = router;
