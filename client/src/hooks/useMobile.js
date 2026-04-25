import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;
const getIsMobile = () => {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
};

export default function useMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleResize = () => setIsMobile(mediaQuery.matches);

    handleResize();
    mediaQuery.addEventListener?.("change", handleResize);
    mediaQuery.addListener?.(handleResize);

    return () => {
      mediaQuery.removeEventListener?.("change", handleResize);
      mediaQuery.removeListener?.(handleResize);
    };
  }, []);

  return isMobile;
}
