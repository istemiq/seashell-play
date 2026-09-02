import { useMemo } from 'react';

function tokenize(text) {
  return String(text ?? '').match(/\S+|\s+/g) ?? [];
}

function wordLemma(token) {
  const stripped = String(token).replace(/^[^\w']+|[^\w']+$/g, '');
  return stripped || String(token);
}

function WordToken({ token, selected, loading, added, onSelect, className = '' }) {
  const lemma = wordLemma(token);
  const isSelected = Boolean(selected && (selected === lemma || selected === token));
  const isLoading = Boolean(loading && (loading === lemma || loading === token));
  const isAdded = Boolean(added && (added === lemma || added === token));

  return (
    <span
      className={[
        'ss-practice-word',
        'ss-practice-word--tappable',
        isSelected ? 'ss-practice-word--selected' : '',
        isLoading ? 'ss-practice-word--loading' : '',
        isAdded ? 'ss-practice-word--added' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-busy={isLoading || undefined}
      aria-label={isAdded ? lemma : undefined}
      title={isAdded ? undefined : lemma}
      onClick={(e) => {
        e.stopPropagation();
        if (isLoading) return;
        onSelect?.(isSelected ? null : lemma);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(isSelected ? null : lemma);
        }
      }}
    >
      {token}
    </span>
  );
}

/** Обыный абзац: тап по слову выделяет его для «В словарь». */
export function PracticeTappableText({
  text,
  selectedWord,
  loadingWord = null,
  addedWord = null,
  onSelectWord,
  className = 'ss-text ss-practice-text ss-practice-prose',
  style,
}) {
  const tokens = useMemo(() => tokenize(text), [text]);
  if (!tokens.length) return null;

  return (
    <p className={className} style={style} dir="ltr" lang="en">
      {tokens.map((token, i) =>
        /^\s+$/.test(token) ? (
          <span key={`${i}-sp`}>{token}</span>
        ) : (
          <WordToken
            key={`${i}-${token}`}
            token={token}
            selected={selectedWord}
            loading={loadingWord}
            added={addedWord}
            onSelect={onSelectWord}
          />
        ),
      )}
    </p>
  );
}

/** То же для кусков echo с подсветкой правок. */
export function PracticeTappableParts({
  parts,
  selectedWord,
  loadingWord = null,
  addedWord = null,
  onSelectWord,
  className = 'ss-text ss-practice-text ss-practice-prose',
  style,
}) {
  if (!parts?.length) return null;

  return (
    <p className={className} style={style} dir="ltr" lang="en">
      {parts.map((part, i) => {
        const tokens = tokenize(part.text);
        return tokens.map((token, j) => {
          if (/^\s+$/.test(token)) {
            return <span key={`${i}-${j}-sp`}>{token}</span>;
          }
          return (
            <WordToken
              key={`${i}-${j}-${token}`}
              token={token}
              selected={selectedWord}
              loading={loadingWord}
              added={addedWord}
              onSelect={onSelectWord}
              className={part.changed ? 'ss-practice-echo-fix' : ''}
            />
          );
        });
      })}
    </p>
  );
}
