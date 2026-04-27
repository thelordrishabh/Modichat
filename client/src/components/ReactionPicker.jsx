const REACTIONS = [
  { key: "heart", emoji: "❤️" },
  { key: "laugh", emoji: "😂" },
  { key: "wow", emoji: "😮" },
  { key: "sad", emoji: "😢" },
  { key: "angry", emoji: "😡" },
  { key: "clap", emoji: "👏" }
];

export default function ReactionPicker({ onSelect }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {REACTIONS.map((reaction) => (
        <button
          key={reaction.key}
          type="button"
          onClick={() => onSelect?.(reaction.key)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl transition hover:scale-110"
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
}
