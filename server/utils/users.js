const { normalizeUser } = require('./assets');

const USERNAME_MAX_LENGTH = 24;

const normalizeUsername = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, USERNAME_MAX_LENGTH);

const ensureUniqueUsername = async ({ User, desiredUsername, fallbackValue = 'user', excludeUserId }) => {
  const baseUsername = normalizeUsername(desiredUsername) || normalizeUsername(fallbackValue) || 'user';
  let suffix = 0;

  while (true) {
    const suffixValue = suffix === 0 ? '' : String(suffix);
    const trimmedBase = baseUsername.slice(0, USERNAME_MAX_LENGTH - suffixValue.length);
    const candidateUsername = `${trimmedBase}${suffixValue}`;
    const existingUser = await User.findOne({
      username: candidateUsername,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {})
    }).select('_id');

    if (!existingUser) {
      return candidateUsername;
    }

    suffix += 1;
  }
};

const toPublicUser = (req, user) => {
  const normalizedUser = normalizeUser(req, user);
  if (!normalizedUser) return normalizedUser;

  const publicUser = {
    _id: normalizedUser._id,
    name: normalizedUser.name,
    username: normalizedUser.username,
    email: normalizedUser.email,
    avatar: normalizedUser.avatar,
    profilePicture: normalizedUser.profilePicture,
    bio: normalizedUser.bio,
    websiteUrl: normalizedUser.websiteUrl || '',
    themeColor: normalizedUser.themeColor || 'blue',
    isPrivate: Boolean(normalizedUser.isPrivate),
    followRequests: normalizedUser.followRequests || [],
    blockedUsers: normalizedUser.blockedUsers || [],
    isVerified: Boolean(normalizedUser.isVerified),
    isAdmin: Boolean(normalizedUser.isAdmin),
    coins: normalizedUser.coins || 0,
    coinsReceived: normalizedUser.coinsReceived || 0,
    subscriptionPrice: normalizedUser.subscriptionPrice || 0,
    subscribers: normalizedUser.subscribers || [],
    followers: normalizedUser.followers || [],
    following: normalizedUser.following || []
  };

  if (req.user && String(req.user.id) === String(normalizedUser._id)) {
    publicUser.savedPosts = normalizedUser.savedPosts || [];
  }

  return publicUser;
};

module.exports = {
  ensureUniqueUsername,
  normalizeUsername,
  toPublicUser
};
