import { useCallback, useEffect, useRef, useState } from "react";
import { getFeed } from "../api";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

const PAGE_LIMIT = 10;

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);

  const loadFeed = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getFeed(pageToLoad, PAGE_LIMIT);
      const feed = response.data || [];
      const more = String(response.headers["x-has-more"]).toLowerCase() === "true";

      setPosts((current) => {
        if (pageToLoad === 1) {
          return feed;
        }

        return [...current, ...feed];
      });
      setHasMore(more);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      if (cancelled) return;
      await loadFeed(1);
    };
    initialize();

    const refreshFeed = () => {
      setPage(1);
      loadFeed(1);
    };

    window.addEventListener("modichat:post-created", refreshFeed);

    return () => {
      cancelled = true;
      window.removeEventListener("modichat:post-created", refreshFeed);
    };
  }, []);

  useEffect(() => {
    if (page === 1) return;
    loadFeed(page);
  }, [page]);

  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        { rootMargin: "200px" }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const handleDelete = (postId) => {
    setPosts((current) => current.filter((post) => post._id !== postId));
  };

  const handleUpdate = (updatedPost) => {
    setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  return (
    <div className="space-y-6">
      {loading ? (
        [1, 2, 3].map((item) => <PostCardSkeleton key={item} />)
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900/80">
          <h2 className="text-xl font-semibold">No posts yet</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Follow other people or add a new post to fill your feed.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post._id} post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
        ))
      )}

      <div ref={lastElementRef} className="py-8 text-center">
        {loadingMore && <div className="text-sm text-gray-500 dark:text-gray-400">Loading more posts…</div>}
        {!hasMore && !loading && posts.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">You caught up with all the posts.</div>
        )}
      </div>
    </div>
  );
}
