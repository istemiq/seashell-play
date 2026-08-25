import { getWebApp } from '../platform/telegramApp.js';

function isTouchMobile() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches;
}

/** Keep Telegram viewport + CSS vars in sync when the software keyboard opens. */
export function installMobileKeyboardViewport() {
  if (typeof window === 'undefined' || !isTouchMobile()) return () => {};

  const root = document.documentElement;
  const vv = window.visualViewport;

  const sync = () => {
    const wa = getWebApp();
    const tgH = Number(wa?.viewportStableHeight ?? wa?.viewportHeight ?? 0);
    const vvH = Number(vv?.height ?? 0);
    const vvTop = Number(vv?.offsetTop ?? 0);

    if (Number.isFinite(vvH) && vvH > 0) {
      root.style.setProperty('--ss-visual-viewport-height', `${Math.round(vvH)}px`);
      root.style.setProperty('--ss-visual-viewport-offset-top', `${Math.round(vvTop)}px`);
    }

    const h =
      Number.isFinite(tgH) && tgH > 0
        ? tgH
        : Number.isFinite(vvH) && vvH > 0
          ? vvH + vvTop
          : 0;
    if (h > 0) {
      root.style.setProperty('--ss-app-height', `${Math.round(h)}px`);
    }

    const keyboardGap = Math.max(0, window.innerHeight - (vvH + vvTop));
    root.style.setProperty('--ss-keyboard-gap', `${Math.round(keyboardGap)}px`);
  };

  sync();
  vv?.addEventListener('resize', sync);
  vv?.addEventListener('scroll', sync);
  window.addEventListener('orientationchange', sync);

  const wa = getWebApp();
  if (wa?.onEvent) {
    wa.onEvent('viewportChanged', sync);
  }

  return () => {
    vv?.removeEventListener('resize', sync);
    vv?.removeEventListener('scroll', sync);
    window.removeEventListener('orientationchange', sync);
  };
}

/** Scroll focused field above the keyboard (Android Telegram WebView). */
export function focusMobileInput(el) {
  if (!el || !(el instanceof HTMLElement)) return;
  if (!isTouchMobile()) return;

  const scrollField = () => {
    try {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    } catch {
      try {
        el.scrollIntoView(false);
      } catch {
        /* ignore */
      }
    }
  };

  scrollField();
  requestAnimationFrame(scrollField);
  window.setTimeout(scrollField, 120);
  window.setTimeout(scrollField, 320);
}

export function handleMobileInputFocus(e) {
  focusMobileInput(e.currentTarget);
}
