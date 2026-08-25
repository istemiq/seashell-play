/**
 * Aggregated usage from PostgreSQL (words, sets, practice, ads).
 * Excludes VK reviewer / test ids from ADMIN_EXCLUDE_USER_IDS + VK_REVIEWER_USER_ID.
 */

import { getPracticeExpert } from './practiceExperts.js';
import { isUserExpertId } from './userPracticeExperts.js';

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_60D = 60 * MS_DAY;
const MSK = 'Europe/Moscow';

export function parseExcludedUserIds() {
  const ids = new Set();
  const reviewer = parseInt(String(process.env.VK_REVIEWER_USER_ID ?? '1'), 10);
  if (Number.isFinite(reviewer) && reviewer > 0) ids.add(reviewer);

  const raw = String(process.env.ADMIN_EXCLUDE_USER_IDS ?? '').trim();
  if (raw) {
    for (const part of raw.split(/[,;\s]+/)) {
      const n = parseInt(part, 10);
      if (Number.isFinite(n) && n > 0) ids.add(n);
    }
  }
  return [...ids];
}

function excludeSql(paramIndex = 1, column = 'vk_user_id') {
  return `($${paramIndex}::bigint[] IS NULL OR cardinality($${paramIndex}) = 0 OR ${column} != ALL($${paramIndex}))`;
}

const MSK_DAY = `((to_timestamp(ts / 1000.0) AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow')::date`;

/** Start of calendar day in Moscow (ms). */
export function mskDayStartMs(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MSK,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now));
  const pick = (type) => parts.find((p) => p.type === type)?.value ?? '01';
  return Date.parse(`${pick('year')}-${pick('month')}-${pick('day')}T00:00:00+03:00`);
}

