import { setPlatformUserId } from '../platform/platformUser.js';
import { getGoogleIdToken, hasGoogleSession } from '../platform/googleSignIn.js';
import { whenGoogleSessionReady } from '../platform/googleSession.js';
import { loadGoogleProfile } from '../platform/googleAuthStore.js';
import { isPlayDevAuth } from '../platform/runtime.js';
import { loadSettings } from '../utils/settings.js';
import { normalizeUiLocale } from '../i18n/config.js';
import { resolveContentLocaleForApi } from '../utils/contentLocale.js';
import { normalizeLearnLocale } from '../i18n/learnLocales.js';

/** Auth headers for Google Play build (Google ID token + platform user id). */
export async function buildAuthHeaders() {
  await whenGoogleSessionReady();
  const token = getGoogleIdToken();
  if (!token && !isPlayDevAuth()) {
    throw new Error('Not signed in with Google');
  }

  const profile = loadGoogleProfile();
  const userId = profile?.userId;
  if (!userId) {
    throw new Error('User session is not ready');
  }
  setPlatformUserId(userId);

  const uiLocale = normalizeUiLocale(loadSettings().uiLocale);
  const contentLocale = resolveContentLocaleForApi();
  const targetLang = normalizeLearnLocale(loadSettings().learnLocale);

  return {
    'Content-Type': 'application/json',
    'X-Platform-User-Id': String(userId),
    'X-UI-Locale': uiLocale,
    'X-Content-Locale': contentLocale,
    'X-Target-Lang': targetLang,
    ...(token ? { 'X-Google-Id-Token': token } : null),
  };
}

export function isAuthenticatedForApi() {
  return hasGoogleSession();
}
