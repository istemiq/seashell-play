/**
 * Общие helpers для HTTP-роутов: локали запроса, квоты, ошибки генерации, rate limiting.
 */
import {
  getLastAdViewTime,
  countWordQuotaUsageSince,
  countAdViewsTotal,
} from './db.js';
import { countPracticeTurnsSince } from './practiceDb.js';
import {
  FREE_WORDS_PER_AD,
  FREE_PRACTICE_PER_AD,
  practiceBatchLimit,
  wordsBatchLimit,
} from './limitsPolicy.js';
import { normalizeContentLocale } from './promptLocales.js';
import { resolveTargetLang, normalizeTargetLang } from './targetLang.js';
import { normalizePracticeLevel } from './practiceLevel.js';
import { generationUserMessage } from './userGenerationErrors.js';

export const isProd = String(process.env.NODE_ENV ?? '').toLowerCase() === 'production';

export function respondDatabaseError(res, e) {
  console.error(e);
  const payload = { error: 'Database error' };
  if (!isProd) {
    payload.hint =
      'PostgreSQL не доступен. Запустите Docker Desktop, затем в seashell_tg_clean: npm run db';
    if (e?.message) payload.detail = e.message;
  }
  res.status(500).json(payload);
}

export function makeRateLimiter({ windowMs, max, keyFn }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = String(keyFn(req) ?? '');
    if (!key) return res.status(400).json({ error: 'Missing rate limit key' });
    const cur = hits.get(key);
    if (!cur || cur.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    cur.count += 1;
    if (cur.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    return next();
  };
}

export function mapPracticeSessionRow(row) {
  return {
    id: row.id,
    mode: row.mode,
    expertId: row.expert_id ?? null,
    targetWordId: row.target_word_id != null ? Number(row.target_word_id) : null,
    patternSeed: row.pattern_seed ?? null,
    targetLang: row.target_lang ?? 'en',
    contentLocale: row.content_locale,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    messageCount: row.message_count ?? 0,
    userTurnCount: row.user_turn_count ?? 0,
    lastPreview: row.last_preview ?? null,
  };
}

export async function getWordsQuotaStatus(vkUserId) {
  const since = await getLastAdViewTime(vkUserId, 'words');
  const [used, adViews] = await Promise.all([
    countWordQuotaUsageSince(vkUserId, since),
    countAdViewsTotal(vkUserId, 'words'),
  ]);
  return {
    used,
    limit: wordsBatchLimit(),
    adViews,
    bonusPerAd: FREE_WORDS_PER_AD,
  };
}

export async function getPracticeQuotaStatus(vkUserId) {
  const since = await getLastAdViewTime(vkUserId, 'practice');
  const [used, adViews] = await Promise.all([
    countPracticeTurnsSince(vkUserId, since),
    countAdViewsTotal(vkUserId, 'practice'),
  ]);
  return {
    used,
    limit: practiceBatchLimit(),
    adViews,
    bonusPerAd: FREE_PRACTICE_PER_AD,
  };
}

export function normalizeWord(w) {
  return String(w || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function responseStatusForGenerationError(e) {
  const status = Number(e?.status ?? e?.statusCode);
  if (Number.isInteger(status) && status >= 400 && status < 600) return status;
  return 502;
}

export function sendGenerationError(res, req, e, statusOverride) {
  const status = statusOverride ?? e?.status ?? responseStatusForGenerationError(e);
  if (
    status >= 400 &&
    status < 500 &&
    e?.message &&
    !String(e.message).includes('OpenRouter') &&
    !String(e.message).includes('DeepSeek')
  ) {
    return res.status(status).json({ error: String(e.message) });
  }
  const locale = resolveUiLocale(req);
  const { error, code } = generationUserMessage(e, locale);
  return res.status(status).json({ error, code });
}

export function resolveContentLocale(req) {
  const fromContent = req.headers['x-content-locale'];
  const fromBody = req.body?.contentLocale;
  const fromHeader = req.headers['x-ui-locale'];
  const fromBodyUi = req.body?.uiLocale;
  let loc = normalizeContentLocale(fromContent || fromBody || fromHeader || fromBodyUi);
  const targetLang = normalizeTargetLang(resolveTargetLang(req));
  // Bashkir cards: Russian gloss by default (Play UI may still send en).
  if (targetLang === 'ba' && loc === 'en') {
    loc = 'ru';
  }
  return loc;
}

export function resolvePracticeLevel(req) {
  const fromHeader = req.headers['x-practice-level'];
  const fromBody = req.body?.practiceLevel;
  return normalizePracticeLevel(fromHeader || fromBody);
}

/** UI language for labels (expert list). Prefer X-UI-Locale over content locale. */
export function resolveUiLocale(req) {
  const fromUi = req.headers['x-ui-locale'] || req.body?.uiLocale;
  const fromContent = req.headers['x-content-locale'] || req.body?.contentLocale;
  return normalizeContentLocale(fromUi || fromContent);
}

/** VK Mini Apps static hosting (prod/stage *.pages*.vk-apps.com). */
export function isVkAppsHostingOrigin(origin) {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === 'vk-apps.com' || host.endsWith('.vk-apps.com');
  } catch {
    return false;
  }
}
