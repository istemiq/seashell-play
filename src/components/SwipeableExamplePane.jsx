import { useCallback, useEffect, useRef, useState } from 'react';

import { APP_RESUME_EVENT, APP_SUSPEND_EVENT } from '../utils/appResume.js';
import { isInteractiveGestureTarget } from '../utils/gestureInteractiveTarget.js';

const THRESHOLD = 52;
const MAX_DRAG = 160;
const EXIT_MS = 240;
const HORIZONTAL_LOCK_PX = 16;
const HORIZONTAL_BIAS = 1.45;

function isHorizontalSwipeIntent(dx, dy) {
  return Math.abs(dx) >= HORIZONTAL_LOCK_PX && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function stepForward(prevKey, nextKey, total) {
  if (total < 2) return true;
  return (nextKey - prevKey + total) % total === 1;
}

function isDocumentRtl() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dir === 'rtl';
}

/** Map horizontal drag to next/prev; mirror in RTL. */
function swipeActionFromDelta(dx, dy) {
  if (Math.abs(dx) < THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null;
  const rtl = isDocumentRtl();
  if (dx < 0) return rtl ? 'prev' : 'next';
  return rtl ? 'next' : 'prev';
}

/**
 * Swipeable example block with a page-turn feel (drag follow + flip on release).
 */
export function SwipeableExamplePane({
  enabled = false,
  pageKey,
  pageCount = 1,
  onNext,
  onPrev,
  className = '',
  children,
}) {
  const rootRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [enterFrom, setEnterFrom] = useState(null);
  const startRef = useRef(null);
  const activePointerRef = useRef(null);
  const draggingRef = useRef(false);
  const prevKeyRef = useRef(pageKey);
  const commitTimerRef = useRef(null);
  const touchStartRef = useRef(null);

  const resetPointer = useCallback(() => {
    startRef.current = null;
    activePointerRef.current = null;
    draggingRef.current = false;
    setDragging(false);
  }, []);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, []);

  const releaseCapture = useCallback(() => {
    const el = rootRef.current;
    const pointerId = activePointerRef.current;
    if (el && pointerId != null) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const resetGesture = useCallback(() => {
    releaseCapture();
    setDragX(0);
    resetPointer();
    touchStartRef.current = null;
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, [releaseCapture, resetPointer]);

  useEffect(() => {
    window.addEventListener(APP_RESUME_EVENT, resetGesture);
    window.addEventListener(APP_SUSPEND_EVENT, resetGesture);
    return () => {
      window.removeEventListener(APP_RESUME_EVENT, resetGesture);
      window.removeEventListener(APP_SUSPEND_EVENT, resetGesture);
    };
  }, [resetGesture]);

  useEffect(() => {
    const prev = prevKeyRef.current;
    if (prev === pageKey) return;
    const forward = stepForward(prev, pageKey, pageCount);
    setEnterFrom(forward ? 'next' : 'prev');
    prevKeyRef.current = pageKey;
    const t = window.setTimeout(() => setEnterFrom(null), EXIT_MS + 40);
    return () => window.clearTimeout(t);
  }, [pageKey, pageCount]);

  const commitSwipe = useCallback(
    (direction) => {
      const rtl = isDocumentRtl();
      const outX =
        direction === 'next'
          ? rtl
            ? MAX_DRAG * 1.8
            : -MAX_DRAG * 1.8
          : rtl
            ? -MAX_DRAG * 1.8
            : MAX_DRAG * 1.8;
      draggingRef.current = false;
      setDragging(false);
      setDragX(outX);
      startRef.current = null;
      activePointerRef.current = null;

      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = window.setTimeout(() => {
        if (direction === 'next') onNext?.();
        else onPrev?.();
        setDragX(0);
      }, EXIT_MS);
    },
    [onNext, onPrev],
  );

  const onPointerDown = useCallback(
    (e) => {
      if (!enabled || e.button > 0) return;
      if (isInteractiveGestureTarget(e.target)) return;
      activePointerRef.current = e.pointerId;
      startRef.current = { x: e.clientX, y: e.clientY };
      draggingRef.current = false;
      setDragging(false);
      setDragX(0);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!enabled || activePointerRef.current !== e.pointerId || !startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (!draggingRef.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        if (!isHorizontalSwipeIntent(dx, dy)) {
          resetPointer();
          return;
        }
        draggingRef.current = true;
        setDragging(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      if (draggingRef.current) {
        e.preventDefault();
        setDragX(clamp(dx, -MAX_DRAG, MAX_DRAG));
      }
    },
    [enabled, resetPointer],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (activePointerRef.current !== e.pointerId) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);

      const start = startRef.current;
      if (!start) {
        resetPointer();
        return;
      }

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const action = swipeActionFromDelta(dx, dy);
      if (action) {
        commitSwipe(action);
      } else {
        setDragX(0);
        resetPointer();
      }
    },
    [commitSwipe, resetPointer],
  );

  const onPointerCancel = useCallback(() => {
    setDragX(0);
    resetPointer();
  }, [resetPointer]);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled || e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }
      if (isInteractiveGestureTarget(e.target)) {
        touchStartRef.current = null;
        return;
      }
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      draggingRef.current = false;
      setDragX(0);
      setDragging(false);
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (e) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || !enabled) return;
      if (e.touches.length > 0) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const action = swipeActionFromDelta(dx, dy);
      if (action) {
        commitSwipe(action);
      } else {
        setDragX(0);
        draggingRef.current = false;
        setDragging(false);
      }
    },
    [commitSwipe, enabled],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!enabled || !el) return undefined;

    const onTouchMove = (e) => {
      if (e.touches.length !== 1 || !touchStartRef.current) {
        if (e.touches.length !== 1) {
          touchStartRef.current = null;
          draggingRef.current = false;
          setDragging(false);
          setDragX(0);
        }
        return;
      }
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (!draggingRef.current && isHorizontalSwipeIntent(dx, dy)) {
        draggingRef.current = true;
        setDragging(true);
      }
      if (draggingRef.current) {
        e.preventDefault();
        setDragX(clamp(dx, -MAX_DRAG, MAX_DRAG));
      }
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [enabled]);

  const rotateY = clamp((dragX / MAX_DRAG) * 16, -16, 16);
  const opacity = 1 - Math.min(Math.abs(dragX) / MAX_DRAG, 0.38) * 0.65;
  const transitioning = Boolean(enterFrom) || Math.abs(dragX) > 0.5;
  const pageClass = [
    'seashell-example-flip__page',
    enterFrom === 'next' ? 'seashell-example-flip__page--enter-next' : '',
    enterFrom === 'prev' ? 'seashell-example-flip__page--enter-prev' : '',
    transitioning && !dragging ? 'seashell-example-flip__page--transition' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={rootRef}
      className={`seashell-example-flip${enabled ? ' seashell-example-flip--active' : ''} ${className}`.trim()}
      onPointerDown={enabled ? onPointerDown : undefined}
      onPointerMove={enabled ? onPointerMove : undefined}
      onPointerUp={enabled ? onPointerUp : undefined}
      onPointerCancel={enabled ? onPointerCancel : undefined}
      onLostPointerCapture={enabled ? onPointerCancel : undefined}
      onTouchStart={enabled ? onTouchStart : undefined}
      onTouchEnd={enabled ? onTouchEnd : undefined}
    >
      <div
        className={pageClass}
        style={
          dragging || (Math.abs(dragX) > 0.5 && !enterFrom)
            ? {
                transform: `translateX(${dragX}px) rotateY(${rotateY}deg)`,
                opacity,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
