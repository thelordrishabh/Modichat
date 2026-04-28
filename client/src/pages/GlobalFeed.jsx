import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGlobalFeed } from "../api";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";

export default function GlobalFeed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getGlobalFeed(page, 10);
        const posts = Array.isArray(data) ? data : data.posts || [];
        setPosts((prev) => (page === 1 ? posts : [...prev, ...posts]));
        setHasMore(posts.length >= 10);
      } catch (err) {
        console.error(err);
        setError("Unable to load public feed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [page]);

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Public Feed</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Explore the latest posts from the community. Log in to like, comment, and join the conversation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Sign Up
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <p>• Anyone can browse global posts here.</p>
            <p>• Create an account to save posts, follow users, and comment.</p>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800/70 dark:bg-red-900/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {posts.length === 0 && !loading ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <p className="text-lg font-semibold">No public posts yet.</p>
            <p className="mt-2">Check back soon or log in to see more personalized updates.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Newer
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {page}</span>
          <button
            type="button"
            disabled={!hasMore || loading}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Older
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Loading feed...
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
