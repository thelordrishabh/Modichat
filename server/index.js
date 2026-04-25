require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const postRoutes = require('./routes/posts');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

const app = express();
const isVercel = Boolean(process.env.VERCEL);
const bundledUploadsDir = path.join(__dirname, 'uploads');
const runtimeUploadsDir = isVercel ? path.join('/tmp', 'uploads') : bundledUploadsDir;

fs.mkdirSync(runtimeUploadsDir, { recursive: true });

app.use(cors({ 
  origin: '*',
  exposedHeaders: ['X-Has-More']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let lastDbError = null;
let hasLoggedMissingMongoUri = false;
let dbConnectPromise = null;
let memoryServer = null;

const startMemoryServer = async () => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }
  return memoryServer.getUri();
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (dbConnectPromise) {
    await dbConnectPromise;
    return;
  }

  dbConnectPromise = (async () => {
    let uri = process.env.MONGO_URI;
    let usingFallback = false;
    let fallbackReason = '';

    if (!uri) {
      usingFallback = true;
      fallbackReason = 'MONGO_URI is not set';
    }

    if (!usingFallback) {
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log('✅ MongoDB connected');
        lastDbError = null;
        return;
      } catch (err) {
        lastDbError = err.message;
        usingFallback = true;
        fallbackReason = err.message;
        console.warn(`⚠️ MongoDB connection failed, falling back to in-memory MongoDB: ${err.message}`);
      }
    }

    if (usingFallback) {
      if (!hasLoggedMissingMongoUri) {
        console.warn(`⚠️ ${fallbackReason}. Starting in-memory MongoDB for local development.`);
        hasLoggedMissingMongoUri = true;
      }

      uri = await startMemoryServer();
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ In-memory MongoDB connected');
      lastDbError = null;
    }
  })()
    .finally(() => {
      dbConnectPromise = null;
    });

  await dbConnectPromise;
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Health check route
app.get('/api/health', async (req, res) => {
  await connectDB();
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState,
    dbStatus: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    dbError: lastDbError,
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Serve uploads statically
if (isVercel) {
  app.use('/uploads', express.static(bundledUploadsDir));
}
app.use('/uploads', express.static(runtimeUploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Serve static assets in production (Render)
if (!isVercel) {
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server on port ${PORT}`);
    connectDB();
  });
}

module.exports = app;
