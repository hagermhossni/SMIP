/**
 * tourStorage
 * ----------------------------------------------------------------------
 * Tiny wrapper around localStorage for the Guided Tour's single stored
 * preference: whether the user checked "Don't show this again". Wrapped
 * in try/catch since localStorage can throw (privacy mode, disabled
 * storage, etc.) - in that case the tour simply falls back to showing
 * every time, which is the safe default.
 */
const STORAGE_KEY = 'smip.guidedTour.dismissed';

export function isTourDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTourDismissed(dismissed) {
  try {
    if (dismissed) {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable - nothing to do; the tour will just show again
    // next time, which is an acceptable fallback.
  }
}
