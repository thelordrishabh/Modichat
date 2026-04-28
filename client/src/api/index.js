import axios from "axios";

const DEFAULT_DEV_API_URL = "http://127.0.0.1:8080/api";
const DEFAULT_PROD_API_URL = "/api";
export const API_BASE_URL = import.meta.env.PROD
  ? DEFAULT_PROD_API_URL
  : (import.meta.env.VITE_API_URL || DEFAULT_DEV_API_URL);
export const BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
export const API = axios.create({ 
  baseURL: API_BASE_URL
});
export const PUBLIC_API = axios.create({
  baseURL: API_BASE_URL
});

export const getAssetUrl = (value) => {
  if (!value) return "";
  if (/^(?:https?:|blob:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${BASE_URL}${normalizedPath}`;
};

export const getUserAvatar = (user) =>
  getAssetUrl(user?.avatar || user?.profilePicture || "");

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);

// Users
export const getCurrentUser = () => API.get("/users/me");
export const getUser = (id) => API.get(`/users/${id}`);
export const getUserFollowers = (id) => API.get(`/users/${id}/followers`);
export const getUserFollowing = (id) => API.get(`/users/${id}/following`);
export const searchUsers = (query) => API.get(`/users?q=${query}`);
export const followUser = (id) => API.put(`/users/${id}/follow`);
export const updateProfile = (data) => API.put("/users/profile", data);

// Posts
export const createPost = (data) => API.post("/posts", data);
export const getGlobalFeed = (page = 1, limit = 10) => PUBLIC_API.get(`/posts/global?page=${page}&limit=${limit}`);
export const getFeed = (page = 1, limit = 10) => API.get(`/posts/feed?page=${page}&limit=${limit}`);
export const getPosts = (page = 1, limit = 10) => API.get(`/posts?page=${page}&limit=${limit}`);
export const getUserPosts = (userId) => API.get(`/posts/user/${userId}`);
export const getPostById = (id) => API.get(`/posts/${id}`);
export const savePost = (id) => API.put(`/posts/${id}/save`);
export const updatePost = (id, data) => API.put(`/posts/${id}`, data);
export const deletePost = (id) => API.delete(`/posts/${id}`);
export const likePost = (id) => API.post(`/posts/${id}/like`);
export const commentPost = (id, data) => API.post(`/posts/${id}/comments`, data);
export const getComments = (id) => API.get(`/posts/${id}/comments`);

// Search
export const searchEverything = (query) => API.get(`/search?q=${encodeURIComponent(query)}`);

// Notifications
export const getNotifications = () => API.get("/notifications");
export const markNotificationsRead = () => API.put("/notifications/read");

// Messages
export const getConversations = () => API.get("/messages/conversation");
export const getConversationSummaries = () => API.get("/messages/conversations");
export const createConversation = (receiverId) => API.post("/messages/conversation", { receiverId });
export const getMessages = (conversationId) => API.get(`/messages/${conversationId}`);
export const sendMessage = (data) => API.post("/messages", data);
export const getMessagesByUser = (userId) => API.get(`/messages/user/${userId}`);
export const sendMessageToUser = (userId, data) => API.post(`/messages/user/${userId}`, data);

// Stories
export const createStory = (data) => API.post("/stories", data);
export const getStories = () => API.get("/stories");
export const viewStory = (id) => API.put(`/stories/${id}/view`);

// Highlights
export const createHighlight = (data) => API.post("/highlights", data);
export const getHighlights = (userId) => API.get(`/highlights${userId ? `?userId=${userId}` : ""}`);
export const updateHighlight = (id, data) => API.put(`/highlights/${id}`, data);
export const deleteHighlight = (id) => API.delete(`/highlights/${id}`);

// Reports
export const createReport = (data) => API.post("/reports", data);

// Polls / reactions / repost / promotions
export const votePoll = (id, optionIndex) => API.put(`/posts/${id}/vote`, { optionIndex });
export const reactPost = (id, type) => API.put(`/posts/${id}/react`, { type });
export const repostPost = (id, data = {}) => API.post(`/posts/${id}/repost`, data);
export const acceptCollab = (id) => API.put(`/posts/${id}/accept-collab`);
export const promotePost = (id, durationDays) => API.post(`/posts/${id}/promote`, { durationDays });
export const deleteComment = (postId, commentId) => API.delete(`/posts/${postId}/comments/${commentId}`);

// Trending and hashtags
export const getTrending = () => API.get("/trending");
export const getTrendingHashtags = () => API.get("/hashtags/trending");
export const getPostsByHashtag = (tag) => API.get(`/hashtags/${tag}`);

// Users moderation / privacy / monetization
export const searchUsersForMentions = (q) => API.get(`/users/search?q=${encodeURIComponent(q)}`);
export const blockUser = (id) => API.put(`/users/${id}/block`);
export const unblockUser = (id) => API.put(`/users/${id}/unblock`);
export const trackProfileView = (id, data = {}) => API.put(`/users/${id}/view`, data);
export const getMyProfileViews = () => API.get("/users/profile-views");
export const acceptFollowRequest = (id, requesterId) => API.put(`/users/${id}/accept-request`, { requesterId });
export const rejectFollowRequest = (id, requesterId) => API.put(`/users/${id}/reject-request`, { requesterId });
export const verifyUser = (id, isVerified = true) => API.put(`/users/${id}/verify`, { isVerified });
export const subscribeToCreator = (id) => API.post(`/users/${id}/subscribe`);

// Events
export const createEvent = (data) => API.post("/events", data);
export const getEvents = () => API.get("/events");
export const rsvpEvent = (id, status) => API.put(`/events/${id}/rsvp`, { status });

// Utils
export const getLinkPreview = (url) => API.get(`/utils/link-preview?url=${encodeURIComponent(url)}`);
export const searchMusicTracks = (q) => API.get(`/utils/music/search?q=${encodeURIComponent(q)}`);

// Coins
export const purchaseBadge = (data) => API.post("/badges", data);
export const sendTip = (data) => API.post("/tips", data);
