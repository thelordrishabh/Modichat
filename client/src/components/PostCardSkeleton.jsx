export default function PostCardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <div className="p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/4 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-5/6 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
