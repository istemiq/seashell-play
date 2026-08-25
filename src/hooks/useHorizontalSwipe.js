import { useCallback, useEffect, useRef } from 'react';

import { APP_RESUME_EVENT, APP_SUSPEND_EVENT } from '../utils/appResume.js';

/**
 * Horizontal swipe on a block — swipe left → next, swipe right → previous.
 * Vertical scroll still works (`touch-action: pan-y` on the target element).
 */
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  threshold = 48,
} = {}) {
  const startRef = useRef(null);

  const finishSwipe = useCallback(
    (clientX, clientY) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || !enabled) return;
      const dx = clientX - start.x;
      const dy = clientY - start.y;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight],
  );

  const onPointerDown = useCallback(
    (e) => {
      if (!enabled || e.button > 0) return;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (startRef.current?.id !== e.pointerId) return;
      finishSwipe(e.clientX, e.clientY);
    },
    [finishSwipe],
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  const touchStartRef = useRef(null);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled || e.touches.length !== 1) return;
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (e) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || !enabled) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight],
  );

  useEffect(() => {
    const reset = () => {
      startRef.current = null;
      touchStartRef.current = null;
    };
    window.addEventListener(APP_RESUME_EVENT, reset);
    window.addEventListener(APP_SUSPEND_EVENT, reset);
    return () => {
      window.removeEventListener(APP_RESUME_EVENT, reset);
      window.removeEventListener(APP_SUSPEND_EVENT, reset);
    };
  }, []);

  return {
    swipeProps: enabled
      ? {
          onPointerDown,
          onPointerUp,
          onPointerCancel,
          onPointerLeave: onPointerUp,
          onTouchStart,
          onTouchEnd,
        }
      : {},
  };
}
