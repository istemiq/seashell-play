import { useEffect, useMemo, useState } from 'react';

import { clearAdsonarSticky, isAdsonarConfigured, refreshAdsonarSticky } from '../ads/index.js';
import { usePremium } from '../hooks/usePremium.js';
import { useI18n } from '../i18n/I18nContext.jsx';

/**
 * Sticky banner slot (AdSonar). Refreshes when `refreshKey` changes.
 * `refreshEvery` (conversation turns): show after N turns, then refresh every N more.
 * Hidden for premium users and when VITE_ADSONAR_APP_ID is not set.
 */
export function AdBanner({
  refreshKey = 0,
  enabled = true,
  autoRefreshIntervalSec = 0,
  refreshEvery = 1,
}) {
  const { t: tr } = useI18n();
  const { premium, loading: premiumLoading } = usePremium();
  const [status, setStatus] = useState('idle');
  const [autoTick, setAutoTick] = useState(0);

  const configured = isAdsonarConfigured();
  const every = Math.max(1, Number(refreshEvery) || 1);
  const turnCount = typeof refreshKey === 'number' ? refreshKey : null;

  const gatedRefreshKey = useMemo(() => {
    if (turnCount === null) return refreshKey;
    if (turnCount < every) return null;
    return Math.floor(turnCount / every);
  }, [turnCount, every, refreshKey]);

  const shouldShow =
    enabled && configured && !premiumLoading && !premium && gatedRefreshKey !== null;

  const effectiveRefreshKey = useMemo(
    () => `${gatedRefreshKey}:${autoTick}`,
    [gatedRefreshKey, autoTick],
  );

  useEffect(() => {
    if (!shouldShow || !autoRefreshIntervalSec || autoRefreshIntervalSec < 30) {
      return undefined;
    }
    const ms = autoRefreshIntervalSec * 1000;
    const id = window.setInterval(() => setAutoTick((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [shouldShow, autoRefreshIntervalSec]);

  useEffect(() => {
    if (!shouldShow) {
      setStatus('hidden');
      document.documentElement.classList.remove('seashell-ad-active');
      void clearAdsonarSticky();
      return undefined;
    }

    document.documentElement.classList.add('seashell-ad-active');

    let cancelled = false;
    setStatus('loading');
    void refreshAdsonarSticky().then((result) => {
      if (cancelled) return;
      setStatus(result?.status === 'error' ? 'error' : 'ready');
    });

    return () => {
      cancelled = true;
      document.documentElement.classList.remove('seashell-ad-active');
      void clearAdsonarSticky();
    };
  }, [shouldShow, effectiveRefreshKey]);

  if (!configured || premium || !enabled || gatedRefreshKey === null) {
    return null;
  }

  return (
    <div className="ss-practice-ad" aria-label={tr('practice.adPlaceholder')}>
      {status === 'loading' ? (
        <div className="ss-practice-ad__banner">{tr('practice.adLoading')}</div>
      ) : null}
      {status === 'error' ? (
        <div className="ss-practice-ad__banner ss-practice-ad__banner--muted">{tr('practice.adPlaceholder')}</div>
      ) : null}
    </div>
  );
}
