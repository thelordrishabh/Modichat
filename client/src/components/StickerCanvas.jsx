import { useState } from "react";

const EMOJIS = ["😀", "😍", "🔥", "❤️", "😂", "🤩", "🥳", "😎", "👏", "🎉", "✨", "🌈", "🫶", "🥰", "🤍", "🐥", "🍕", "🌟", "💯", "🚀"];

export default function StickerCanvas({ onAddSticker }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="min-h-11 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        Emoji stickers
      </button>
      {open ? (
        <div className="mt-2 grid grid-cols-10 gap-1 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onAddSticker?.(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
