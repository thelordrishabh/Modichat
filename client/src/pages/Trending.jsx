import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getTrending } from "../api";

export default function Trending() {
  const [data, setData] = useState({ trendingPosts: [], trendingUsers: [] });

  useEffect(() => {
    const load = async () => {
      const { data: payload } = await getTrending();
      setData(payload);
    };
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔥 Trending Posts</h1>
          <div className="mt-4 space-y-3">
            {data.trendingPosts.map((post, index) => (
              <div key={post._id} className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-300">#{index + 1}</p>
                <p className="text-sm text-gray-800 dark:text-gray-100">{post.caption || "No caption"}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trending Users</h2>
          <div className="mt-4 space-y-3">
            {data.trendingUsers.map((user) => (
              <div key={user._id} className="rounded-2xl bg-gray-100 p-3 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                {user.name} @{user.username}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
