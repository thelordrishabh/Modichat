const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const { uploadImage } = require('../utils/cloudinary');
const { ensureUniqueUsername, normalizeUsername, toPublicUser } = require('../utils/users');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

const runAvatarUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    await runAvatarUpload(req, res);

    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const requestedUsername = req.body.username?.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (requestedUsername && !normalizeUsername(requestedUsername)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const username = await ensureUniqueUsername({
      User,
      desiredUsername: requestedUsername,
      fallbackValue: `${name}_${email.split('@')[0]}`
    });
    const hashed = await bcrypt.hash(password, 10);
    const avatarUrl = await uploadImage(req.file, { folder: 'modichat/avatars' });
    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
      avatar: avatarUrl,
      profilePicture: avatarUrl
    });
    const token = signToken(user._id);

    res.status(201).json({ token, user: toPublicUser(req, user) });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Avatar must be 3MB or smaller' });
    }

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    const token = signToken(user._id);

    res.json({ token, user: toPublicUser(req, user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
