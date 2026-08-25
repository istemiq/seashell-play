/**
 * IT-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const IT_CARD_LOCALE_AUTO_KEY = 'seashell_it_card_locale_auto_v1';

export const IT_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'it');

export function itNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'it') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function itDefaultCardLocale() {
  return 'en';
}

export function itCardTranslationLocales() {
  return IT_CARD_TRANSLATION_LOCALES;
}

export function itIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function itShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'it';
}

export function itResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'it') {
    if (itIsCardLocaleManuallyPinned()) {
      const card = itNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return itDefaultCardLocale();
  }
  return ui;
}

export function itSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'it' && itIsCardLocaleManuallyPinned();
}

export function itEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'it') return;
  if (itIsCardLocaleManuallyPinned()) return;
  const expected = itDefaultCardLocale();
  const card = itNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function itSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'it') return null;
  if (itIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: itDefaultCardLocale(), cardLocalePinned: false };
}

export function itOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'it-IT' };
  if (itIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'it' ? itDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyItCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(IT_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'it' ? itDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(IT_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function itDictWordInputLabel(t) {
  return t('dict.wordLabelIt');
}

export function itDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}It`;
  return params != null ? t(key, params) : t(key);
}

export function itPracticeStudyLangLabel(t) {
  return t('practice.inItalian');
}
