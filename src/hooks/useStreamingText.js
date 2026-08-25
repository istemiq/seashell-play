import { useEffect, useState } from 'react';

import { prefersReducedMotion } from '../utils/prefersReducedMotion.js';

/** Already streamed in this session — no re-animation on scroll/remount. */
const completedStreamIds = new Set();

function charDelay(fullLength, baseMs) {
  if (fullLength > 400) return Math.max(4, baseMs - 6);
  if (fullLength > 180) return Math.max(6, baseMs - 3);
  return baseMs;
}

/**
 * Reveal `fullText` char-by-char. Returns slice + streaming flag.
 * @param {string} fullText
 * @param {{ streamId: string, enabled?: boolean, charMs?: number }} opts
 */
export function useStreamingText(fullText, { streamId, enabled = true, charMs = 14 } = {}) {
  const text = String(fullText ?? '');
  const skip =
    !enabled ||
    !text ||
    !streamId ||
    prefersReducedMotion() ||
    completedStreamIds.has(streamId);

  const [visibleCount, setVisibleCount] = useState(skip ? text.length : 0);

  useEffect(() => {
    if (!text || !streamId) {
      setVisibleCount(0);
      return undefined;
    }

    if (skip) {
      setVisibleCount(text.length);
      completedStreamIds.add(streamId);
      return undefined;
    }

    setVisibleCount(0);
    let cancelled = false;
    let i = 0;
    let timer = null;

    const tick = () => {
      if (cancelled) return;
      i += 1;
      setVisibleCount(i);
      if (i >= text.length) {
        completedStreamIds.add(streamId);
        return;
      }
      timer = setTimeout(tick, charDelay(text.length, charMs));
    };

    timer = setTimeout(tick, charMs);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [text, streamId, skip, charMs]);

  const streaming = visibleCount < text.length;
  return {
    visibleText: text.slice(0, visibleCount),
    streaming,
    complete: !streaming && text.length > 0,
  };
}
