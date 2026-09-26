const STORAGE_KEY = 'smip.theme';

// Matches SMIP's existing, unmodified appearance (see style.css's :root
// block), so a user who never touches the theme control sees no change.
const DEFAULT_THEME = 'dark';

function loadTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' ? 'light' : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

let currentTheme = loadTheme();

/** @returns {'light'|'dark'} the currently active theme. */
export function getTheme() {
  return currentTheme;
}

/**
 * Applies `theme` immediately (via [data-theme] on <html>, which every
 * existing panel/button/input already re-colors through the CSS custom
 * properties in style.css) and persists it. Unlike the language switcher,
 * this never needs to rebuild anything - it's pure CSS, so the change is
 * instant with no loss of in-progress state (typed equations, open forms).
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
  currentTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = currentTheme;
  try {
    window.localStorage.setItem(STORAGE_KEY, currentTheme);
  } catch {
    // Storage unavailable - the choice just won't persist across reloads,
    // which is an acceptable fallback (same pattern as tourStorage.js).
  }
}

/**
 * Applies the stored (or default) theme to <html>. Call once at startup,
 * before the app renders, so the page never briefly flashes the wrong
 * theme before the user's saved choice takes effect.
 */
export function initTheme() {
  document.documentElement.dataset.theme = currentTheme;
}
