import { useCallback, useRef } from 'react';

const TAP_DEBOUNCE_MS = 400;

/**
 * В Telegram/iOS WebView первый тап по кнопке часто только закрывает клавиатуру.
 * onMouseDown + preventDefault срабатывает до blur поля ввода.
 */
export function useReliableTap(handler, { disabled = false } = {}) {
  const lastAtRef = useRef(0);

  return useCallback(
    (e) => {
      if (disabled || !handler) return;
      const now = Date.now();
      if (now - lastAtRef.current < TAP_DEBOUNCE_MS) return;
      lastAtRef.current = now;
      handler(e);
    },
    [handler, disabled],
  );
}

export function reliableTapProps(handler, { disabled = false } = {}) {
  let lastAt = 0;

  const invoke = (e) => {
    if (disabled || !handler) return;
    const now = Date.now();
    if (now - lastAt < TAP_DEBOUNCE_MS) return;
    lastAt = now;
    handler(e);
  };

  return {
    onMouseDown: (e) => {
      if (disabled || !handler) return;
      if (e.button !== 0) return;
      e.preventDefault();
      invoke(e);
    },
    onClick: (e) => {
      if (disabled || !handler) return;
      invoke(e);
    },
  };
}
