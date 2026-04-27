import Avatar from "./Avatar";

export default function StoryRow({ stories = [], onOpenStory, onCreateStory }) {
  return (
    <div className="mb-4 rounded-3xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={onCreateStory}
          className="flex min-h-11 min-w-16 flex-col items-center gap-1"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-blue-500 text-xl text-blue-500">
            +
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Your story</span>
        </button>
        {stories.map((story) => (
          <button
            key={story._id}
            type="button"
            onClick={() => onOpenStory?.(story)}
            className="flex min-h-11 min-w-16 flex-col items-center gap-1"
          >
            <div className="relative rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-[2px]">
              <Avatar user={story.author} size="h-14 w-14" />
              {story.live ? <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-2 text-[10px] font-semibold text-white">LIVE</span> : null}
            </div>
            <span className="max-w-16 truncate text-xs text-gray-600 dark:text-gray-300">{story.author?.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
