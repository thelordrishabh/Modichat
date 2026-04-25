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
    const handleChange = () => setIsMobile(mediaQuery.matches);

    // Use only addEventListener (modern API). Fall back to addListener only if
    // addEventListener is unavailable (very old Safari). Never register both —
    // doing so causes the handler to fire twice on browsers that support both.
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (typeof mediaQuery.addListener === "function") {
      // eslint-disable-next-line no-restricted-properties
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isMobile;
}
