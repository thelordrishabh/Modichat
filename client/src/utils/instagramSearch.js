const rawBackendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BACKEND_URL = rawBackendUrl.replace(/\/api\/?$/, "");

export const getInstagramAvatarUrl = (username) => {
  const cleanUsername = username.replace("@", "").trim().toLowerCase();
  return `${BACKEND_URL}/api/users/instagram-avatar/${encodeURIComponent(cleanUsername)}`;
};

export const searchInstagramUsers = async (query) => {
  if (!query || query.length < 2) return [];

  const username = query.replace("@", "").trim().toLowerCase();
  if (!username) return [];

  const avatarUrl = getInstagramAvatarUrl(username);

  try {
    const response = await fetch(avatarUrl, { method: "HEAD" });

    if (response.ok) {
      return [{
        username,
        avatarUrl,
        displayName: username,
        isReal: true
      }];
    }

    return [];
  } catch {
    return [{
      username,
      avatarUrl,
      displayName: username,
      isReal: false
    }];
  }
};
