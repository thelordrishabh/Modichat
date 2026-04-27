const router = require('express').Router();
const auth = require('../middleware/auth');
const Badge = require('../models/Badge');
const User = require('../models/User');
const Notification = require('../models/Notification');

const COST_MAP = {
  bronze: 10,
  silver: 50,
  gold: 100
};

router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, level, livestream } = req.body;
    const cost = COST_MAP[level];
    if (!cost) {
      return res.status(400).json({ message: 'Invalid badge level' });
    }

    const [giver, recipient] = await Promise.all([
      User.findById(req.user.id),
      User.findById(recipientId)
    ]);

    if (!giver || !recipient) return res.status(404).json({ message: 'User not found' });
    if (giver.coins < cost) return res.status(400).json({ message: 'Not enough coins' });

    giver.coins -= cost;
    recipient.coinsReceived = (recipient.coinsReceived || 0) + cost;
    await Promise.all([
      giver.save(),
      recipient.save(),
      Badge.create({ giver: req.user.id, recipient: recipientId, level, livestream: livestream || '' }),
      Notification.create({
        recipient: recipientId,
        sender: req.user.id,
        type: 'badge',
        message: `${giver.name} sent you a ${level} badge`
      })
    ]);

    res.status(201).json({ message: 'Badge purchased', remainingCoins: giver.coins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
