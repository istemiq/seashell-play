/**
 * HTTP-клиент для REST API словаря (`/api/words`, `/api/refresh-examples`…).
 * Авторизация: Telegram initData + X-Platform-User-Id.
 */
import { buildAuthHeaders } from './buildAuthHeaders.js';
import { resolveContentLocaleForApi } from '../utils/contentLocale.js';
import { resolvePlatformUserId, setPlatformUserId } from '../platform/platformUser.js';
import { messageFromStatusAndBody, networkFetchError } from './apiErrors.js';

export { resolvePlatformUserId, setPlatformUserId };

/**
 * Прод: VITE_API_URL=https://api.sishel.ru или …/api
 * Дев: не задан — запросы на тот же origin, Vite проксирует /api → локальный бэкенд.
 */
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

export async function fetchWords() {
  const r = await request('/words');
  if (!r.ok) throw new Error(await readHttpError(r));
  return r.json();
}

export async function fetchWordsInSet(setId) {
  const id = setId != null ? parseInt(String(setId), 10) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid setId');
  }
  const r = await request(`/words?setId=${encodeURIComponent(String(id))}`);
  if (!r.ok) throw new Error(await readHttpError(r));
  return r.json();
}

export async function fetchWord(wordId) {
  const r = await request(`/words/${wordId}`);
  if (!r.ok) throw new Error(await readHttpError(r));
  return r.json();
}

export async function fetchSets() {
  const r = await request('/sets');
  if (!r.ok) throw new Error(await readHttpError(r));
  return r.json();
}

export async function createSet(name) {
  const n = String(name ?? '').trim().replace(/\s+/g, ' ');
  const r = await request('/sets', {
    method: 'POST',
    body: JSON.stringify({ name: n }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(messageFromStatusAndBody(r.status, text));
  return JSON.parse(text);
}

export async function renameSet(setId, name) {
  const id = setId != null ? parseInt(String(setId), 10) : NaN;
  const n = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid setId');
  const r = await request(`/sets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: n }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(messageFromStatusAndBody(r.status, text));
  return JSON.parse(text);
}

export async function deleteSet(setId) {
  const id = setId != null ? parseInt(String(setId), 10) : NaN;
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid setId');
  const r = await request(`/sets/${id}`, { method: 'DELETE' });
  const text = await r.text();
  if (!r.ok) throw new Error(messageFromStatusAndBody(r.status, text));
  return JSON.parse(text);
}

export async function updateWordSets(wordId, setIds) {
  const id = wordId != null ? parseInt(String(wordId), 10) : NaN;
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid wordId');
  const r = await request(`/words/${id}/sets`, {
    method: 'PUT',
    body: JSON.stringify({ setIds: Array.isArray(setIds) ? setIds : [] }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(messageFromStatusAndBody(r.status, text));
  return JSON.parse(text);
}

export async function addWord(word, options = {}) {
  const body = { word, contentLocale: resolveContentLocaleForApi() };
  const verbId = options?.irregularVerbId;
  if (verbId != null) {
    body.irregularVerbId = Number(verbId);
  }
  const r = await request('/words', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function addWordFromIrregularVerb(verbId) {
  const id = parseInt(String(verbId), 10);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid verb id');
  return addWord('', { irregularVerbId: id });
}

export async function removeWord(wordId) {
  const r = await request(`/words/${wordId}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) {
    throw new Error(await readHttpError(r));
  }
}

/** Заново запросить у LLM примеры с переводами и заменить сохранённые. */
export async function refreshWordExamples(wordId) {
  const r = await request('/refresh-examples', {
    method: 'POST',
    body: JSON.stringify({ wordId, contentLocale: resolveContentLocaleForApi() }),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

/** Добавить пользовательский пример: родная фраза → естественный английский с headword. */
export async function addCustomWordExample(wordId, nativeText) {
  const id = wordId != null ? parseInt(String(wordId), 10) : NaN;
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid wordId');
  const r = await request(`/words/${id}/custom-examples`, {
    method: 'POST',
    body: JSON.stringify({
      nativeText: String(nativeText ?? '').trim(),
      contentLocale: resolveContentLocaleForApi(),
    }),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}
