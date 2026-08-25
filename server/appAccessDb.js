import { getDbPool } from './db.js';

export async function initAppAccessDb() {
  const pool = getDbPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS app_admins (
    vk_user_id BIGINT PRIMARY KEY,
    granted_by BIGINT NOT NULL,
    created_at BIGINT NOT NULL
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS premium_grants (
    vk_user_id BIGINT PRIMARY KEY,
    granted_by BIGINT NOT NULL,
    created_at BIGINT NOT NULL
  )`);
}

export async function listDbAppAdminIds() {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `SELECT vk_user_id FROM app_admins ORDER BY vk_user_id ASC`,
  );
  return rows.map((row) => Number(row.vk_user_id));
}

export async function listDbAppAdminsDetailed() {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `SELECT vk_user_id, granted_by, created_at
     FROM app_admins
     ORDER BY vk_user_id ASC`,
  );
  return rows.map((row) => ({
    userId: Number(row.vk_user_id),
    grantedBy: Number(row.granted_by),
    createdAt: Number(row.created_at),
    source: 'db',
  }));
}

export async function addDbAppAdmin(userId, grantedBy) {
  const pool = getDbPool();
  const now = Date.now();
  await pool.query(
    `INSERT INTO app_admins (vk_user_id, granted_by, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (vk_user_id) DO NOTHING`,
    [userId, grantedBy, now],
  );
}

export async function removeDbAppAdmin(userId) {
  const pool = getDbPool();
  const { rowCount } = await pool.query(`DELETE FROM app_admins WHERE vk_user_id = $1`, [userId]);
  return rowCount > 0;
}

export async function listDbPremiumGrantIds() {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `SELECT vk_user_id FROM premium_grants ORDER BY vk_user_id ASC`,
  );
  return rows.map((row) => Number(row.vk_user_id));
}

export async function listDbPremiumGrantsDetailed() {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `SELECT vk_user_id, granted_by, created_at
     FROM premium_grants
     ORDER BY vk_user_id ASC`,
  );
  return rows.map((row) => ({
    userId: Number(row.vk_user_id),
    grantedBy: Number(row.granted_by),
    createdAt: Number(row.created_at),
    source: 'db',
  }));
}

export async function addDbPremiumGrant(userId, grantedBy) {
  const pool = getDbPool();
  const now = Date.now();
  await pool.query(
    `INSERT INTO premium_grants (vk_user_id, granted_by, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (vk_user_id) DO NOTHING`,
    [userId, grantedBy, now],
  );
}

export async function removeDbPremiumGrant(userId) {
  const pool = getDbPool();
  const { rowCount } = await pool.query(`DELETE FROM premium_grants WHERE vk_user_id = $1`, [userId]);
  return rowCount > 0;
}
