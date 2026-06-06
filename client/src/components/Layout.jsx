import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useTheme } from "../context/ThemeContext";
import CreatePostModal from "./CreatePostModal";
import { getConversationSummaries } from "../api";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return undefined;

    const loadUnread = async () => {
      try {
        const { data } = await getConversationSummaries();
        const count = data.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);
        setUnreadMessages(count);
      } catch {
        setUnreadMessages(0);
      }
    };
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    return () => clearInterval(timer);
  }, [user]);

  const guestDesktopNavItems = [
    { name: "Feed", path: "/", icon: "🏠" },
    { name: "Search", path: "/search", icon: "🔍" }
  ];


  const guestMobileNavItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Search", path: "/search", icon: "🔍" },
    { name: "Log In", path: "/login", icon: "🔑" },
    { name: "Sign Up", path: "/register", icon: "📝" }
  ];

  const desktopNavItems = user
    ? [
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Search", path: "/search", icon: "🔍" },
        { name: "Nearby", path: "/nearby", icon: "📍" },
        { name: "Trending", path: "/trending", icon: "🔥" },
        { name: "Events", path: "/events", icon: "📅" },
        { name: "Notifications", path: "/notifications", icon: "🔔", badge: unreadCount },
        { name: "Messages", path: "/messages", icon: "💬", badge: unreadMessages },
        { name: "Go Live", path: "/live", icon: "📡" },
        { name: "Create", action: () => setIsCreateOpen(true), icon: "➕" },
        { name: "Profile", path: `/profile/${user?._id}`, icon: "👤" },
        { name: "Settings", path: "/settings", icon: "⚙️" }
      ]
    : guestDesktopNavItems;

  const mobileNavItems = user
    ? [
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Search", path: "/search", icon: "🔍" },
        { name: "Nearby", path: "/nearby", icon: "📍" },
        { name: "Create", action: () => setIsCreateOpen(true), icon: "➕" },
        { name: "Profile", path: `/profile/${user?._id}`, icon: "👤" }
      ]
    : guestMobileNavItems;

  const isPathActive = (path) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/profile/")) return location.pathname.startsWith("/profile");
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item, mobile = false) => {
    const sharedClassName = mobile
      ? `magnetic-link nav-link-lux flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition ${
          isPathActive(item.path)
            ? "is-active bg-white/15 text-white"
            : "text-white/65 hover:text-white"
        }`
      : `magnetic-link nav-link-lux flex min-h-11 items-center gap-4 rounded-2xl px-4 py-3 transition ${
          isPathActive(item.path)
            ? "is-active bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`;

    const content = (
      <>
        <div className="relative flex items-center justify-center">
          <span className={mobile ? "text-xl" : "text-2xl"}>{item.icon}</span>
          {item.badge > 0 ? (
            <span className="notification-wobble absolute -right-2 -top-2 min-w-5 rounded-full bg-pink-500 px-1.5 text-center text-[10px] font-bold text-white shadow-[0_0_18px_rgba(236,72,153,0.85)]">
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
    <div className="relative min-h-screen text-gray-100 transition-colors duration-300">
      <div className="flex min-h-screen">
        <aside className="glass-nav fixed left-0 top-0 z-40 hidden h-screen min-h-screen w-72 flex-col overflow-y-auto overflow-x-hidden p-5 md:flex">
        <div className="mb-8 px-2">
          <h1 className="brand-glow text-2xl font-bold tracking-tight text-white">MODICHAT</h1>
          <p className="mt-1 text-sm text-white/55">@{user?.username || user?.name || "public"}</p>
        </div>

        <nav className="flex-1 space-y-2">
          {desktopNavItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
          {user ? (
            <>
              <button
                onClick={toggleDark}
                className="magnetic-link nav-link-lux flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-2xl">{dark ? "☀️" : "🌙"}</span>
                <span className="text-base font-medium">Theme</span>
              </button>
              <button
                onClick={logout}
                className="magnetic-link nav-link-lux flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-pink-200 transition hover:bg-pink-500/15 hover:text-white"
              >
                <span className="text-2xl">🚪</span>
                <span className="text-base font-medium">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="magnetic-link nav-link-lux flex min-h-11 w-full items-center gap-4 rounded-2xl border border-white/15 px-4 py-3 text-center text-base font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-2xl">🔑</span>
                Log In
              </Link>
              <Link
                to="/register"
                className="magnetic-link liquid-button flex min-h-11 w-full items-center gap-4 rounded-2xl bg-white px-4 py-3 text-center text-base font-medium text-gray-950 transition"
              >
                <span className="text-2xl">📝</span>
                Sign Up
              </Link>
              <button
                onClick={toggleDark}
                className="magnetic-link nav-link-lux flex min-h-11 w-full items-center gap-4 rounded-2xl px-4 py-3 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-2xl">{dark ? "☀️" : "🌙"}</span>
                <span className="text-base font-medium">Theme</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="ml-0 min-h-screen flex-1 overflow-y-auto md:ml-72">
        <header className="glass-nav sticky top-0 z-20 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="brand-glow text-lg font-bold tracking-tight text-white">
              MODICHAT
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                className="liquid-button flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-white/15 text-xl text-white"
              >
                {dark ? "☀️" : "🌙"}
              </button>
              {user ? (
                <button
                  onClick={logout}
                  className="liquid-button flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-pink-500/20 text-xl text-white"
                >
                  🚪
                </button>
              ) : (
                <Link
                  to="/login"
                  className="liquid-button flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-white/15 text-xl text-white"
                >
                  🔑
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-4 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      </div>

      <nav className="glass-nav fixed inset-x-0 bottom-0 z-30 px-2 py-2 md:hidden">
        <div className="flex items-center gap-2">
          {mobileNavItems.map((item) => renderNavItem(item, true))}
        </div>
      </nav>

      {isCreateOpen ? <CreatePostModal onClose={() => setIsCreateOpen(false)} /> : null}
    </div>
  );
}
