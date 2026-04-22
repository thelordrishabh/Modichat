import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUser, getUserPosts, followUser, createConversation } from "../api";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          getUser(id),
          getUserPosts(id)
        ]);
        setProfileUser(userRes.data);
        setPosts(postsRes.data);
        setIsFollowing(userRes.data.followers?.includes(currentUser._id));
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, currentUser._id]);

  const handleFollow = async () => {
    try {
      await followUser(id);
      setIsFollowing(!isFollowing);
      setProfileUser(prev => ({
        ...prev,
        followers: isFollowing 
          ? prev.followers.filter(followerId => followerId !== currentUser._id)
          : [...prev.followers, currentUser._id]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessage = async () => {
    try {
      await createConversation(id);
      navigate("/messages");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) return <Layout><div className="text-center p-10 dark:text-white">User not found.</div></Layout>;

  return (
    <Layout>
      <div className="py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {profileUser.profilePicture ? (
              <img src={`http://localhost:5000${profileUser.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl text-gray-500 dark:text-gray-300">{profileUser.name[0]}</span>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h2 className="text-3xl font-light text-gray-900 dark:text-white">{profileUser.name}</h2>
              {currentUser._id !== profileUser._id ? (
                <div className="flex gap-2">
                  <button 
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-xl font-semibold transition ${
                      isFollowing 
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button 
                    onClick={handleMessage}
                    className="px-6 py-2 rounded-xl font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  >
                    Message
                  </button>
                </div>
              ) : (
                <button className="px-6 py-2 rounded-xl font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition">
                  Edit Profile
                </button>
              )}
            </div>

            <div className="flex justify-center md:justify-start gap-8 mb-4 text-gray-900 dark:text-white">
              <span className="text-lg"><strong className="font-semibold">{posts.length}</strong> posts</span>
              <span className="text-lg"><strong className="font-semibold">{profileUser.followers?.length || 0}</strong> followers</span>
              <span className="text-lg"><strong className="font-semibold">{profileUser.following?.length || 0}</strong> following</span>
            </div>
            
            <div className="text-gray-900 dark:text-white">
              <p>{profileUser.bio}</p>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No posts yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {posts.map(post => (
                <div key={post._id} className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden">
                  <img src={`http://localhost:5000${post.imageUrl}`} className="w-full h-full object-cover" alt="Post" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold">
                    <span className="flex items-center gap-2">❤️ {post.likes.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
