import { useEffect, useState } from 'react';

import { getTelegramUser, isBrowserDevMode } from '../platform/telegramApp.js';
import { resolvePlatformUserId, setPlatformUserId } from '../platform/platformUser.js';
import { whenTelegramSessionReady } from '../platform/telegramSession.js';
import { tStatic } from '../i18n/I18nContext.jsx';

const DEV_FALLBACK_USER_ID = Number(import.meta.env.VITE_DEV_TG_USER_ID) || 1000001;

/**
 * userId для API + optional error в WebView Telegram.
 */
export function usePlatformUser() {
  const [userId, setUserId] = useState(() => resolvePlatformUserId());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await whenTelegramSessionReady();
      const tgUser = getTelegramUser();
      if (tgUser?.id) {
        setPlatformUserId(tgUser.id);
        if (!cancelled) setUserId(tgUser.id);
        return;
      }
      const id = resolvePlatformUserId();
      if (id) {
        if (!cancelled) setUserId(id);
        return;
      }
      if (isBrowserDevMode()) {
        setPlatformUserId(DEV_FALLBACK_USER_ID);
        if (!cancelled) setUserId(DEV_FALLBACK_USER_ID);
        return;
      }
      if (!cancelled) {
        setError(tStatic('errors.userTelegram'));
      }
    })().catch(() => {
      if (!cancelled) {
        setError(tStatic('errors.userTelegram'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { userId, error, ready: Boolean(userId) };
}
