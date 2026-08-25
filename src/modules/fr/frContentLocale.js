/**
 * FR-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const FR_CARD_LOCALE_AUTO_KEY = 'seashell_fr_card_locale_auto_v1';

export const FR_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'fr');

export function frNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'fr') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function frDefaultCardLocale() {
  return 'en';
}

export function frCardTranslationLocales() {
  return FR_CARD_TRANSLATION_LOCALES;
}

export function frIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function frShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'fr';
}

export function frResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'fr') {
    if (frIsCardLocaleManuallyPinned()) {
      const card = frNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return frDefaultCardLocale();
  }
  return ui;
}

export function frSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'fr' && frIsCardLocaleManuallyPinned();
}

export function frEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'fr') return;
  if (frIsCardLocaleManuallyPinned()) return;
  const expected = frDefaultCardLocale();
  const card = frNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function frSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'fr') return null;
  if (frIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: frDefaultCardLocale(), cardLocalePinned: false };
}

export function frOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'fr-FR' };
  if (frIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'fr' ? frDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyFrCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(FR_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'fr' ? frDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(FR_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function frDictWordInputLabel(t) {
  return t('dict.wordLabelFr');
}

export function frDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Fr`;
  return params != null ? t(key, params) : t(key);
}

export function frPracticeStudyLangLabel(t) {
  return t('practice.inFrench');
}
