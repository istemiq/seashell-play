/**
 * HTTP-клиент для примеров неправильных глаголов (серверный кэш + LLM).
 */
import { buildAuthHeaders } from './buildAuthHeaders.js';
import { resolveContentLocaleForApi } from '../utils/contentLocale.js';
import { messageFromStatusAndBody, networkFetchError } from './apiErrors.js';

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

async function request(path, init = {}) {
  let r;
  try {
    r = await fetch(apiUrl(path), {
      ...init,
      headers: { ...(await buildAuthHeaders()), ...init.headers },
    });
  } catch (e) {
    if (e?.name === 'TypeError') {
      throw new Error(networkFetchError(e));
    }
    throw e;
  }
  return r;
}

async function readHttpError(r) {
  const t = await r.text();
  return messageFromStatusAndBody(r.status, t);
}

function localeBody() {
  return { contentLocale: resolveContentLocaleForApi() };
}

/** @returns {Promise<{ verbId: number, examples: Array<{ form: string, en: string, translation: string }>, needsGeneration?: boolean, batchCount?: number }>} */
export async function fetchIrregularVerbExamples(verbId) {
  const id = parseInt(String(verbId), 10);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid verb id');
  const locale = resolveContentLocaleForApi();
  const r = await request(
    `/irregular-verbs/${id}/examples?contentLocale=${encodeURIComponent(locale)}`,
  );
  if (!r.ok) throw new Error(await readHttpError(r));
  return r.json();
}

/** Первичная генерация (или чтение из кэша, если уже достаточно примеров). */
export async function generateIrregularVerbExamples(verbId) {
  const id = parseInt(String(verbId), 10);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid verb id');
  const r = await request(`/irregular-verbs/${id}/examples/generate`, {
    method: 'POST',
    body: JSON.stringify(localeBody()),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

/** Premium: добавить новую пачку из 30 примеров в общий кэш. */
export async function refreshIrregularVerbExamples(verbId) {
  const id = parseInt(String(verbId), 10);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid verb id');
  const r = await request(`/irregular-verbs/${id}/examples/refresh`, {
    method: 'POST',
    body: JSON.stringify(localeBody()),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}
