import { buildAuthHeaders } from './buildAuthHeaders.js';

const RAW_BASE = (import.meta.env.VITE_API_URL || '').trim();

function apiRoot() {
  if (!RAW_BASE) return '';
  const b = RAW_BASE.replace(/\/$/, '');
  return b.endsWith('/api') ? b : `${b}/api`;
}

function apiUrl(path) {
  const rel = path.startsWith('/') ? path : `/${path}`;
  const root = apiRoot();
  if (!root) return `/api${rel}`;
  return `${root}${rel}`;
}

/** API origin without `/api` — for public mp3 at `/tts/v1/...`. */
function apiOrigin() {
  if (!RAW_BASE) return '';
  return RAW_BASE.replace(/\/$/, '').replace(/\/api$/, '');
}

/** Полный https URL для mp3 (не относительный `/tts/...`). */
export function resolveTtsPlayUrl(relOrAbs) {
  const u = String(relOrAbs ?? '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  const origin = apiOrigin();
  if (!origin) return u;
  return `${origin}${u.startsWith('/') ? u : `/${u}`}`;
}

function messageFromStatusAndBody(status, text) {
  const trimmed = String(text ?? '').trim();
  try {
    const j = JSON.parse(trimmed);
    if (j?.error && typeof j.error === 'string') return j.error;
  } catch {
    // not json
  }
  return trimmed || `HTTP ${status}`;
}

export async function postTtsSpeak({ text, ttsText, locale = 'en-US', rate }) {
  const r = await fetch(apiUrl('/tts/speak'), {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify({
      text,
      ...(ttsText ? { ttsText } : null),
      locale,
      ...(rate != null ? { rate } : null),
    }),
  });
  const bodyText = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, bodyText));
  }
  const j = JSON.parse(bodyText);
  const url = String(j?.url ?? '').trim();
  if (!url) throw new Error('TTS: server returned empty url');
  return j;
}
