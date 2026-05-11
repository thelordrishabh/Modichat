import { useEffect, useState } from "react";

const MAX_TILT = 15;
const LERP_SPEED = 0.08;
const subscribers = new Set();

const motionState = {
  tilt: { x: 0, y: 0 },
  targetTilt: { x: 0, y: 0 },
  isSupported: false,
  hasPermission: false,
  needsPermission: false,
  listening: false,
  frame: null
};

const clampTilt = (value) => Math.max(-MAX_TILT, Math.min(MAX_TILT, value || 0));

const canUseStorage = () => typeof window !== "undefined" && "localStorage" in window;

const publish = () => {
  subscribers.forEach((listener) => listener({ ...motionState, tilt: { ...motionState.tilt } }));
};

const tick = () => {
  motionState.tilt.x += (motionState.targetTilt.x - motionState.tilt.x) * LERP_SPEED;
  motionState.tilt.y += (motionState.targetTilt.y - motionState.tilt.y) * LERP_SPEED;
  publish();
  motionState.frame = window.requestAnimationFrame(tick);
};

const handleOrientation = (event) => {
  motionState.targetTilt = {
    x: clampTilt(event.gamma),
    y: clampTilt((event.beta || 0) - 45)
  };
};

const startListening = () => {
  if (typeof window === "undefined" || motionState.listening) return;

  window.addEventListener("deviceorientation", handleOrientation, { passive: true });
  motionState.listening = true;

  if (!motionState.frame) {
    motionState.frame = window.requestAnimationFrame(tick);
  }
};

const setPermissionGranted = () => {
  motionState.hasPermission = true;
  if (canUseStorage()) {
    window.localStorage.setItem("gyro-granted", "true");
    window.localStorage.removeItem("gyro-skipped");
  }
  startListening();
  publish();
};

const initializeMotionSupport = () => {
  if (typeof window === "undefined") return;

  const orientationEvent = window.DeviceOrientationEvent;
  motionState.isSupported = Boolean(orientationEvent);
  motionState.needsPermission = typeof orientationEvent?.requestPermission === "function";

  if (!motionState.isSupported) {
    publish();
    return;
  }

  if (canUseStorage() && window.localStorage.getItem("gyro-granted") === "true") {
    setPermissionGranted();
    return;
  }

  if (!motionState.needsPermission) {
    setPermissionGranted();
    return;
  }

  publish();
};

export function useGyroscope() {
  const [state, setState] = useState({
    tilt: motionState.tilt,
    isSupported: motionState.isSupported,
    hasPermission: motionState.hasPermission,
    needsPermission: motionState.needsPermission
  });

  useEffect(() => {
    initializeMotionSupport();
    const listener = (nextState) => {
      setState({
        tilt: nextState.tilt,
        isSupported: nextState.isSupported,
        hasPermission: nextState.hasPermission,
        needsPermission: nextState.needsPermission
      });
    };

    subscribers.add(listener);
    listener(motionState);

    return () => {
      subscribers.delete(listener);
    };
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !window.DeviceOrientationEvent) return false;

    if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
      try {
        const permission = await window.DeviceOrientationEvent.requestPermission();
        if (permission === "granted") {
          setPermissionGranted();
          return true;
        }
      } catch (err) {
        console.error("Gyroscope permission denied:", err);
      }
      return false;
    }

    setPermissionGranted();
    return true;
  };

  return { ...state, requestPermission };
}
