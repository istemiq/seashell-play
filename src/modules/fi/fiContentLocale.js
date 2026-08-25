/**
 * FI-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const FI_CARD_LOCALE_AUTO_KEY = 'seashell_fi_card_locale_auto_v1';

export const FI_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'fi');

export function fiNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'fi') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function fiDefaultCardLocale() {
  return 'en';
}

export function fiCardTranslationLocales() {
  return FI_CARD_TRANSLATION_LOCALES;
}

export function fiIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function fiShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'fi';
}

export function fiResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'fi') {
    if (fiIsCardLocaleManuallyPinned()) {
      const card = fiNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return fiDefaultCardLocale();
  }
  return ui;
}

export function fiSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'fi' && fiIsCardLocaleManuallyPinned();
}

export function fiEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'fi') return;
  if (fiIsCardLocaleManuallyPinned()) return;
  const expected = fiDefaultCardLocale();
  const card = fiNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function fiSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'fi') return null;
  if (fiIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: fiDefaultCardLocale(), cardLocalePinned: false };
}

export function fiOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'fi-FI' };
  if (fiIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'fi' ? fiDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyFiCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(FI_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'fi' ? fiDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(FI_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function fiDictWordInputLabel(t) {
  return t('dict.wordLabelFi');
}

export function fiDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Fi`;
  return params != null ? t(key, params) : t(key);
}

export function fiPracticeStudyLangLabel(t) {
  return t('practice.inFinnish');
}
