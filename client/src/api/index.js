import axios from "axios";

export const BASE_URL = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:8080");
export const API = axios.create({ 
  baseURL: import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:8080/api") 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);

// Users
export const getUser = (id) => API.get(`/users/${id}`);
export const searchUsers = (query) => API.get(`/users?q=${query}`);
export const followUser = (id) => API.post(`/users/${id}/follow`);

// Posts
export const createPost = (data) => API.post("/posts", data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getFeed = () => API.get("/posts/feed");
export const getUserPosts = (userId) => API.get(`/posts/user/${userId}`);
export const likePost = (id) => API.post(`/posts/${id}/like`);
export const commentPost = (id, data) => API.post(`/posts/${id}/comment`, data);
export const getComments = (id) => API.get(`/posts/${id}/comments`);

// Messages
export const getConversations = () => API.get("/messages/conversation");
export const createConversation = (receiverId) => API.post("/messages/conversation", { receiverId });
export const getMessages = (conversationId) => API.get(`/messages/${conversationId}`);
export const sendMessage = (data) => API.post("/messages", data);