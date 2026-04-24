import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getUser,
  getUserPosts,
  followUser,
  createConversation,
  getAssetUrl,
  getUserFollowers,
  getUserFollowing,
  updateProfile
} from "../api";
import Avatar from "../components/Avatar";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreviewUrl, setEditAvatarPreviewUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsType, setConnectionsType] = useState("followers");
  const [connectionsUsers, setConnectionsUsers] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsActionUserId, setConnectionsActionUserId] = useState("");

  useEffect(() => {
    if (!editAvatarFile) {
      setEditAvatarPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(editAvatarFile);
    setEditAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editAvatarFile]);

  useEffect(() => {
    let isCancelled = false;

    const fetchProfile = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          getUser(id),
          getUserPosts(id)
        ]);
        if (!isCancelled) {
          setProfileUser(userRes.data);
          setPosts(postsRes.data);
          setIsFollowing((userRes.data.followers || []).some((followerId) => String(followerId) === String(currentUser._id)));
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    const handlePostCreated = () => {
      fetchProfile();
    };

    window.addEventListener("modichat:post-created", handlePostCreated);

    return () => {
      isCancelled = true;
      window.removeEventListener("modichat:post-created", handlePostCreated);
    };
  }, [id, currentUser._id]);

  const handleFollow = async () => {
    try {
      const { data } = await followUser(id);
      setIsFollowing(data.following);
      setProfileUser(data.profileUser);
      updateUser(data.currentUser);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = () => {
    setEditBio(profileUser?.bio || "");
    setEditAvatarFile(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditAvatarFile(null);
    setEditBio(profileUser?.bio || "");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const formData = new FormData();
    formData.append("bio", editBio);
    if (editAvatarFile) {
      formData.append("avatar", editAvatarFile);
    }

    try {
      const { data } = await updateProfile(formData);
      setProfileUser(data);
      updateUser(data);
      setIsEditModalOpen(false);
      setEditAvatarFile(null);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openConnectionsModal = async (type) => {
    setConnectionsType(type);
    setConnectionsUsers([]);
    setConnectionsLoading(true);
    setIsConnectionsModalOpen(true);

    try {
      const { data } = type === "followers" ? await getUserFollowers(id) : await getUserFollowing(id);
      setConnectionsUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setConnectionsLoading(false);
    }
  };

  const closeConnectionsModal = () => {
    setIsConnectionsModalOpen(false);
    setConnectionsType("followers");
    setConnectionsUsers([]);
    setConnectionsActionUserId("");
  };

  const isUserFollowedByCurrentUser = (targetUserId) =>
    (currentUser?.following || []).some((followedUserId) => String(followedUserId) === String(targetUserId));

  const handleConnectionFollowToggle = async (targetUserId) => {
    if (String(targetUserId) === String(currentUser._id)) return;

    try {
      setConnectionsActionUserId(targetUserId);
      const { data } = await followUser(targetUserId);
      updateUser(data.currentUser);

      if (String(targetUserId) === String(profileUser?._id)) {
        setIsFollowing(data.following);
        setProfileUser(data.profileUser);
      }

      setConnectionsUsers((prevUsers) =>
        prevUsers.map((listedUser) =>
          String(listedUser._id) === String(targetUserId)
            ? { ...listedUser, ...data.profileUser }
            : listedUser
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update follow status");
    } finally {
      setConnectionsActionUserId("");
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

  const editPreviewUser = editAvatarFile
    ? {
        ...profileUser,
        avatar: editAvatarPreviewUrl,
        profilePicture: editAvatarPreviewUrl
      }
    : profileUser;

  return (
    <Layout>
      <div className="py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          <Avatar user={profileUser} size="h-32 w-32 md:h-40 md:w-40" textSize="text-5xl" />
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-light text-gray-900 dark:text-white">{profileUser.name}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">@{profileUser.username || "user"}</p>
              </div>
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
                <button
                  onClick={openEditModal}
                  className="px-6 py-2 rounded-xl font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="flex justify-center md:justify-start gap-8 mb-4 text-gray-900 dark:text-white">
              <span className="text-lg"><strong className="font-semibold">{posts.length}</strong> posts</span>
              <button
                type="button"
                onClick={() => openConnectionsModal("followers")}
                className="text-lg transition hover:opacity-80"
              >
                <strong className="font-semibold">{profileUser.followers?.length || 0}</strong> followers
              </button>
              <button
                type="button"
                onClick={() => openConnectionsModal("following")}
                className="text-lg transition hover:opacity-80"
              >
                <strong className="font-semibold">{profileUser.following?.length || 0}</strong> following
              </button>
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
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
              {posts.map(post => (
                <div key={post._id} className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden">
                  <img src={getAssetUrl(post.imageUrl)} className="w-full h-full object-cover" alt="Post" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold">
                    <span className="flex items-center gap-2">❤️ {post.likes.length}</span>
                    <span className="flex items-center gap-2">💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-gray-800 md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar user={editPreviewUser} size="h-20 w-20" textSize="text-2xl" />
                <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                  Change avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio</span>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="min-h-11 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isConnectionsModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4"
          onClick={closeConnectionsModal}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-4 shadow-2xl dark:bg-gray-800 md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {connectionsType === "followers" ? "Followers" : "Following"}
              </h3>
              <button
                type="button"
                onClick={closeConnectionsModal}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto pb-2">
              {connectionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : connectionsUsers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No users found.
                </div>
              ) : (
                connectionsUsers.map((listedUser) => {
                  const isSelf = String(listedUser._id) === String(currentUser._id);
                  const isFollowed = isUserFollowedByCurrentUser(listedUser._id);

                  return (
                    <div
                      key={listedUser._id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar user={listedUser} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-900 dark:text-white">
                            {listedUser.name}
                          </div>
                          <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                            @{listedUser.username || "user"}
                          </div>
                        </div>
                      </div>

                      {isSelf ? (
                        <button
                          type="button"
                          disabled
                          className="min-h-11 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400"
                        >
                          You
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectionFollowToggle(listedUser._id)}
                          disabled={connectionsActionUserId === listedUser._id}
                          className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                            isFollowed
                              ? "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {connectionsActionUserId === listedUser._id
                            ? "Updating..."
                            : isFollowed
                              ? "Unfollow"
                              : "Follow"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
