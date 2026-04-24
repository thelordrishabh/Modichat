const router = require('express').Router();
const multer = require('multer');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
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

    res.status(201).json(normalizePost(req, populatedPost));
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image must be 5MB or smaller' });
    }

    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate(postPopulate);

    res.json(posts.map((post) => normalizePost(req, post)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('_id following');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authorIds = [currentUser._id, ...currentUser.following];
    const posts = await Post.find({ userId: { $in: authorIds } })
      .sort({ createdAt: -1 })
      .populate(postPopulate);

    res.json(posts.map((post) => normalizePost(req, post)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate(postPopulate);

    res.json(posts.map((post) => normalizePost(req, post)));
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

router.get('/:id/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('userId', 'name username avatar profilePicture')
      .sort({ createdAt: -1 });

    res.json(comments.map((comment) => normalizeComment(req, comment)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
