/**
 * User-created practice experts (stored per vk_user_id).
 */
import { assertAllowedUserContent } from './contentPolicy.js';

export const USER_EXPERT_ID_PREFIX = 'u';
export const MAX_USER_EXPERTS = 30;

const MAX_TITLE = 80;
const MAX_ROLE = 120;
const MAX_TOPICS = 500;

const DEFAULT_STYLE =
  'friendly, conversational, explains clearly without jargon — like a knowledgeable friend';
const DEFAULT_SAFEGUARDS = `- This is AI language practice only; you are NOT a licensed professional.
- Stay respectful; no hate, violence, or illegal advice.
- If the user asks for real-world professional help, remind them this is practice and suggest qualified human specialists.`;

function pool() {
  return globalThis.__seashellPgPool;
}

export async function initUserPracticeExpertsDb(sharedPool) {
  globalThis.__seashellPgPool = sharedPool;
  await sharedPool.query(`CREATE TABLE IF NOT EXISTS user_practice_experts (
    id BIGSERIAL PRIMARY KEY,
    vk_user_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    role_title TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT '',
    style TEXT NOT NULL DEFAULT '',
    sample_topics TEXT NOT NULL DEFAULT '',
    safeguards TEXT NOT NULL DEFAULT '',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`);
  await sharedPool.query(
    `CREATE INDEX IF NOT EXISTS idx_user_practice_experts_user
     ON user_practice_experts (vk_user_id, updated_at DESC)`,
  );
}

export function formatUserExpertId(dbId) {
  return `${USER_EXPERT_ID_PREFIX}${dbId}`;
}

export function parseUserExpertId(id) {
  const s = String(id ?? '').trim();
  const m = /^u(\d+)$/.exec(s);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isUserExpertId(id) {
  return parseUserExpertId(id) != null;
}

function clip(s, max) {
  return String(s ?? '').trim().slice(0, max);
}

function buildDomain(roleTitle, sampleTopics) {
  const role = clip(roleTitle, MAX_ROLE);
  const topics = clip(sampleTopics, MAX_TOPICS);
  return `${role}. Conversation topics: ${topics}`;
}

export function userExpertRowToPersona(row) {
  if (!row) return null;
  return {
    titleRu: row.title,
    roleTitle: row.role_title,
    domain: row.domain || buildDomain(row.role_title, row.sample_topics),
    style: row.style || DEFAULT_STYLE,
    sampleTopics: row.sample_topics,
    safeguards: row.safeguards || DEFAULT_SAFEGUARDS,
  };
}

function mapUiExpert(row) {
  return {
    id: formatUserExpertId(row.id),
    title: row.title,
    roleTitle: row.role_title,
    sampleTopics: row.sample_topics,
    updatedAt: Number(row.updated_at),
  };
}

function validateExpertPayload(body, { partial = false } = {}) {
  const title = body?.title != null ? clip(body.title, MAX_TITLE) : partial ? undefined : '';
  const roleTitle = body?.roleTitle != null ? clip(body.roleTitle, MAX_ROLE) : partial ? undefined : '';
  const sampleTopics =
    body?.sampleTopics != null ? clip(body.sampleTopics, MAX_TOPICS) : partial ? undefined : '';

  if (!partial || title !== undefined) {
    if (!title) return { ok: false, error: 'Title is required' };
    const pol = assertAllowedUserContent(title);
    if (!pol.ok) return pol;
  }
  if (!partial || roleTitle !== undefined) {
    if (!roleTitle) return { ok: false, error: 'Role is required' };
    const pol = assertAllowedUserContent(roleTitle);
    if (!pol.ok) return pol;
  }
  if (!partial || sampleTopics !== undefined) {
    if (!sampleTopics) return { ok: false, error: 'Topics are required' };
    const pol = assertAllowedUserContent(sampleTopics);
    if (!pol.ok) return pol;
  }

  return {
    ok: true,
    title,
    roleTitle,
    sampleTopics,
    domain: buildDomain(roleTitle ?? '', sampleTopics ?? ''),
    style: DEFAULT_STYLE,
    safeguards: DEFAULT_SAFEGUARDS,
  };
}

export async function listUserPracticeExperts(vkUserId) {
  const r = await pool().query(
    `SELECT id, title, role_title, sample_topics, updated_at
     FROM user_practice_experts
     WHERE vk_user_id = $1
     ORDER BY updated_at DESC, id DESC`,
    [vkUserId],
  );
  return r.rows.map(mapUiExpert);
}

export async function getUserPracticeExpert(vkUserId, expertId) {
  const dbId = parseUserExpertId(expertId);
  if (!dbId) return null;
  const r = await pool().query(
    `SELECT id, vk_user_id, title, role_title, domain, style, sample_topics, safeguards, created_at, updated_at
     FROM user_practice_experts
     WHERE id = $1 AND vk_user_id = $2`,
    [dbId, vkUserId],
  );
  return r.rows[0] ?? null;
}

export async function createUserPracticeExpert(vkUserId, body) {
  const countR = await pool().query(
    `SELECT COUNT(*)::int AS n FROM user_practice_experts WHERE vk_user_id = $1`,
    [vkUserId],
  );
  if ((countR.rows[0]?.n ?? 0) >= MAX_USER_EXPERTS) {
    const err = new Error('Expert limit reached');
    err.status = 400;
    throw err;
  }

  const v = validateExpertPayload(body);
  if (!v.ok) {
    const err = new Error(v.error);
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  const r = await pool().query(
    `INSERT INTO user_practice_experts
       (vk_user_id, title, role_title, domain, style, sample_topics, safeguards, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     RETURNING id, title, role_title, sample_topics, updated_at`,
    [vkUserId, v.title, v.roleTitle, v.domain, v.style, v.sampleTopics, v.safeguards, now],
  );
  return mapUiExpert(r.rows[0]);
}

export async function updateUserPracticeExpert(vkUserId, expertId, body) {
  const existing = await getUserPracticeExpert(vkUserId, expertId);
  if (!existing) {
    const err = new Error('Expert not found');
    err.status = 404;
    throw err;
  }

  const v = validateExpertPayload(
    {
      title: body?.title ?? existing.title,
      roleTitle: body?.roleTitle ?? existing.role_title,
      sampleTopics: body?.sampleTopics ?? existing.sample_topics,
    },
    { partial: false },
  );
  if (!v.ok) {
    const err = new Error(v.error);
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  const dbId = parseUserExpertId(expertId);
  const r = await pool().query(
    `UPDATE user_practice_experts
     SET title = $3, role_title = $4, domain = $5, style = $6, sample_topics = $7, safeguards = $8, updated_at = $9
     WHERE id = $1 AND vk_user_id = $2
     RETURNING id, title, role_title, sample_topics, updated_at`,
    [dbId, vkUserId, v.title, v.roleTitle, v.domain, v.style, v.sampleTopics, v.safeguards, now],
  );
  return mapUiExpert(r.rows[0]);
}

export async function deleteUserPracticeExpert(vkUserId, expertId) {
  const dbId = parseUserExpertId(expertId);
  if (!dbId) return false;
  const r = await pool().query(
    `DELETE FROM user_practice_experts WHERE id = $1 AND vk_user_id = $2 RETURNING id`,
    [dbId, vkUserId],
  );
  return (r.rowCount ?? 0) > 0;
}
