export default function HighlightRow({ highlights = [], onSelect }) {
  if (!highlights.length) return null;

  return (
    <div className="mb-6 flex items-center gap-4 overflow-x-auto pb-2">
      {highlights.map((highlight) => (
        <button
          key={highlight._id}
          type="button"
          onClick={() => onSelect?.(highlight)}
          className="flex min-h-11 min-w-20 flex-col items-center gap-2"
        >
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600">
            {highlight.coverImage ? (
              <img
                src={highlight.coverImage}
                alt={highlight.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.querySelector(".highlight-fallback").style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="highlight-fallback h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              style={{ display: highlight.coverImage ? "none" : "flex" }}
            >
              {highlight.title?.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <span className="max-w-20 truncate text-xs text-gray-700 dark:text-gray-300">{highlight.title}</span>
        </button>
      ))}
    </div>
  );
}
