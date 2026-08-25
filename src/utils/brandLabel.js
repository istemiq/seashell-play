import { normalizeLearnLocale } from '../i18n/learnLocales.js';

export const APP_BRAND = 'one_seashell';

/** @param {string | undefined | null} learnLocale */
export function brandLabelWithLearnLocale(learnLocale) {
  return `${APP_BRAND} ${normalizeLearnLocale(learnLocale)}`;
}

/** HTML title only — Telegram native header text is configured in BotFather, not here. */
export function applyLearnLocaleDocumentTitle(learnLocale) {
  if (typeof document === 'undefined') return;
  document.title = brandLabelWithLearnLocale(learnLocale);
}
