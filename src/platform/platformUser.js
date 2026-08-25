import { isPlayDevAuth } from './runtime.js';

const DEV_FALLBACK_USER_ID = Number(import.meta.env.VITE_PLAY_DEV_USER_ID) || 5000000001;

let platformUserIdFallback = null;

export function setPlatformUserId(id) {
  const n = id != null ? parseInt(String(id), 10) : NaN;
  platformUserIdFallback = Number.isFinite(n) && n > 0 ? n : null;
}

export function resolvePlatformUserId() {
  if (platformUserIdFallback) return platformUserIdFallback;
  if (isPlayDevAuth()) return DEV_FALLBACK_USER_ID;
  return null;
}
