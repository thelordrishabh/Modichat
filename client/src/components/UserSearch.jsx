import { useState, useEffect } from "react";
import { searchUsers } from "../api";
import { Link } from "react-router-dom";

export default function UserSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const fetchUsers = async () => {
      try {
        const { data } = await searchUsers(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    };
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white px-2">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {results.map(user => (
            <Link 
              key={user._id} 
              to={`/profile/${user._id}`}
              onClick={onClose}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition"
            >
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img src={`http://localhost:5000${user.profilePicture}`} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-300 text-lg">{user.name[0]}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
              </div>
            </Link>
          ))}
          {query && results.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-4">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
