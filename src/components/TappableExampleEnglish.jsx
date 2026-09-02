import { PracticeDictionaryAddBar } from './PracticeDictionaryAddBar.jsx';
import { PracticeTappableText } from './PracticeTappableText.jsx';

/** English example line: tap a word, then confirm add to dictionary. */
export function TappableExampleEnglish({
  text,
  pickKey,
  blockState,
  onSelectWord,
  onAddClick,
  showTapHint = false,
  disabled = false,
  className,
  style,
}) {
  if (!text) return null;

  const { selectedWord, loading, loadingWord, addedWord } = blockState ?? {};

  return (
    <>
      <PracticeTappableText
        text={text}
        selectedWord={selectedWord}
        loadingWord={loading ? loadingWord : null}
        addedWord={addedWord}
        onSelectWord={(word) => onSelectWord(pickKey, word)}
        className={['ss-text', 'ss-practice-text', 'ss-practice-prose', 'ss-dict-study-text', className]
          .filter(Boolean)
          .join(' ')}
        style={style}
      />
      <PracticeDictionaryAddBar
        selectedWord={selectedWord}
        loading={loading}
        addedWord={addedWord}
        onAdd={onAddClick}
        showTapHint={showTapHint}
        disabled={disabled}
      />
    </>
  );
}
