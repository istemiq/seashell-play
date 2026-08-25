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

/** @typedef {'sub_month' | 'topup_credits'} BillingProduct */

/**
 * @param {BillingProduct} product
 * @returns {Promise<{ invoiceUrl: string, product: string }>}
 */
export async function createBillingInvoice(product) {
  const r = await apiFetch('/billing/invoice', {
    method: 'POST',
    headers: {
      ...(await buildAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ product }),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(messageFromStatusAndBody(r.status, text));
  }
  return JSON.parse(text);
}
