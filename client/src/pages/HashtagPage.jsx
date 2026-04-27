import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getPostsByHashtag } from "../api";

export default function HashtagPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await getPostsByHashtag(tag);
      setPosts(data);
    };
    load();
  }, [tag]);

  return (
    <Layout>
      <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">#{tag}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post._id} to={`/posts/${post._id}`} className="aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700">
              <img src={post.mediaUrl || post.imageUrl} alt={post.caption || "Post"} className="h-full w-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
