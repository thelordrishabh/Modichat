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
  const distPath = path.join(__dirname, '../client/dist');
  res.json({ 
    status: 'ok', 
    dbState: mongoose.connection.readyState,
    dbStatus: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    dbError: lastDbError,
    debug: {
      __dirname,
      distPath,
      exists: require('fs').existsSync(path.join(distPath, 'index.html')),
      rootDirContents: require('fs').readdirSync(path.join(__dirname, '..')),
      clientDirContents: require('fs').existsSync(path.join(__dirname, '../client')) ? require('fs').readdirSync(path.join(__dirname, '../client')) : 'not found'
    },
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

// Serve static assets in production (Render)
if (!process.env.VERCEL) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));

module.exports = app;