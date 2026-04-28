import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getUser,
  getUserPosts,
  followUser,
  createConversation,
  getAssetUrl,
  getUserFollowers,
  getUserFollowing,
  updateProfile,
  getHighlights,
  getLinkPreview,
  getMyProfileViews,
  trackProfileView,
  blockUser,
  unblockUser
} from "../api";
import Avatar from "../components/Avatar";
import GuestActionModal from "../components/GuestActionModal";
import Layout from "../components/Layout";
import PageFade from "../components/PageFade";
import { useAuth } from "../context/AuthContext";
import HighlightRow from "../components/HighlightRow";
import LinkPreview from "../components/LinkPreview";
import ReportModal from "../components/ReportModal";

const formatRelativeTime = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreviewUrl, setEditAvatarPreviewUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsType, setConnectionsType] = useState("followers");
  const [connectionsUsers, setConnectionsUsers] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsActionUserId, setConnectionsActionUserId] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [linkPreview, setLinkPreview] = useState(null);
  const [profileViewData, setProfileViewData] = useState({ weekCount: 0, viewers: [] });
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showGuestPostModal, setShowGuestPostModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isOwnProfile = currentUser && id ? String(currentUser._id) === String(id) : false;
  const isGuest = !currentUser;

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
        const [userRes, postsRes] = await Promise.all([getUser(id), getUserPosts(id)]);
        if (!isCancelled) {
          setProfileUser(userRes.data);
          setPosts(postsRes.data);
          setSelectedTab("posts");
          setIsFollowing(currentUser ? (userRes.data.followers || []).some((followerId) => String(followerId) === String(currentUser._id)) : false);
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
  }, [id, currentUser?._id]);

  useEffect(() => {
    if (!id) return;
    if (currentUser) {
      trackProfileView(id).catch(() => {});
    }
    getHighlights(id).then(({ data }) => setHighlights(data)).catch(() => setHighlights(null));
  }, [id, currentUser]);

  useEffect(() => {
    const dismissedProfiles = JSON.parse(localStorage.getItem('modichatDismissedProfileBanners') || '[]');
    setBannerDismissed(dismissedProfiles.includes(id));
  }, [id]);

  useEffect(() => {
    if (!isOwnProfile) return;
    getMyProfileViews().then(({ data }) => setProfileViewData(data)).catch(() => {});
  }, [isOwnProfile]);

  useEffect(() => {
    const urlMatch = (profileUser?.bio || "").match(/https?:\/\/[^\s]+/i);
    if (!urlMatch) {
      setLinkPreview(null);
      return;
    }
    getLinkPreview(urlMatch[0]).then(({ data }) => setLinkPreview(data)).catch(() => setLinkPreview(null));
  }, [profileUser?.bio]);

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
    setRemoveAvatar(false);
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
    formData.append("removeAvatar", String(removeAvatar));
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
    if (!currentUser || String(targetUserId) === String(currentUser._id)) return;

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
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <div className="space-y-6">
            <div className="h-56 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-52 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          </div>
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
    : removeAvatar
      ? { ...profileUser, avatar: "", profilePicture: "" }
      : profileUser;

  const savedPosts = profileUser.savedPosts || [];
  const displayPosts = selectedTab === "saved" ? savedPosts : posts;

  return (
    <Layout>
      <PageFade className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          <Avatar user={profileUser} size="h-32 w-32 md:h-40 md:w-40" textSize="text-5xl" />

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-light text-gray-900 dark:text-white">{profileUser.name}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">@{profileUser.username || "user"}</p>
              </div>
              {isOwnProfile ? (
                <button
                  onClick={openEditModal}
                  className="px-6 py-2 rounded-xl font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                >
                  Edit Profile
                </button>
              ) : currentUser ? (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-xl font-semibold transition ${
                      isFollowing
                        ? "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
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
                  <button
                    onClick={async () => {
                      if (isBlocked) {
                        await unblockUser(id);
                        setIsBlocked(false);
                        toast.success("User unblocked");
                      } else {
                        await blockUser(id);
                        setIsBlocked(true);
                        toast.success("User blocked");
                      }
                    }}
                    className="px-6 py-2 rounded-xl font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  >
                    {isBlocked ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-6 py-2 rounded-xl font-semibold bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 transition"
                  >
                    Report
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-4 text-gray-900 dark:text-white">
              <span className="text-lg"><strong className="font-semibold">{posts.length}</strong> posts</span>
              {currentUser ? (
                <>
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
                </>
              ) : (
                <>
                  <span className="text-lg"><strong className="font-semibold">{profileUser.followers?.length || 0}</strong> followers</span>
                  <span className="text-lg"><strong className="font-semibold">{profileUser.following?.length || 0}</strong> following</span>
                </>
              )}
            </div>

            <div className="text-gray-900 dark:text-white">
              <p>{profileUser.bio}</p>
              <LinkPreview preview={linkPreview} />
            </div>
          </div>
        </div>

        <HighlightRow highlights={highlights} />
        {!currentUser && !isOwnProfile && !bannerDismissed ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-5 py-4 text-sm text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Sign up to follow @{profileUser.username} and see their full content</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create your account to like, comment, and send messages.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dismissedProfiles = JSON.parse(localStorage.getItem('modichatDismissedProfileBanners') || '[]');
                    localStorage.setItem('modichatDismissedProfileBanners', JSON.stringify([...dismissedProfiles, id]));
                    setBannerDismissed(true);
                  }}
                  className="text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {isOwnProfile ? (
          <>
            <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {profileViewData.weekCount} people viewed your profile this week.
            </div>
            {profileViewData.viewers.length > 0 ? (
              <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Who Viewed My Profile</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latest 50 views, newest first.</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {profileViewData.viewers.length} recent views
                  </span>
                </div>
                <div className="space-y-3">
                  {profileViewData.viewers.map((entry) => {
                    const viewer = entry.viewer;
                    return (
                      <div key={entry._id} className="flex items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
                        <div className="flex items-center gap-3">
                          {viewer ? (
                            <Avatar user={viewer} />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-200 text-2xl text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                              👤
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                              {viewer ? (
                                <Link to={`/profile/${viewer._id}`} className="hover:underline">
                                  {viewer.name}
                                </Link>
                              ) : (
                                <span>{entry.guestName || "Anonymous visitor"}</span>
                              )}
                              {!viewer ? (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                                  Guest
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {viewer ? `@${viewer.username}` : entry.guestInstagram ? (
                                <a
                                  href={`https://instagram.com/${entry.guestInstagram.replace(/^@/, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline"
                                >
                                  {entry.guestInstagram}
                                </a>
                              ) : (
                                "Anonymous visitor"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(entry.viewedAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {isOwnProfile && (
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-3xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setSelectedTab("posts")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                selectedTab === "posts"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("saved")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                selectedTab === "saved"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Saved ({savedPosts.length})
            </button>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {selectedTab === "saved" ? "No saved posts yet." : "No posts yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
              {displayPosts.map((post) => (
                <button
                  key={post._id}
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      navigate(`/posts/${post._id}`);
                      return;
                    }
                    setShowGuestPostModal(true);
                  }}
                  className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden text-left"
                >
                  <img src={getAssetUrl(post.imageUrl)} className="w-full h-full object-cover" alt="Post" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold">
                    <span className="flex items-center gap-2">❤️ {post.likes.length}</span>
                    <span className="flex items-center gap-2">💬 {post.comments?.length || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
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
                      onChange={(e) => {
                        setEditAvatarFile(e.target.files?.[0] || null);
                        setRemoveAvatar(false);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAvatarFile(null);
                      setRemoveAvatar(true);
                    }}
                    className="min-h-11 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Remove avatar
                  </button>
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
                    const isSelf = currentUser && String(listedUser._id) === String(currentUser._id);
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
        <GuestActionModal
          open={isGuest && showGuestPostModal}
          action="view this post"
          onClose={() => setShowGuestPostModal(false)}
        />
        {showReportModal ? (
          <ReportModal targetType="user" targetId={profileUser._id} onClose={() => setShowReportModal(false)} />
        ) : null}
      </PageFade>
    </Layout>
  );
}
