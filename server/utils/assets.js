const isAbsoluteAssetUrl = (value = '') =>
  /^(?:https?:)?\/\//i.test(value) || value.startsWith('data:');

const getBaseUrl = (req) => {
  const host = req.headers['x-forwarded-host'] || req.get('host');
  if (!host) return '';

  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
};

const toAbsoluteAssetUrl = (req, value = '') => {
  if (!value || isAbsoluteAssetUrl(value)) return value;

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  const baseUrl = getBaseUrl(req);

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};

const toPlainObject = (value, options = {}) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') {
    return value.toObject(options);
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainObject(item, options));
  }

  if (typeof value === 'object') {
    return { ...value };
  }

  return value;
};

const normalizeUser = (req, user) => {
  if (!user || typeof user !== 'object') return user;

  const normalizedUser = toPlainObject(user, { virtuals: true });
  const avatarUrl = normalizedUser.avatar || normalizedUser.profilePicture || '';
  const absoluteAvatarUrl = toAbsoluteAssetUrl(req, avatarUrl);

  normalizedUser.avatar = absoluteAvatarUrl;
  normalizedUser.profilePicture = absoluteAvatarUrl;

  return normalizedUser;
};

const normalizeComment = (req, comment) => {
  if (!comment || typeof comment !== 'object') return comment;

  const normalizedComment = toPlainObject(comment, { virtuals: true });
  normalizedComment.userId = normalizeUser(req, normalizedComment.userId);

  return normalizedComment;
};

const normalizePost = (req, post) => {
  if (!post || typeof post !== 'object') return post;

  const normalizedPost = toPlainObject(post, { virtuals: true });
  normalizedPost.imageUrl = toAbsoluteAssetUrl(req, normalizedPost.imageUrl);
  normalizedPost.mediaUrl = toAbsoluteAssetUrl(req, normalizedPost.mediaUrl || normalizedPost.imageUrl);
  normalizedPost.userId = normalizeUser(req, normalizedPost.userId);
  normalizedPost.comments = Array.isArray(normalizedPost.comments)
    ? normalizedPost.comments.map((comment) => normalizeComment(req, comment))
    : [];

  return normalizedPost;
};

const normalizeNotification = (req, notification) => {
  if (!notification || typeof notification !== 'object') return notification;

  const normalizedNotification = toPlainObject(notification, { virtuals: true });
  normalizedNotification.sender = normalizeUser(req, normalizedNotification.sender);
  normalizedNotification.recipient = normalizeUser(req, normalizedNotification.recipient);
  normalizedNotification.post = normalizedNotification.post
    ? normalizePost(req, normalizedNotification.post)
    : normalizedNotification.post;

  return normalizedNotification;
};

module.exports = {
  getBaseUrl,
  isAbsoluteAssetUrl,
  normalizeComment,
  normalizeNotification,
  normalizePost,
  normalizeUser,
  toAbsoluteAssetUrl,
  toPlainObject
};
