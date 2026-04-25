import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAssetUrl, likePost, commentPost, savePost, updatePost, deletePost } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(user ? post.likes.some((likeId) => String(likeId) === String(user._id)) : false);
  const [isSaved, setIsSaved] = useState(Boolean(post.saved));
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  const isOwner = user ? String(post.userId._id) === String(user._id) : false;

  useEffect(() => {
    setLikes(post.likes.length);
    setIsLiked(user ? post.likes.some((likeId) => String(likeId) === String(user._id)) : false);
    setComments(post.comments || []);
    setIsSaved(Boolean(post.saved));
    setEditCaption(post.caption || "");
  }, [post, user?._id]);

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
      toast.error("Unable to update like.");
    }
  };

  const handleSave = async () => {
    const previousValue = isSaved;
    try {
      setIsSaved(!previousValue);
      const { data } = await savePost(post._id);
      setIsSaved(data.saved);
      toast.success(data.saved ? "Saved to your collection" : "Removed from saved posts");
    } catch (err) {
      setIsSaved(previousValue);
      console.error(err);
      toast.error("Unable to update saved post.");
    }
  };

  const handleShare = async () => {
    const origin = window.location.origin;
    const postUrl = `${origin}/posts/${post._id}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Unable to copy link.");
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
      toast.error("Unable to post comment.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await deletePost(post._id);
      toast.success("Post deleted");
      onDelete?.(post._id);
      if (!onDelete) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete post.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const { data } = await updatePost(post._id, { caption: editCaption.trim() });
      onUpdate?.(data);
      setIsEditing(false);
      toast.success("Post updated");
    } catch (err) {
      console.error(err);
      toast.error("Unable to update post.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) {
        handleLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
    }
    lastTap.current = now;
  };

  return (
    <div className="bg-white dark:bg-gray-800 md:rounded-2xl shadow-sm border-y md:border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <div className="p-4 flex items-center justify-between gap-4">
        <Link to={`/profile/${post.userId._id}`} className="flex items-center gap-3">
          <Avatar user={post.userId} />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{post.userId.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">@{post.userId.username || "user"}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-right">
          <span className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
          {isOwner ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                ⋯
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    Delete post
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden bg-black"
        onClick={handleImageTap}
        onTouchEnd={(e) => { e.preventDefault(); handleImageTap(); }}
      >
        <img
          src={getAssetUrl(post.imageUrl)}
          alt="Post"
          className="w-full aspect-square object-contain"
        />
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-6xl text-red-500 opacity-0 animate-heart-pop">❤️</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleLike}
            className={`min-h-11 min-w-11 text-2xl transition-transform hover:scale-110 ${isLiked ? "text-red-500" : "text-gray-900 dark:text-white"}`}
            aria-label="Like post"
          >
            {isLiked ? "❤️" : "🤍"}
          </button>
          <button
            onClick={() => setShowComments((visible) => !visible)}
            className="min-h-11 min-w-11 text-2xl transition-transform hover:scale-110 text-gray-900 dark:text-white"
            aria-label="Toggle comments"
          >
            💬
          </button>
          <button
            onClick={handleShare}
            className="min-h-11 min-w-11 text-2xl transition-transform hover:scale-110 text-gray-900 dark:text-white"
            aria-label="Share post"
          >
            🔗
          </button>
          <button
            onClick={handleSave}
            className={`ml-auto min-h-11 min-w-11 text-2xl transition-transform hover:scale-110 ${isSaved ? "text-blue-500" : "text-gray-900 dark:text-white"}`}
            aria-label="Save post"
          >
            {isSaved ? "🔖" : "📑"}
          </button>
        </div>

        <div className="font-semibold text-gray-900 dark:text-white mb-2">{likes} likes</div>
        <div className="text-gray-900 dark:text-gray-200">
          <Link to={`/profile/${post.userId._id}`} className="font-semibold mr-2">
            {post.userId.name}
          </Link>
          {post.caption}
        </div>
        <button
          type="button"
          onClick={() => setShowComments((visible) => !visible)}
          className="mt-3 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showComments ? "Hide comments" : `View comments (${comments.length})`}
        </button>
      </div>

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
              className="min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button type="submit" className="min-h-11 rounded-full px-4 text-blue-500 font-semibold text-sm">
              Post
            </button>
          </form>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit post</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-2xl px-3 py-2 text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows={4}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
