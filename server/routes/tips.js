const router = require('express').Router();
const auth = require('../middleware/auth');
const Tip = require('../models/Tip');
const User = require('../models/User');
const Notification = require('../models/Notification');

router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, amount, post } = req.body;
    const tipAmount = Number(amount);
    if (![5, 10, 25, 50, 100].includes(tipAmount)) {
      return res.status(400).json({ message: 'Invalid tip amount' });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(req.user.id),
      User.findById(recipientId)
    ]);
    if (!sender || !recipient) return res.status(404).json({ message: 'User not found' });
    if (sender.coins < tipAmount) return res.status(400).json({ message: 'Not enough coins' });

    sender.coins -= tipAmount;
    recipient.coins = (recipient.coins || 0) + tipAmount;
    recipient.coinsReceived = (recipient.coinsReceived || 0) + tipAmount;

    await Promise.all([
      sender.save(),
      recipient.save(),
      Tip.create({
        sender: req.user.id,
        recipient: recipientId,
        amount: tipAmount,
        post: post || null
      }),
      Notification.create({
        recipient: recipientId,
        sender: req.user.id,
        type: 'tip',
        post: post || null,
        message: `${sender.name} tipped you ${tipAmount} coins`
      })
    ]);

    res.status(201).json({ message: 'Tip sent', remainingCoins: sender.coins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
