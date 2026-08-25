/**
 * Чистая логика content locale для языков изучения без своего UI.
 * Без localStorage / Vite — можно тестировать в Node.
 */
import { normalizeUiLocale, UI_LOCALES } from '../i18n/config.js';

const UI_LOCALE_CODES = new Set(UI_LOCALES.map((l) => l.code));

export function isStudyWithoutDedicatedUi(studyCode) {
  const code = String(studyCode ?? '').trim();
  return code !== 'en' && !UI_LOCALE_CODES.has(code);
}

export function showCardPickerForOrphanStudy(studyCode) {
  return isStudyWithoutDedicatedUi(studyCode);
}

export function defaultCardLocaleForOrphanStudy() {
  return 'ru';
}

/**
 * @param {{ uiLocale?: string, cardLocalePinned?: boolean, cardLocale?: string }} settings
 */
export function resolveContentLocaleForOrphanStudyFromSettings(
  settings,
  normalizeCardLocale,
  defaultCardLocale,
) {
  const ui = normalizeUiLocale(settings?.uiLocale);
  if (settings?.cardLocalePinned === true) {
    const card = normalizeCardLocale(settings?.cardLocale);
    if (card) return card;
  }
  if (UI_LOCALE_CODES.has(ui)) return ui;
  const fallback = defaultCardLocale();
  if (fallback && fallback !== 'en') return fallback;
  return 'ru';
}

export function isOrphanStudyCardLocalePinned(settings) {
  return settings?.cardLocalePinned === true;
}
