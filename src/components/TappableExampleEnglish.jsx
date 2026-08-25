import { PracticeTappableText } from './PracticeTappableText.jsx';

/** English example line: tap a word, then «Add to dictionary». */
export function TappableExampleEnglish({
  text,
  pickKey,
  wordPick,
  onSelectWord,
  onAddClick,
  addLabel,
  disabled = false,
  className,
  style,
}) {
  if (!text) return null;

  return (
    <>
      <PracticeTappableText
        text={text}
        selectedWord={wordPick?.pickKey === pickKey ? wordPick.word : null}
        onSelectWord={(word) => onSelectWord(pickKey, word)}
        className={className}
        style={style}
      />
      <button
        type="button"
        className="ss-flat-link ss-mt-sm ss-block"
        disabled={disabled}
        onClick={onAddClick}
      >
        {addLabel}
      </button>
    </>
  );
}
