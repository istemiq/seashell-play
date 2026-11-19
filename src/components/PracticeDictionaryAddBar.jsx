import { CheckIcon } from './CheckIcon.jsx';
import { Footnote } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

const LABEL_MAX = 60;

/** Длинное выделение (случайный drag до низа экрана) показываем сокращённо. */
const shorten = (w) => (w && w.length > LABEL_MAX ? `${w.slice(0, LABEL_MAX)}…` : w);

/** Action row under tappable practice text: hint → add button → loading → success. */
export function PracticeDictionaryAddBar({
  selectedWord,
  loading = false,
  addedWord = null,
  onAdd,
  showTapHint = false,
  disabled = false,
}) {
  const { t } = useI18n();

  if (loading && selectedWord) {
    return (
      <div className="ss-practice-dict-add ss-practice-dict-add--loading" aria-live="polite" aria-busy="true">
        <span className="ss-practice-dict-add__spinner" aria-hidden="true" />
        <span>{t('practice.addingWord', { word: shorten(selectedWord) })}</span>
      </div>
    );
  }

  if (addedWord) {
    return (
      <div className="ss-practice-dict-add ss-practice-dict-add--success" aria-live="polite">
        <CheckIcon size={16} />
        <span>{t('practice.wordAdded', { word: shorten(addedWord) })}</span>
      </div>
    );
  }

  if (selectedWord) {
    return (
      <button
        type="button"
        className="ss-practice-dict-add ss-practice-dict-add--action"
        disabled={disabled}
        onClick={onAdd}
      >
        {t('practice.addWordAction', { word: shorten(selectedWord) })}
      </button>
    );
  }

  if (showTapHint) {
    return (
      <Footnote className="ss-practice-dict-add ss-practice-dict-add--hint">{t('practice.tapWordHint')}</Footnote>
    );
  }

  return null;
}