/** Moscow calendar day key, e.g. 2026-08-10. */
export function mskDayKey(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MSK,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

/** Russian plural: 1 слово, 2 слова, 5 слов. */
export function pluralRu(n, one, few, many) {
  const abs = Math.abs(Number(n)) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return `${n} ${many}`;
  if (n1 > 1 && n1 < 5) return `${n} ${few}`;
  if (n1 === 1) return `${n} ${one}`;
  return `${n} ${many}`;
}

function buildLabeledActivityUnion() {
  const ex = (column = 'vk_user_id') => excludeSql(1, column);
  return `
    SELECT vk_user_id, created_at AS ts, 'word'::text AS kind FROM words WHERE ${ex()} AND created_at > 0
    UNION ALL
    SELECT vk_user_id, created_at, 'set' FROM word_sets WHERE ${ex()} AND created_at > 0
    UNION ALL
    SELECT vk_user_id, created_at, 'practice_start' FROM practice_sessions WHERE ${ex()} AND created_at > 0
    UNION ALL
    SELECT s.vk_user_id, m.created_at, 'practice_message'
      FROM practice_messages m
      JOIN practice_sessions s ON s.id = m.session_id
     WHERE ${ex('s.vk_user_id')} AND m.created_at > 0
    UNION ALL
    SELECT vk_user_id, created_at,
           CASE view_type WHEN 'words' THEN 'ad_dictionary' WHEN 'practice' THEN 'ad_practice' ELSE 'ad_other' END
      FROM ad_views WHERE ${ex()} AND created_at > 0
    UNION ALL
    SELECT w.vk_user_id, e.created_at, 'custom_example'
      FROM examples e
      JOIN words w ON w.id = e.word_id
     WHERE COALESCE(e.is_custom, FALSE) = TRUE
       AND e.created_at > 0
       AND ${ex('w.vk_user_id')}
  `;
}

function buildUserActivityUnion() {
  return `SELECT vk_user_id, ts FROM (${buildLabeledActivityUnion()}) labeled`;
}

async function scalar(pool, sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return Number(rows[0]?.n ?? 0);
}

function expertLabel(expertId) {
  if (!expertId) return 'эксперт';
  const builtin = getPracticeExpert(expertId);
  if (builtin) return builtin.titleRu ?? expertId;
  if (isUserExpertId(expertId)) return `Custom (${expertId})`;
  return expertId;
}

function emptyUserBreakdown(userId) {
  return {
    userId: Number(userId),
    firstActivityAt: null,
    lastActivityAt: null,
    activeDays60d: 0,
    wordsAdded: 0,
    groupsCreated: 0,
    practiceFree: 0,
    practiceExpert: 0,
    practiceWord: 0,
    practiceMessages: 0,
    adsDictionary: 0,
    adsPractice: 0,
    customExamples: 0,
    topExpertId: null,
    topExpertSessions: 0,
  };
}

function mapUserBreakdownRow(row, practiceRow) {
  const userId = Number(row.vk_user_id);
  const base = emptyUserBreakdown(userId);
  return {
    ...base,
    firstActivityAt: new Date(Number(row.first_ts)).toISOString(),
    lastActivityAt: new Date(Number(row.last_ts)).toISOString(),
    activeDays60d: Number(row.active_days_60d ?? 0),
    wordsAdded: Number(row.words_added_60d ?? 0),
    groupsCreated: Number(row.groups_created_60d ?? 0),
    practiceMessages: Number(row.practice_messages_60d ?? 0),
    adsDictionary: Number(row.ads_dictionary_60d ?? 0),
    adsPractice: Number(row.ads_practice_60d ?? 0),
    customExamples: Number(row.custom_examples_60d ?? 0),
    practiceFree: Number(practiceRow?.practice_free ?? 0),
    practiceExpert: Number(practiceRow?.practice_expert ?? 0),
    practiceWord: Number(practiceRow?.practice_word ?? 0),
    topExpertId: practiceRow?.top_expert_id ?? null,
    topExpertSessions: Number(practiceRow?.top_expert_sessions ?? 0),
  };
}

/** Plain-language summary of what a user did in the stats window. */
export function describeUserActivity(user, { periodLabel = 'за 2 мес', showFirst = true, showLast = false } = {}) {
  const actions = [];

  if (user.wordsAdded > 0) {
    actions.push(`добавил ${pluralRu(user.wordsAdded, 'слово', 'слова', 'слов')}`);
  }
  if (user.groupsCreated > 0) {
    actions.push(`создал ${pluralRu(user.groupsCreated, 'группу', 'группы', 'групп')}`);
  }

  const practiceBits = [];
  if (user.practiceFree > 0) {
    practiceBits.push(`${pluralRu(user.practiceFree, 'свободный диалог', 'свободных диалога', 'свободных диалогов')}`);
  }
  if (user.practiceExpert > 0) {
    let bit = pluralRu(user.practiceExpert, 'диалог с экспертом', 'диалога с экспертом', 'диалогов с экспертом');
    if (user.topExpertId && user.topExpertSessions > 0) {
      bit += ` (чаще: ${expertLabel(user.topExpertId)})`;
    }
    practiceBits.push(bit);
  }
  if (user.practiceWord > 0) {
    practiceBits.push(
      pluralRu(user.practiceWord, 'практику слова в диалоге', 'практики слова в диалоге', 'практик слова в диалоге'),
    );
  }
  if (practiceBits.length) {
    actions.push(`практика: ${practiceBits.join(', ')}`);
  }
  if (user.practiceMessages > 0) {
    actions.push(`написал ${pluralRu(user.practiceMessages, 'реплику', 'реплики', 'реплик')} в диалогах`);
  }
  if (user.customExamples > 0) {
    actions.push(`добавил ${pluralRu(user.customExamples, 'свой пример', 'своих примера', 'своих примеров')}`);
  }
  if (user.adsDictionary > 0) {
    actions.push(`досмотрел ${pluralRu(user.adsDictionary, 'рекламу', 'рекламы', 'реклам')} за новые слова`);
  }
  if (user.adsPractice > 0) {
    actions.push(`досмотрел ${pluralRu(user.adsPractice, 'рекламу', 'рекламы', 'реклам')} за практику`);
  }

  if (!actions.length) {
    actions.push('заходил в приложение, но слов и практики за период нет');
  }

  let head = String(user.userId);
  if (showFirst && user.firstActivityAt) {
    head += ` — впервые ${formatMskDay(user.firstActivityAt)}`;
  }
  if (showLast && user.lastActivityAt) {
    head += `, последний раз ${formatMskDate(user.lastActivityAt)}`;
  }

  const visits =
    user.activeDays60d > 0
      ? ` · ${pluralRu(user.activeDays60d, 'день', 'дня', 'дней')} ${periodLabel}`
      : '';

  return `${head}: ${actions.join('; ')}${visits}`;
}

/** Split users into new (first seen in window) vs returning regulars (seen before window, active inside). */
export function classifyUserCohorts(users, since60dMs) {
  const since = Number(since60dMs);
  const newUsers2m = [];
  const regularUsers2m = [];
  for (const user of users) {
    const firstMs = Date.parse(user.firstActivityAt);
    const lastMs = Date.parse(user.lastActivityAt);
    if (!Number.isFinite(firstMs) || !Number.isFinite(lastMs)) continue;
    if (firstMs >= since) {
      newUsers2m.push(user);
    } else if (lastMs >= since) {
      regularUsers2m.push(user);
    }
  }
  const byFirstDesc = (a, b) => Date.parse(b.firstActivityAt) - Date.parse(a.firstActivityAt);
  const byLastDesc = (a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
  newUsers2m.sort(byFirstDesc);
  regularUsers2m.sort(byLastDesc);
  return { newUsers2m, regularUsers2m };
}

async function fetchUserBreakdowns(pool, excludeEmpty, since60d) {
  const labeledUnion = buildLabeledActivityUnion();
  const { rows: breakdownRows } = await pool.query(
    `SELECT vk_user_id,
            MIN(ts) AS first_ts,
            MAX(ts) AS last_ts,
            COUNT(DISTINCT ${MSK_DAY.replace(/ts/g, 'ts')}) FILTER (WHERE ts >= $2)::int AS active_days_60d,
            COUNT(*) FILTER (WHERE kind = 'word' AND ts >= $2)::int AS words_added_60d,
            COUNT(*) FILTER (WHERE kind = 'set' AND ts >= $2)::int AS groups_created_60d,
            COUNT(*) FILTER (WHERE kind = 'practice_message' AND ts >= $2)::int AS practice_messages_60d,
            COUNT(*) FILTER (WHERE kind = 'ad_dictionary' AND ts >= $2)::int AS ads_dictionary_60d,
            COUNT(*) FILTER (WHERE kind = 'ad_practice' AND ts >= $2)::int AS ads_practice_60d,
            COUNT(*) FILTER (WHERE kind = 'custom_example' AND ts >= $2)::int AS custom_examples_60d
       FROM (${labeledUnion}) a
      GROUP BY vk_user_id
      HAVING MAX(ts) >= $2 OR MIN(ts) >= $2`,
    [excludeEmpty, since60d],
  );

  const { rows: practiceRows } = await pool.query(
    `SELECT vk_user_id,
            COUNT(*) FILTER (WHERE mode = 'free' AND created_at >= $2)::int AS practice_free,
            COUNT(*) FILTER (WHERE mode = 'expert' AND created_at >= $2)::int AS practice_expert,
            COUNT(*) FILTER (WHERE mode = 'word' AND created_at >= $2)::int AS practice_word
       FROM practice_sessions
      WHERE ${excludeSql(1)} AND created_at > 0
      GROUP BY vk_user_id`,
    [excludeEmpty, since60d],
  );

  const { rows: topExpertRows } = await pool.query(
    `SELECT DISTINCT ON (vk_user_id) vk_user_id, expert_id AS top_expert_id, cnt::int AS top_expert_sessions
       FROM (
         SELECT vk_user_id, expert_id, COUNT(*) AS cnt
           FROM practice_sessions
          WHERE mode = 'expert' AND expert_id IS NOT NULL AND ${excludeSql(1)} AND created_at >= $2
          GROUP BY vk_user_id, expert_id
       ) t
      ORDER BY vk_user_id, cnt DESC`,
    [excludeEmpty, since60d],
  );

  const practiceByUser = new Map(practiceRows.map((r) => [Number(r.vk_user_id), r]));
  const expertByUser = new Map(topExpertRows.map((r) => [Number(r.vk_user_id), r]));

  return breakdownRows.map((row) => {
    const userId = Number(row.vk_user_id);
    const practice = { ...practiceByUser.get(userId), ...expertByUser.get(userId) };
    return mapUserBreakdownRow(row, practice);
  });
}

/**
 * @param {import('pg').Pool} pool
 * @param {{ now?: number }} [opts]
 */
export async function fetchUsageStats(pool, { now = Date.now() } = {}) {
  const exclude = parseExcludedUserIds();
  const excludeEmpty = exclude.length ? exclude : null;

  const since24h = now - MS_DAY;
  const since7d = now - 7 * MS_DAY;
  const since30d = now - 30 * MS_DAY;
  const since60d = now - MS_60D;
  const sinceToday = mskDayStartMs(now);

  const userUnion = buildUserActivityUnion();
  const userSourcesUnion = `
         SELECT vk_user_id FROM words WHERE ${excludeSql(1)}
         UNION
         SELECT vk_user_id FROM word_sets WHERE ${excludeSql(1)}
         UNION
         SELECT vk_user_id FROM practice_sessions WHERE ${excludeSql(1)}
         UNION
         SELECT vk_user_id FROM ad_views WHERE ${excludeSql(1)}
       `;

  const [
    usersTotal,
    usersActive24h,
    usersActive7d,
    usersActiveToday,
    usersFirstToday,
    wordsTotal,
    words24h,
    wordsToday,
    words7d,
    words30d,
    setsTotal,
    practiceSessionsTotal,
    practiceSessions24h,
    practiceSessionsToday,
    practiceSessions7d,
    practiceMessagesTotal,
    practiceMessages24h,
    practiceMessagesToday,
    practiceFreeSessions,
    practiceExpertSessions,
    practiceWordSessions,
    dictCacheEntries,
  ] = await Promise.all([
    scalar(
      pool,
      `SELECT COUNT(DISTINCT vk_user_id)::int AS n FROM (${userSourcesUnion}) u`,
      [excludeEmpty],
    ),
    scalar(
      pool,
      `SELECT COUNT(DISTINCT vk_user_id)::int AS n FROM (${userUnion}) a WHERE ts >= $2`,
      [excludeEmpty, since24h],
    ),
    scalar(
      pool,
      `SELECT COUNT(DISTINCT vk_user_id)::int AS n FROM (${userUnion}) a WHERE ts >= $2`,
      [excludeEmpty, since7d],
    ),
    scalar(
      pool,
      `SELECT COUNT(DISTINCT vk_user_id)::int AS n FROM (${userUnion}) a WHERE ts >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM (
         SELECT vk_user_id, MIN(ts) AS first_ts
           FROM (${userUnion}) x
          GROUP BY vk_user_id
       ) f WHERE first_ts >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(pool, `SELECT COUNT(*)::int AS n FROM words WHERE ${excludeSql(1)}`, [excludeEmpty]),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM words WHERE ${excludeSql(1)} AND created_at >= $2`,
      [excludeEmpty, since24h],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM words WHERE ${excludeSql(1)} AND created_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM words WHERE ${excludeSql(1)} AND created_at >= $2`,
      [excludeEmpty, since7d],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM words WHERE ${excludeSql(1)} AND created_at >= $2`,
      [excludeEmpty, since30d],
    ),
    scalar(pool, `SELECT COUNT(*)::int AS n FROM word_sets WHERE ${excludeSql(1)}`, [excludeEmpty]),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)}`,
      [excludeEmpty],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND updated_at >= $2`,
      [excludeEmpty, since24h],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND updated_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND updated_at >= $2`,
      [excludeEmpty, since7d],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_messages m
         JOIN practice_sessions s ON s.id = m.session_id
        WHERE ${excludeSql(1).replace(/vk_user_id/g, 's.vk_user_id')}`,
      [excludeEmpty],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_messages m
         JOIN practice_sessions s ON s.id = m.session_id
        WHERE ${excludeSql(1).replace(/vk_user_id/g, 's.vk_user_id')} AND m.created_at >= $2`,
      [excludeEmpty, since24h],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_messages m
         JOIN practice_sessions s ON s.id = m.session_id
        WHERE ${excludeSql(1).replace(/vk_user_id/g, 's.vk_user_id')} AND m.created_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND mode = 'free'`,
      [excludeEmpty],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND mode = 'expert'`,
      [excludeEmpty],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND mode = 'word'`,
      [excludeEmpty],
    ),
    scalar(pool, `SELECT COUNT(*)::int AS n FROM dictionary_generation_cache`, []),
  ]);

  const { rows: topExperts } = await pool.query(
    `SELECT expert_id, COUNT(*)::int AS sessions
       FROM practice_sessions
      WHERE mode = 'expert' AND expert_id IS NOT NULL AND ${excludeSql(1)}
      GROUP BY expert_id
      ORDER BY sessions DESC
      LIMIT 8`,
    [excludeEmpty],
  );

  const cohortUsers = await fetchUserBreakdowns(pool, excludeEmpty, since60d);
  const { newUsers2m, regularUsers2m } = classifyUserCohorts(cohortUsers, since60d);

  const breakdownByUser = new Map(cohortUsers.map((u) => [u.userId, u]));
  const recentIds = [...cohortUsers]
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt))
    .slice(0, 6)
    .map((u) => u.userId);

  const recentUsers = recentIds
    .map((id) => breakdownByUser.get(id))
    .filter(Boolean);

  return {
    generatedAt: new Date(now).toISOString(),
    timezone: MSK,
    excludedUserIds: exclude,
    users: {
      total: usersTotal,
      active24h: usersActive24h,
      active7d: usersActive7d,
      activeToday: usersActiveToday,
      newToday: usersFirstToday,
    },
    words: { total: wordsTotal, last24h: words24h, today: wordsToday, last7d: words7d, last30d: words30d },
    sets: { total: setsTotal },
    practice: {
      sessionsTotal: practiceSessionsTotal,
      sessions24h: practiceSessions24h,
      sessionsToday: practiceSessionsToday,
      sessions7d: practiceSessions7d,
      messagesTotal: practiceMessagesTotal,
      messages24h: practiceMessages24h,
      messagesToday: practiceMessagesToday,
      freeSessions: practiceFreeSessions,
      expertSessions: practiceExpertSessions,
      wordSessions: practiceWordSessions,
      topExperts: topExperts.map((r) => ({
        expertId: r.expert_id,
        sessions: Number(r.sessions),
      })),
    },
    dictionaryCache: { entries: dictCacheEntries },
    recentUsers,
    cohorts2m: {
      since: new Date(since60d).toISOString(),
      newUsers: newUsers2m,
      regularUsers: regularUsers2m,
    },
  };
}

