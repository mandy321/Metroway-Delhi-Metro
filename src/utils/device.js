/**
 * Device and standalone detection utilities for PWA/APK wrappers.
 */

export const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 1024
  );
};

export const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone ||
    document.referrer.includes("android-app://")
  );
};

/**
 * Trigger subtle haptic vibrations (Android only, fails silently on iOS/Desktop)
 * @param {number|number[]} pattern - vibration duration in ms or pattern array
 */
export const triggerHaptic = (pattern = 15) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Fail silently if blocked by security policies
    }
  }
};
