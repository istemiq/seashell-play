const SCRIPT_URL = 'https://sad.adsgram.ai/js/sad.min.js';
let loadPromise = null;
let adController = null;
let showInFlight = false;

function envBlockId() {
  return String(import.meta.env.VITE_ADSGRAM_BLOCK_ID ?? '').trim();
}

function envDebug() {
  const v = String(import.meta.env.VITE_ADSGRAM_DEBUG ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function isAdsgramConfigured() {
  return Boolean(envBlockId());
}

export function ensureAdsgramLoaded() {
  if (!isAdsgramConfigured()) return Promise.resolve(null);
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Adsgram) return Promise.resolve(window.Adsgram);

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(window.Adsgram);
      script.onerror = () => {
        loadPromise = null;
        reject(new Error('Adsgram script failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

async function getAdController() {
  const Adsgram = await ensureAdsgramLoaded();
  if (!Adsgram) return null;
  if (!adController) {
    adController = Adsgram.init({
      blockId: envBlockId(),
      debug: envDebug(),
      debugConsole: envDebug(),
    });
  }
  return adController;
}

/** One rewarded impression per call; concurrent calls are ignored. */
export async function showAdsgramRewarded() {
  if (showInFlight) {
    console.warn('[adsgram] show skipped: already in flight');
    return false;
  }

  const controller = await getAdController();
  if (!controller) throw new Error('Adsgram disabled');

  showInFlight = true;
  try {
    await controller.show();
    return true;
  } catch (result) {
    console.warn('Adsgram show failed or skipped:', result);
    return false;
  } finally {
    showInFlight = false;
  }
}
