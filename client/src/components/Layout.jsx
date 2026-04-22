import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import CreatePostModal from "./CreatePostModal";
import UserSearch from "./UserSearch";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Search", action: () => setIsSearchOpen(true), icon: "🔍" },
    { name: "Messages", path: "/messages", icon: "💬" },
    { name: "Create", action: () => setIsCreateOpen(true), icon: "➕" },
    { name: "Profile", path: `/profile/${user?._id}`, icon: "👤" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 fixed top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 shadow-sm z-10">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">MODICHAT</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            item.path ? (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition ${
                  location.pathname === item.path
                    ? "bg-gray-100 dark:bg-gray-700 font-semibold"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                } text-gray-900 dark:text-gray-100`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-lg">{item.name}</span>
              </Link>
            ) : (
              <button
                key={item.name}
                onClick={item.action}
                className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-lg">{item.name}</span>
              </button>
            )
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <button
            onClick={toggleDark}
            className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
          >
            <span className="text-xl">{dark ? "☀️" : "🌙"}</span>
            <span className="text-lg">Theme</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          >
            <span className="text-xl">🚪</span>
            <span className="text-lg">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>

      {/* Modals */}
      {isCreateOpen && <CreatePostModal onClose={() => setIsCreateOpen(false)} />}
      {isSearchOpen && <UserSearch onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
}
