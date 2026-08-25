import { useStreamingText } from '../hooks/useStreamingText.js';

/** Blinking terminal cursor (silver glow). */
export function StreamingCursor({ className = '' }) {
  return (
    <span
      className={['ss-streaming-text', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <span className="ss-streaming-text__cursor" />
    </span>
  );
}

/**
 * Text with typewriter reveal + silver cursor while streaming.
 */
export function StreamingText({
  text,
  streamId,
  enabled = true,
  charMs,
  className = 'ss-text',
  style,
  dir = 'auto',
  lang,
  showCursorWhenDone = false,
}) {
  const full = String(text ?? '');
  const { visibleText, streaming } = useStreamingText(full, { streamId, enabled, charMs });

  if (!full && !streaming) return null;

  const showCursor = streaming || (showCursorWhenDone && !full);

  return (
    <p
      className={[className, 'ss-practice-prose ss-practice-prose--pre', streaming ? 'ss-streaming-text--active' : '']
        .filter(Boolean)
        .join(' ')}
      style={style}
      dir={dir}
      lang={lang}
    >
      {visibleText}
      {showCursor ? <span className="ss-streaming-text__cursor" aria-hidden="true" /> : null}
    </p>
  );
}
