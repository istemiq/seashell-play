import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

import { isPlayDevAuth } from './runtime.js';
import {
  clearGoogleAuth,
  loadGoogleIdToken,
  loadGoogleProfile,
  saveGoogleIdToken,
  saveGoogleProfile,
} from './googleAuthStore.js';
import { setPlatformUserId } from './platformUser.js';

const DEV_USER_ID = Number(import.meta.env.VITE_PLAY_DEV_USER_ID) || 5000000001;

let initialized = false;

export function initGoogleAuthPlugin() {
  if (initialized) return;
  const clientId = String(import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? '').trim();
  if (!clientId && !isPlayDevAuth()) return;
  if (clientId) {
    GoogleAuth.initialize({
      clientId,
      scopes: ['profile', 'email'],
      grantOfflineAccess: false,
    });
  }
  initialized = true;
}

export function hasGoogleSession() {
  return Boolean(loadGoogleIdToken());
}

export async function signInWithGoogle() {
  if (isPlayDevAuth()) {
    setPlatformUserId(DEV_USER_ID);
    saveGoogleProfile({ userId: DEV_USER_ID, email: 'dev@local' });
    saveGoogleIdToken('dev-token');
    return { idToken: 'dev-token', profile: loadGoogleProfile() };
  }

  initGoogleAuthPlugin();
  const result = await GoogleAuth.signIn();
  const idToken = result?.authentication?.idToken;
  if (!idToken) throw new Error('Google Sign-In did not return an id token');
  saveGoogleIdToken(idToken);
  saveGoogleProfile({
    sub: result.id,
    email: result.email,
    picture: result.imageUrl,
  });
  return { idToken, profile: loadGoogleProfile() };
}

export async function signOutGoogle() {
  clearGoogleAuth();
  setPlatformUserId(null);
  if (!isPlayDevAuth()) {
    try {
      await GoogleAuth.signOut();
    } catch {
      /* ignore */
    }
  }
}

export function getGoogleIdToken() {
  return loadGoogleIdToken();
}
