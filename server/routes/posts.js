const router = require('express').Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create a post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const newPost = new Post({
      userId: req.user.id,
      caption: req.body.caption,
      imageUrl
    });
    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get feed (posts from followings + own posts)
router.get('/feed', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.following.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    let allPosts = userPosts.concat(...friendPosts).sort((p1, p2) => {
      return new Date(p2.createdAt) - new Date(p1.createdAt);
    });
    
    // Populate user details for each post
    allPosts = await Post.populate(allPosts, { path: 'userId', select: 'name profilePicture' });
    res.json(allPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's posts (for profile)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).populate('userId', 'name profilePicture').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like / Dislike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.user.id)) {
      await post.updateOne({ $push: { likes: req.user.id } });
      res.json({ message: "The post has been liked" });
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } });
      res.json({ message: "The post has been unliked" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Comment on a post
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const comment = new Comment({
      postId: req.params.id,
      userId: req.user.id,
      text: req.body.text
    });
    const savedComment = await comment.save();
    res.json(savedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get comments for a post
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id }).populate('userId', 'name profilePicture').sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
