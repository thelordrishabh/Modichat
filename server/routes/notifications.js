const router = require('express').Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { normalizeNotification } = require('../utils/assets');

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate('sender', 'name username avatar profilePicture')
      .populate({
        path: 'post',
        select: 'caption imageUrl userId',
        populate: {
          path: 'userId',
          select: 'name username avatar profilePicture'
        }
      });

    res.json(notifications.map((notification) => normalizeNotification(req, notification)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
