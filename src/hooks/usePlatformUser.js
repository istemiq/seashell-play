import { useEffect, useState } from 'react';

import { resolvePlatformUserId, setPlatformUserId } from '../platform/platformUser.js';
import { whenGoogleSessionReady } from '../platform/googleSession.js';
import { loadGoogleProfile } from '../platform/googleAuthStore.js';
import { isPlayDevAuth } from '../platform/runtime.js';
import { tStatic } from '../i18n/I18nContext.jsx';

/**
 * Platform user id for API calls (Google Play build).
 */
export function usePlatformUser() {
  const [userId, setUserId] = useState(() => resolvePlatformUserId());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await whenGoogleSessionReady();
        const profile = loadGoogleProfile();
        const id = profile?.userId ?? resolvePlatformUserId();
        if (id) {
          setPlatformUserId(id);
          if (!cancelled) setUserId(id);
          return;
        }
        if (!cancelled) {
          setError(tStatic('errors.authInitData'));
        }
      } catch {
        if (!cancelled) {
          setError(isPlayDevAuth() ? tStatic('errors.loadFailed') : tStatic('errors.authInitData'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { userId, error, ready: Boolean(userId) };
}
