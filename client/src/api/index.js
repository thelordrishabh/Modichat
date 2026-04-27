import axios from "axios";

const DEFAULT_DEV_API_URL = "http://127.0.0.1:8080/api";
export const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || "/api")
  : (import.meta.env.VITE_API_URL || DEFAULT_DEV_API_URL);
export const BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
export const API = axios.create({ 
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
export const createConversation = (receiverId) => API.post("/messages/conversation", { receiverId });
export const getMessages = (conversationId) => API.get(`/messages/${conversationId}`);
export const sendMessage = (data) => API.post("/messages", data);
