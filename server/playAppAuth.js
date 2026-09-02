/**
 * Seashell Play (Capacitor) → same API + DB as Telegram Mini App.
 * Production: PLAY_APP_SECRET + X-Play-App-Secret + X-Platform-User-Id (Telegram user id).
 */
function platformUserIdFromHeader(req) {
  const raw = req.headers['x-platform-user-id'] ?? req.headers['x-vk-user-id'];
  const n = raw != null ? parseInt(String(raw), 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function allowedPlayUserIds() {
  const raw = String(process.env.PLAY_APP_ALLOWED_USERS ?? '').trim();
  if (!raw) return null;
  const ids = raw
    .split(/[,;\s]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids.length ? ids : null;
}

/** @returns {boolean} */
export function tryPlayAppHeaderAuth(req) {
  const secret = String(process.env.PLAY_APP_SECRET ?? '').trim();
  if (!secret) return false;

  const got = String(req.headers['x-play-app-secret'] ?? '').trim();
  if (!got || got !== secret) return false;

  const uid = platformUserIdFromHeader(req);
  if (!uid) return false;

  const allowed = allowedPlayUserIds();
  if (allowed && !allowed.includes(uid)) return false;

  req.vkUserId = uid;
  req.authVia = 'play-app';
  return true;
}
