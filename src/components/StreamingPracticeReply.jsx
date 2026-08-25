import { PracticeTappableText } from './PracticeTappableText.jsx';
import { useStreamingText } from '../hooks/useStreamingText.js';

/** Partner reply: typewriter first, then tappable words when done. */
export function StreamingPracticeReply({
  text,
  streamId,
  selectedWord,
  onSelectWord,
  className = 'ss-text ss-practice-text ss-practice-prose ss-practice-prose--pre',
  style,
  enabled = true,
}) {
  const full = String(text ?? '');
  const { visibleText, streaming, complete } = useStreamingText(full, {
    streamId,
    enabled: enabled && Boolean(full),
  });

  if (!full) return null;

  if (streaming || !complete) {
    return (
      <p
        className={[className, 'ss-streaming-text--active'].filter(Boolean).join(' ')}
        style={style}
        dir="ltr"
        lang="en"
      >
        {visibleText}
        <span className="ss-streaming-text__cursor" aria-hidden="true" />
      </p>
    );
  }

  return (
    <PracticeTappableText
      text={full}
      selectedWord={selectedWord}
      onSelectWord={onSelectWord}
      className={className}
      style={style}
    />
  );
}
