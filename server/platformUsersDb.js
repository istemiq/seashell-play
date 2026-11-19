import { getDbPool } from './db.js';
import { fetchTelegramChat } from './telegramProfilePhoto.js';

const pool = getDbPool();

const PLATFORM = 'google';
const MAX_DISPLAY_NAME = 40;
const LEGACY_USER_ID_MAX = 5_000_000_000;
const TG_PROFILE_STALE_MS = 24 * 60 * 60 * 1000;

export async function ensurePlatformAccountsSchema() {
  await pool.query(`
    CREATE SEQUENCE IF NOT EXISTS platform_user_id_seq START 5000000000 INCREMENT 1;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_accounts (
      user_id BIGINT PRIMARY KEY,
      platform TEXT NOT NULL,
      external_id TEXT NOT NULL,
      email TEXT,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (platform, external_id)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_platform_accounts_platform
    ON platform_accounts (platform, external_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tg_user_profiles (
      telegram_id BIGINT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function isNewPlatformUserId(userId) {
  return Number(userId) >= LEGACY_USER_ID_MAX;
}

/**
 * Resolve internal numeric user id for Google account (stable across logins).
 * @param {{ sub: string, email?: string, name?: string, picture?: string }} googleUser
 */
export async function resolveGoogleUserId(googleUser) {
  const externalId = String(googleUser.sub ?? '').trim();
  if (!externalId) throw new Error('Missing Google sub');

  const existing = await pool.query(
    `SELECT user_id FROM platform_accounts WHERE platform = $1 AND external_id = $2`,
    [PLATFORM, externalId],
  );
  if (existing.rows[0]?.user_id) {
    const userId = Number(existing.rows[0].user_id);
    await pool.query(
      `UPDATE platform_accounts
       SET last_login_at = NOW(),
           email = COALESCE($2, email),
           avatar_url = COALESCE($3, avatar_url)
       WHERE user_id = $1`,
      [userId, googleUser.email ?? null, googleUser.picture ?? null],
    );
    return userId;
  }

  const seq = await pool.query(`SELECT nextval('platform_user_id_seq') AS id`);
  const userId = Number(seq.rows[0].id);
  await pool.query(
    `INSERT INTO platform_accounts (user_id, platform, external_id, email, display_name, avatar_url)
     VALUES ($1, $2, $3, $4, NULL, $5)`,
    [userId, PLATFORM, externalId, googleUser.email ?? null, googleUser.picture ?? null],
  );
  return userId;
}

export async function getPlatformAccount(userId) {
  const { rows } = await pool.query(
    `SELECT user_id, platform, external_id, email, display_name, avatar_url
     FROM platform_accounts WHERE user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

/** Имя/username из TG-апдейта (webhook видит from на каждом сообщении боту). */
export async function upsertTgUserProfile(tgUser) {
  const id = Number(tgUser?.id);
  if (!Number.isFinite(id) || id <= 0) return;
  await pool.query(
    `INSERT INTO tg_user_profiles (telegram_id, first_name, last_name, username, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (telegram_id) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       username = EXCLUDED.username,
       updated_at = NOW()`,
    [id, tgUser.first_name ?? null, tgUser.last_name ?? null, tgUser.username ?? null],
  );
}

export async function getTgUserProfile(telegramId) {
  const { rows } = await pool.query(
    `SELECT telegram_id, first_name, last_name, username, updated_at
     FROM tg_user_profiles WHERE telegram_id = $1`,
    [telegramId],
  );
  return rows[0] ?? null;
}

/** Подтянуть свежий профиль через Bot API getChat и сохранить. */
export async function refreshTgUserProfile(telegramId) {
  const chat = await fetchTelegramChat(telegramId);
  if (!chat?.id) return null;
  await upsertTgUserProfile(chat);
  return getTgUserProfile(chat.id);
}

function tgProfileDisplayName(row) {
  const full = [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim();
  return full || (row?.username ? String(row.username) : null);
}

/** Public profile for app UI — display name only, no email. */
export async function getUserProfileResponse(userId, authVia) {
  const account = await getPlatformAccount(userId);
  if (account) {
    const displayName = String(account.display_name ?? '').trim() || null;
    return {
      userId,
      displayName,
      needsOnboarding: !displayName,
    };
  }

  const isTelegramAuth = String(authVia ?? '').includes('telegram');
  const tg = await getTgUserProfile(userId);
  if (tg) {
    const staleMs = Date.now() - new Date(tg.updated_at).getTime();
    if (isTelegramAuth && staleMs > TG_PROFILE_STALE_MS) {
      void refreshTgUserProfile(userId).catch(() => {});
    }
    return { userId, displayName: tgProfileDisplayName(tg), needsOnboarding: false };
  }
  if (isTelegramAuth) {
    const fresh = await refreshTgUserProfile(userId).catch(() => null);
    if (fresh) {
      return { userId, displayName: tgProfileDisplayName(fresh), needsOnboarding: false };
    }
  }

  return {
    userId,
    displayName: null,
    needsOnboarding: isNewPlatformUserId(userId),
  };
}

export async function setPlatformDisplayName(userId, displayName) {
  const name = String(displayName ?? '').trim().slice(0, MAX_DISPLAY_NAME);
  if (!name) {
    const err = new Error('Display name is required');
    err.status = 400;
    throw err;
  }

  const account = await getPlatformAccount(userId);
  if (account) {
    await pool.query(`UPDATE platform_accounts SET display_name = $2 WHERE user_id = $1`, [userId, name]);
    return name;
  }

  if (!isNewPlatformUserId(userId)) {
    const err = new Error('Profile name is managed by your Telegram account');
    err.status = 403;
    throw err;
  }

  const err = new Error('Account not found');
  err.status = 404;
  throw err;
}
