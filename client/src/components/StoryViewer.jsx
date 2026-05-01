import { useEffect, useState } from "react";

export default function StoryViewer({ stories = [], initialIndex = 0, onClose, onView }) {
  const [index, setIndex] = useState(initialIndex);
  const active = stories[index];

  useEffect(() => {
    if (!active) return;
    onView?.(active);
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1 < stories.length ? prev + 1 : prev));
    }, 5000);
    return () => clearTimeout(timer);
  }, [active?._id]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="absolute left-4 right-4 top-4 flex gap-1">
        {stories.map((story, progressIndex) => (
          <div key={story._id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className={`h-full bg-white ${progressIndex <= index ? "w-full" : "w-0"}`} />
          </div>
        ))}
      </div>
      <button type="button" onClick={onClose} className="absolute right-4 top-6 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/50 text-2xl text-white">✕</button>
      <button type="button" onClick={() => setIndex((prev) => Math.max(0, prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-white">‹</button>
      <button type="button" onClick={() => setIndex((prev) => Math.min(stories.length - 1, prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl text-white">›</button>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-black">
        {active.mediaType === "video" ? (
          <video
            src={active.mediaUrl}
            className="max-h-[80vh] w-full object-cover"
            autoPlay muted controls
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <img
            src={active.mediaUrl}
            alt="Story"
            className="max-h-[80vh] w-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = "flex flex-col items-center justify-center h-64 gap-2";
              fallback.innerHTML = '<span style="font-size:3rem">🖼️</span><p style="color:#9ca3af;font-size:0.875rem">Image no longer available</p>';
              e.target.parentNode.appendChild(fallback);
            }}
          />
        )}
        {active.musicTrack?.title ? (
          <div className="flex items-center justify-between bg-black/70 px-3 py-2 text-xs text-white">
            <span>{active.musicTrack.title} - {active.musicTrack.artist}</span>
            {active.musicTrack.previewUrl ? <audio src={active.musicTrack.previewUrl} controls className="h-8" /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
