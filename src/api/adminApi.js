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

async function adminFetch(path, init = {}) {
  try {
    return await fetch(apiUrl(path), init);
  } catch (e) {
    if (e?.name === 'TypeError') throw new Error(networkFetchError(e));
    throw e;
  }
}

async function parseJsonOrThrow(r) {
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}

export async function fetchAdminAccess() {
  const r = await adminFetch('/admin/access', {
    headers: await buildAuthHeaders(),
  });
  return parseJsonOrThrow(r);
}

export async function addPremiumGrantAdmin(userId) {
  const r = await adminFetch('/admin/premium-grants', {
    method: 'POST',
    headers: {
      ...(await buildAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  return parseJsonOrThrow(r);
}

export async function removePremiumGrantAdmin(userId) {
  const r = await adminFetch(`/admin/premium-grants/${userId}`, {
    method: 'DELETE',
    headers: await buildAuthHeaders(),
  });
  return parseJsonOrThrow(r);
}

export async function addAppAdmin(userId) {
  const r = await adminFetch('/admin/admins', {
    method: 'POST',
    headers: {
      ...(await buildAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  return parseJsonOrThrow(r);
}

export async function removeAppAdmin(userId) {
  const r = await adminFetch(`/admin/admins/${userId}`, {
    method: 'DELETE',
    headers: await buildAuthHeaders(),
  });
  return parseJsonOrThrow(r);
}
