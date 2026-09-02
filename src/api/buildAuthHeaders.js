import { setPlatformUserId, resolvePlatformUserId } from '../platform/platformUser.js';
import { getGoogleIdToken, hasGoogleSession } from '../platform/googleSignIn.js';
import { whenGoogleSessionReady } from '../platform/googleSession.js';
import { loadGoogleProfile } from '../platform/googleAuthStore.js';
import { isPlayDevAuth } from '../platform/runtime.js';
import { loadSettings } from '../utils/settings.js';
import { normalizeUiLocale } from '../i18n/config.js';
import { resolveContentLocaleForApi } from '../utils/contentLocale.js';
import { resolvePracticeLevelForApi } from '../utils/practiceLevel.js';
import { normalizeLearnLocale } from '../i18n/learnLocales.js';

/** Auth headers for Google Play build (Google ID token + platform user id). */
let cachedHeaders = null;
let cachedHeadersAt = 0;
const HEADERS_CACHE_MS = 30_000;

export async function buildAuthHeaders() {
  const now = Date.now();
  if (cachedHeaders && now - cachedHeadersAt < HEADERS_CACHE_MS) {
    return { ...cachedHeaders };
  }

  await whenGoogleSessionReady();
  const token = getGoogleIdToken();
  if (!token && !isPlayDevAuth()) {
    throw new Error('Not signed in with Google');
  }

  const profile = loadGoogleProfile();
  const userId = profile?.userId ?? resolvePlatformUserId();
  if (!userId) {
    throw new Error('User session is not ready');
  }
  setPlatformUserId(userId);

  const uiLocale = normalizeUiLocale(loadSettings().uiLocale);
  let contentLocale = resolveContentLocaleForApi();
  const targetLang = normalizeLearnLocale(loadSettings().learnLocale);
  if (targetLang === 'ba' && contentLocale === 'en') {
    contentLocale = 'ru';
  }

  cachedHeaders = {
    'Content-Type': 'application/json',
    'X-Platform-User-Id': String(userId),
    'X-UI-Locale': uiLocale,
    'X-Content-Locale': contentLocale,
    'X-Target-Lang': targetLang,
    'X-Practice-Level': resolvePracticeLevelForApi(),
    ...(token ? { 'X-Google-Id-Token': token } : null),
    ...(String(import.meta.env.VITE_PLAY_APP_SECRET ?? '').trim()
      ? { 'X-Play-App-Secret': String(import.meta.env.VITE_PLAY_APP_SECRET).trim() }
      : null),
  };
  cachedHeadersAt = now;
  return { ...cachedHeaders };
}

export function invalidateAuthHeadersCache() {
  cachedHeaders = null;
  cachedHeadersAt = 0;
}

export function isAuthenticatedForApi() {
  return hasGoogleSession();
}
