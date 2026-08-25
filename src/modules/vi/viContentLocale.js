/**
 * VI-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const VI_CARD_LOCALE_AUTO_KEY = 'seashell_vi_card_locale_auto_v1';

export const VI_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'vi');

export function viNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'vi') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function viDefaultCardLocale() {
  return 'en';
}

export function viCardTranslationLocales() {
  return VI_CARD_TRANSLATION_LOCALES;
}

export function viIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function viShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'vi';
}

export function viResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'vi') {
    if (viIsCardLocaleManuallyPinned()) {
      const card = viNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return viDefaultCardLocale();
  }
  return ui;
}

export function viSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'vi' && viIsCardLocaleManuallyPinned();
}

export function viEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'vi') return;
  if (viIsCardLocaleManuallyPinned()) return;
  const expected = viDefaultCardLocale();
  const card = viNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function viSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'vi') return null;
  if (viIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: viDefaultCardLocale(), cardLocalePinned: false };
}

export function viOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'vi-VN' };
  if (viIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'vi' ? viDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyViCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(VI_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'vi' ? viDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(VI_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function viDictWordInputLabel(t) {
  return t('dict.wordLabelVi');
}

export function viDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Vi`;
  return params != null ? t(key, params) : t(key);
}

export function viPracticeStudyLangLabel(t) {
  return t('practice.inVietnamese');
}
