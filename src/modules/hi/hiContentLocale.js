/**
 * HI-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const HI_CARD_LOCALE_AUTO_KEY = 'seashell_hi_card_locale_auto_v1';

export const HI_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'hi');

export function hiNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'hi') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function hiDefaultCardLocale() {
  return 'en';
}

export function hiCardTranslationLocales() {
  return HI_CARD_TRANSLATION_LOCALES;
}

export function hiIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function hiShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'hi';
}

export function hiResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'hi') {
    if (hiIsCardLocaleManuallyPinned()) {
      const card = hiNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return hiDefaultCardLocale();
  }
  return ui;
}

export function hiSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'hi' && hiIsCardLocaleManuallyPinned();
}

export function hiEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'hi') return;
  if (hiIsCardLocaleManuallyPinned()) return;
  const expected = hiDefaultCardLocale();
  const card = hiNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function hiSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'hi') return null;
  if (hiIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: hiDefaultCardLocale(), cardLocalePinned: false };
}

export function hiOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'hi-IN' };
  if (hiIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'hi' ? hiDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyHiCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(HI_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'hi' ? hiDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(HI_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function hiDictWordInputLabel(t) {
  return t('dict.wordLabelHi');
}

export function hiDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Hi`;
  return params != null ? t(key, params) : t(key);
}

export function hiPracticeStudyLangLabel(t) {
  return t('practice.inHindi');
}
