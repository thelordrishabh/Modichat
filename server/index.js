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

        try {
          await mongoose.disconnect();
        } catch (disconnectErr) {
          console.warn(`⚠️ Error while disconnecting from failed MongoDB attempt: ${disconnectErr.message}`);
        }
      }
    }

    if (usingFallback) {
      if (!hasLoggedMissingMongoUri) {
        console.warn(`⚠️ ${fallbackReason}. Starting in-memory MongoDB for local development.`);
        hasLoggedMissingMongoUri = true;
      }

      uri = await startMemoryServer();
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log('✅ In-memory MongoDB connected');
        lastDbError = null;
      } catch (err) {
        lastDbError = err.message;
        console.error(`❌ In-memory MongoDB connection failed: ${err.message}`);
        throw err;
      }
    }
  })()
    .finally(() => {
      dbConnectPromise = null;
    });

  await dbConnectPromise;
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health check route
app.get('/api/health', async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
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

// Error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    dbError: lastDbError
  });
});

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

const DEFAULT_PORT = 8080;
const requestedPort = Number(process.env.PORT) || DEFAULT_PORT;

const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', async () => {
      console.log(`✅ Server on port ${port}`);
      try {
        await connectDB();
        resolve(server);
      } catch (err) {
        reject(err);
      }
    });

    server.on('error', reject);
  });
};

if (require.main === module) {
  startServer(requestedPort).catch((err) => {
    if (err.code === 'EADDRINUSE' && requestedPort !== DEFAULT_PORT) {
      console.warn(`⚠️ Port ${requestedPort} is unavailable, trying ${DEFAULT_PORT}`);
      startServer(DEFAULT_PORT).catch((err2) => {
        console.error(`❌ Failed to start server on fallback port ${DEFAULT_PORT}: ${err2.message}`);
        process.exit(1);
      });
      return;
    }

    console.error(`❌ Server start error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = app;
