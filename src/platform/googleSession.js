import { getApiBaseUrl } from '../api/apiUrl.js';
import { setPlatformUserId } from './platformUser.js';
import {
  getGoogleIdToken,
  hasGoogleSession,
  initGoogleAuthPlugin,
  signInWithGoogle,
} from './googleSignIn.js';
import { isPlayDevAuth } from './runtime.js';
import { loadGoogleProfile, saveGoogleProfile } from './googleAuthStore.js';

let sessionReady = false;
/** @type {Promise<void> | null} */
let sessionPromise = null;

function applySessionPayload(data) {
  const userId = Number(data.userId);
  if (!Number.isFinite(userId) || userId <= 0) throw new Error('Invalid session user id');
  setPlatformUserId(userId);
  const prev = loadGoogleProfile() || {};
  saveGoogleProfile({
    ...prev,
    userId,
    name: data.displayName ?? prev.name ?? null,
    displayName: data.displayName ?? null,
    needsOnboarding: Boolean(data.needsOnboarding),
    picture: data.avatarUrl ?? prev.picture,
  });
}

async function exchangeSessionWithApi() {
  const token = getGoogleIdToken();
  if (!token) throw new Error('Not signed in');

  if (isPlayDevAuth()) {
    const devId = Number(import.meta.env.VITE_PLAY_DEV_USER_ID) || 5000000001;
    setPlatformUserId(devId);
    saveGoogleProfile({
      ...(loadGoogleProfile() || {}),
      userId: devId,
    });
    return;
  }

  const res = await fetch(`${getApiBaseUrl()}/api/auth/google/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Google-Id-Token': token,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Auth failed (${res.status})`);
  }
  applySessionPayload(await res.json());
}

export function bootstrapGoogleSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      initGoogleAuthPlugin();
      if (!hasGoogleSession()) return;
      await exchangeSessionWithApi();
    })().finally(() => {
      sessionReady = true;
    });
  }
  return sessionPromise;
}

export function whenGoogleSessionReady() {
  if (sessionReady) return Promise.resolve();
  return bootstrapGoogleSession();
}

export async function completeGoogleSignIn() {
  await signInWithGoogle();
  await exchangeSessionWithApi();
  sessionReady = true;
}

export function isGoogleSessionReady() {
  return sessionReady && hasGoogleSession();
}

export function needsOnboarding() {
  return Boolean(loadGoogleProfile()?.needsOnboarding);
}
