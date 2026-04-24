import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCurrentUser, updateProfile } from "../api";
import Avatar from "../components/Avatar";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || ""
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadCurrentUser = async () => {
      try {
        const { data } = await getCurrentUser();
        if (!isCancelled) {
          setForm({
            name: data.name || "",
            username: data.username || "",
            bio: data.bio || ""
          });
          updateUser(data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to load current user", err);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, [user?._id]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  const previewUser = avatarFile
    ? {
        ...user,
        avatar: avatarPreviewUrl,
        profilePicture: avatarPreviewUrl,
        name: form.name || user?.name
      }
    : removeAvatar
      ? { ...user, avatar: "", profilePicture: "", name: form.name || user?.name }
      : { ...user, name: form.name || user?.name };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("username", form.username);
    formData.append("bio", form.bio);
    formData.append("removeAvatar", String(removeAvatar));
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const { data } = await updateProfile(formData);
      updateUser(data);
      toast.success("Profile updated");
      navigate(`/profile/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update your name, username, bio, and profile photo.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar user={previewUser} size="h-20 w-20" textSize="text-2xl" />
              <div className="flex flex-wrap gap-3">
                <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                  Upload avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      setAvatarFile(e.target.files?.[0] || null);
                      setRemoveAvatar(false);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setRemoveAvatar(true);
                  }}
                  className="min-h-11 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Remove avatar
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="min-h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Username</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="min-h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio</span>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="min-h-11 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="min-h-11 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
