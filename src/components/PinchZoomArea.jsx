import { useCallback, useEffect, useRef, useState } from 'react';

import { APP_RESUME_EVENT, APP_SUSPEND_EVENT } from '../utils/appResume.js';
import { subscribeAppFontScale } from '../utils/fontScale.js';
import { isInteractiveGestureTarget } from '../utils/gestureInteractiveTarget.js';

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const SNAP_THRESHOLD = 1.04;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function canUsePinchZoom() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

function clampPan(pan, containerSize, contentSize, scale) {
  if (scale <= 1) return 0;
  const overflow = contentSize * scale - containerSize;
  if (overflow <= 0) return 0;
  return clamp(pan, -overflow, 0);
}

function pointerDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Pinch-to-zoom for a card block (pointer events — works in Telegram WebView).
 */
export function PinchZoomArea({ children, className = '', resetKey = '', onZoomChange }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const transformRef = useRef({ scale: 1, panX: 0, panY: 0 });
  const contentSizeRef = useRef({ w: 0, h: 0 });
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const [pinching, setPinching] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const notifyZoom = useCallback(
    (scale) => {
      const z = scale > SNAP_THRESHOLD;
      setZoomed(z);
      onZoomChange?.(z);
    },
    [onZoomChange],
  );

  const paint = useCallback(
    (scale, panX, panY) => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const cw = outer.clientWidth;
      const ch = outer.clientHeight;
      const { w, h } = contentSizeRef.current;
      const contentW = w > 0 ? w : inner.offsetWidth;
      const contentH = h > 0 ? h : inner.scrollHeight;

      const px = clampPan(panX, cw, contentW, scale);
      const py = clampPan(panY, ch, contentH, scale);
      transformRef.current = { scale, panX: px, panY: py };
      inner.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
      notifyZoom(scale);
    },
    [notifyZoom],
  );

  const measure = useCallback(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;
    contentSizeRef.current = {
      w: inner.offsetWidth || outer.clientWidth,
      h: inner.scrollHeight || inner.offsetHeight,
    };
    const { scale, panX, panY } = transformRef.current;
    paint(scale, panX, panY);
  }, [paint]);

  const resetTransform = useCallback(() => {
    pointersRef.current.clear();
    pinchRef.current = null;
    panRef.current = null;
    setPinching(false);
    paint(1, 0, 0);
  }, [paint]);

  useEffect(() => {
    resetTransform();
  }, [resetKey, resetTransform]);

  useEffect(() => {
    const releaseActiveGesture = () => {
      const outer = outerRef.current;
      if (outer) {
        for (const pointerId of pointersRef.current.keys()) {
          try {
            outer.releasePointerCapture(pointerId);
          } catch {
            /* ignore */
          }
        }
      }
      pointersRef.current.clear();
      pinchRef.current = null;
      panRef.current = null;
      setPinching(false);
    };
    window.addEventListener(APP_RESUME_EVENT, releaseActiveGesture);
    window.addEventListener(APP_SUSPEND_EVENT, releaseActiveGesture);
    return () => {
      window.removeEventListener(APP_RESUME_EVENT, releaseActiveGesture);
      window.removeEventListener(APP_SUSPEND_EVENT, releaseActiveGesture);
    };
  }, []);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return undefined;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    window.addEventListener('resize', measure);
    const unsubFont = subscribeAppFontScale(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      unsubFont();
    };
  }, [measure, children]);

  const beginPinch = useCallback(
    (p1, p2) => {
      const outer = outerRef.current;
      if (!outer) return;
      const mid = pointerMidpoint(p1, p2);
      const rect = outer.getBoundingClientRect();
      const { scale, panX, panY } = transformRef.current;
      pinchRef.current = {
        startDistance: pointerDistance(p1, p2),
        startScale: scale,
        anchorX: (mid.x - rect.left - panX) / scale,
        anchorY: (mid.y - rect.top - panY) / scale,
      };
      panRef.current = null;
      setPinching(true);
    },
    [],
  );

  const updatePinch = useCallback(
    (p1, p2) => {
      const outer = outerRef.current;
      const pinch = pinchRef.current;
      if (!outer || !pinch) return;
      const mid = pointerMidpoint(p1, p2);
      const rect = outer.getBoundingClientRect();
      const ratio = pointerDistance(p1, p2) / pinch.startDistance;
      const nextScale = clamp(pinch.startScale * ratio, MIN_SCALE, MAX_SCALE);
      const panX = mid.x - rect.left - pinch.anchorX * nextScale;
      const panY = mid.y - rect.top - pinch.anchorY * nextScale;
      paint(nextScale, panX, panY);
    },
    [paint],
  );

  useEffect(() => {
    if (!canUsePinchZoom()) return undefined;
    const outer = outerRef.current;
    if (!outer) return undefined;

    const onPointerDown = (e) => {
      if (isInteractiveGestureTarget(e.target)) return;
      if (e.pointerType === 'mouse' && e.button > 0) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 2) {
        try {
          outer.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        const pts = [...pointersRef.current.values()];
        beginPinch(pts[0], pts[1]);
        e.stopPropagation();
        return;
      }

      if (pointersRef.current.size === 1 && transformRef.current.scale > SNAP_THRESHOLD) {
        try {
          outer.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startPanX: transformRef.current.panX,
          startPanY: transformRef.current.panY,
        };
      }
    };

    const onPointerMove = (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size >= 2) {
        e.preventDefault();
        e.stopPropagation();
        const pts = [...pointersRef.current.values()];
        if (pts.length >= 2) {
          if (!pinchRef.current) beginPinch(pts[0], pts[1]);
          else updatePinch(pts[0], pts[1]);
        }
        return;
      }

      if (panRef.current && transformRef.current.scale > SNAP_THRESHOLD) {
        e.preventDefault();
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        const { scale } = transformRef.current;
        paint(scale, panRef.current.startPanX + dx, panRef.current.startPanY + dy);
      }
    };

    const onPointerUp = (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.delete(e.pointerId);
      try {
        outer.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      if (pointersRef.current.size >= 2) {
        const pts = [...pointersRef.current.values()];
        if (pinchRef.current && pts.length >= 2) updatePinch(pts[0], pts[1]);
        return;
      }

      if (pinchRef.current && pointersRef.current.size < 2) {
        const { scale, panX, panY } = transformRef.current;
        if (scale < SNAP_THRESHOLD) resetTransform();
        else paint(scale, panX, panY);
        pinchRef.current = null;
        setPinching(false);
      }

      if (pointersRef.current.size === 0) {
        panRef.current = null;
        setPinching(false);
      }
    };

    outer.addEventListener('pointerdown', onPointerDown, { capture: true });
    outer.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
    outer.addEventListener('pointerup', onPointerUp, { capture: true });
    outer.addEventListener('pointercancel', onPointerUp, { capture: true });

    return () => {
      outer.removeEventListener('pointerdown', onPointerDown, { capture: true });
      outer.removeEventListener('pointermove', onPointerMove, { capture: true });
      outer.removeEventListener('pointerup', onPointerUp, { capture: true });
      outer.removeEventListener('pointercancel', onPointerUp, { capture: true });
    };
  }, [beginPinch, updatePinch, paint, resetTransform]);

  if (!canUsePinchZoom()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={outerRef}
      className={`seashell-pinch-area${zoomed ? ' is-zoomed' : ''}${pinching ? ' is-pinching' : ''} ${className}`.trim()}
    >
      <div ref={innerRef} className="seashell-pinch-area__inner">
        {children}
      </div>
    </div>
  );
}
