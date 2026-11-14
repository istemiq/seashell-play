import { useEffect, useRef, useState } from 'react';

import { fetchDictionaryQuotes } from '../api/dictionaryApi.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const QUOTE_CYCLE_MS = 7000;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/** "Имя Фамилия" / "@nick" → "имя.фамилия" для подписи источника цитат. */
export function quoteSourceSlug(userName) {
  const slug = String(userName ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '.')
    .replace(/^\.+|\.+$/g, '');
  return slug || 'seashell';
}

/**
 * «Экранчик» под именем на главной (не-Academic стили): высвечивает позитивные
 * цитаты из сгенерированных примеров словаря. Блок занимает своё место сразу
 * (плейсхолдер-цитата), чтобы плитки не прыгали при загрузке.
 */
export function HomeQuoteScreen({ className = '' }) {
  const { t } = useI18n();
  const [quotes, setQuotes] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchDictionaryQuotes();
        if (!cancelled && Array.isArray(list) && list.length) setQuotes(list);
      } catch {
        /* остаёмся на плейсхолдере */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = quotes?.length ?? 0;

  useEffect(() => {
    if (count < 2 || prefersReducedMotion()) return undefined;
    timerRef.current = window.setInterval(() => {
      setQuoteIdx((i) => (i + 1) % count);
    }, QUOTE_CYCLE_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [count]);

  const quote = count
    ? quotes[quoteIdx % count]
    : { text: t('home.quotePlaceholder'), translation: t('home.quotePlaceholderTr') };

  return (
    <div className={`ss-home-quote ${className}`.trim()} aria-live="polite">
      <div key={count ? quoteIdx : -1} className="ss-home-quote__body">
        <div className="ss-home-quote__text" dir="auto">
          {quote.text}
        </div>
        {quote.translation ? (
          <div className="ss-home-quote__translation" dir="auto">
            {quote.translation}
          </div>
        ) : null}
      </div>
    </div>
  );
}
