import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import {
  followUser,
  getNearbyUsers,
  updateLocationVisibility,
  updateMyLocation
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const MotionDiv = motion.div;
const RADIUS_OPTIONS = [100, 500, 1000, 2000, 5000, 10000, 25000, 50000];

const radiusLabel = (value) => {
  if (value < 1000) return `${value} m`;
  const kilometres = value / 1000;
  return `${Number.isInteger(kilometres) ? kilometres : kilometres.toFixed(1)} km`;
};

const getPosition = () =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5000
    });
  });

const getGeolocationError = (error) => {
  if (error?.code === 1) return "Location permission was denied. Please enable it in your browser settings.";
  if (error?.code === 2) return "Your location is unavailable right now. Try again in a moment.";
  if (error?.code === 3) return "Location lookup timed out. Please try again.";
  return "Unable to access location.";
};

const getBadgeClass = (distance) => {
  if (distance < 100) return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30";
  if (distance < 500) return "bg-fuchsia-500/15 text-fuchsia-100 ring-1 ring-fuchsia-300/30";
  if (distance < 2000) return "bg-sky-500/15 text-sky-100 ring-1 ring-sky-300/30";
  return "bg-white/10 text-white/70 ring-1 ring-white/15";
};

const getBadgeLabel = (user) => {
  if (user.distance < 50) return "Less than 50 metres";
  if (user.distance < 100) return "Very close!";
  return user.distanceLabel;
};

const isRecentlySeen = (lastSeen = "") => {
  if (lastSeen === "Just now") return true;
  const match = lastSeen.match(/^(\d+) mins? ago$/);
  return match ? Number(match[1]) <= 5 : false;
};

