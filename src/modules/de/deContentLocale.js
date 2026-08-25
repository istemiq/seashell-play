/**
 * DE-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const DE_CARD_LOCALE_AUTO_KEY = 'seashell_de_card_locale_auto_v1';

export const DE_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'de');

export function deNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'de') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function deDefaultCardLocale() {
  return 'en';
}

export function deCardTranslationLocales() {
  return DE_CARD_TRANSLATION_LOCALES;
}

export function deIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function deShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'de';
}

export function deResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'de') {
    if (deIsCardLocaleManuallyPinned()) {
      const card = deNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return deDefaultCardLocale();
  }
  return ui;
}

export function deSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'de' && deIsCardLocaleManuallyPinned();
}

export function deEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'de') return;
  if (deIsCardLocaleManuallyPinned()) return;
  const expected = deDefaultCardLocale();
  const card = deNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function deSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'de') return null;
  if (deIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: deDefaultCardLocale(), cardLocalePinned: false };
}

export function deOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'de-DE' };
  if (deIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'de' ? deDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyDeCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(DE_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'de' ? deDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(DE_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function deDictWordInputLabel(t) {
  return t('dict.wordLabelDe');
}

export function deDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}De`;
  return params != null ? t(key, params) : t(key);
}

export function dePracticeStudyLangLabel(t) {
  return t('practice.inGerman');
}
