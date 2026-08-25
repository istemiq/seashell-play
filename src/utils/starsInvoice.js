import { getWebApp } from '../platform/telegramApp.js';

/**
 * Opens Telegram Stars invoice in Mini App.
 * @param {string} invoiceUrl
 * @returns {Promise<'paid'|'cancelled'|'failed'|'pending'>}
 */
export function openStarsInvoice(invoiceUrl) {
  const url = String(invoiceUrl ?? '').trim();
  if (!url) return Promise.resolve('failed');

  const wa = getWebApp();
  if (!wa?.openInvoice) {
    return Promise.resolve('failed');
  }

  return new Promise((resolve) => {
    try {
      wa.openInvoice(url, (status) => {
        resolve(status || 'failed');
      });
    } catch {
      resolve('failed');
    }
  });
}
