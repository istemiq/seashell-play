import { useEffect, useRef, useState } from 'react';

import { fetchDictionaryQuotes } from '../api/dictionaryApi.js';

const QUOTE_CYCLE_MS = 7000;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * «Экранчик» на главной (не-Academic стили): высвечивает позитивные цитаты
 * из сгенерированных примеров словаря — включает в настрой обучения.
 */
export function HomeQuoteScreen({ className = '' }) {
  const [quotes, setQuotes] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchDictionaryQuotes();
        if (!cancelled) setQuotes(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setQuotes([]);
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

  if (!count) return null;

  const quote = quotes[quoteIdx % count];

  return (
    <div className={`ss-home-quote ${className}`.trim()} aria-live="polite">
      <div key={quoteIdx} className="ss-home-quote__body">
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
