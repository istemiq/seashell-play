const KEY = 'seashell.google.idToken';
const PROFILE_KEY = 'seashell.google.profile';

/** @typedef {{ sub?: string, email?: string, name?: string, picture?: string, userId?: number }} GoogleProfile */

export function loadGoogleIdToken() {
  try {
    return String(localStorage.getItem(KEY) ?? '').trim() || null;
  } catch {
    return null;
  }
}

export function saveGoogleIdToken(token) {
  if (!token) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, token);
}

export function loadGoogleProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @param {GoogleProfile | null} profile */
export function saveGoogleProfile(profile) {
  if (!profile) {
    localStorage.removeItem(PROFILE_KEY);
    return;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearGoogleAuth() {
  saveGoogleIdToken(null);
  saveGoogleProfile(null);
}
