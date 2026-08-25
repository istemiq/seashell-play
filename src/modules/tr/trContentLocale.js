/**
 * TR-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const TR_CARD_LOCALE_AUTO_KEY = 'seashell_tr_card_locale_auto_v1';

export const TR_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'tr');

export function trNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'tr') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function trDefaultCardLocale() {
  return 'en';
}

export function trCardTranslationLocales() {
  return TR_CARD_TRANSLATION_LOCALES;
}

export function trIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function trShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'tr';
}

export function trResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'tr') {
    if (trIsCardLocaleManuallyPinned()) {
      const card = trNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return trDefaultCardLocale();
  }
  return ui;
}

export function trSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'tr' && trIsCardLocaleManuallyPinned();
}

export function trEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'tr') return;
  if (trIsCardLocaleManuallyPinned()) return;
  const expected = trDefaultCardLocale();
  const card = trNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function trSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'tr') return null;
  if (trIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: trDefaultCardLocale(), cardLocalePinned: false };
}

export function trOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'tr-TR' };
  if (trIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'tr' ? trDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyTrCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(TR_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'tr' ? trDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(TR_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function trDictWordInputLabel(t) {
  return t('dict.wordLabelTr');
}

export function trDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Tr`;
  return params != null ? t(key, params) : t(key);
}

export function trPracticeStudyLangLabel(t) {
  return t('practice.inTurkish');
}
