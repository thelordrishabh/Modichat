import { useEffect, useMemo, useState } from "react";
import { searchUsersForMentions } from "../api";

export default function MentionInput({ value, onChange, placeholder = "Type here..." }) {
  const [results, setResults] = useState([]);

  const mentionTrigger = useMemo(() => {
    const parts = value.split(" ");
    const lastPart = parts[parts.length - 1];
    if (lastPart.startsWith("@") && lastPart.length > 1) {
      return lastPart.slice(1);
    }
    return "";
  }, [value]);

  useEffect(() => {
    if (!mentionTrigger) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await searchUsersForMentions(mentionTrigger);
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [mentionTrigger]);

  const applyMention = (username) => {
    const parts = value.split(" ");
    parts[parts.length - 1] = `@${username}`;
    const nextValue = `${parts.join(" ")} `;
    onChange(nextValue);
    setResults([]);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      {results.length > 0 ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.map((user) => (
            <button
              key={user._id}
              type="button"
              onClick={() => applyMention(user.username)}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <span className="font-semibold">{user.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
