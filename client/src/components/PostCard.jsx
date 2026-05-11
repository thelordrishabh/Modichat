import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import gsap from "gsap";
import { getAssetUrl, likePost, commentPost, savePost, updatePost, deletePost, reactPost, votePoll, repostPost, deleteComment } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import ReactionPicker from "./ReactionPicker";
import PollCard from "./PollCard";
import ReportModal from "./ReportModal";
import GuestActionModal from "./GuestActionModal";
import useMobile from "../hooks/useMobile";
import { useGyroscope } from "../hooks/useGyroscope";

let gyroPromptClaimed = false;

const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|webm|m4v)(?:$|[?#])/i;
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|avif)(?:$|[?#])/i;

const inferMediaType = (value, fallbackType) => {
  if (fallbackType === "video" || VIDEO_EXTENSION_PATTERN.test(value || "")) return "video";
  return "image";
};

const getPostMediaCandidates = (post) => {
  const fields = [
    ["imageUrl", post.imageUrl],
    ["image", post.image],
    ["mediaUrl", post.mediaUrl],
    ["media", post.media]
  ];
  const seen = new Set();

  return fields.reduce((candidates, [field, value]) => {
    if (!value || seen.has(value)) return candidates;
    seen.add(value);
    candidates.push({
      field,
      originalUrl: value,
      src: getAssetUrl(value),
      type: inferMediaType(value, post.mediaType)
    });
    return candidates;
  }, []);
};

const isUnavailableUploadPlaceholder = (url, contentType) => {
  if (!url || !contentType) return false;
  return /\/uploads\//i.test(url) && /image\/svg\+xml/i.test(contentType) && IMAGE_EXTENSION_PATTERN.test(url);
};

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { tilt, isSupported, hasPermission, needsPermission, requestPermission } = useGyroscope();
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
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showGuestAction, setShowGuestAction] = useState(false);
  const [guestActionMessage, setGuestActionMessage] = useState("like posts");
  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaUnavailable, setMediaUnavailable] = useState(false);
  const [showGyroPrompt, setShowGyroPrompt] = useState(false);
  const lastTap = useRef(0);
  const cardRef = useRef(null);
  const likeButtonRef = useRef(null);
  const mediaCandidates = useMemo(() => getPostMediaCandidates(post), [post]);
  const activeMedia = mediaCandidates[mediaIndex];

  const isGuest = !user;
  const isOwner = user ? String(post.userId._id) === String(user._id) : false;

  const handleCurrentMediaFailure = useCallback(() => {
    setMediaIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < mediaCandidates.length) return nextIndex;
      setMediaUnavailable(true);
      return currentIndex;
    });
  }, [mediaCandidates.length]);

  const openGuestAction = (action) => {
    setGuestActionMessage(action);
    setShowGuestAction(true);
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Post image URL:", post.imageUrl || post.image || post.media);
    }
    setLikes(post.likes.length);
    setIsLiked(user ? post.likes.some((likeId) => String(likeId) === String(user._id)) : false);
    setComments(post.comments || []);
    setIsSaved(Boolean(post.saved));
    setEditCaption(post.caption || "");
    if (post.poll?.options?.length) {
      const voted = post.poll.options.some((option) =>
        option.votes?.some((voteUserId) => String(voteUserId) === String(user?._id))
      );
      setHasVoted(voted);
    }
  }, [post, user?._id]);

  useEffect(() => {
    setMediaIndex(0);
    setMediaUnavailable(mediaCandidates.length === 0);
  }, [post._id, mediaCandidates.length]);

  useEffect(() => {
    if (!isMobile || !isSupported || hasPermission || !needsPermission || gyroPromptClaimed) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("gyro-skipped") || window.localStorage.getItem("gyro-granted")) return;

    gyroPromptClaimed = true;
    setShowGyroPrompt(true);
  }, [hasPermission, isMobile, isSupported, needsPermission]);

  useEffect(() => {
    if (!activeMedia?.src || mediaUnavailable) return undefined;
    if (!/\/uploads\//i.test(activeMedia.src)) return undefined;

    const controller = new AbortController();

    const validateMedia = async () => {
      try {
        const response = await fetch(activeMedia.src, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store"
        });
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok || isUnavailableUploadPlaceholder(activeMedia.src, contentType)) {
          handleCurrentMediaFailure();
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // If HEAD is blocked by a host, the media element still gets one final attempt.
        }
      }
    };

    validateMedia();
    return () => controller.abort();
  }, [activeMedia?.src, handleCurrentMediaFailure, mediaUnavailable]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 90, rotateX: -28, rotateY: 9, scale: 0.92, transformPerspective: 1200 },
          { autoAlpha: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1, duration: 1, ease: "expo.out" }
        );
        observer.disconnect();
      },
      { threshold: 0.18 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const burstLikeParticles = () => {
    const rect = likeButtonRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        }
      : { x: 0.5, y: 0.55 };

    confetti({
      particleCount: 58,
      spread: 72,
      scalar: 0.95,
      ticks: 90,
      origin,
      colors: ["#ff4fd8", "#8b5cf6", "#38bdf8", "#ffffff"],
      shapes: ["star", "circle"]
    });
  };

  const handleTiltMove = (event) => {
    if (isMobile) return;
    const element = cardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.transform = `perspective(1200px) rotateX(${-y * 6}deg) rotateY(${x * 7}deg) translate3d(0,-8px,0)`;
  };

  const resetTilt = () => {
    if (isMobile) return;
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)";
    }
  };

  const getTransformStyle = () => {
    if (isMobile && hasPermission) {
      return {
        transform: `perspective(1000px) rotateX(${-tilt.y * 0.3}deg) rotateY(${tilt.x * 0.3}deg)`,
        transition: "transform 0.1s ease-out",
        willChange: "transform"
      };
    }

    return undefined;
  };

  const enableMotionEffects = async () => {
    const granted = await requestPermission();
    if (granted && typeof window !== "undefined") {
      window.localStorage.setItem("gyro-granted", "true");
    }
    setShowGyroPrompt(false);
  };

  const skipMotionEffects = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("gyro-skipped", "true");
    }
    setShowGyroPrompt(false);
  };

  const handleLike = async () => {
    if (isGuest) {
      openGuestAction("like posts");
      return;
    }

    const previousLikes = likes;
    const previousLiked = isLiked;

    try {
      setLikes(isLiked ? likes - 1 : likes + 1);
      setIsLiked(!isLiked);
      if (!isLiked) burstLikeParticles();
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

  const handleReact = async (reactionType) => {
    try {
      await reactPost(post._id, reactionType);
      setShowReactionPicker(false);
      toast.success("Reaction updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to react");
    }
  };

  const handleVote = async (optionIndex) => {
    try {
      await votePoll(post._id, optionIndex);
      setHasVoted(true);
      toast.success("Vote submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote");
    }
  };

  const handleRepost = async () => {
    try {
      await repostPost(post._id);
      toast.success("Reposted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to repost");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (isGuest) {
      openGuestAction("add comments");
      return;
    }
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

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(post._id, commentId);
      setComments((prev) => prev.filter((entry) => entry._id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete comment");
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
      if (isGuest) {
        openGuestAction("like posts");
      } else if (!isLiked) {
        handleLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
    }
    lastTap.current = now;
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handleTiltMove}
      onPointerLeave={resetTilt}
      className="post-card-lux scroll-reveal mb-6 overflow-hidden border-y border-white/15 bg-white/10 shadow-sm md:rounded-2xl md:border"
      style={getTransformStyle()}
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <Link to={`/profile/${post.userId._id}`} className="flex items-center gap-3">
          <Avatar user={post.userId} />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{post.userId.name} {post.userId.isVerified ? "✓" : ""}</div>
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
        className="post-media-container relative w-full overflow-hidden bg-gray-950/70"
        onClick={handleImageTap}
        onTouchEnd={(e) => {
          if (e.target.closest("video")) return;
          e.preventDefault();
          handleImageTap();
        }}
      >
        {!mediaUnavailable && activeMedia?.type === "video" ? (
          <video
            src={activeMedia.src}
            className="w-full max-h-[600px] object-cover"
            muted
            autoPlay
            loop
            controls
            playsInline
            onError={handleCurrentMediaFailure}
          />
        ) : !mediaUnavailable && activeMedia ? (
          <img
            src={activeMedia.src}
            alt="Post"
            className="ken-burns-media w-full max-h-[600px] object-cover"
            style={{ filter: post.filter && post.filter !== "normal" ? undefined : undefined }}
            onError={handleCurrentMediaFailure}
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
            Image unavailable
          </div>
        )}
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-6xl text-red-500 opacity-0 animate-heart-pop">❤️</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            ref={likeButtonRef}
            onMouseEnter={() => setShowReactionPicker(true)}
            onClick={handleLike}
            className={`liquid-button relative min-h-11 min-w-11 rounded-full text-2xl transition-transform hover:scale-110 ${isLiked ? "text-red-500" : "text-gray-900 dark:text-white"}`}
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
            onClick={handleRepost}
            className="min-h-11 min-w-11 text-xl transition-transform hover:scale-110 text-gray-900 dark:text-white"
            aria-label="Repost"
          >
            🔁
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
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link to={`/profile/${post.userId._id}`} className="font-semibold mr-2">
              {post.userId.name}
            </Link>
            {isGuest && !isOwner ? (
              <button
                type="button"
                onClick={() => openGuestAction("follow people")}
                className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Follow
              </button>
            ) : null}
          </div>
          {(post.caption || "").split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g).map((part, index) => {
            if (part.startsWith("#")) {
              return <Link key={`${part}-${index}`} to={`/hashtag/${part.slice(1)}`} className="text-blue-500 hover:underline">{part}</Link>;
            }
            if (part.startsWith("@")) {
              return <span key={`${part}-${index}`} className="text-blue-500">{part}</span>;
            }
            return <span key={`${part}-${index}`}>{part}</span>;
          })}
        </div>
        {!post.hideLikes || isOwner ? (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{post.reactions?.length || 0} reactions · {post.repostCount || 0} reposts</div>
        ) : (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Liked by {post.userId.name} and others</div>
        )}
        <PollCard poll={post.poll} onVote={handleVote} isVoted={hasVoted} />
        <button
          type="button"
          onClick={() => {
            if (isGuest) {
              openGuestAction("add comments");
              return;
            }
            setShowComments((visible) => !visible);
          }}
          className="mt-3 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showComments ? "Hide comments" : `View comments (${comments.length})`}
        </button>
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="mt-2 text-xs text-red-500 hover:underline"
        >
          Report post
        </button>
      </div>
      {showReactionPicker ? (
        <div className="px-4 pb-2">
          <ReactionPicker onSelect={handleReact} />
        </div>
      ) : null}

      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          <div className="pt-3 space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="group flex items-start gap-3 text-sm text-gray-900 dark:text-gray-200">
                  <Avatar user={comment.userId} size="h-9 w-9" textSize="text-sm" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${comment.userId?._id}`} className="font-semibold mr-2">
                      {comment.userId?.name || "User"}
                    </Link>
                    {comment.text}
                  </div>
                  {(isOwner || String(comment.userId?._id) === String(user?._id)) ? (
                    <button
                      type="button"
                      onClick={() => handleCommentDelete(comment._id)}
                      className="hidden rounded-full px-2 py-1 text-xs text-red-500 hover:bg-red-50 group-hover:block dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  ) : null}
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
      {showReportModal ? (
        <ReportModal targetType="post" targetId={post._id} onClose={() => setShowReportModal(false)} />
      ) : null}
      <GuestActionModal
        open={showGuestAction}
        action={guestActionMessage}
        onClose={() => setShowGuestAction(false)}
      />
      {showGyroPrompt ? (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-3xl border border-white/20 bg-gray-950/90 p-3 text-sm text-white shadow-2xl backdrop-blur md:hidden">
          <span className="font-medium">Enable motion effects? 📱</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={enableMotionEffects}
              className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-gray-950"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={skipMotionEffects}
              className="rounded-2xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/80"
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
