import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function LetterboxModal({ open, targetUser, initialGuestData, onSubmit, onSkip, onClose }) {
  const [guestName, setGuestName] = useState("");
  const [guestInstagram, setGuestInstagram] = useState("");

  useEffect(() => {
    if (!open) return;
    setGuestName(initialGuestData?.guestName || "");
    setGuestInstagram(initialGuestData?.guestInstagram || "");
  }, [open, initialGuestData]);

  if (!open || !targetUser) return null;

  const isSubmitEnabled = guestName.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubmitEnabled) return;

    const cleanName = guestName.trim();
    const cleanHandle = guestInstagram.trim().replace(/^@+/, "");
    onSubmit({ guestName: cleanName, guestInstagram: cleanHandle || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all duration-200 ease-out dark:bg-gray-900 animate-modal-enter">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Who's visiting?</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Let {targetUser.name} know who you are</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <Avatar user={targetUser} size="h-16 w-16" textSize="text-3xl" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">You're about to visit</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{targetUser.name}'s profile</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-gray-700 dark:text-gray-200">
          <p className="text-base font-medium">Tell them who you are</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your name is required so the profile owner can see your visit.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Your Name</span>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Your Instagram Username</span>
            <input
              value={guestInstagram}
              onChange={(e) => setGuestInstagram(e.target.value)}
              placeholder="@yourusername"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Instagram suggestions are disabled to avoid showing irrelevant handles.
          </p>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={!isSubmitEnabled}
              className="flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Visit Profile →
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Skip and visit anonymously
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
