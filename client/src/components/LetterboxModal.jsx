import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { searchInstagramUsers } from "../utils/instagramSearch";

export default function LetterboxModal({ open, targetUser, initialGuestData, onSubmit, onSkip, onClose }) {
  const [guestName, setGuestName] = useState("");
  const [guestInstagram, setGuestInstagram] = useState("");
  const [instagramResults, setInstagramResults] = useState([]);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [selectedInstagramProfile, setSelectedInstagramProfile] = useState(null);
  const [showInstagramDropdown, setShowInstagramDropdown] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGuestName(initialGuestData?.guestName || "");
    setGuestInstagram(initialGuestData?.guestInstagram || "");
    setSelectedInstagramProfile(
      initialGuestData?.guestInstagram && initialGuestData?.guestInstagramAvatar
        ? {
            username: initialGuestData.guestInstagram.replace(/^@+/, ""),
            avatarUrl: initialGuestData.guestInstagramAvatar,
            displayName: initialGuestData.guestInstagram.replace(/^@+/, ""),
            isReal: true
          }
        : null
    );
    setInstagramResults([]);
    setShowInstagramDropdown(false);
    setProfileImageLoading(Boolean(initialGuestData?.guestInstagramAvatar));
  }, [open, initialGuestData]);

  useEffect(() => {
    if (!open) return undefined;

    const cleanQuery = guestInstagram.replace(/^@+/, "").trim().toLowerCase();
    if (cleanQuery.length < 2 || selectedInstagramProfile?.username === cleanQuery) {
      setInstagramResults([]);
      setInstagramLoading(false);
      return undefined;
    }

    let isCancelled = false;
    setInstagramLoading(true);
    setShowInstagramDropdown(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchInstagramUsers(cleanQuery);
        if (!isCancelled) {
          setInstagramResults(results);
        }
      } catch {
        if (!isCancelled) {
          setInstagramResults([]);
        }
      } finally {
        if (!isCancelled) {
          setInstagramLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [guestInstagram, open, selectedInstagramProfile]);

  if (!open || !targetUser) return null;

  const isSubmitEnabled = guestName.trim().length > 0;
  const cleanInstagramQuery = guestInstagram.replace(/^@+/, "").trim().toLowerCase();
  const shouldShowNoResults = !instagramLoading && cleanInstagramQuery.length >= 2 && instagramResults.length === 0 && !selectedInstagramProfile;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubmitEnabled) return;

    const cleanName = guestName.trim();
    const cleanHandle = selectedInstagramProfile?.username || guestInstagram.trim().replace(/^@+/, "");
    onSubmit({
      guestName: cleanName,
      guestInstagram: cleanHandle || null,
      guestInstagramAvatar: selectedInstagramProfile?.avatarUrl || null
    });
  };

  const handleInstagramInputChange = (e) => {
    setGuestInstagram(e.target.value);
    setSelectedInstagramProfile(null);
    setProfileImageLoading(false);
    if (e.target.value.replace(/^@+/, "").trim().length >= 2) {
      setShowInstagramDropdown(true);
    }
  };

  const handleInstagramSelect = (profile) => {
    setSelectedInstagramProfile(profile);
    setGuestInstagram(profile.username);
    setInstagramResults([]);
    setShowInstagramDropdown(false);
    setProfileImageLoading(true);
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

          <label className="relative block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Your Instagram Username</span>
            <input
              value={guestInstagram}
              onChange={handleInstagramInputChange}
              onFocus={() => {
                if (cleanInstagramQuery.length >= 2 && !selectedInstagramProfile) {
                  setShowInstagramDropdown(true);
                }
              }}
              placeholder="@yourusername"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {showInstagramDropdown && cleanInstagramQuery.length >= 2 && !selectedInstagramProfile ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                {instagramLoading ? (
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                ) : null}

                {!instagramLoading && instagramResults.map((profile) => (
                  <button
                    key={profile.username}
                    type="button"
                    onClick={() => handleInstagramSelect(profile)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div
                      className="hidden h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{
                        background: "linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)"
                      }}
                    >
                      {profile.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">@{profile.username}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">Instagram account found</p>
                    </div>
                  </button>
                ))}

                {shouldShowNoResults ? (
                  <div className="px-4 py-5 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                      @
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      No Instagram account found for @{cleanInstagramQuery}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Double check the spelling and try again
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </label>

          {selectedInstagramProfile ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="relative h-11 w-11 shrink-0">
                {profileImageLoading ? (
                  <div className="absolute inset-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                ) : null}
                <img
                  src={selectedInstagramProfile.avatarUrl}
                  alt={selectedInstagramProfile.username}
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover"
                  onLoad={() => setProfileImageLoading(false)}
                  onError={(e) => {
                    setProfileImageLoading(false);
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="hidden h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{
                    background: "linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)"
                  }}
                >
                  {selectedInstagramProfile.username[0].toUpperCase()}
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">@{selectedInstagramProfile.username}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  This profile picture will be shown with your visit.
                </p>
              </div>
            </div>
          ) : null}

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
