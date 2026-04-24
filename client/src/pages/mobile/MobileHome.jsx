import { useEffect, useState } from "react";
import { getFeed } from "../../api";
import MobileLayout from "../../components/mobile/MobileLayout";
import MobilePostCard from "../../components/mobile/MobilePostCard";

export default function MobileHome() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await getFeed();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  return (
    <MobileLayout>
      {loading ? (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="animate-fade-in">
          {posts.map(post => <MobilePostCard key={post._id} post={post} />)}
        </div>
      )}
    </MobileLayout>
  );
}
