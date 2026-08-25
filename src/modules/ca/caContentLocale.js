/**
 * CA-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const CA_CARD_LOCALE_AUTO_KEY = 'seashell_ca_card_locale_auto_v1';

export const CA_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ca');

export function caNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ca') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function caDefaultCardLocale() {
  return 'en';
}

export function caCardTranslationLocales() {
  return CA_CARD_TRANSLATION_LOCALES;
}

export function caIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function caShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ca';
}

export function caResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ca') {
    if (caIsCardLocaleManuallyPinned()) {
      const card = caNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return caDefaultCardLocale();
  }
  return ui;
}

export function caSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ca' && caIsCardLocaleManuallyPinned();
}

export function caEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ca') return;
  if (caIsCardLocaleManuallyPinned()) return;
  const expected = caDefaultCardLocale();
  const card = caNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function caSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ca') return null;
  if (caIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: caDefaultCardLocale(), cardLocalePinned: false };
}

export function caOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'ca-ES' };
  if (caIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ca' ? caDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyCaCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(CA_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ca' ? caDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(CA_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function caDictWordInputLabel(t) {
  return t('dict.wordLabelCa');
}

export function caDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ca`;
  return params != null ? t(key, params) : t(key);
}

export function caPracticeStudyLangLabel(t) {
  return t('practice.inCatalan');
}
