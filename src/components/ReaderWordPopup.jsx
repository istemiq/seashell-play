import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { CheckIcon } from './CheckIcon.jsx';
import { Spinner, Footnote } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

const POPUP_W = 300;
const POPUP_H_EST = 240;

/** Небольшой попап с переводом слова из встроенного словаря (без LLM). */
export function ReaderWordPopup({ anchorRect, word, loading, data, error, onAdd, adding, addedWord, onClose }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 8, top: 8 });

  useLayoutEffect(() => {
    if (!anchorRect) return;
    const vw = window.visualViewport?.width || window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;
    const w = ref.current?.offsetWidth || Math.min(POPUP_W, vw - 16);
    const h = ref.current?.offsetHeight || POPUP_H_EST;
    const left = Math.min(Math.max(anchorRect.left, 8), Math.max(8, vw - w - 8));
    let top = anchorRect.bottom + 8;
    if (top + h > vh - 8) {
      top = Math.max(8, anchorRect.top - h - 8);
    }
    setPos({ left, top });
  }, [anchorRect, data, loading]);

  // Закрытие по клику вне попапа
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [onClose]);

  const entries = data?.entries || [];

  return (
    <div ref={ref} className="ss-word-popup" style={{ left: pos.left, top: pos.top }}>
      <div className="ss-word-popup__head">
        <div className="ss-word-popup__word">
          <strong>{data?.word || word}</strong>
          {data?.lemma ? <span className="ss-word-popup__lemma">→ {data.lemma}</span> : null}
          {entries[0]?.pos ? <span className="ss-word-popup__pos">{entries[0].pos}</span> : null}
          {entries[0]?.ipa ? <span className="ss-word-popup__ipa">{entries[0].ipa}</span> : null}
        </div>
        <button type="button" className="ss-word-popup__close" aria-label={t('common.cancel')} onClick={onClose}>
          ×
        </button>
      </div>

      {loading ? (
        <div className="ss-word-popup__loading">
          <Spinner size="s" />
        </div>
      ) : error ? (
        <div className="ss-word-popup__body">{t('reader.lookupFailed')}</div>
      ) : entries.length || data?.translations?.length ? (
        <div className="ss-word-popup__body">
          {data?.form ? <div className="ss-word-popup__form">{data.form}</div> : null}
          {data?.translations?.length ? (
            <div className="ss-word-popup__trans">{data.translations.join('; ')}</div>
          ) : (
            entries.slice(0, 3).map((e, i) => (
              <div key={i} className="ss-word-popup__entry">
                {entries.length > 1 ? <div className="ss-word-popup__lang">{e.lang}</div> : null}
                <ol className="ss-word-popup__glosses">
                  {e.glosses.slice(0, 5).map((g, j) => (
                    <li key={j}>{g}</li>
                  ))}
                </ol>
              </div>
            ))
          )}
          <Footnote className="ss-word-popup__src">
            {t(
              data?.translations?.length
                ? data.translationsSource === 'mymemory'
                  ? 'reader.srcMyMemory'
                  : 'reader.srcGoogle'
                : 'reader.dictSource',
            )}
          </Footnote>
        </div>
      ) : (
        <div className="ss-word-popup__body">{t('reader.lookupFailed')}</div>
      )}

      <div className="ss-word-popup__actions">
        {addedWord === (data?.word || word) ? (
          <div className="ss-practice-dict-add ss-practice-dict-add--success">
            <CheckIcon size={16} />
            <span>{t('reader.addedToDict')}</span>
          </div>
        ) : (
          <button
            type="button"
            className="ss-practice-dict-add ss-practice-dict-add--action"
            disabled={adding || loading}
            onClick={onAdd}
          >
            {adding ? '…' : t('reader.addDictionary')}
          </button>
        )}
      </div>
    </div>
  );
}
