/**
 * Telegram Mini App WebView (официальный window.Telegram.WebApp).
 * @see https://core.telegram.org/bots/webapps
 */
import { initAppTheme } from '../utils/theme.js';

export function getWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function hasTelegramWebApp() {
  return Boolean(getWebApp());
}

export async function waitForTelegramSdk({ timeoutMs = 8000, intervalMs = 16 } = {}) {
  if (hasTelegramWebApp()) return true;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (hasTelegramWebApp()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return hasTelegramWebApp();
}

export function isTelegramWebApp() {
  return Boolean(getInitData());
}

/** Обычный браузер на :5174: SDK грузится, но initData нет. */
export function isBrowserDevMode() {
  if (typeof window === 'undefined') return false;
  if (getInitData()) return false;
  return window.parent === window;
}

export function initTelegramApp() {
  const wa = getWebApp();
  if (!wa) return false;
  try {
    wa.ready();
    wa.expand();
    if (wa.disableVerticalSwipes) wa.disableVerticalSwipes();
    applyTelegramViewportCss(wa);
    if (wa.onEvent) {
      wa.onEvent('viewportChanged', () => applyTelegramViewportCss(wa));
    }
    return true;
  } catch (e) {
    console.warn('[Seashell TG clean] init', e);
    return false;
  }
}

/** Call after screen unlock / returning from background. */
export function resumeTelegramApp() {
  const wa = getWebApp();
  if (!wa) return false;
  try {
    wa.ready?.();
    wa.expand?.();
    if (wa.disableVerticalSwipes) wa.disableVerticalSwipes();
    applyTelegramViewportCss(wa);
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      window.setTimeout(() => {
        try {
          wa.ready?.();
          wa.expand?.();
          applyTelegramViewportCss(wa);
        } catch {
          /* ignore */
        }
      }, 300);
    }
    return true;
  } catch (e) {
    console.warn('[Seashell TG clean] resume', e);
    return false;
  }
}

function applyTelegramViewportCss(wa) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const h = Number(wa?.viewportStableHeight ?? wa?.viewportHeight ?? 0);
  if (Number.isFinite(h) && h > 0) {
    root.style.setProperty('--ss-app-height', `${h}px`);
  }
}

export function getInitData() {
  return String(getWebApp()?.initData ?? '').trim();
}

export async function waitForInitData({ timeoutMs = 5000, intervalMs = 30 } = {}) {
  if (!hasTelegramWebApp()) return '';
  // В обычном браузере SDK есть, но initData не появится — не ждём зря.
  if (typeof window !== 'undefined' && window.parent === window) {
    const immediate = getInitData();
    if (!immediate) return '';
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = getInitData();
    if (data) return data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return getInitData();
}

export function getTelegramUser() {
  return getWebApp()?.initDataUnsafe?.user ?? null;
}

/** Open t.me link inside Telegram (e.g. @PremiumBot). */
export function openTelegramLink(url) {
  const wa = getWebApp();
  const target = String(url ?? '').trim();
  if (!target) return false;
  try {
    if (wa?.openTelegramLink) {
      wa.openTelegramLink(target);
      return true;
    }
    if (wa?.openLink) {
      wa.openLink(target);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function telegramUserToHomeProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    photo_200: undefined, // loaded via /api/user/avatar (initData photo_url is unreliable)
  };
}

const MOBILE_SIDE_FLOOR = 12;
const MOBILE_BOTTOM_FLOOR = 20;

export function getTelegramSafeAreaInsets() {
  const wa = getWebApp();
  const base = wa?.safeAreaInset ?? {};
  const content = wa?.contentSafeAreaInset ?? {};
  return {
    top: Math.max(base.top ?? 0, content.top ?? 0),
    left: Math.max(base.left ?? 0, content.left ?? 0, MOBILE_SIDE_FLOOR),
    right: Math.max(base.right ?? 0, content.right ?? 0, MOBILE_SIDE_FLOOR),
    bottom: Math.max(base.bottom ?? 0, content.bottom ?? 0, MOBILE_BOTTOM_FLOOR),
  };
}

export function applyTelegramTheme() {
  initAppTheme();
}
