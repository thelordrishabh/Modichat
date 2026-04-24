import { getUserAvatar } from "../api";

export default function Avatar({
  user,
  size = "h-10 w-10",
  textSize = "text-base",
  className = "",
  alt
}) {
  const avatarUrl = getUserAvatar(user);
  const label = user?.name || user?.username || "User";

  return (
    <div
      className={`rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center ${size} ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={alt || `${label} avatar`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={`font-semibold text-gray-500 dark:text-gray-300 ${textSize}`}>
          {label.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
