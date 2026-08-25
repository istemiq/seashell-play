/**
 * KO-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const KO_CARD_LOCALE_AUTO_KEY = 'seashell_ko_card_locale_auto_v1';

export const KO_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ko');

export function koNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ko') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function koDefaultCardLocale() {
  return 'en';
}

export function koCardTranslationLocales() {
  return KO_CARD_TRANSLATION_LOCALES;
}

export function koIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function koShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ko';
}

export function koResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ko') {
    if (koIsCardLocaleManuallyPinned()) {
      const card = koNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return koDefaultCardLocale();
  }
  return ui;
}

export function koSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ko' && koIsCardLocaleManuallyPinned();
}

export function koEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ko') return;
  if (koIsCardLocaleManuallyPinned()) return;
  const expected = koDefaultCardLocale();
  const card = koNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function koSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ko') return null;
  if (koIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: koDefaultCardLocale(), cardLocalePinned: false };
}

export function koOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = {};
  if (koIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ko' ? koDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyKoCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(KO_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ko' ? koDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(KO_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function koDictWordInputLabel(t) {
  return t('dict.wordLabelKo');
}

export function koDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ko`;
  return params != null ? t(key, params) : t(key);
}

export function koPracticeStudyLangLabel(t) {
  return t('practice.inKorean');
}
