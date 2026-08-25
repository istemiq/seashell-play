import { apiUrl } from './apiUrl.js';
import { buildAuthHeaders } from './buildAuthHeaders.js';

export async function fetchHealth() {
  const headers = await buildAuthHeaders();
  const r = await fetch(apiUrl('/health'), { headers });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`API ${r.status}${text ? `: ${text.slice(0, 120)}` : ''}`);
  }
  return r.json();
}