export default function Nearby() {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [coords, setCoords] = useState(null);
  const [radiusIndex, setRadiusIndex] = useState(4);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [locationMode, setLocationMode] = useState("everyone");
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const watchIdRef = useRef(null);
  const debounceRef = useRef(null);
  const latestCoordsRef = useRef(null);
  const locationModeRef = useRef(locationMode);

  const radius = RADIUS_OPTIONS[radiusIndex];
  const followingIds = useMemo(() => (user?.following || []).map(String), [user?.following]);

  const turnOffLocation = useCallback((useKeepalive = false) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!token) return Promise.resolve();

    if (useKeepalive) {
      return fetch(`${import.meta.env.VITE_API_URL || ""}`.replace(/\/+$/, "").replace(/\/api$/, "") + "/api/location/visibility", {
        method: "PUT",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ locationMode: "off" })
      }).catch(() => {});
    }

    return updateLocationVisibility("off").catch(() => {});
  }, [token]);

  const fetchNearby = useCallback(async (nextRadius = radius, nextCoords = latestCoordsRef.current) => {
    if (!nextCoords) return;
    setLoading(true);
    try {
      const { data } = await getNearbyUsers({
        radius: nextRadius,
        latitude: nextCoords.latitude,
        longitude: nextCoords.longitude
      });
      setNearbyUsers(data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load nearby people");
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const sendLocationUpdate = useCallback(async (nextCoords) => {
    latestCoordsRef.current = nextCoords;
    setCoords(nextCoords);
    if (locationModeRef.current === "off") {
      await fetchNearby(radius, nextCoords);
      return;
    }
    try {
      await updateMyLocation(nextCoords);
      await fetchNearby(radius, nextCoords);
    } catch (err) {
      if (err.response?.status !== 429) {
        toast.error(err.response?.data?.message || "Could not update your location");
      }
    }
  }, [fetchNearby, radius]);

  const enableLocation = async () => {
    if (!navigator.geolocation) {
      setPermissionError("This browser does not support location services.");
      return;
    }

    setPermissionError("");
    try {
      const position = await getPosition();
      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      setEnabled(true);
      setLocationMode("everyone");
      locationModeRef.current = "everyone";
      await sendLocationUpdate(nextCoords);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (nextPosition) => {
          sendLocationUpdate({
            latitude: nextPosition.coords.latitude,
            longitude: nextPosition.coords.longitude
          });
        },
        (error) => setPermissionError(getGeolocationError(error)),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000
        }
      );
    } catch (error) {
      setPermissionError(getGeolocationError(error));
    }
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      await updateLocationVisibility(locationMode);
      locationModeRef.current = locationMode;
      if (locationMode === "off") {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (latestCoordsRef.current) await fetchNearby(radius, latestCoordsRef.current);
      } else if (coords) {
        await sendLocationUpdate(coords);
      }
      setPrivacyOpen(false);
      toast.success("Privacy settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      await followUser(targetUserId);
      toast.success("Follow updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not follow user");
    }
  };

  useEffect(() => {
    locationModeRef.current = locationMode;
  }, [locationMode]);

  useEffect(() => {
    if (!enabled || !latestCoordsRef.current) return undefined;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNearby(radius, latestCoordsRef.current);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [enabled, fetchNearby, radius]);

  useEffect(() => {
    if (!socket || !enabled) return undefined;
    const refetch = () => fetchNearby(radius, latestCoordsRef.current);
    const onLeave = ({ userId }) => {
      setNearbyUsers((prev) => prev.filter((entry) => String(entry._id) !== String(userId)));
    };

    socket.on("location:update", refetch);
    socket.on("location:join", refetch);
    socket.on("location:leave", onLeave);

    return () => {
      socket.off("location:update", refetch);
      socket.off("location:join", refetch);
      socket.off("location:leave", onLeave);
    };
  }, [enabled, fetchNearby, radius, socket]);

  useEffect(() => {
    const handleUnload = () => {
      turnOffLocation(true);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      turnOffLocation(false);
    };
  }, [turnOffLocation]);

  if (!enabled) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[72vh] w-full max-w-2xl items-center justify-center px-2">
          <section className="glass-panel w-full rounded-3xl border border-white/15 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-fuchsia-500/20 text-5xl shadow-[0_0_60px_rgba(217,70,239,0.65)]">
              📍
            </div>
            <h1 className="mt-6 text-3xl font-black text-white">Find people nearby</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/68">
              See other Modichat users who are close to you right now. Your location is only shared while you have this page open.
            </p>
            {permissionError ? (
              <div className="mt-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">
                <div className="text-2xl">🔒</div>
                <p className="mt-2 font-semibold">Location access needed</p>
                <p className="mt-1 text-red-100/80">{permissionError}</p>
                <details className="mt-3 text-left text-xs text-red-50/80">
                  <summary className="cursor-pointer font-semibold">How to enable</summary>
                  <p className="mt-2">Chrome: open site settings from the address bar and allow Location. Safari: open Settings, Privacy & Security, Location Services, then allow your browser.</p>
                </details>
              </div>
            ) : null}
            <button
              type="button"
              onClick={enableLocation}
              className="liquid-button mt-7 min-h-12 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(236,72,153,0.35)]"
            >
              Enable Location
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-4 block w-full text-sm text-white/45 transition hover:text-white/75"
            >
              Maybe Later
            </button>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        count={nearbyUsers.length}
        locationMode={locationMode}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      <section className="glass-panel mt-5 rounded-3xl border border-white/15 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-white">
            Showing people within <span className="text-pink-200">{radiusLabel(radius)}</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/45">100 m</span>
            <input
              type="range"
              min="0"
              max={RADIUS_OPTIONS.length - 1}
              step="1"
              value={radiusIndex}
              onChange={(e) => setRadiusIndex(Number(e.target.value))}
              className="nearby-slider w-full min-w-48 accent-fuchsia-400"
              aria-label="Nearby distance filter"
            />
            <span className="text-xs text-white/45">50 km</span>
          </div>
        </div>
      </section>

      {loading && nearbyUsers.length === 0 ? (
        <div className="mt-8 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-300 border-t-transparent" />
        </div>
      ) : nearbyUsers.length === 0 ? (
        <EmptyState onIncrease={() => setRadiusIndex((prev) => Math.min(prev + 1, RADIUS_OPTIONS.length - 1))} />
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {nearbyUsers.map((nearbyUser) => {
              const isFollowing = followingIds.includes(String(nearbyUser._id));
              return (
                <MotionDiv
                  key={nearbyUser._id}
                  layout
                  initial={{ opacity: 0, y: -18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="glass-panel rounded-3xl border border-white/15 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <Avatar user={nearbyUser} size="h-14 w-14" textSize="text-xl" />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#17112f] ${isRecentlySeen(nearbyUser.lastSeen) ? "bg-emerald-400" : "bg-gray-400"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${nearbyUser._id}`} className="block truncate text-base font-bold text-white">
                        {nearbyUser.name}
                      </Link>
                      <p className="truncate text-sm text-white/50">@{nearbyUser.username || "user"}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${getBadgeClass(nearbyUser.distance)}`}>
                          {getBadgeLabel(nearbyUser)}
                        </span>
                        <span className="text-xs text-white/45">{nearbyUser.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {!isFollowing ? (
                      <button
                        type="button"
                        onClick={() => handleFollow(nearbyUser._id)}
                        className="min-h-11 flex-1 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-gray-950"
                      >
                        Follow
                      </button>
                    ) : null}
                    <Link
                      to={`/chat/${nearbyUser._id}`}
                      className="flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                    >
                      💬 Message
                    </Link>
                  </div>
                </MotionDiv>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {privacyOpen ? (
          <MotionDiv className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MotionDiv
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="glass-panel w-full max-w-md rounded-3xl border border-white/15 p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Who can see me</h2>
                <button type="button" onClick={() => setPrivacyOpen(false)} className="min-h-11 min-w-11 rounded-2xl bg-white/10 text-white">×</button>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ["everyone", "Everyone"],
                  ["friends", "People I follow"],
                  ["off", "Off (hidden)"]
                ].map(([value, label]) => (
                  <label key={value} className="flex min-h-11 items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                    <input type="radio" checked={locationMode === value} onChange={() => setLocationMode(value)} />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-100">
                I can only be seen while this page is open.
              </p>
              <button
                type="button"
                onClick={savePrivacy}
                disabled={savingPrivacy}
                className="liquid-button mt-4 min-h-12 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingPrivacy ? "Saving..." : "Save Privacy Settings"}
              </button>
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </Layout>
  );
}

function PageHeader({ count, locationMode, onOpenPrivacy }) {
  return (
    <section className="glass-panel rounded-3xl border border-white/15 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-pink-200/80">Nearby People</p>
          <h1 className="mt-1 text-3xl font-black text-white">{count} people nearby</h1>
          <p className="mt-2 text-sm text-white/55">
            Live distances update while this page stays open. Exact coordinates are never shown to other users.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="liquid-button flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-white/10 text-xl text-white"
          aria-label="Location privacy settings"
          title="Location privacy settings"
        >
          ⚙️
        </button>
      </div>
      {locationMode === "off" ? (
        <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-white/65">
          Hidden mode is on. You can see nearby people, but nobody can see you.
        </p>
      ) : null}
    </section>
  );
}

function EmptyState({ onIncrease }) {
  return (
    <section className="glass-panel mt-5 rounded-3xl border border-dashed border-white/20 p-10 text-center">
      <div className="radar-empty mx-auto">
        <span className="radar-ping radar-ping-a" />
        <span className="radar-ping radar-ping-b" />
        <span className="radar-ping radar-ping-c" />
        <span className="radar-dot" />
      </div>
      <h2 className="mt-8 text-2xl font-black text-white">No one nearby right now</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">Try increasing the distance or check back later.</p>
      <button
        type="button"
        onClick={onIncrease}
        className="mt-5 min-h-11 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-gray-950"
      >
        Increase radius
      </button>
    </section>
  );
}
