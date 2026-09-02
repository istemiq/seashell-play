import { verifyGoogleIdToken } from './googleAuth.js';
import { resolveGoogleUserId, getPlatformAccount, getUserProfileResponse } from './platformUsersDb.js';
import { tryPlayAppHeaderAuth } from './playAppAuth.js';

function platformUserIdFromHeader(req) {
  const raw = req.headers['x-platform-user-id'];
  const n = parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function googleIdTokenFromHeader(req) {
  return String(req.headers['x-google-id-token'] ?? '').trim();
}

function isProd() {
  return String(process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

function playDevAuthEnabled() {
  return String(process.env.PLAY_DEV_AUTH ?? '').trim() === '1' && !isProd();
}

/** @returns {boolean} true if response was sent */
export function tryPlayDevAuth(req, res) {
  if (!playDevAuthEnabled()) return false;
  const token = googleIdTokenFromHeader(req);
  if (token && token !== 'dev-token') return false;
  const uid = platformUserIdFromHeader(req);
  if (!uid) return false;
  req.vkUserId = uid;
  req.authVia = 'play-dev';
  return true;
}

/** @returns {boolean} true if response was sent */
export async function tryGoogleIdTokenAuth(req, res) {
  const token = googleIdTokenFromHeader(req);
  if (!token) return false;
  if (token === 'dev-token') return false;

  const v = await verifyGoogleIdToken(token);
  if (!v.ok) {
    res.status(401).json({ error: 'Invalid Google ID token' });
    return true;
  }

  try {
    const userId = await resolveGoogleUserId(v);
    req.vkUserId = userId;
    req.authVia = 'google';
    req.googleSub = v.sub;
    return true;
  } catch (e) {
    console.error('[auth] google user resolve failed', e);
    res.status(500).json({ error: 'Auth failed' });
    return true;
  }
}

export async function handleGoogleSession(req, res) {
  const token = googleIdTokenFromHeader(req);
  if (!token) return res.status(400).json({ error: 'Missing X-Google-Id-Token' });

  if (token === 'dev-token' && playDevAuthEnabled()) {
    const userId = platformUserIdFromHeader(req) || 5000000001;
    const profile = await getUserProfileResponse(userId);
    return res.json({
      ...profile,
      avatarUrl: null,
      dev: true,
    });
  }

  const v = await verifyGoogleIdToken(token);
  if (!v.ok) return res.status(401).json({ error: 'Invalid Google ID token' });

  try {
    const userId = await resolveGoogleUserId(v);
    const account = await getPlatformAccount(userId);
    const profile = await getUserProfileResponse(userId);
    return res.json({
      ...profile,
      avatarUrl: account?.avatar_url ?? v.picture ?? null,
    });
  } catch (e) {
    console.error('[auth] session', e);
    return res.status(500).json({ error: 'Auth failed' });
  }
}

export function registerPlayAuthMiddleware(app) {
  app.post('/api/auth/google/session', (req, res) => {
    void handleGoogleSession(req, res);
  });

  app.use(async (req, res, next) => {
    if (tryPlayAppHeaderAuth(req)) {
      return next();
    }
    if (tryPlayDevAuth(req, res)) {
      if (req.vkUserId) return next();
      return;
    }
    const handled = await tryGoogleIdTokenAuth(req, res);
    if (handled) {
      if (req.vkUserId) return next();
      return;
    }
    if (playDevAuthEnabled()) {
      const uid = platformUserIdFromHeader(req);
      if (uid) {
        req.vkUserId = uid;
        req.authVia = 'play-dev-header';
        return next();
      }
    }
    return res.status(401).json({ error: 'Missing or invalid Google auth' });
  });
}
