import { OAuth2Client } from 'google-auth-library';

let client = null;

function oauthClient() {
  if (client) return client;
  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
  ]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);
  if (!ids.length) return null;
  client = new OAuth2Client(ids[0]);
  return client;
}

/** @returns {Promise<{ ok: true, sub: string, email?: string, name?: string, picture?: string } | { ok: false, reason: string }>} */
export async function verifyGoogleIdToken(idToken) {
  const token = String(idToken ?? '').trim();
  if (!token) return { ok: false, reason: 'missing' };

  const oauth = oauthClient();
  if (!oauth) return { ok: false, reason: 'not_configured' };

  const audiences = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
  ]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);

  try {
    const ticket = await oauth.verifyIdToken({
      idToken: token,
      audience: audiences.length ? audiences : undefined,
    });
    const payload = ticket.getPayload();
    const sub = String(payload?.sub ?? '').trim();
    if (!sub) return { ok: false, reason: 'no_sub' };
    return {
      ok: true,
      sub,
      email: payload?.email ? String(payload.email) : undefined,
      name: payload?.name ? String(payload.name) : undefined,
      picture: payload?.picture ? String(payload.picture) : undefined,
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
