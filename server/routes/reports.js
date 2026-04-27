const router = require('express').Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');

router.post('/', auth, async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId and reason are required' });
    }

    await Report.create({
      reporter: req.user.id,
      targetType,
      targetId,
      reason
    });

    res.status(201).json({ message: 'Thanks for your report' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
