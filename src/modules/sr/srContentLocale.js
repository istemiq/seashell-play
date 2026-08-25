/**
 * SR-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const SR_CARD_LOCALE_AUTO_KEY = 'seashell_sr_card_locale_auto_v1';

export const SR_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'sr');

export function srNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'sr') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function srDefaultCardLocale() {
  return 'en';
}

export function srCardTranslationLocales() {
  return SR_CARD_TRANSLATION_LOCALES;
}

export function srIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function srShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'sr';
}

export function srResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'sr') {
    if (srIsCardLocaleManuallyPinned()) {
      const card = srNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return srDefaultCardLocale();
  }
  return ui;
}

export function srSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'sr' && srIsCardLocaleManuallyPinned();
}

export function srEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'sr') return;
  if (srIsCardLocaleManuallyPinned()) return;
  const expected = srDefaultCardLocale();
  const card = srNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function srSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'sr') return null;
  if (srIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: srDefaultCardLocale(), cardLocalePinned: false };
}

export function srOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'sr-RS' };
  if (srIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'sr' ? srDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applySrCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SR_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'sr' ? srDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(SR_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function srDictWordInputLabel(t) {
  return t('dict.wordLabelSr');
}

export function srDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Sr`;
  return params != null ? t(key, params) : t(key);
}

export function srPracticeStudyLangLabel(t) {
  return t('practice.inSerbian');
}
