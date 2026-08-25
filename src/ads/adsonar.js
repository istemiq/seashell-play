const SCRIPT_BASE = 'https://static.sonartech.io/lib/1.0.0/sonar.js';

let loadPromise = null;
let refreshChain = Promise.resolve();

function envAppId() {
  return String(import.meta.env.VITE_ADSONAR_APP_ID ?? '').trim();
}

function envStickyUnit() {
  const unit = String(import.meta.env.VITE_ADSONAR_STICKY_UNIT ?? 'sticky_banner').trim();
  return unit || 'sticky_banner';
}

function envDebug() {
  const v = String(import.meta.env.VITE_ADSONAR_DEBUG ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function isAdsonarConfigured() {
  return Boolean(envAppId());
}

function scriptUrl() {
  const appId = encodeURIComponent(envAppId());
  const isDebug = envDebug() ? 'true' : 'false';
  return `${SCRIPT_BASE}?appId=${appId}&isDebug=${isDebug}`;
}

function waitForSonar(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (typeof window !== 'undefined' && window.Sonar) {
        resolve(window.Sonar);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('AdSonar SDK timeout'));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export function ensureAdsonarLoaded() {
  if (!isAdsonarConfigured()) return Promise.resolve(null);
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Sonar) return Promise.resolve(window.Sonar);

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-seashell-adsonar]');
      if (existing) {
        waitForSonar().then(resolve).catch(reject);
        return;
      }
      const script = document.createElement('script');
      script.src = scriptUrl();
      script.async = true;
      script.dataset.seashellAdsonar = '1';
      script.onload = () => {
        waitForSonar().then(resolve).catch(reject);
      };
      script.onerror = () => {
        loadPromise = null;
        reject(new Error('AdSonar script failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

async function showStickyBanner() {
  const Sonar = await ensureAdsonarLoaded();
  if (!Sonar) return { status: 'disabled' };

  const adUnit = envStickyUnit();
  try {
    const result = await Sonar.show({
      adUnit,
      loader: false,
    });
    return result ?? { status: 'shown' };
  } catch (e) {
    return { status: 'error', message: e?.message || String(e) };
  }
}

async function removeStickyBanner() {
  const Sonar = await ensureAdsonarLoaded();
  if (!Sonar) return { status: 'disabled' };

  const adUnit = envStickyUnit();
  try {
    const result = await Sonar.remove({ adUnit });
    return result ?? { status: 'removed' };
  } catch (e) {
    return { status: 'error', message: e?.message || String(e) };
  }
}

/** Remove previous sticky and request a new impression (practice turn, example switch). */
export async function showRewardedAd() {
  const Sonar = await ensureAdsonarLoaded();
  if (!Sonar) throw new Error('Ads disabled');

  return new Promise((resolve) => {
    Sonar.show({
      adUnit: 'rewarded_video', // You might need to configure this unit ID in env later if it differs
      onReward: () => resolve(true),
      onClose: () => resolve(false),
      onError: () => resolve(false),
    }).catch(() => resolve(false));
  });
}

export function refreshAdsonarSticky() {
  if (!isAdsonarConfigured()) return Promise.resolve({ status: 'disabled' });
  refreshChain = refreshChain
    .then(async () => {
      await removeStickyBanner();
      return showStickyBanner();
    })
    .catch((e) => ({ status: 'error', message: e?.message || String(e) }));
  return refreshChain;
}

export function clearAdsonarSticky() {
  if (!isAdsonarConfigured()) return Promise.resolve({ status: 'disabled' });
  refreshChain = refreshChain
    .then(() => removeStickyBanner())
    .catch(() => ({ status: 'error' }));
  return refreshChain;
}
