import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({ onCreatePost, unreadMessages = 0 }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { dark, toggleDark } = useTheme();
  const location = useLocation();

  const guestNavItems = [
    { name: "Feed", path: "/", icon: "🏠" },
    { name: "Search", path: "/search", icon: "🔍" }
  ];

  const navItems = user
    ? [
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Search", path: "/search", icon: "🔍" },
        { name: "Trending", path: "/trending", icon: "🔥" },
        { name: "Events", path: "/events", icon: "📅" },
        { name: "Notifications", path: "/notifications", icon: "🔔", badge: unreadCount },
        { name: "Messages", path: "/messages", icon: "💬", badge: unreadMessages },
        { name: "Go Live", path: "/live", icon: "📡" },
        { name: "Create", action: onCreatePost, icon: "➕" },
        { name: "Profile", path: `/profile/${user?._id}`, icon: "👤" },
        { name: "Settings", path: "/settings", icon: "⚙️" }
      ]
    : guestNavItems;

  const isPathActive = (path) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/profile/")) return location.pathname.startsWith("/profile");
    return location.pathname.startsWith(path);
  };

  const renderItem = (item) => {
    const className = `flex min-h-11 items-center gap-4 rounded-2xl px-4 py-3 transition ${
      isPathActive(item.path)
        ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/70"
    }`;

    const content = (
      <>
        <span className="relative flex items-center justify-center text-2xl">
          {item.icon}
          {item.badge > 0 ? (
            <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold text-white">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          ) : null}
        </span>
        <span className="text-base font-medium">{item.name}</span>
      </>
    );

    if (item.path) {
      return (
        <Link key={item.name} to={item.path} className={className}>
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.name}
        type="button"
        onClick={item.action}
        disabled={!item.action}
        className={`${className} w-full disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {content}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">MODICHAT</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">@{user?.username || user?.name || "guest"}</p>
      </div>

      <nav className="flex-1 space-y-2">{navItems.map(renderItem)}</nav>

      <div className="mt-auto space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
        {!user ? (
          <>
            {renderItem({ name: "Log In", path: "/login", icon: "🔑" })}
            <Link
              to="/register"
              className="flex min-h-11 w-full items-center gap-4 rounded-2xl bg-black px-4 py-3 text-base font-medium text-white transition hover:bg-gray-800"
            >
              <span className="text-2xl">📝</span>
              Sign Up
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-base font-medium">Logout</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleDark}
          className="flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/70"
        >
          <span className="text-2xl">{dark ? "☀️" : "🌙"}</span>
          <span className="text-base font-medium">Theme</span>
        </button>
      </div>
    </aside>
  );
}
