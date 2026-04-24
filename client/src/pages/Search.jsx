import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchEverything, getAssetUrl } from "../api";
import Avatar from "../components/Avatar";
import Layout from "../components/Layout";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      setResults({ users: [], posts: [] });
      return;
    }

    let isCancelled = false;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchEverything(query.trim());
        if (!isCancelled) {
          setResults(data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Search failed", err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  const hasResults = results.users.length > 0 || results.posts.length > 0;

  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find people by name or username and explore posts by caption.
          </p>
          <div className="mt-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users or posts..."
              className="min-h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : !query.trim() ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Start typing to search across people and posts.
          </div>
        ) : !hasResults ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            No results found for “{query}”.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px,minmax(0,1fr)]">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">People</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{results.users.length}</span>
              </div>
              <div className="space-y-3">
                {results.users.map((resultUser) => (
                  <Link
                    key={resultUser._id}
                    to={`/profile/${resultUser._id}`}
                    className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/60"
                  >
                    <Avatar user={resultUser} size="h-12 w-12" textSize="text-lg" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-gray-900 dark:text-white">{resultUser.name}</div>
                      <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                        @{resultUser.username || "user"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Posts</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{results.posts.length}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.posts.map((post) => (
                  <div
                    key={post._id}
                    className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <img
                      src={getAssetUrl(post.imageUrl)}
                      alt="Search result"
                      className="aspect-square w-full object-cover"
                    />
                    <div className="space-y-3 p-4">
                      <Link to={`/profile/${post.userId._id}`} className="flex items-center gap-3">
                        <Avatar user={post.userId} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-900 dark:text-white">{post.userId.name}</div>
                          <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                            @{post.userId.username || "user"}
                          </div>
                        </div>
                      </Link>
                      <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                        {post.caption || "No caption"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
