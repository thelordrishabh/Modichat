const router = require('express').Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadAudio } = require('../utils/cloudinary');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

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

// Conversations with last message/unread count
router.get('/conversations', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('blockedUsers');
    const blockedIds = currentUser?.blockedUsers || [];

    const conversations = await Conversation.find({
      members: { $in: [req.user.id] }
    }).populate('members', 'name username avatar profilePicture');

    // Filter out conversations with blocked users
    const filteredConversations = conversations.filter(conv => 
      !conv.members.some(member => String(member._id) !== req.user.id && blockedIds.includes(member._id))
    );

    const conversationSummaries = await Promise.all(
      filteredConversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 }),
          Message.countDocuments({
            conversationId: conversation._id,
            senderId: { $ne: req.user.id },
            seen: false
          })
        ]);

        return {
          ...conversation.toObject(),
          lastMessage,
          unreadCount
        };
      })
    );

    res.json(conversationSummaries);
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

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId).select('_id');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [req.user.id, req.params.userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user.id, req.params.userId]
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id
    }).populate('senderId', 'name username avatar profilePicture');

    await Message.updateMany(
      { conversationId: conversation._id, senderId: { $ne: req.user.id }, seen: false },
      { $set: { seen: true } }
    );

    res.json({ conversationId: conversation._id, messages });
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
    const populatedMessage = await Message.findById(savedMessage._id).populate('senderId', 'name username avatar profilePicture');
    res.json(populatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send direct message by user
router.post('/user/:userId', auth, upload.single('audio'), async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      members: { $all: [req.user.id, req.params.userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user.id, req.params.userId]
      });
    }

    const messageType = req.file ? 'voice' : (req.body.messageType || 'text');
    const audioUrl = req.file ? await uploadAudio(req.file, { folder: 'modichat/voices' }) : '';
    const text = req.body.text?.trim() || '';

    if (messageType === 'text' && !text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      recipientId: req.params.userId,
      text,
      messageType,
      audioUrl,
      delivered: true
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name username avatar profilePicture');

    if (req.app.get('io')) {
      req.app.get('io').to(`user:${req.params.userId}`).emit('dm:new', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages of a conversation
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).populate('senderId', 'name username avatar profilePicture');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
