export default function LinkPreview({ preview }) {
  if (!preview?.url) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex min-h-11 items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {preview.image ? (
        <img src={preview.image} alt={preview.title || "Preview"} className="h-16 w-16 rounded-xl object-cover" />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{preview.title || preview.url}</p>
        <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{preview.description || preview.url}</p>
      </div>
    </a>
  );
}
