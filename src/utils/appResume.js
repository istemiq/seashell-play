import { getWebApp, hasTelegramWebApp, resumeTelegramApp } from '../platform/telegramApp.js';

export const APP_RESUME_EVENT = 'seashell-app-resume';
export const APP_SUSPEND_EVENT = 'seashell-app-suspend';

let installed = false;
let touchRecoveryArmed = false;
let touchRecoveryTimer = null;
let burstTimers = [];

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

function clearBurstTimers() {
  for (const id of burstTimers) window.clearTimeout(id);
  burstTimers = [];
}

function resetBodyScrollLock() {
  if (typeof document === 'undefined') return;
  if (document.body.style.overflow !== 'hidden') return;
  if (document.querySelector('.seashell-wordsets-shell')) return;
  document.body.style.overflow = '';
}

function nudgeScrollContainers() {
  for (const el of document.querySelectorAll('.ss-panel, .seashell-pinch-viewport, .vkuiPanel__in')) {
    el.scrollTop += 0;
  }
}

function nudgeLayout() {
  try {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
  } catch {
    /* ignore */
  }
  nudgeScrollContainers();
}

function blurFocusedInput() {
  if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

function collectTouchRoots() {
  const seen = new Set();
  const out = [];
  const add = (el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    out.push(el);
  };

  add(document.documentElement);
  add(document.body);
  add(document.getElementById('root'));
  for (const el of document.querySelectorAll(
    '.seashell-crt, .seashell-global-modal-mount, .ss-panel-root, .seashell-confirm-shell',
  )) {
    add(el);
  }
  return out;
}

let touchLayerStuck = false;

function restoreTouchLayer() {
  touchLayerStuck = false;
  for (const el of collectTouchRoots()) {
    el.style.pointerEvents = '';
  }
}

/** Telegram WebView (esp. Android) sometimes keeps an invisible layer that eats touches after lock. */
function unstickTouchLayer() {
  if (typeof document === 'undefined') return;
  const targets = collectTouchRoots();
  for (const el of targets) {
    el.style.pointerEvents = 'none';
  }
  touchLayerStuck = true;
  requestAnimationFrame(() => {
    requestAnimationFrame(restoreTouchLayer);
  });
  // Страховка: rAF в скрытой/замороженной странице может не выполниться,
  // и pointer-events:none зависнет навсегда → приложение глухо к тапам.
  window.setTimeout(restoreTouchLayer, 150);
}

function armTouchRecovery() {
  touchRecoveryArmed = true;
  if (touchRecoveryTimer) window.clearTimeout(touchRecoveryTimer);
  touchRecoveryTimer = window.setTimeout(() => {
    touchRecoveryArmed = false;
    touchRecoveryTimer = null;
  }, 15000);
}

function disarmTouchRecovery() {
  touchRecoveryArmed = false;
  if (touchRecoveryTimer) {
    window.clearTimeout(touchRecoveryTimer);
    touchRecoveryTimer = null;
  }
}

function hookTelegramLifecycleEvents(maybeResume, suspendAppInteraction) {
  const wa = getWebApp();
  if (!wa?.onEvent || wa.__seashellResumeHooked) return Boolean(wa);
  wa.__seashellResumeHooked = true;
  wa.onEvent('visibility_changed', (data) => {
    if (data?.is_visible) maybeResume();
    else suspendAppInteraction();
  });
  wa.onEvent('activated', maybeResume);
  wa.onEvent('deactivated', suspendAppInteraction);
  return true;
}

/** Drop stale pointer/touch state before WebView freezes (screen lock, app switch). */
export function suspendAppInteraction() {
  if (touchLayerStuck) restoreTouchLayer();
  blurFocusedInput();
  armTouchRecovery();
  void import('../ads/adsonar.js').then((m) => m.clearAdsonarSticky()).catch(() => {});
  window.dispatchEvent(new CustomEvent(APP_SUSPEND_EVENT));
}

/** Re-enable touches/scroll after screen lock or Telegram WebView backgrounding. */
export function resumeAppInteraction() {
  if (hasTelegramWebApp()) {
    resumeTelegramApp();
  }

  if (touchLayerStuck) restoreTouchLayer();
  blurFocusedInput();
  resetBodyScrollLock();
  nudgeLayout();
  unstickTouchLayer();
  void import('../ads/adsonar.js').then((m) => m.clearAdsonarSticky()).catch(() => {});

  window.dispatchEvent(new CustomEvent(APP_RESUME_EVENT));
}

function burstResume() {
  clearBurstTimers();
  resumeAppInteraction();
  const delays = isAndroid() ? [150, 450, 1000, 2000, 3000] : [150, 450, 1000];
  for (const ms of delays) {
    burstTimers.push(
      window.setTimeout(() => {
        if (document.visibilityState !== 'hidden') resumeAppInteraction();
      }, ms),
    );
  }
  armTouchRecovery();
}

function onRecoveryPointer() {
  if (!touchRecoveryArmed) return;
  resumeAppInteraction();
  disarmTouchRecovery();
}

export function installAppResumeHandlers() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || installed) return;
  installed = true;

  let lastBurstAt = 0;
  const maybeResume = () => {
    if (document.visibilityState === 'hidden') return;
    const now = Date.now();
    if (now - lastBurstAt < 200) return;
    lastBurstAt = now;
    burstResume();
  };

  const maybeSuspend = () => {
    suspendAppInteraction();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      maybeSuspend();
      return;
    }
    maybeResume();
  });
  window.addEventListener('pagehide', maybeSuspend);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) burstResume();
    else maybeResume();
  });
  window.addEventListener('focus', maybeResume);

  // Page Lifecycle API (Chrome / Android WebView).
  document.addEventListener('freeze', maybeSuspend);
  document.addEventListener('resume', maybeResume);

  // First tap after lock: unstick before the event reaches the target (capture phase).
  document.addEventListener('touchstart', onRecoveryPointer, { capture: true, passive: true });
  document.addEventListener('pointerdown', onRecoveryPointer, { capture: true, passive: true });

  hookTelegramLifecycleEvents(maybeResume, suspendAppInteraction);
  let hookPolls = 0;
  const hookTimer = window.setInterval(() => {
    if (hookTelegramLifecycleEvents(maybeResume, suspendAppInteraction) || ++hookPolls >= 80) {
      window.clearInterval(hookTimer);
    }
  }, 50);
}
