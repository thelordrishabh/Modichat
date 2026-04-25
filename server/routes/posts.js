const router = require('express').Router();
const multer = require('multer');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { normalizeComment, normalizePost } = require('../utils/assets');
const { uploadImage } = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const runImageUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

const postPopulate = [
  { path: 'userId', select: 'name username avatar profilePicture' },
  {
    path: 'comments',
    options: { sort: { createdAt: -1 } },
    populate: { path: 'userId', select: 'name username avatar profilePicture' }
  }
];

const findPostById = (postId) =>
  Post.findById(postId).populate(postPopulate);

const getSavedPostIds = async (userId) => {
  const currentUser = await User.findById(userId).select('savedPosts');
  return currentUser?.savedPosts.map((id) => String(id)) || [];
};

const createLikeNotification = async (post, senderId) => {
  if (String(post.userId) === String(senderId)) return;

  await Notification.findOneAndUpdate(
    {
      recipient: post.userId,
      sender: senderId,
      type: 'like',
      post: post._id
    },
    {
      recipient: post.userId,
      sender: senderId,
      type: 'like',
      post: post._id,
      read: false
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

const deleteLikeNotification = async (postId, postOwnerId, senderId) => {
  await Notification.deleteOne({
    recipient: postOwnerId,
    sender: senderId,
    type: 'like',
    post: postId
  });
};

const createCommentNotification = async (post, senderId) => {
  if (String(post.userId) === String(senderId)) return;

  await Notification.create({
    recipient: post.userId,
    sender: senderId,
    type: 'comment',
    post: post._id
  });
};

const createCommentHandler = async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      postId: req.params.id,
      userId: req.user.id,
      text
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name username avatar profilePicture');

    await createCommentNotification(post, req.user.id);

    res.status(201).json(normalizeComment(req, populatedComment));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.post('/', auth, async (req, res) => {
  try {
    await runImageUpload(req, res);

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const imageUrl = await uploadImage(req.file, { folder: 'modichat/posts' });
    const post = await Post.create({
      userId: req.user.id,
      caption: req.body.caption?.trim() || '',
      imageUrl
    });
    const populatedPost = await findPostById(post._id);
    const savedPostIds = await getSavedPostIds(req.user.id);
    const normalized = normalizePost(req, populatedPost);
    normalized.saved = savedPostIds.includes(String(populatedPost._id));

    res.status(201).json(normalized);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image must be 5MB or smaller' });
    }

    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1)
      .populate(postPopulate);

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    const savedPostIds = await getSavedPostIds(req.user.id);

    res.set('X-Has-More', hasMore ? 'true' : 'false');
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.json(
      sliced.map((post) => {
        const normalized = normalizePost(req, post);
        normalized.saved = savedPostIds.includes(String(post._id));
        return normalized;
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const currentUser = await User.findById(req.user.id).select('_id following');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authorIds = [currentUser._id, ...currentUser.following];
    const posts = await Post.find({ userId: { $in: authorIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1)
      .populate(postPopulate);

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    const savedPostIds = await getSavedPostIds(req.user.id);

    res.set('X-Has-More', hasMore ? 'true' : 'false');
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.json(
      sliced.map((post) => {
        const normalized = normalizePost(req, post);
        normalized.saved = savedPostIds.includes(String(post._id));
        return normalized;
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate(postPopulate);

    const savedPostIds = req.user ? await getSavedPostIds(req.user.id) : [];
    res.json(
      posts.map((post) => {
        const normalized = normalizePost(req, post);
        normalized.saved = savedPostIds.includes(String(post._id));
        return normalized;
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const hasLikedPost = post.likes.some((likeId) => String(likeId) === req.user.id);

    if (!hasLikedPost) {
      await Promise.all([
        post.updateOne({ $addToSet: { likes: req.user.id } }),
        createLikeNotification(post, req.user.id)
      ]);

      return res.json({
        liked: true,
        likesCount: post.likes.length + 1
      });
    }

    await Promise.all([
      post.updateOne({ $pull: { likes: req.user.id } }),
      deleteLikeNotification(post._id, post.userId, req.user.id)
    ]);

    res.json({
      liked: false,
      likesCount: Math.max(0, post.likes.length - 1)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comments', auth, createCommentHandler);
router.post('/:id/comment', auth, createCommentHandler);

router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('userId', 'name username avatar profilePicture')
      .sort({ createdAt: -1 });

    res.json(comments.map((comment) => normalizeComment(req, comment)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await findPostById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const savedPostIds = req.user ? await getSavedPostIds(req.user.id) : [];
    const normalized = normalizePost(req, post);
    normalized.saved = savedPostIds.includes(String(post._id));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/save', auth, async (req, res) => {
  try {
    const [post, user] = await Promise.all([
      Post.findById(req.params.id),
      User.findById(req.user.id)
    ]);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasSaved = user.savedPosts.some((savedId) => String(savedId) === String(req.params.id));

    if (!hasSaved) {
      await user.updateOne({ $addToSet: { savedPosts: req.params.id } });
    } else {
      await user.updateOne({ $pull: { savedPosts: req.params.id } });
    }

    res.json({ saved: !hasSaved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (String(post.userId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.caption = req.body.caption?.trim() || '';
    await post.save();

    const populatedPost = await findPostById(post._id);
    const savedPostIds = await getSavedPostIds(req.user.id);
    const normalized = normalizePost(req, populatedPost);
    normalized.saved = savedPostIds.includes(String(populatedPost._id));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (String(post.userId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Promise.all([
      Comment.deleteMany({ postId: post._id }),
      Notification.deleteMany({ post: post._id }),
      User.updateMany({ savedPosts: post._id }, { $pull: { savedPosts: post._id } }),
      post.deleteOne()
    ]);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
