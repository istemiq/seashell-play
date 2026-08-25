/**
 * AR-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const AR_CARD_LOCALE_AUTO_KEY = 'seashell_ar_card_locale_auto_v1';

export const AR_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ar');

export function arNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ar') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function arDefaultCardLocale() {
  return 'en';
}

export function arCardTranslationLocales() {
  return AR_CARD_TRANSLATION_LOCALES;
}

export function arIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function arShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ar';
}

export function arResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ar') {
    if (arIsCardLocaleManuallyPinned()) {
      const card = arNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return arDefaultCardLocale();
  }
  return ui;
}

export function arSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ar' && arIsCardLocaleManuallyPinned();
}

export function arEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ar') return;
  if (arIsCardLocaleManuallyPinned()) return;
  const expected = arDefaultCardLocale();
  const card = arNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function arSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ar') return null;
  if (arIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: arDefaultCardLocale(), cardLocalePinned: false };
}

export function arOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'ar-JO' };
  if (arIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ar' ? arDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyArCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(AR_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ar' ? arDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(AR_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function arDictWordInputLabel(t) {
  return t('dict.wordLabelAr');
}

export function arDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ar`;
  return params != null ? t(key, params) : t(key);
}

export function arPracticeStudyLangLabel(t) {
  return t('practice.inArabic');
}
