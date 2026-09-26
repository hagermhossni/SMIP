import { TRANSLATIONS } from './translations.js';

const STORAGE_KEY = 'smip.language';
const DEFAULT_LANGUAGE = 'en';

let currentLanguage = loadLanguage();

function loadLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'ar' ? 'ar' : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/** @returns {'en'|'ar'} the currently active UI language. */
export function getLanguage() {
  return currentLanguage;
}

/** @param {'en'|'ar'} lang */
export function setLanguage(lang) {
  currentLanguage = lang === 'ar' ? 'ar' : 'en';
  try {
    window.localStorage.setItem(STORAGE_KEY, currentLanguage);
  } catch {
    // Storage unavailable - the choice just won't persist across reloads,
    // which is an acceptable fallback (same pattern as tourStorage.js).
  }
}

/** @returns {boolean} true when Arabic (right-to-left) is active. */
export function isRTL() {
  return currentLanguage === 'ar';
}

/**
 * Looks up `key` in the active language, falling back to English and then
 * to the raw key itself so a missing translation never breaks the UI.
 * `vars` values are substituted for `{name}` placeholders in the string.
 * @param {string} key
 * @param {Object.<string, string|number>} [vars]
 */
export function t(key, vars) {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([name, value]) => {
      str = str.replace(`{${name}}`, String(value));
    });
  }
  return str;
}

const COORD_SYSTEM_KEYS = {
  cartesian: 'coordSystemCartesian',
  cylindrical: 'coordSystemCylindrical',
  spherical: 'coordSystemSpherical',
};

/**
 * Shared "Cartesian"/"Cylindrical"/"Spherical" word lookup, used by every
 * place that previously derived this from the system's own key via
 * `.charAt(0).toUpperCase() + .slice(1)` (MotionControls' Path Information,
 * StepByStepDerivation's law heading, etc.) - centralized here so all of
 * them translate consistently.
 * @param {'cartesian'|'cylindrical'|'spherical'} system
 */
export function coordSystemLabel(system) {
  const key = COORD_SYSTEM_KEYS[system];
  return key ? t(key) : system;
}
