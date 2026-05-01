import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import { resolveInstagramProfile, searchInstagramProfiles } from "../api";

export default function LetterboxModal({ open, targetUser, initialGuestData, onSubmit, onSkip, onClose }) {
  const [guestName, setGuestName] = useState("");
  const [guestInstagram, setGuestInstagram] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [instagramError, setInstagramError] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const normalizedHandle = useMemo(
    () => guestInstagram.trim().replace(/^@+/, "").toLowerCase(),
    [guestInstagram]
  );

  useEffect(() => {
    if (!open) return;
    setGuestName(initialGuestData?.guestName || "");
    setGuestInstagram(initialGuestData?.guestInstagram || "");
    setSuggestions([]);
    setSelectedSuggestion(null);
    setInstagramError("");
  }, [open, initialGuestData]);

  if (!open || !targetUser) return null;

  const isSubmitEnabled = guestName.trim().length > 0;
  const showSuggestions = normalizedHandle.length >= 2 && suggestions.length > 0;

  const resolveTypedHandle = async (handle) => {
    const cleanHandle = handle.trim().replace(/^@+/, "");
    if (!cleanHandle) return null;
    const { data } = await resolveInstagramProfile(cleanHandle);
    return data;
  };

  const handleSuggestionSelect = (profile) => {
    setGuestInstagram(profile.username);
    setSelectedSuggestion(profile);
    setSuggestions([]);
    setInstagramError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubmitEnabled || isResolving) return;

    const cleanName = guestName.trim();
    const cleanHandle = guestInstagram.trim();

    if (!cleanHandle) {
      onSubmit({ guestName: cleanName, guestInstagram: null });
      return;
    }

    setInstagramError("");
    setIsResolving(true);
    try {
      const resolved = await resolveTypedHandle(cleanHandle);
      setGuestInstagram(resolved.username);
      setSelectedSuggestion(resolved);
      onSubmit({
        guestName: cleanName,
        guestInstagram: resolved.username
      });
    } catch (err) {
      const errorCode = err?.response?.data?.code;
      if (errorCode === "IG_CONFIG_MISSING") {
        setInstagramError("Instagram validation is temporarily unavailable. You can still continue without Instagram.");
      } else {
        setInstagramError("This Instagram username does not exist. Pick a valid suggestion or enter a real handle.");
      }
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    if (!open || normalizedHandle.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await searchInstagramProfiles(normalizedHandle);
        if (!cancelled) {
          setSuggestions(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setSuggestions([]);
          if (err?.response?.data?.code === "IG_CONFIG_MISSING") {
            setInstagramError("Instagram suggestions are unavailable right now. You can continue without Instagram.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [normalizedHandle, open]);

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
              onChange={(e) => {
                setGuestInstagram(e.target.value);
                setInstagramError("");
                setSelectedSuggestion(null);
              }}
              placeholder="@yourusername"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>

          {isSearching ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Checking Instagram profiles...</p>
          ) : null}

          {showSuggestions ? (
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              {suggestions.map((profile) => (
                <button
                  key={profile.username}
                  type="button"
                  onClick={() => handleSuggestionSelect(profile)}
                  className="flex w-full items-center gap-3 border-b border-gray-200 px-3 py-2 text-left last:border-b-0 hover:bg-white dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <img
                    src={profile.profilePicUrl}
                    alt={profile.username}
                    className="h-9 w-9 rounded-full border border-gray-200 object-cover dark:border-gray-600"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {profile.username}
                      {profile.isVerified ? " ✓" : ""}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{profile.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {selectedSuggestion?.profilePicUrl ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <img
                src={selectedSuggestion.profilePicUrl}
                alt={selectedSuggestion.username}
                className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-600"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedSuggestion.username}
                  {selectedSuggestion.isVerified ? " ✓" : ""}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{selectedSuggestion.fullName}</p>
              </div>
            </div>
          ) : null}

          {instagramError ? (
            <p className="text-sm font-medium text-red-500">{instagramError}</p>
          ) : null}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={!isSubmitEnabled || isResolving}
              className="flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResolving ? "Verifying Instagram..." : "Visit Profile →"}
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
