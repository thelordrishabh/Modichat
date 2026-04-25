import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import PageFade from "../components/PageFade";
import PostCard from "../components/PostCard";
import PostCardSkeleton from "../components/PostCardSkeleton";
import { getPostById } from "../api";
import toast from "react-hot-toast";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPost = async () => {
      try {
        const response = await getPostById(id);
        if (!cancelled) {
          setPost(response.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Unable to load that post.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = () => {
    navigate("/");
  };

  const handleUpdate = (updatedPost) => {
    setPost(updatedPost);
  };

  return (
    <Layout>
      <PageFade className="mx-auto w-full max-w-3xl py-6 px-4 sm:px-0">
        {loading ? (
          <PostCardSkeleton />
        ) : post ? (
          <PostCard post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
        ) : (
          <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 text-center text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
            Post not found.
          </div>
        )}
      </PageFade>
    </Layout>
  );
}
