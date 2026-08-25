import { loadSettings, updateSettings } from './settings.js';

export const FONT_NORMAL = 'normal';
export const FONT_LARGE = 'large';
export const FONT_XLARGE = 'xlarge';

const SCALE_BY_PREF = {
  [FONT_NORMAL]: 1,
  [FONT_LARGE]: 1.14,
  [FONT_XLARGE]: 1.28,
};

/** @type {Set<(pref: string) => void>} */
const listeners = new Set();

export function resolveFontScale(preference) {
  const pref = preference || loadSettings().fontScale || FONT_NORMAL;
  return SCALE_BY_PREF[pref] ?? SCALE_BY_PREF[FONT_NORMAL];
}

export function normalizeFontScalePreference(value) {
  if (value === FONT_LARGE || value === FONT_XLARGE) return value;
  return FONT_NORMAL;
}

export function applyAppFontScale(preference) {
  if (typeof document === 'undefined') return FONT_NORMAL;
  const pref = normalizeFontScalePreference(preference);
  const root = document.documentElement;
  root.dataset.seashellFontScale = pref;
  root.style.setProperty('--ss-font-scale', String(resolveFontScale(pref)));
  listeners.forEach((fn) => fn(pref));
  return pref;
}

export function subscribeAppFontScale(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initAppFontScale() {
  return applyAppFontScale(loadSettings().fontScale);
}

export function setFontScalePreference(preference) {
  const pref = normalizeFontScalePreference(preference);
  updateSettings({ fontScale: pref });
  applyAppFontScale(pref);
  return pref;
}
