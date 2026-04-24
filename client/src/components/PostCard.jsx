import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { likePost, commentPost, getAssetUrl } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.some((likeId) => String(likeId) === String(user._id)));
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    setLikes(post.likes.length);
    setIsLiked(post.likes.some((likeId) => String(likeId) === String(user._id)));
    setComments(post.comments || []);
  }, [post, user._id]);

  const handleLike = async () => {
    const previousLikes = likes;
    const previousLiked = isLiked;

    try {
      setLikes(isLiked ? likes - 1 : likes + 1);
      setIsLiked(!isLiked);
      const { data } = await likePost(post._id);
      setLikes(data.likesCount);
      setIsLiked(data.liked);
    } catch (err) {
      setLikes(previousLikes);
      setIsLiked(previousLiked);
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await commentPost(post._id, { text: commentText.trim() });
      setComments((prevComments) => [data, ...prevComments]);
      setShowComments(true);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.userId._id}`} className="flex items-center gap-3">
          <Avatar user={post.userId} />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{post.userId.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">@{post.userId.username || "user"}</div>
          </div>
        </Link>
        <span className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Post Image */}
      <div className="w-full aspect-square bg-black">
        <img 
          src={getAssetUrl(post.imageUrl)}
          alt="Post" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Post Actions & Caption */}
      <div className="p-4">
        <div className="flex gap-4 mb-3">
          <button onClick={handleLike} className={`min-h-11 min-w-11 text-2xl transition-transform hover:scale-110 ${isLiked ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {isLiked ? '❤️' : '🤍'}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="min-h-11 min-w-11 text-2xl transition-transform hover:scale-110 text-gray-900 dark:text-white">
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
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="mt-3 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showComments ? "Hide comments" : `View comments (${comments.length})`}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          <div className="pt-3 space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-3 text-sm text-gray-900 dark:text-gray-200">
                  <Avatar user={comment.userId} size="h-9 w-9" textSize="text-sm" />
                  <div className="min-w-0">
                    <Link to={`/profile/${comment.userId?._id}`} className="font-semibold mr-2">
                      {comment.userId?.name || "User"}
                    </Link>
                    {comment.text}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</div>
            )}
          </div>
          <form onSubmit={handleComment} className="mt-3 flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-11 flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white"
            />
            <button type="submit" className="min-h-11 rounded-full px-4 text-blue-500 font-semibold text-sm">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}
