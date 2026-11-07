import { loadSettings, updateSettings } from './settings.js';

export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';
export const THEME_SYSTEM = 'system';

const PAGE_BG = {
  light: '#f2f2f2',
  dark: '#0a0e14',
};

/** @type {Set<(theme: 'light' | 'dark') => void>} */
const listeners = new Set();

let themeChangedBound = false;

function getWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramColorScheme() {
  const scheme = getWebApp()?.colorScheme;
  return scheme === 'dark' ? THEME_DARK : THEME_LIGHT;
}

/** До загрузки SDK: system → prefers-color-scheme. */
export function resolveBootTheme(preference) {
  const pref = preference || THEME_SYSTEM;
  if (pref === THEME_DARK) return THEME_DARK;
  if (pref === THEME_LIGHT) return THEME_LIGHT;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
    return THEME_DARK;
  }
  return THEME_LIGHT;
}

export function resolveEffectiveTheme(preference) {
  const pref = preference || loadSettings().theme || THEME_SYSTEM;
  if (pref === THEME_SYSTEM) {
    if (getWebApp()) return getTelegramColorScheme();
    return resolveBootTheme(THEME_SYSTEM);
  }
  return pref === THEME_DARK ? THEME_DARK : THEME_LIGHT;
}

export function applyAppTheme(effectiveTheme) {
  if (typeof document === 'undefined') return effectiveTheme;
  const theme = effectiveTheme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  const root = document.documentElement;
  root.dataset.seashellTheme = theme;
  root.style.colorScheme = theme;
  const computedBg = getComputedStyle(root).getPropertyValue('--ss-page-bg').trim();
  const pageBg = computedBg || PAGE_BG[theme];
  root.style.background = pageBg;
  if (document.body) {
    document.body.style.background = pageBg;
  }

  const wa = getWebApp();
  if (wa) {
    try {
      if (wa.setBackgroundColor) wa.setBackgroundColor(pageBg);
      if (wa.setHeaderColor) wa.setHeaderColor(pageBg);
    } catch {
      /* ignore */
    }
  }

  listeners.forEach((fn) => fn(theme));
  return theme;
}

function bindTelegramThemeChanged() {
  if (themeChangedBound) return;
  const wa = getWebApp();
  if (!wa?.onEvent) return;
  themeChangedBound = true;
  wa.onEvent('themeChanged', () => {
    if (loadSettings().theme === THEME_SYSTEM) {
      applyAppTheme(resolveEffectiveTheme(THEME_SYSTEM));
    }
  });
}

export function subscribeAppTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshAppTheme() {
  return applyAppTheme(resolveEffectiveTheme(loadSettings().theme));
}

export function initAppTheme() {
  bindTelegramThemeChanged();
  return refreshAppTheme();
}

export function setThemePreference(preference) {
  updateSettings({ theme: preference });
  bindTelegramThemeChanged();
  return applyAppTheme(resolveEffectiveTheme(preference));
}
