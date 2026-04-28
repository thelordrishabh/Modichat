const router = require('express').Router();
const multer = require('multer');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { normalizeComment, normalizePost } = require('../utils/assets');
const { uploadImage, uploadVideo } = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const runImageUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.fields([
      { name: 'media', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

const postPopulate = [
  { path: 'userId', select: 'name username avatar profilePicture isVerified' },
  {
    path: 'comments',
    options: { sort: { createdAt: -1 } },
    populate: { path: 'userId', select: 'name username avatar profilePicture isVerified' }
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

const extractHashtags = (caption = '') => {
  const matches = caption.match(/#([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
};

const extractMentionUsernames = (text = '') => {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((value) => value.slice(1).toLowerCase()))];
};

const createMentionNotifications = async (usernames, senderId, postId) => {
  if (!usernames.length) return;
  const users = await User.find({ username: { $in: usernames } }).select('_id');
  const receivers = users.filter((entry) => String(entry._id) !== String(senderId));
  if (!receivers.length) return;

  await Notification.insertMany(
    receivers.map((receiver) => ({
      recipient: receiver._id,
      sender: senderId,
      type: 'mention',
      post: postId,
      message: 'mentioned you in a post'
    }))
  );
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
    const mediaFile = req.files?.media?.[0] || req.files?.image?.[0];
    if (!mediaFile) {
      return res.status(400).json({ message: 'Media is required' });
    }

    const mediaType = req.body.mediaType === 'video' ? 'video' : 'image';
    const mediaUrl = mediaType === 'video'
      ? await uploadVideo(mediaFile, { folder: 'modichat/posts/videos' })
      : await uploadImage(mediaFile, { folder: 'modichat/posts/images' });
    const caption = req.body.caption?.trim() || '';
    const hashtags = extractHashtags(caption);
    const mentionUsernames = extractMentionUsernames(caption);

    let poll = undefined;
    if (req.body.pollQuestion) {
      const pollOptions = [
        req.body.pollOption1,
        req.body.pollOption2,
        req.body.pollOption3,
        req.body.pollOption4
      ].filter(Boolean).map((option) => ({ text: option.trim(), votes: [] }));
      if (pollOptions.length >= 2) {
        poll = { question: req.body.pollQuestion, options: pollOptions };
      }
    }

    const mediaDuration = Number(req.body.videoDuration || 0);
    const post = await Post.create({
      userId: req.user.id,
      originalAuthor: req.user.id,
      caption,
      imageUrl: mediaType === 'image' ? mediaUrl : '',
      mediaUrl,
      mediaType,
      videoDuration: mediaDuration,
      hashtags,
      poll,
      filter: req.body.filter || 'normal',
      hideLikes: req.body.hideLikes === 'true' || req.body.hideLikes === true,
      collaborator: req.body.collaboratorId || null,
      collabStatus: req.body.collaboratorId ? 'pending' : 'none',
      isExclusive: req.body.isExclusive === 'true' || req.body.isExclusive === true
    });
    await createMentionNotifications(mentionUsernames, req.user.id, post._id);
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

    const currentUser = await User.findById(req.user.id).select('_id following blockedUsers subscribers');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authorIds = [currentUser._id, ...currentUser.following];
    const now = new Date();
    const posts = await Post.find({
      $or: [
        { userId: { $in: authorIds } },
        { isPromoted: true, promotedUntil: { $gt: now }, userId: { $nin: authorIds } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1)
      .populate(postPopulate);

    const visiblePosts = posts.filter((post) =>
      !currentUser.blockedUsers.some((blockedId) => String(blockedId) === String(post.userId?._id || post.userId))
    );

    const hasMore = visiblePosts.length > limit;
    const sliced = hasMore ? visiblePosts.slice(0, limit) : visiblePosts;
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

router.get('/global', optionalAuth, async (req, res) => {
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
    const savedPostIds = req.user ? await getSavedPostIds(req.user.id) : [];

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
    const owner = await User.findById(req.params.userId).select('isPrivate followers blockedUsers');
    if (!owner) return res.status(404).json({ message: 'User not found' });
    if (req.user && owner.blockedUsers.some((id) => String(id) === req.user.id)) {
      return res.json([]);
    }
    if (owner.isPrivate && (!req.user || (String(owner._id) !== req.user.id && !owner.followers.some((id) => String(id) === req.user.id)))) {
      return res.status(403).json({ message: 'This account is private' });
    }

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

router.put('/:id/vote', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.poll?.options?.length) {
      return res.status(404).json({ message: 'Poll post not found' });
    }

    const optionIndex = Number(req.body.optionIndex);
    if (Number.isNaN(optionIndex) || !post.poll.options[optionIndex]) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    const alreadyVoted = post.poll.options.some((option) =>
      option.votes.some((voteUserId) => String(voteUserId) === req.user.id)
    );
    if (alreadyVoted) {
      return res.status(400).json({ message: 'Vote already submitted' });
    }

    post.poll.options[optionIndex].votes.push(req.user.id);
    await post.save();
    res.json(post.poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/react', auth, async (req, res) => {
  try {
    const type = req.body.type;
    if (!['heart', 'laugh', 'wow', 'sad', 'angry', 'clap'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.reactions = post.reactions.filter((reaction) => String(reaction.user) !== req.user.id);
    post.reactions.push({ user: req.user.id, type });
    await post.save();
    res.json({ reactions: post.reactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/repost', auth, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });

    const repost = await Post.create({
      userId: req.user.id,
      originalAuthor: originalPost.userId,
      caption: req.body.caption || originalPost.caption,
      imageUrl: originalPost.imageUrl,
      mediaUrl: originalPost.mediaUrl || originalPost.imageUrl,
      mediaType: originalPost.mediaType || 'image',
      originalPost: originalPost._id
    });

    originalPost.reposts = [...new Set([...(originalPost.reposts || []), req.user.id])];
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save();
    res.status(201).json(repost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/accept-collab', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.collaborator) !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    post.collabStatus = 'accepted';
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/promote', auth, async (req, res) => {
  try {
    const durationDays = Number(req.body.durationDays || 1);
    const costByDays = { 1: 50, 3: 100, 7: 200 };
    const coinsCost = costByDays[durationDays];
    if (!coinsCost) return res.status(400).json({ message: 'Invalid promotion duration' });

    const [post, user] = await Promise.all([Post.findById(req.params.id), User.findById(req.user.id)]);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (String(post.userId) !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    if (user.coins < coinsCost) return res.status(400).json({ message: 'Not enough coins' });

    user.coins -= coinsCost;
    post.isPromoted = true;
    post.promotedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await Promise.all([user.save(), post.save()]);
    res.json({ post, remainingCoins: user.coins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const [post, comment] = await Promise.all([
      Post.findById(req.params.postId),
      Comment.findById(req.params.commentId)
    ]);
    if (!post || !comment) return res.status(404).json({ message: 'Post or comment not found' });

    const isCommentAuthor = String(comment.userId) === req.user.id;
    const isPostOwner = String(post.userId) === req.user.id;
    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
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
    post.hashtags = extractHashtags(post.caption);
    if (req.body.hideLikes !== undefined) {
      post.hideLikes = req.body.hideLikes === true || req.body.hideLikes === 'true';
    }
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
