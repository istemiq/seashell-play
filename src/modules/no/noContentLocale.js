/**
 * NO-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const NO_CARD_LOCALE_AUTO_KEY = 'seashell_no_card_locale_auto_v1';

export const NO_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'no');

export function noNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'no') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function noDefaultCardLocale() {
  return 'en';
}

export function noCardTranslationLocales() {
  return NO_CARD_TRANSLATION_LOCALES;
}

export function noIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function noShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'no';
}

export function noResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'no') {
    if (noIsCardLocaleManuallyPinned()) {
      const card = noNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return noDefaultCardLocale();
  }
  return ui;
}

export function noSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'no' && noIsCardLocaleManuallyPinned();
}

export function noEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'no') return;
  if (noIsCardLocaleManuallyPinned()) return;
  const expected = noDefaultCardLocale();
  const card = noNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function noSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'no') return null;
  if (noIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: noDefaultCardLocale(), cardLocalePinned: false };
}

export function noOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'no-NO' };
  if (noIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'no' ? noDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyNoCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(NO_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'no' ? noDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(NO_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function noDictWordInputLabel(t) {
  return t('dict.wordLabelNo');
}

export function noDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}No`;
  return params != null ? t(key, params) : t(key);
}

export function noPracticeStudyLangLabel(t) {
  return t('practice.inNorwegian');
}
