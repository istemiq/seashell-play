/**
 * Premium access: PREMIUM_USER_IDS env, DB premium_grants, or paid subscription in billing DB.
 * Same numeric id as X-Platform-User-Id / Telegram user id.
 */

function parsePremiumIdSet() {
  const raw = String(process.env.PREMIUM_USER_IDS ?? '').trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n > 0),
  );
}

let cachedEnvIds = null;
let cachedDbGrantIds = new Set();
let grantCacheReady = false;

function premiumEnvIdSet() {
  if (!cachedEnvIds) cachedEnvIds = parsePremiumIdSet();
  return cachedEnvIds;
}

export function premiumEnvUserIds() {
  return [...premiumEnvIdSet()];
}

export async function refreshPremiumGrantCache() {
  try {
    const { listDbPremiumGrantIds } = await import('./appAccessDb.js');
    const ids = await listDbPremiumGrantIds();
    cachedDbGrantIds = new Set(ids);
  } catch {
    cachedDbGrantIds = new Set();
  }
  grantCacheReady = true;
}

export function isPremiumGrantCacheReady() {
  return grantCacheReady;
}

export function isPremiumUser(userId) {
  const id = parseInt(String(userId ?? ''), 10);
  if (!Number.isFinite(id) || id <= 0) return false;
  if (premiumEnvIdSet().has(id)) return true;
  return cachedDbGrantIds.has(id);
}

/** For tests: reset env cache after changing PREMIUM_USER_IDS. */
export function resetPremiumCacheForTests() {
  cachedEnvIds = null;
  cachedDbGrantIds = new Set();
  grantCacheReady = false;
}
