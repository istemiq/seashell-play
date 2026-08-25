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

/** @returns {Promise<{ premium: boolean, admin?: boolean, subscription?: object, billing?: object }>} */
export async function fetchUserPlan() {
  const r = await apiFetch('/user/plan', {
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function fetchUserLimits() {
  const r = await apiFetch('/user/limits', {
    headers: await buildAuthHeaders(),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

/** Profile photo via Bot API (initData photo_url is often missing or expired). */
export async function fetchUserAvatarBlobUrl() {
  try {
    const headers = await buildAuthHeaders();
    const { 'Content-Type': _drop, ...authHeaders } = headers;
    const r = await apiFetch('/user/avatar', { headers: authHeaders });
    if (r.status === 404 || !r.ok) return null;
    const blob = await r.blob();
    if (!blob.size) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function rewardAdView(type) {
  const r = await apiFetch('/ads/reward', {
    method: 'POST',
    headers: {
      ...(await buildAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function resetUserLimitsAdmin(targetUserId) {
  const r = await apiFetch('/admin/reset-limits', {
    method: 'POST',
    headers: {
      ...(await buildAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId }),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}
