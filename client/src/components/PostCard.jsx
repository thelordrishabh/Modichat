import { useState } from "react";
import { Link } from "react-router-dom";
import { likePost, commentPost } from "../api";
import { useAuth } from "../context/AuthContext";

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(user._id));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleLike = async () => {
    try {
      setLikes(isLiked ? likes - 1 : likes + 1);
      setIsLiked(!isLiked);
      await likePost(post._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await commentPost(post._id, { text: commentText });
      setCommentText("");
      // Ideally update comment count or list locally, keeping it simple for now
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.userId._id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {post.userId.profilePicture ? (
              <img src={`http://localhost:5000${post.userId.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-gray-500 dark:text-gray-300">{post.userId.name[0]}</span>
            )}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{post.userId.name}</span>
        </Link>
        <span className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Post Image */}
      <div className="w-full aspect-square bg-black">
        <img 
          src={`http://localhost:5000${post.imageUrl}`} 
          alt="Post" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Post Actions & Caption */}
      <div className="p-4">
        <div className="flex gap-4 mb-3">
          <button onClick={handleLike} className={`text-2xl transition-transform hover:scale-110 ${isLiked ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {isLiked ? '❤️' : '🤍'}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-2xl transition-transform hover:scale-110 text-gray-900 dark:text-white">
            💬
          </button>
        </div>
        <div className="font-semibold text-gray-900 dark:text-white mb-2">
          {likes} likes
        </div>
        <div className="text-gray-900 dark:text-gray-200">
          <Link to={`/profile/${post.userId._id}`} className="font-semibold mr-2">{post.userId.name}</Link>
          {post.caption}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          <form onSubmit={handleComment} className="mt-3 flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white"
            />
            <button type="submit" className="text-blue-500 font-semibold text-sm px-2">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}
