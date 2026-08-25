import { buildAuthHeaders } from './buildAuthHeaders.js';
import { normalizeSttLanguage } from '../utils/studySpeech.js';

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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

export async function postSttTranscribe(blob, { lang } = {}) {
  const audioBase64 = await blobToBase64(blob);
  const sttLang = normalizeSttLanguage(lang);
  const r = await fetch(apiUrl('/stt/transcribe'), {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify({
      audioBase64,
      mime: blob.type || 'audio/webm',
      lang: sttLang,
    }),
  });
  const bodyText = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, bodyText));
  }
  const j = JSON.parse(bodyText);
  return String(j?.text ?? '').trim();
}
