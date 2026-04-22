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

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

mongoose.connect('mongodb+srv://thelordrishabh:8uNkCQmkQTYp2ysH@cluster0.s57qasv.mongodb.net/social-app?appName=Cluster0')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Error:', err.message));

app.listen(8080, () => console.log('✅ Server on port 8080'));