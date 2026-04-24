const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

let lastDbError = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const uri = 'mongodb+srv://thelordrishabh:8uNkCQmkQTYp2ysH@cluster0.s57qasv.mongodb.net/social-app?retryWrites=true&w=majority';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected');
    lastDbError = null;
  } catch (err) {
    lastDbError = err.message;
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbState: mongoose.connection.readyState,
    dbStatus: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    dbError: lastDbError,
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriPrefix: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 15) : 'none',
      nodeEnv: process.env.NODE_ENV
    } 
  });
});

// Initial connection attempt
connectDB();

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

// Serve static assets ONLY in local production mode (not on Vercel)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const _dirname = path.resolve();
  app.use(express.static(path.join(_dirname, '../client/dist')));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.resolve(_dirname, '../client/dist', 'index.html'));
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));

module.exports = app;