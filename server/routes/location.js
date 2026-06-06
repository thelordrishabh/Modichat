const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

const DEFAULT_RADIUS_METRES = 5000;
const MAX_RADIUS_METRES = 50000;
const MIN_UPDATE_INTERVAL_MS = 10000;
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
const updateBuckets = new Map();

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const isValidCoordinate = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const clampRadius = (value) => {
  const radius = Number(value) || DEFAULT_RADIUS_METRES;
  return Math.min(MAX_RADIUS_METRES, Math.max(100, radius));
};

const formatDistanceLabel = (distance) => {
  if (distance < 50) return 'Less than 50 metres';
  if (distance < 1000) return `${distance} metres away`;
  if (distance <= 10000) return `${(distance / 1000).toFixed(1)} km away`;
  return `${Math.round(distance / 1000)} km away`;
};

const formatLastSeen = (value) => {
  if (!value) return 'Unknown';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const canBeSeenBy = (candidate, currentUserId) => {
  if (candidate.locationMode === 'everyone') return true;
  if (candidate.locationMode === 'friends') {
    return (candidate.following || []).some((id) => String(id) === String(currentUserId));
  }
  return false;
};

const hasBlockedRelationship = (currentUser, candidate) => {
  const candidateId = String(candidate._id);
  const currentId = String(currentUser._id);
  const currentBlocked = (currentUser.blockedUsers || []).some((id) => String(id) === candidateId);
  const candidateBlocked = (candidate.blockedUsers || []).some((id) => String(id) === currentId);
  return currentBlocked || candidateBlocked;
};

const toNearbyUser = (user, latitude, longitude) => {
  const [userLongitude, userLatitude] = user.location?.coordinates || [0, 0];
  const distance = haversineDistance(latitude, longitude, userLatitude, userLongitude);
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar || user.profilePicture || '',
    distance,
    distanceLabel: formatDistanceLabel(distance),
    lastSeen: formatLastSeen(user.location?.lastUpdated),
    locationMode: user.locationMode
  };
};

const getNearbyUsers = async ({ currentUser, latitude, longitude, radius }) => {
  const lastActiveAfter = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const users = await User.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radius
      }
    },
    locationVisible: true,
    locationMode: { $ne: 'off' },
    'location.lastUpdated': { $gte: lastActiveAfter },
    _id: { $ne: currentUser._id }
  })
    .select('name username avatar profilePicture following blockedUsers location locationMode')
    .limit(80);

  return users
    .filter((user) => canBeSeenBy(user, currentUser._id))
    .filter((user) => !hasBlockedRelationship(currentUser, user))
    .map((user) => toNearbyUser(user, latitude, longitude))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 50);
};

const broadcastLocationUpdate = async ({ req, currentUser, latitude, longitude }) => {
  const io = req.app.get('io');
  if (!io || currentUser.locationMode === 'off' || !currentUser.locationVisible) return;

  const watchers = await getNearbyUsers({
    currentUser,
    latitude,
    longitude,
    radius: MAX_RADIUS_METRES
  });

  watchers.forEach((watcher) => {
    const distance = watcher.distance;
    io.to(`user:${watcher._id}`).emit('location:update', {
      userId: currentUser._id,
      distance,
      distanceLabel: formatDistanceLabel(distance),
      lastSeen: 'Just now'
    });
    io.to(`user:${watcher._id}`).emit('location:join', { userId: currentUser._id });
  });
};

router.put('/update', auth, async (req, res) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    const now = Date.now();
    const lastUpdate = updateBuckets.get(req.user.id) || 0;
    if (now - lastUpdate < MIN_UPDATE_INTERVAL_MS) {
      return res.status(429).json({ message: 'Location updates are limited to once every 10 seconds' });
    }
    updateBuckets.set(req.user.id, now);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      lastUpdated: new Date()
    };
    if (user.locationMode === 'off') {
      user.locationMode = 'everyone';
    }
    user.locationVisible = true;
    await user.save();

    await broadcastLocationUpdate({ req, currentUser: user, latitude, longitude });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/nearby', auth, async (req, res) => {
  try {
    const radius = clampRadius(req.query.radius);
    const currentUser = await User.findById(req.user.id).select('location blockedUsers');
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const queryLatitude = Number(req.query.latitude);
    const queryLongitude = Number(req.query.longitude);
    const [storedLongitude, storedLatitude] = currentUser.location?.coordinates || [0, 0];
    const latitude = isValidCoordinate(queryLatitude, queryLongitude) ? queryLatitude : storedLatitude;
    const longitude = isValidCoordinate(queryLatitude, queryLongitude) ? queryLongitude : storedLongitude;

    if (!isValidCoordinate(latitude, longitude) || (latitude === 0 && longitude === 0)) {
      return res.json({ users: [], total: 0, radius });
    }

    const users = await getNearbyUsers({ currentUser, latitude, longitude, radius });
    res.json({ users, total: users.length, radius });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/visibility', auth, async (req, res) => {
  try {
    const locationMode = req.body.locationMode;
    if (!['everyone', 'friends', 'off'].includes(locationMode)) {
      return res.status(400).json({ message: 'locationMode must be everyone, friends, or off' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.locationMode = locationMode;
    user.locationVisible = locationMode !== 'off';
    if (locationMode === 'off') {
      user.location = {
        type: 'Point',
        coordinates: [0, 0],
        lastUpdated: null
      };
      updateBuckets.delete(req.user.id);
    }
    await user.save();

    const io = req.app.get('io');
    if (io && locationMode === 'off') {
      io.emit('location:leave', { userId: user._id });
    }

    res.json({ success: true, locationMode, locationVisible: user.locationVisible });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
