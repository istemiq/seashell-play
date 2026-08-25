const RAW_BASE = (import.meta.env.VITE_API_URL || '').trim();

/** Origin for auth/session calls (no /api suffix). */
export function getApiBaseUrl() {
  if (!RAW_BASE) return '';
  const base = RAW_BASE.replace(/\/$/, '');
  return base.endsWith('/api') ? base.slice(0, -4) : base;
}

/** @param {string} path — например `/health` или `/dictionary/words` */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!RAW_BASE) return `/api${p}`;
  const base = RAW_BASE.replace(/\/$/, '');
  if (base.endsWith('/api')) return `${base}${p}`;
  return `${base}/api${p}`;
}

export function getApiBaseLabel() {
  return RAW_BASE || '(dev proxy /api)';
}
