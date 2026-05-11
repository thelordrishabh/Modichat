import Avatar from "./Avatar";

export default function StoryRow({ stories = [], onOpenStory, onCreateStory }) {
  return (
    <div className="glass-panel scroll-reveal mb-4 rounded-3xl border border-white/15 p-3 shadow-sm">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={onCreateStory}
          className="magnetic-link flex min-h-11 min-w-16 flex-col items-center gap-1"
        >
          <div className="story-ring flex h-14 w-14 items-center justify-center rounded-full text-xl text-white">
            +
          </div>
          <span className="text-xs text-white/75">Your story</span>
        </button>
        {stories.map((story) => (
          <button
            key={story._id}
            type="button"
            onClick={() => onOpenStory?.(story)}
            className="magnetic-link flex min-h-11 min-w-16 flex-col items-center gap-1"
          >
            <div className="story-ring relative rounded-full p-[2px]">
              <Avatar user={story.author} size="h-14 w-14" />
              {story.live ? <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-2 text-[10px] font-semibold text-white">LIVE</span> : null}
            </div>
            <span className="max-w-16 truncate text-xs text-white/75">{story.author?.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
