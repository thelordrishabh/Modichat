import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useTheme } from "../context/ThemeContext";
import CreatePostModal from "./CreatePostModal";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const desktopNavItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Search", path: "/search", icon: "🔍" },
    { name: "Notifications", path: "/notifications", icon: "🔔", badge: unreadCount },
    { name: "Messages", path: "/messages", icon: "💬" },
    { name: "Create", action: () => setIsCreateOpen(true), icon: "➕" },
    { name: "Profile", path: `/profile/${user?._id}`, icon: "👤" }
  ];

  const mobileNavItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Search", path: "/search", icon: "🔍" },
    { name: "Create", action: () => setIsCreateOpen(true), icon: "➕" },
    { name: "Profile", path: `/profile/${user?._id}`, icon: "👤" }
  ];

  const isPathActive = (path) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/profile/")) return location.pathname.startsWith("/profile");
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item, mobile = false) => {
    const sharedClassName = mobile
      ? `flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition ${
          isPathActive(item.path)
            ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
            : "text-gray-500 dark:text-gray-400"
        }`
      : `flex min-h-11 items-center gap-4 rounded-2xl px-4 py-3 transition ${
          isPathActive(item.path)
            ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/70"
        }`;

    const content = (
      <>
        <div className="relative flex items-center justify-center">
          <span className={mobile ? "text-xl" : "text-2xl"}>{item.icon}</span>
          {item.badge > 0 ? (
            <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold text-white">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          ) : null}
        </div>
        <span className={mobile ? "text-[11px] font-medium" : "text-base font-medium"}>
          {item.name}
        </span>
      </>
    );

    if (item.path) {
      return (
        <Link key={item.name} to={item.path} className={sharedClassName}>
          {content}
        </Link>
      );
    }

    return (
      <button key={item.name} onClick={item.action} className={sharedClassName}>
        {content}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">MODICHAT</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">@{user?.username || user?.name}</p>
        </div>

        <nav className="flex-1 space-y-2">
          {desktopNavItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
          <button
            onClick={toggleDark}
            className="flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/70"
          >
            <span className="text-2xl">{dark ? "☀️" : "🌙"}</span>
            <span className="text-base font-medium">Theme</span>
          </button>
          <button
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="md:ml-72">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-800/95 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              MODICHAT
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-gray-100 text-xl text-gray-800 dark:bg-gray-700 dark:text-white"
              >
                {dark ? "☀️" : "🌙"}
              </button>
              <button
                onClick={logout}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-600 dark:bg-red-900/20 dark:text-red-400"
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-2 py-2 dark:border-gray-700 dark:bg-gray-900 md:hidden">
        <div className="flex items-center gap-2">
          {mobileNavItems.map((item) => renderNavItem(item, true))}
        </div>
      </nav>

      {isCreateOpen ? <CreatePostModal onClose={() => setIsCreateOpen(false)} /> : null}
    </div>
  );
}
