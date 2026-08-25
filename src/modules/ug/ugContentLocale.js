/**
 * UG-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const UG_CARD_LOCALE_AUTO_KEY = 'seashell_ug_card_locale_auto_v1';

export const UG_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ug');

export function ugNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ug') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function ugDefaultCardLocale() {
  return 'en';
}

export function ugCardTranslationLocales() {
  return UG_CARD_TRANSLATION_LOCALES;
}

export function ugIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function ugShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ug';
}

export function ugResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ug') {
    if (ugIsCardLocaleManuallyPinned()) {
      const card = ugNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return ugDefaultCardLocale();
  }
  return ui;
}

export function ugSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ug' && ugIsCardLocaleManuallyPinned();
}

export function ugEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ug') return;
  if (ugIsCardLocaleManuallyPinned()) return;
  const expected = ugDefaultCardLocale();
  const card = ugNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function ugSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ug') return null;
  if (ugIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: ugDefaultCardLocale(), cardLocalePinned: false };
}

export function ugOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'ug-CN' };
  if (ugIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ug' ? ugDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyUgCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(UG_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ug' ? ugDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(UG_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function ugDictWordInputLabel(t) {
  return t('dict.wordLabelUg');
}

export function ugDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ug`;
  return params != null ? t(key, params) : t(key);
}

export function ugPracticeStudyLangLabel(t) {
  return t('practice.inUyghur');
}
