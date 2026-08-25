/**
 * Один ход разговорной практики: POST /api/practice/turn.
 */
import { buildAuthHeaders } from './buildAuthHeaders.js';
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

async function apiFetch(path, init = {}) {
  try {
    return await fetch(apiUrl(path), init);
  } catch (e) {
    if (e?.name === 'TypeError') throw new Error(networkFetchError(e));
    throw e;
  }
}

/**
 * Один шаг диалога: эхо, правки, ответ собеседника.
 * @param {{ userText: string, sessionId?: number | null, history?: Array<{ role: string, text: string }> }} body
 */
export async function postPracticeTurn(body) {
  const r = await apiFetch('/practice/turn', {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

/** Список сохранённых экспертов пользователя. */
export async function fetchPracticeExperts() {
  const r = await apiFetch('/practice/experts', {
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function createPracticeExpert(body) {
  const r = await apiFetch('/practice/experts', {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function updatePracticeExpert(expertId, body) {
  const id = String(expertId).replace(/^u/, '');
  const r = await apiFetch(`/practice/experts/${id}`, {
    method: 'PATCH',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function deletePracticeExpert(expertId) {
  const id = String(expertId).replace(/^u/, '');
  const r = await apiFetch(`/practice/experts/${id}`, {
    method: 'DELETE',
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return text ? JSON.parse(text) : { ok: true };
}

export const PRACTICE_EXPERT_START = '__start__';

/**
 * Ход диалога с экспертом.
 * @param {{ expertId: string, userText: string, sessionId?: number | null, history?: Array<{ role: string, text: string }> }} body
 */
export async function postExpertPracticeTurn(body) {
  const r = await apiFetch('/practice/expert/turn', {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function fetchPracticeSession(sessionId) {
  const r = await apiFetch(`/practice/sessions/${sessionId}`, {
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function fetchPracticeSessionsList(mode) {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  const r = await apiFetch(`/practice/sessions${query}`, {
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function deletePracticeSession(sessionId) {
  const r = await apiFetch(`/practice/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return text ? JSON.parse(text) : { ok: true };
}

/**
 * Word drill turn (all UI locales).
 * @param {{ wordId: number, userText: string, sessionId?: number | null }} body
 */
export async function postWordPracticeTurn(body) {
  const r = await apiFetch('/practice/word/turn', {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

/** Sentence-pattern drill for the active study language. */
export async function postPatternPracticeTurn(body) {
  const r = await apiFetch('/practice/pattern/turn', {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}
