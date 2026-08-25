import { useEffect, useRef } from 'react';

import { focusMobileInput } from '../utils/mobileKeyboard.js';

/** Focus textarea/input when `active` — e.g. dialog ready or tab switched. */
export function useAutofocusInput(active, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const focusEl = () => {
      const el = ref.current;
      if (!el || el.disabled) return;
      try {
        el.focus({ preventScroll: false });
        const len = String(el.value ?? '').length;
        if (typeof el.setSelectionRange === 'function') {
          el.setSelectionRange(len, len);
        }
        focusMobileInput(el);
      } catch {
        /* Telegram WebView */
      }
    };

    const t1 = requestAnimationFrame(() => {
      focusEl();
      setTimeout(focusEl, 50);
    });

    return () => cancelAnimationFrame(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);

  return ref;
}
