import { useMemo } from 'react';

import { highlightEchoDiff } from '../utils/practiceEchoHighlight.js';
import { PracticeTappableParts } from './PracticeTappableText.jsx';

export function PracticeEchoText({
  original,
  echo,
  selectedWord,
  loadingWord = null,
  addedWord = null,
  onSelectWord,
  className = 'ss-text ss-practice-text ss-practice-prose',
  style,
}) {
  const parts = useMemo(() => highlightEchoDiff(original, echo), [original, echo]);

  if (!parts.length) return null;

  if (onSelectWord) {
    return (
      <PracticeTappableParts
        parts={parts}
        selectedWord={selectedWord}
        loadingWord={loadingWord}
        addedWord={addedWord}
        onSelectWord={onSelectWord}
        className={className}
        style={style}
      />
    );
  }

  return (
    <p className={className} style={style} dir="ltr" lang="en">
      {parts.map((p, i) =>
        p.changed ? (
          <span key={`${i}-${p.text}`} className="ss-practice-echo-fix">
            {p.text}
          </span>
        ) : (
          <span key={`${i}-${p.text}`}>{p.text}</span>
        ),
      )}
    </p>
  );
}
