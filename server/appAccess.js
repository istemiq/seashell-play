import {
  addDbAppAdmin,
  addDbPremiumGrant,
  listDbAppAdminIds,
  listDbAppAdminsDetailed,
  listDbPremiumGrantIds,
  listDbPremiumGrantsDetailed,
  removeDbAppAdmin,
  removeDbPremiumGrant,
} from './appAccessDb.js';
import {
  getAppOwnerUserId,
  isAppOwner,
  parseAdminUserIds,
  refreshAdminIdCache,
  isAppAdmin,
} from './adminAuth.js';
import { refreshPremiumGrantCache, premiumEnvUserIds } from './premium.js';

export function parsePositiveUserId(raw) {
  const id = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function warmAppAccessCaches() {
  await Promise.all([refreshAdminIdCache(), refreshPremiumGrantCache()]);
}

function uniqueSortedIds(ids) {
  return [...new Set(ids)].sort((a, b) => a - b);
}

export async function buildAdminAccessPayload(actorUserId) {
  const ownerUserId = getAppOwnerUserId();
  const envAdminIds = parseAdminUserIds();
  const dbAdmins = await listDbAppAdminsDetailed();
  const dbAdminIds = dbAdmins.map((row) => row.userId);

  const adminIds = uniqueSortedIds([ownerUserId, ...envAdminIds, ...dbAdminIds]);
  const admins = adminIds.map((userId) => {
    if (userId === ownerUserId) {
      return { userId, source: 'owner', removable: false };
    }
    if (envAdminIds.includes(userId)) {
      return { userId, source: 'env', removable: false };
    }
    const dbRow = dbAdmins.find((row) => row.userId === userId);
    return {
      userId,
      source: 'db',
      removable: true,
      grantedBy: dbRow?.grantedBy ?? null,
      createdAt: dbRow?.createdAt ?? null,
    };
  });

  const envPremiumIds = premiumEnvUserIds();
  const dbGrants = await listDbPremiumGrantsDetailed();
  const dbGrantIds = dbGrants.map((row) => row.userId);
  const premiumIds = uniqueSortedIds([...envPremiumIds, ...dbGrantIds]);

  const premiumGrants = premiumIds.map((userId) => {
    if (envPremiumIds.includes(userId) && !dbGrantIds.includes(userId)) {
      return { userId, source: 'env', removable: false };
    }
    const dbRow = dbGrants.find((row) => row.userId === userId);
    return {
      userId,
      source: dbRow ? 'db' : 'env',
      removable: Boolean(dbRow),
      grantedBy: dbRow?.grantedBy ?? null,
      createdAt: dbRow?.createdAt ?? null,
    };
  });

  return {
    ownerUserId,
    isOwner: isAppOwner(actorUserId),
    isAdmin: isAppAdmin(actorUserId),
    admins,
    premiumGrants,
  };
}

export async function grantAppAdmin(userId, grantedBy) {
  await addDbAppAdmin(userId, grantedBy);
  await refreshAdminIdCache();
}

export async function revokeAppAdmin(userId) {
  const removed = await removeDbAppAdmin(userId);
  await refreshAdminIdCache();
  return removed;
}

export async function grantPremiumAccess(userId, grantedBy) {
  await addDbPremiumGrant(userId, grantedBy);
  await refreshPremiumGrantCache();
}

export async function revokePremiumAccess(userId) {
  const removed = await removeDbPremiumGrant(userId);
  await refreshPremiumGrantCache();
  return removed;
}

export async function listDbAdminIdsForTests() {
  return listDbAppAdminIds();
}

export async function listDbPremiumIdsForTests() {
  return listDbPremiumGrantIds();
}
