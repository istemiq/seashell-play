import telegramAnalytics from '@telegram-apps/analytics';

import { hasTelegramWebApp, waitForTelegramSdk } from '../platform/telegramApp.js';

let initPromise = null;

export function isTelegramAnalyticsConfigured() {
  const token = String(import.meta.env.VITE_TG_ANALYTICS_TOKEN ?? '').trim();
  const appName = String(import.meta.env.VITE_TG_ANALYTICS_APP_NAME ?? '').trim();
  return Boolean(token && appName);
}

/** Initialize before React render (Telegram Apps Center requirement). */
export function initTelegramAnalytics() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isTelegramAnalyticsConfigured()) {
      if (import.meta.env.PROD) {
        console.warn(
          '[analytics] skipped: set VITE_TG_ANALYTICS_TOKEN and VITE_TG_ANALYTICS_APP_NAME',
        );
      }
      return false;
    }

    const hasSdk = await waitForTelegramSdk({ timeoutMs: 8000 });
    if (!hasSdk || !hasTelegramWebApp()) {
      return false;
    }

    try {
      await telegramAnalytics.init({
        token: String(import.meta.env.VITE_TG_ANALYTICS_TOKEN).trim(),
        appName: String(import.meta.env.VITE_TG_ANALYTICS_APP_NAME).trim(),
        env: 'PROD',
      });
      return true;
    } catch (err) {
      console.warn('[analytics] init failed', err);
      return false;
    }
  })();

  return initPromise;
}
