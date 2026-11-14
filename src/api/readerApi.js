/**
 * Загрузка книг из открытого каталога через бэкенд-прокси
 * (GET /api/reader/book?gutenbergId=N → EPUB/TXT байты).
 */
import { buildAuthHeaders } from './buildAuthHeaders.js';
import { networkFetchError } from './apiErrors.js';

const RAW_BASE = (import.meta.env.VITE_API_URL || '').trim();

function apiUrl(path) {
  const rel = path.startsWith('/') ? path : `/${path}`;
  if (!RAW_BASE) return `/api${rel}`;
  const b = RAW_BASE.replace(/\/$/, '');
  const root = b.endsWith('/api') ? b : `${b}/api`;
  return `${root}${rel}`;
}

/**
 * Поиск слова во встроенном словаре (Викисловарь через бэкенд).
 * @returns {Promise<{ word: string, entries: Array }>}
 */
export async function defineWord(word, { src, dst } = {}) {
  const q = new URLSearchParams({ word });
  if (src) q.set('src', src);
  if (dst) q.set('dst', dst);
  let r;
  try {
    r = await fetch(apiUrl(`/reader/define?${q}`), {
      headers: { ...(await buildAuthHeaders()) },
    });
  } catch (e) {
    throw new Error(e?.name === 'TypeError' ? networkFetchError(e) : String(e?.message || e));
  }
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`);
  }
  return r.json();
}

/**
 * Прямой вызов Google Translate из браузера — фолбэк на случай,
 * когда серверный IP заблокирован Google (DC-адреса). Эндпоинт
 * gtx отдаёт CORS *, поэтому fetch из Mini App/WebView работает.
 * @returns {Promise<string[]|null>} переводы или null при недоступности
 */
export async function translateClientSide(text, { src, dst } = {}) {
  const tl = dst || 'en';
  const sl = src || 'auto';
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&dt=bd&q=${encodeURIComponent(text)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const main = (Array.isArray(data?.[0]) ? data[0] : [])
      .map((seg) => String(seg?.[0] ?? ''))
      .join('')
      .trim();
    if (!main) return null;
    const out = [main];
    for (const block of Array.isArray(data?.[1]) ? data[1] : []) {
      for (const tr of Array.isArray(block?.[1]) ? block[1] : []) {
        const s = String(tr ?? '').trim();
        if (s && s.toLowerCase() !== main.toLowerCase() && !out.includes(s)) out.push(s);
        if (out.length >= 6) return out;
      }
    }
    return out;
  } catch {
    return null;
  }
}

/** @returns {Promise<{ data: ArrayBuffer, contentType: string }>} */
export async function fetchCatalogBook(gutenbergId) {
  let r;
  try {
    r = await fetch(apiUrl(`/reader/book?gutenbergId=${encodeURIComponent(gutenbergId)}`), {
      headers: { ...(await buildAuthHeaders()) },
    });
  } catch (e) {
    throw new Error(e?.name === 'TypeError' ? networkFetchError(e) : String(e?.message || e));
  }
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`);
  }
  return {
    data: await r.arrayBuffer(),
    contentType: r.headers.get('content-type') || '',
  };
}

/** Книги, присланные боту (Desktop-обход для file input). */
export async function listMyBooks() {
  const r = await fetch(apiUrl('/reader/my-books'), {
    headers: { ...(await buildAuthHeaders()) },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return Array.isArray(data?.books) ? data.books : [];
}

/** @returns {Promise<{ data: ArrayBuffer, name: string }>} */
export async function fetchMyBook(id) {
  const r = await fetch(apiUrl(`/reader/my-books/${encodeURIComponent(id)}`), {
    headers: { ...(await buildAuthHeaders()) },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const cd = r.headers.get('content-disposition') || '';
  const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
  const name = m ? decodeURIComponent(m[1]) : 'book';
  return { data: await r.arrayBuffer(), name };
}

export async function deleteMyBook(id) {
  const r = await fetch(apiUrl(`/reader/my-books/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { ...(await buildAuthHeaders()) },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}
