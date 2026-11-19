/**
 * Вход в Play-приложение через Telegram-бота:
 *   приложение просит код → открывает t.me/<bot>?start=play_<code> →
 *   юзер жмёт Start → webhook связывает код с telegram_id →
 *   приложение поллит и получает сессионный токен (та же учётка, что в Mini App).
 */
import crypto from 'crypto';
import { getDbPool } from './db.js';

const CODE_TTL_MS = 10 * 60 * 1000;
/** code → { expiresAt, telegramId } — живёт в процессе, коды короткоживущие. */
const pendingCodes = new Map();
/** token → telegramId — кэш над tg_link_sessions, чтобы не ходить в PG на каждый запрос. */
const sessionCache = new Map();

export const LINK_START_PREFIX = 'play_';
const CODE_RE = /^[A-Za-z0-9_-]{8,32}$/;

export async function ensureTgLinkSchema() {
  await getDbPool().query(`CREATE TABLE IF NOT EXISTS tg_link_sessions (
    token TEXT PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    created_at BIGINT NOT NULL
  )`);
}

function sweepExpired() {
  const now = Date.now();
  for (const [code, rec] of pendingCodes) {
    if (rec.expiresAt <= now) pendingCodes.delete(code);
  }
}

export function createLinkCode() {
  sweepExpired();
  const code = crypto.randomBytes(9).toString('base64url');
  pendingCodes.set(code, { expiresAt: Date.now() + CODE_TTL_MS, telegramId: null });
  return code;
}

/** '/start play_<code>' → код либо null. */
export function parseLinkStartParam(text) {
  const m = String(text ?? '')
    .trim()
    .match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]+)/);
  const param = m?.[1] ?? '';
  if (!param.startsWith(LINK_START_PREFIX)) return null;
  const code = param.slice(LINK_START_PREFIX.length);
  return CODE_RE.test(code) ? code : null;
}

/** Webhook /start play_<code> — связывает код с telegram_id. */
export function completeLinkCode(code, telegramId) {
  const rec = pendingCodes.get(code);
  if (!rec || rec.expiresAt <= Date.now()) return false;
  rec.telegramId = telegramId;
  return true;
}

/**
 * Поллинг из приложения: если код уже подтверждён ботом — одноразово
 * выдаёт сессионный токен и сжигает код.
 */
export async function consumeLinkedSession(code) {
  const rec = pendingCodes.get(code);
  if (!rec) return { status: 'expired' };
  if (!rec.telegramId) return { status: 'pending' };
  pendingCodes.delete(code);

  const token = crypto.randomBytes(32).toString('base64url');
  const uid = Number(rec.telegramId);
  await getDbPool().query(
    'INSERT INTO tg_link_sessions (token, telegram_id, created_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO NOTHING',
    [token, uid, Date.now()],
  );
  sessionCache.set(token, uid);
  return { status: 'linked', token, userId: uid };
}

async function resolveTgLinkToken(token) {
  const t = String(token ?? '').trim();
  if (!t || t.length > 128) return null;
  const cached = sessionCache.get(t);
  if (cached) return cached;
  const { rows } = await getDbPool().query(
    'SELECT telegram_id FROM tg_link_sessions WHERE token = $1',
    [t],
  );
  const uid = Number(rows[0]?.telegram_id);
  if (!Number.isFinite(uid) || uid <= 0) return null;
  sessionCache.set(t, uid);
  return uid;
}

/** Header-аутентификация в общей цепочке: X-Telegram-Link-Token. */
export async function tryTelegramLinkAuth(req) {
  const token = String(req.headers['x-telegram-link-token'] ?? '').trim();
  if (!token) return false;
  const uid = await resolveTgLinkToken(token);
  if (!uid) return false;
  req.vkUserId = uid;
  req.authVia = 'telegram-link';
  return true;
}

let botUsernameCache = null;

async function resolveBotUsername() {
  if (botUsernameCache) return botUsernameCache;
  const fromEnv = String(process.env.TELEGRAM_BOT_USERNAME ?? '').trim().replace(/^@/, '');
  if (fromEnv) {
    botUsernameCache = fromEnv;
    return fromEnv;
  }
  const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  if (!token) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const d = await r.json();
    const name = d?.result?.username;
    botUsernameCache = name ? String(name) : null;
  } catch {
    botUsernameCache = null;
  }
  return botUsernameCache;
}

/** Публичные роуты (до auth middleware): старт и поллинг привязки. */
export function registerTelegramLinkRoutes(app) {
  app.post('/api/auth/telegram-link', async (_req, res) => {
    const username = await resolveBotUsername();
    if (!username) {
      return res.status(503).json({ error: 'Telegram bot is not configured' });
    }
    const code = createLinkCode();
    res.json({
      code,
      url: `https://t.me/${username}?start=${LINK_START_PREFIX}${code}`,
      expiresInSec: Math.floor(CODE_TTL_MS / 1000),
    });
  });

  app.get('/api/auth/telegram-link/poll', async (req, res) => {
    const code = String(req.query.code ?? '').trim();
    if (!CODE_RE.test(code)) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    try {
      res.json(await consumeLinkedSession(code));
    } catch (e) {
      console.error('[tg-link] poll failed', e?.message);
      res.status(500).json({ error: 'Poll failed' });
    }
  });
}
