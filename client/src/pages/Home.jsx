import { useEffect, useState } from "react";
import { getFeed } from "../api";
import PostCard from "../components/PostCard";
import Layout from "../components/Layout";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchFeed = async () => {
      try {
        const { data } = await getFeed();
        if (!isCancelled) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to fetch feed", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchFeed();

    const handlePostCreated = () => {
      fetchFeed();
    };

    window.addEventListener("modichat:post-created", handlePostCreated);

    return () => {
      isCancelled = true;
      window.removeEventListener("modichat:post-created", handlePostCreated);
    };
  }, []);

  return (
    <Layout>
      <div className="mx-auto w-full max-w-xl py-2 md:py-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to MODICHAT!</h2>
            <p className="text-gray-500 dark:text-gray-400">Search for users and follow them to see their posts in your feed.</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </Layout>
  );
}
