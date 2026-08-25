import { timingSafeEqualString } from './securityHelpers.js';

const DEFAULT_APP_OWNER_USER_ID = 497039245;

/** Owner can manage admins; always has admin access. Override via APP_OWNER_USER_ID on VPS. */
export function getAppOwnerUserId() {
  const fromEnv = parseInt(String(process.env.APP_OWNER_USER_ID ?? ''), 10);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return DEFAULT_APP_OWNER_USER_ID;
}

export function isAppOwner(vkUserId) {
  const id = parseInt(String(vkUserId), 10);
  if (!Number.isFinite(id) || id <= 0) return false;
  return id === getAppOwnerUserId();
}

/** Comma-separated Telegram user ids allowed to call in-app admin routes (bootstrap). */
export function parseAdminUserIds() {
  const raw = String(process.env.ADMIN_USER_IDS ?? '').trim();
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

let cachedDbAdminIds = new Set();
let adminCacheReady = false;

export async function refreshAdminIdCache() {
  try {
    const { listDbAppAdminIds } = await import('./appAccessDb.js');
    const ids = await listDbAppAdminIds();
    cachedDbAdminIds = new Set(ids);
  } catch {
    cachedDbAdminIds = new Set();
  }
  adminCacheReady = true;
}

export function resetAdminCacheForTests() {
  cachedDbAdminIds = new Set();
  adminCacheReady = false;
}

export function isAppAdmin(vkUserId) {
  const id = parseInt(String(vkUserId), 10);
  if (!Number.isFinite(id) || id <= 0) return false;
  if (isAppOwner(id)) return true;
  if (parseAdminUserIds().includes(id)) return true;
  return cachedDbAdminIds.has(id);
}

export function isDbAdminCacheReady() {
  return adminCacheReady;
}

/**
 * Token for GET /api/admin/stats (set ADMIN_STATS_TOKEN on VPS).
 * Header: Authorization: Bearer <token>  OR  X-Admin-Stats-Token: <token>
 */
export function adminStatsToken() {
  return String(process.env.ADMIN_STATS_TOKEN ?? '').trim();
}

export function verifyAdminStatsToken(req) {
  const expected = adminStatsToken();
  if (!expected) return false;

  const auth = String(req.headers.authorization ?? '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) {
    const got = auth.slice(7).trim();
    if (got && timingSafeEqualString(got, expected)) return true;
  }

  const header = String(req.headers['x-admin-stats-token'] ?? '').trim();
  return Boolean(header && timingSafeEqualString(header, expected));
}
