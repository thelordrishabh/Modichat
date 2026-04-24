import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function MobileLayout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "🏠", label: "Home" },
    { path: "/search", icon: "🔍", label: "Explore" },
    { path: "/messages", icon: "💬", label: "Inbox" },
    { path: `/profile/${user?._id}`, icon: "👤", label: "Profile" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pb-20">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
        <h1 className="text-xl font-black tracking-tighter dark:text-white">MODICHAT</h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleDark} className="text-xl">{dark ? "☀️" : "🌙"}</button>
          <button className="text-xl">➕</button>
        </div>
      </header>

      {/* Content Area */}
      <main className="w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-900 py-3 px-2">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex flex-col items-center gap-1 transition-all ${location.pathname === item.path ? "scale-110 opacity-100" : "opacity-40 grayscale"}`}
          >
            <span className="text-2xl">{item.icon}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
