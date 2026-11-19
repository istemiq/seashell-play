import { AppLauncher } from '@capacitor/app-launcher';

import { apiUrl } from '../api/apiUrl.js';
import { setPlatformUserId } from './platformUser.js';
import { isCapacitorNative } from './runtime.js';

const TOKEN_KEY = 'seashell.tgLink.token';
const UID_KEY = 'seashell.tgLink.uid';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

export function getTgLinkToken() {
  try {
    return String(localStorage.getItem(TOKEN_KEY) ?? '').trim() || null;
  } catch {
    return null;
  }
}

export function getTgLinkUserId() {
  try {
    const n = parseInt(String(localStorage.getItem(UID_KEY) ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function hasTgLinkSession() {
  return Boolean(getTgLinkToken());
}

export function clearTgLinkSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(UID_KEY);
  } catch {
    /* private mode */
  }
}

function saveTgLinkSession(token, userId) {
  localStorage.setItem(TOKEN_KEY, String(token));
  localStorage.setItem(UID_KEY, String(userId));
}

/**
 * Вход через TG-бота: просим код → открываем t.me-ссылку →
 * юзер жмёт Start в боте → поллим до подтверждения → сессия та же, что в Mini App.
 * @returns {Promise<{userId:number}>}
 */
export async function signInWithTelegramLink() {
  const start = await fetch(apiUrl('/auth/telegram-link'), { method: 'POST' });
  if (!start.ok) throw new Error('Telegram sign-in is unavailable');
  const { code, url } = await start.json();
  if (!code || !url) throw new Error('Telegram sign-in is unavailable');

  // В WebView window.open наружу не работает — только нативный intent.
  if (isCapacitorNative()) {
    await AppLauncher.openUrl({ url }).catch(() => {
      window.open(url, '_blank');
    });
  } else {
    window.open(url, '_blank');
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(apiUrl(`/auth/telegram-link/poll?code=${encodeURIComponent(code)}`));
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === 'linked' && data.token && data.userId) {
      saveTgLinkSession(data.token, data.userId);
      setPlatformUserId(data.userId);
      try {
        sessionStorage.removeItem('seashell.auth.signedOutOnce');
      } catch {
        /* ignore */
      }
      return { userId: data.userId };
    }
    if (data.status === 'expired') throw new Error('Login code expired — try again');
    if (Date.now() > deadline) throw new Error('Timed out waiting for Telegram confirmation');
  }
}
