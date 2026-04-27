import { useEffect, useState } from "react";
import { searchMusicTracks } from "../api";

export default function MusicPicker({ onSelect }) {
  const [q, setQ] = useState("");
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (!q.trim()) {
      setTracks([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await searchMusicTracks(q.trim());
        setTracks(data);
      } catch (err) {
        console.error(err);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [q]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search music..."
        className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <div className="max-h-44 space-y-1 overflow-y-auto">
        {tracks.map((track, index) => (
          <button
            key={`${track.previewUrl}-${index}`}
            type="button"
            onClick={() => onSelect?.(track)}
            className="flex min-h-11 w-full items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <span>{track.title} - {track.artist}</span>
            {track.previewUrl ? <audio src={track.previewUrl} controls className="h-8" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
