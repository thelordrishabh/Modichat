const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Story = require('../models/Story');
const User = require('../models/User');
const { uploadImage, uploadVideo } = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Story media is required' });
    }

    const mediaType = req.body.mediaType === 'video' ? 'video' : 'image';
    const mediaUrl = mediaType === 'video'
      ? await uploadVideo(req.file, { folder: 'modichat/stories' })
      : await uploadImage(req.file, { folder: 'modichat/stories' });

    const story = await Story.create({
      author: req.user.id,
      mediaUrl,
      mediaType,
      musicTrack: {
        title: req.body.musicTitle || '',
        artist: req.body.musicArtist || '',
        previewUrl: req.body.musicPreviewUrl || ''
      }
    });

    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('following blockedUsers');
    const authorIds = [req.user.id, ...(currentUser?.following || [])];
    const blockedIds = currentUser?.blockedUsers || [];

    const stories = await Story.find({ 
      author: { $in: authorIds, $nin: blockedIds } 
    })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar profilePicture isVerified')
      .populate('viewers', 'name username avatar profilePicture');

    stories.sort((a, b) => {
      if (String(a.author?._id) === req.user.id) return -1;
      if (String(b.author?._id) === req.user.id) return 1;
      return 0;
    });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/view', auth, async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { viewers: req.user.id } },
      { new: true }
    ).populate('viewers', 'name username avatar profilePicture');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
