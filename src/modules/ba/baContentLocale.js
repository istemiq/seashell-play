/**
 * BA-модуль: язык переводов на карточках.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const BA_CARD_LOCALE_AUTO_KEY = 'seashell_ba_card_locale_auto_v1';

export const BA_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ba');

export function baNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ba') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function baDefaultCardLocale() {
  return 'ru';
}

export function baCardTranslationLocales() {
  return BA_CARD_TRANSLATION_LOCALES;
}

export function baIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function baShowCardTranslationLocalePicker() {
  return true;
}

/**
 * Локаль для API (переводы gloss/translation).
 * При изучении башкирского по умолчанию ru; cardLocale — если выбран в picker.
 */
export function baResolveContentLocaleForApi() {
  const { cardLocale } = loadSettings();
  if (baIsCardLocaleManuallyPinned()) {
    const card = baNormalizeCardLocale(cardLocale);
    if (card) return card;
  }
  const card = baNormalizeCardLocale(cardLocale);
  if (card) return card;
  return baDefaultCardLocale();
}

export function baSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ba' && baIsCardLocaleManuallyPinned();
}

export function baEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (baIsCardLocaleManuallyPinned()) return;
  const expected = baDefaultCardLocale();
  const card = baNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function baSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ba') return null;
  if (baIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: baDefaultCardLocale(), cardLocalePinned: false };
}

export function baOnLearnModuleEnter() {
  const patch = { ttsLocale: 'ba' };
  if (baIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: baDefaultCardLocale(),
    cardLocalePinned: false,
  };
}

export function applyBaCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(BA_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ba' ? baDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(BA_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function baDictWordInputLabel(t) {
  return t('dict.wordLabelBa');
}

export function baDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ba`;
  return params != null ? t(key, params) : t(key);
}

export function baPracticeStudyLangLabel(t) {
  return t('practice.inBashkir');
}
