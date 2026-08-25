import { pool } from './db.js';

const PLATFORM = 'google';

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
           display_name = COALESCE($3, display_name),
           avatar_url = COALESCE($4, avatar_url)
       WHERE user_id = $1`,
      [userId, googleUser.email ?? null, googleUser.name ?? null, googleUser.picture ?? null],
    );
    return userId;
  }

  const seq = await pool.query(`SELECT nextval('platform_user_id_seq') AS id`);
  const userId = Number(seq.rows[0].id);
  await pool.query(
    `INSERT INTO platform_accounts (user_id, platform, external_id, email, display_name, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, PLATFORM, externalId, googleUser.email ?? null, googleUser.name ?? null, googleUser.picture ?? null],
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
