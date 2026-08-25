/**
 * PostgreSQL для пользовательских примеров («Мои примеры»).
 * Отдельно от словарного кэша (DATABASE_URL), чтобы не засорять основную БД.
 */
import pg from 'pg';
import { MAX_CUSTOM_EXAMPLES, WORD_EXAMPLE_COUNT } from './dictionaryConstants.js';

const { Pool } = pg;

function resolveCustomExamplesDatabaseUrl() {
  const url = process.env.CUSTOM_EXAMPLES_DATABASE_URL?.trim();
  if (url) return url;

  if ((process.env.NODE_ENV ?? '').toLowerCase() !== 'production') {
    return 'postgresql://seashell:seashell@localhost:5432/seashell_custom_examples';
  }

  throw new Error(
    'CUSTOM_EXAMPLES_DATABASE_URL не задан. Укажи отдельную PostgreSQL БД для пользовательских примеров.',
  );
}

const pool = new Pool({ connectionString: resolveCustomExamplesDatabaseUrl() });

export function getCustomExamplesPool() {
  return pool;
}

/** Одноразовый перенос legacy-строк is_custom из основной БД. */
async function migrateLegacyCustomExamplesFromMainDb(mainPool) {
  const { rows: legacy } = await mainPool.query(
    `SELECT w.vk_user_id, e.word_id, e.idx, e.text, e.translation, COALESCE(e.created_at, 0)::bigint AS created_at
     FROM examples e
     JOIN words w ON w.id = e.word_id
     WHERE COALESCE(e.is_custom, FALSE) = TRUE
     ORDER BY e.word_id, e.idx`,
  );
  if (legacy.length === 0) return 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of legacy) {
      await client.query(
        `INSERT INTO user_word_examples (vk_user_id, word_id, idx, text, translation, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (vk_user_id, word_id, idx) DO NOTHING`,
        [
          row.vk_user_id,
          row.word_id,
          row.idx,
          row.text,
          String(row.translation ?? '').trim() || row.text,
          row.created_at,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  await mainPool.query('DELETE FROM examples WHERE COALESCE(is_custom, FALSE) = TRUE');
  console.log(`[custom-examples] Migrated ${legacy.length} legacy row(s) from main dictionary DB`);
  return legacy.length;
}

export async function initCustomExamplesDb(mainPool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS user_word_examples (
    id SERIAL PRIMARY KEY,
    vk_user_id BIGINT NOT NULL,
    word_id INTEGER NOT NULL,
    idx INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    UNIQUE (vk_user_id, word_id, idx)
  )`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_user_word_examples_user_word
     ON user_word_examples (vk_user_id, word_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_user_word_examples_user_created
     ON user_word_examples (vk_user_id, created_at)`,
  );

  if (mainPool) {
    await migrateLegacyCustomExamplesFromMainDb(mainPool);
  }
}

export async function listCustomExamplesForWord(vkUserId, wordId) {
  const { rows } = await pool.query(
    `SELECT idx, text, translation
     FROM user_word_examples
     WHERE vk_user_id = $1 AND word_id = $2
     ORDER BY idx ASC
     LIMIT $3`,
    [vkUserId, wordId, MAX_CUSTOM_EXAMPLES],
  );
  return rows.map((r) => ({
    idx: Number(r.idx),
    text: r.text,
    translation: r.translation,
    note_ru: null,
    is_custom: true,
  }));
}

export async function insertCustomExample(vkUserId, wordId, { text, translation }) {
  const en = String(text ?? '').trim();
  const tr = String(translation ?? '').trim();
  if (!en || !tr) {
    throw new Error('Invalid custom example payload');
  }

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM user_word_examples WHERE vk_user_id = $1 AND word_id = $2`,
    [vkUserId, wordId],
  );
  const customCount = Number(countRows[0]?.n ?? 0);
  if (customCount >= MAX_CUSTOM_EXAMPLES) {
    const err = new Error('Custom example limit reached');
    err.code = 'CUSTOM_EXAMPLE_LIMIT';
    throw err;
  }

  const { rows: idxRows } = await pool.query(
    `SELECT COALESCE(MAX(idx), $3 - 1) + 1 AS next_idx
     FROM user_word_examples
     WHERE vk_user_id = $1 AND word_id = $2 AND idx >= $3`,
    [vkUserId, wordId, WORD_EXAMPLE_COUNT],
  );
  const nextIdx = Number(idxRows[0]?.next_idx ?? WORD_EXAMPLE_COUNT);

  await pool.query(
    `INSERT INTO user_word_examples (vk_user_id, word_id, idx, text, translation, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [vkUserId, wordId, nextIdx, en, tr, Date.now()],
  );
}

export async function countCustomExamplesSince(vkUserId, sinceMs) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM user_word_examples
     WHERE vk_user_id = $1 AND created_at > $2`,
    [vkUserId, sinceMs],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function deleteCustomExamplesForWord(vkUserId, wordId) {
  await pool.query('DELETE FROM user_word_examples WHERE vk_user_id = $1 AND word_id = $2', [
    vkUserId,
    wordId,
  ]);
}

export async function deleteCustomExamplesForWords(vkUserId, wordIds) {
  const ids = Array.isArray(wordIds)
    ? wordIds.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n) && n > 0)
    : [];
  if (ids.length === 0) return;
  await pool.query(
    'DELETE FROM user_word_examples WHERE vk_user_id = $1 AND word_id = ANY($2::int[])',
    [vkUserId, ids],
  );
}
