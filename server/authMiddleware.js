/**
 * Auth-цепочка API: Play app secret, Play dev, Google ID token, Telegram initData,
 * VK launch params, dev-headers. Плюс VK reviewer probe для робота деплоя.
 */
import { verifyVkLaunchParams } from './vkSignature.js';
import { verifyTelegramInitData } from './telegramAuth.js';
import { tryGoogleIdTokenAuth, tryPlayDevAuth } from './playAuth.js';
import { tryPlayAppHeaderAuth } from './playAppAuth.js';
import { isProd, isVkAppsHostingOrigin } from './routeHelpers.js';

function platformUserIdFromHeader(req) {
  const raw = req.headers['x-platform-user-id'] ?? req.headers['x-vk-user-id'];
  const n = raw != null ? parseInt(String(raw), 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

/** @deprecated alias */
function vkUserIdFromHeader(req) {
  return platformUserIdFromHeader(req);
}

function vkLaunchParamsFromHeader(req) {
  const h = req.headers['x-vk-launch-params'];
  const s = h != null ? String(h).trim() : '';
  return s || null;
}

function telegramInitDataFromHeader(req) {
  const h = req.headers['x-telegram-init-data'];
  return h != null ? String(h).trim() : '';
}

/** Локальная разработка TG без initData: id из X-Platform-User-Id. */
function tryTelegramDevHeaderAuth(req) {
  if (isProd) return false;
  const uid = platformUserIdFromHeader(req);
  if (!uid) return false;
  req.vkUserId = uid;
  req.authVia = 'telegram-dev-header';
  return true;
}

function tryTelegramInitDataAuth(req, res) {
  const tgInit = telegramInitDataFromHeader(req);
  if (!tgInit) return false;

  const tgToken = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  if (!tgToken) {
    if (tryTelegramDevHeaderAuth(req)) return true;
    res.status(401).json({
      error: 'Telegram init data received but TELEGRAM_BOT_TOKEN is not configured on the server',
    });
    return true;
  }

  const v = verifyTelegramInitData(tgInit, tgToken);
  if (!v.ok) {
    res.status(401).json({ error: 'Invalid Telegram init data' });
    return true;
  }
  req.vkUserId = v.userId;
  req.authVia = 'telegram';
  return true;
}

function isLocalhostOrigin(req) {
  const origin = String(req.headers.origin ?? '');
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function tryLocalhostHeaderAuth(req) {
  if (isProd) return false;
  if (String(process.env.TELEGRAM_ALLOW_LOCALHOST_HEADER ?? '').trim() !== '1') return false;
  if (!isLocalhostOrigin(req)) return false;
  const uid = vkUserIdFromHeader(req);
  if (!uid) return false;
  req.vkUserId = uid;
  req.authVia = 'localhost-header';
  return true;
}


/** Запрос с CDN хостинга мини-аппа (робот VK грузит index.html отсюда, не с vk.com). */
function isVkHostingRequest(req) {
  const origin = req.headers.origin;
  if (origin && isVkAppsHostingOrigin(origin)) return true;
  const ref = String(req.headers.referer ?? '');
  if (!ref) return false;
  try {
    const host = new URL(ref).hostname.toLowerCase();
    return host === 'vk-apps.com' || host.endsWith('.vk-apps.com');
  } catch {
    return false;
  }
}

/** Безопасные GET, которые фронт может вызвать при старте; POST и мутации по-прежнему требуют подпись. */
function isVkReviewerProbeRequest(req) {
  if (req.method !== 'GET') return false;
  const p = req.path;
  return p === '/api/words' || p === '/api/sets' || /^\/api\/words\/\d+$/.test(p);
}

function tryVkReviewerProbe(req) {
  if (!isVkHostingRequest(req) || !isVkReviewerProbeRequest(req)) return false;
  req.vkReviewerProbe = true;
  return true;
}

/** VK deploy robot: empty dictionary responses, no real user data. */
export function vkReviewerProbeMiddleware(req, res, next) {
  if (!req.vkReviewerProbe) return next();
  if (req.method !== 'GET') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const p = req.path;
  if (p === '/api/words') return res.json({ words: [] });
  if (p === '/api/sets') return res.json({ sets: [] });
  if (/^\/api\/words\/\d+$/.test(p)) return res.status(404).json({ error: 'Not found' });
  return res.status(403).json({ error: 'Forbidden' });
}

/**
 * Домены Telegram Mini App фронта. Их 401 должен явно указывать на отсутствие X-Telegram-Init-Data,
 * иначе в логах/на клиенте непонятно, кто стучится (см. инцидент «Missing or invalid app auth headers»).
 * Расширяется через TG_FRONT_HOSTS="front.sishel.ru,other.example".
 */
const TELEGRAM_FRONT_HOSTS = new Set(
  String(process.env.TG_FRONT_HOSTS ?? 'front.sishel.ru')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

function isTelegramFrontRequest(req) {
  const urls = [req.headers.origin, req.headers.referer].filter(Boolean);
  for (const raw of urls) {
    try {
      if (TELEGRAM_FRONT_HOSTS.has(new URL(String(raw)).hostname.toLowerCase())) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** VK Mini Apps ходят с referer/origin на доменах vk.com / vk.ru / vk-apps.com. */
function isVkClientRequest(req) {
  const urls = [req.headers.origin, req.headers.referer].filter(Boolean);
  for (const raw of urls) {
    try {
      const host = new URL(String(raw)).hostname.toLowerCase();
      if (host === 'vk.com' || host.endsWith('.vk.com') || host === 'vk.ru' || host.endsWith('.vk.ru')) return true;
      if (host.endsWith('.vk-apps.com') || host.endsWith('.vk-apps.ru')) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** Play + Google + Telegram initData + VK launch params (shared VPS API). */
export async function appAuthMiddleware(req, res, next) {
  if (tryPlayAppHeaderAuth(req)) {
    return next();
  }

  if (tryPlayDevAuth(req, res)) {
    if (req.vkUserId) return next();
    return;
  }

  const googleHandled = await tryGoogleIdTokenAuth(req, res);
  if (googleHandled) {
    if (req.vkUserId) return next();
    return;
  }

  if (tryTelegramInitDataAuth(req, res)) {
    if (req.vkUserId) return next();
    return;
  }

  const secret = String(process.env.VK_APP_SECRET ?? '').trim();
  const lp = vkLaunchParamsFromHeader(req);

  if (secret) {
    if (!lp) {
      if (tryVkReviewerProbe(req)) return next();
      if (tryLocalhostHeaderAuth(req)) return next();
      if (tryTelegramDevHeaderAuth(req)) return next();
      const origin = String(req.headers.origin ?? '').trim();
      const referer = String(req.headers.referer ?? '').trim();
      // Диагностика: без origin/referer/UA в логе невозможно понять, кто именно получил 401
      // (Telegram-фронт без initData, старый APK без X-Play-App-Secret, VK-клиент или бот).
      console.warn(
        '[auth] rejected',
        req.method,
        req.originalUrl,
        '| origin:',
        origin || '-',
        '| referer:',
        referer || '-',
        '| ip:',
        req.ip ?? '-',
        '| ua:',
        String(req.headers['user-agent'] ?? '-').slice(0, 90),
        '| x-platform-user-id:',
        req.headers['x-platform-user-id'] ?? '-',
        '| x-play-app-secret:',
        req.headers['x-play-app-secret'] ? 'present' : '-',
        '| x-google-id-token:',
        req.headers['x-google-id-token'] ? 'present' : '-',
        '| x-telegram-init-data:',
        req.headers['x-telegram-init-data'] ? 'present' : '-',
      );
      if (isTelegramFrontRequest(req)) {
        return res.status(401).json({
          error: 'Missing X-Telegram-Init-Data header',
          code: 'auth_required',
          reason: 'telegram_front_without_init_data',
        });
      }
      if (isVkClientRequest(req)) {
        return res.status(401).json({
          error: 'Missing X-VK-Launch-Params header',
          code: 'auth_required',
          reason: 'vk_client_without_launch_params',
        });
      }
      return res.status(401).json({
        error: 'Missing or invalid app auth headers',
        code: 'auth_required',
        reason: origin ? 'unknown_origin_without_auth_headers' : 'no_origin_no_auth_headers',
        origin: origin || null,
      });
    }
    const v = verifyVkLaunchParams(lp, secret);
    if (!v.ok) {
      if (tryVkReviewerProbe(req)) return next();
      return res.status(401).json({ error: 'Invalid VK launch params signature' });
    }
    const uid = v.vkUserId != null ? parseInt(String(v.vkUserId), 10) : NaN;
    if (!Number.isFinite(uid) || uid <= 0) {
      if (tryVkReviewerProbe(req)) return next();
      return res.status(401).json({ error: 'Missing or invalid vk_user_id in launch params' });
    }
    req.vkUserId = uid;
    return next();
  }

  if (isProd) {
    return res.status(503).json({ error: 'Server authentication is not configured' });
  }
  const uid = platformUserIdFromHeader(req);
  if (!uid) return res.status(401).json({ error: 'Missing or invalid X-Platform-User-Id header' });
  req.vkUserId = uid;
  next();
}
