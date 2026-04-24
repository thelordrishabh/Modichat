const router = require('express').Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// New conversation
router.post('/conversation', auth, async (req, res) => {
  try {
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      members: { $all: [req.user.id, req.body.receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [req.user.id, req.body.receiverId]
      });
      await conversation.save();
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user conversations
router.get('/conversation', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user.id] }
    }).populate('members', 'name username avatar profilePicture');
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  const newMessage = new Message({
    conversationId: req.body.conversationId,
    senderId: req.user.id,
    text: req.body.text
  });
  try {
    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages of a conversation
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).populate('senderId', 'name username avatar profilePicture');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
