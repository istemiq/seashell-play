import { useEffect } from 'react';

import { useLearnLocale } from '../hooks/useLearnLocale.js';
import { applyLearnLocaleDocumentTitle } from '../utils/brandLabel.js';

/** Keeps document.title in sync; does not affect Telegram native header (BotFather). */
export function LearnLocaleTitleSync() {
  const learnLocale = useLearnLocale();

  useEffect(() => {
    applyLearnLocaleDocumentTitle(learnLocale);
  }, [learnLocale]);

  return null;
}