/** Lightweight counters for the daily Telegram report (today only, MSK). */
export async function fetchTodayUsageStats(pool, { now = Date.now() } = {}) {
  const exclude = parseExcludedUserIds();
  const excludeEmpty = exclude.length ? exclude : null;
  const sinceToday = mskDayStartMs(now);
  const userUnion = buildUserActivityUnion();
  const exS = excludeSql(1).replace(/vk_user_id/g, 's.vk_user_id');

  const [
    usersActiveToday,
    usersFirstToday,
    wordsToday,
    setsToday,
    practiceSessionsToday,
    practiceMessagesToday,
  ] = await Promise.all([
    scalar(
      pool,
      `SELECT COUNT(DISTINCT vk_user_id)::int AS n FROM (${userUnion}) a WHERE ts >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM (
         SELECT vk_user_id, MIN(ts) AS first_ts
           FROM (${userUnion}) x
          GROUP BY vk_user_id
       ) f WHERE first_ts >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM words WHERE ${excludeSql(1)} AND created_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM word_sets WHERE ${excludeSql(1)} AND created_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_sessions WHERE ${excludeSql(1)} AND updated_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
    scalar(
      pool,
      `SELECT COUNT(*)::int AS n FROM practice_messages m
         JOIN practice_sessions s ON s.id = m.session_id
        WHERE ${exS} AND m.created_at >= $2`,
      [excludeEmpty, sinceToday],
    ),
  ]);

  return {
    generatedAt: new Date(now).toISOString(),
    dayKey: mskDayKey(now),
    timezone: MSK,
    users: { activeToday: usersActiveToday, newToday: usersFirstToday },
    words: { today: wordsToday },
    sets: { today: setsToday },
    practice: { sessionsToday: practiceSessionsToday, messagesToday: practiceMessagesToday },
  };
}

function formatPracticeSummary(practice) {
  const parts = [];
  if (practice.freeSessions > 0) {
    parts.push(`${pluralRu(practice.freeSessions, 'свободный чат', 'свободных чата', 'свободных чатов')}`);
  }
  if (practice.expertSessions > 0) {
    parts.push(`${pluralRu(practice.expertSessions, 'диалог с экспертом', 'диалога с экспертом', 'диалогов с экспертом')}`);
  }
  if (practice.wordSessions > 0) {
    parts.push(
      pluralRu(practice.wordSessions, 'практика слова', 'практики слова', 'практик слова'),
    );
  }
  return parts.length ? parts.join(', ') : 'пока не было';
}

function formatMskDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      timeZone: MSK,
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatMskDay(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      timeZone: MSK,
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
}

function appendUserCohorts(lines, cohorts2m, { maxEach = 12 } = {}) {
  if (!cohorts2m) return;
  const { newUsers = [], regularUsers = [] } = cohorts2m;

  lines.push('');
  lines.push(`🆕 Новые за 2 месяца (${newUsers.length}) — впервые зашли недавно:`);
  if (!newUsers.length) {
    lines.push('— никого');
  } else {
    for (const u of newUsers.slice(0, maxEach)) {
      lines.push(`• ${describeUserActivity(u, { periodLabel: 'за 2 мес', showFirst: true, showLast: false })}`);
    }
    if (newUsers.length > maxEach) {
      lines.push(`… ещё ${newUsers.length - maxEach} человек`);
    }
  }

  lines.push('');
  lines.push(`🔁 Постоянные за 2 месяца (${regularUsers.length}) — были раньше и снова вернулись:`);
  if (!regularUsers.length) {
    lines.push('— никого');
  } else {
    for (const u of regularUsers.slice(0, maxEach)) {
      lines.push(
        `• ${describeUserActivity(u, { periodLabel: 'за 2 мес', showFirst: false, showLast: true })}`,
      );
    }
    if (regularUsers.length > maxEach) {
      lines.push(`… ещё ${regularUsers.length - maxEach} человек`);
    }
  }
}

/** Human-readable report for SSH / cron. */
export function formatUsageStatsText(stats) {
  const lines = [
    `Seashell — ${formatMskDate(stats.generatedAt)} МСК`,
    '',
    `Люди: ${pluralRu(stats.users.total, 'человек', 'человека', 'человек')} пользовались приложением`,
    `  за сутки: ${stats.users.active24h} · за неделю: ${stats.users.active7d} · новых сегодня: ${stats.users.newToday}`,
    '',
    `Словарь: ${pluralRu(stats.words.total, 'слово', 'слова', 'слов')} сохранено`,
    `  +${stats.words.last24h} за сутки · +${stats.words.last7d} за неделю · +${stats.words.last30d} за месяц`,
    '',
    `Группы слов: ${stats.sets.total}`,
    '',
    `Практика: ${pluralRu(stats.practice.sessionsTotal, 'диалог', 'диалога', 'диалогов')} всего`,
    `  ${formatPracticeSummary(stats.practice)}`,
    `  за сутки: ${stats.practice.sessions24h} диалогов, ${stats.practice.messages24h} реплик`,
  ];

  if (stats.practice.topExperts?.length) {
    const top = stats.practice.topExperts
      .slice(0, 5)
      .map((e) => `${expertLabel(e.expertId)} — ${e.sessions}`)
      .join(', ');
    lines.push(`  популярные эксперты: ${top}`);
  }

  if (stats.recentUsers?.length) {
    lines.push('', 'Кто был недавно:');
    for (const u of stats.recentUsers) {
      lines.push(`• ${describeUserActivity(u, { periodLabel: 'за 2 мес', showFirst: false, showLast: true })}`);
    }
  }

  appendUserCohorts(lines, stats.cohorts2m, { maxEach: 20 });

  if (stats.excludedUserIds?.length) {
    lines.push('', `Исключены тестовые id: ${stats.excludedUserIds.join(', ')}`);
  }

  return lines.join('\n');
}

/** Compact Russian report for Telegram (daily cron) — today only. */
export function formatUsageStatsTelegram(stats) {
  const dayLabel = stats.dayKey ?? mskDayKey(Date.parse(stats.generatedAt));
  const when = formatMskDate(stats.generatedAt);
  const active = stats.users?.activeToday ?? 0;
  const fresh = stats.users?.newToday ?? 0;
  const words = stats.words?.today ?? 0;
  const sets = stats.sets?.today ?? 0;
  const sessions = stats.practice?.sessionsToday ?? 0;
  const messages = stats.practice?.messagesToday ?? 0;

  return [
    `📊 Seashell — ${dayLabel}`,
    when + ' МСК',
    '',
    `👥 Активных: ${active} · новых: ${fresh}`,
    `📖 Слов: +${words}`,
    `📁 Групп: +${sets}`,
    `💬 Диалогов: ${sessions} · реплик: ${messages}`,
  ].join('\n');
}
