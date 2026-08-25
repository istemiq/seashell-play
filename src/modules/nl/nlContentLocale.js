/**
 * NL-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const NL_CARD_LOCALE_AUTO_KEY = 'seashell_nl_card_locale_auto_v1';

export const NL_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'nl');

export function nlNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'nl') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function nlDefaultCardLocale() {
  return 'en';
}

export function nlCardTranslationLocales() {
  return NL_CARD_TRANSLATION_LOCALES;
}

export function nlIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function nlShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'nl';
}

export function nlResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'nl') {
    if (nlIsCardLocaleManuallyPinned()) {
      const card = nlNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return nlDefaultCardLocale();
  }
  return ui;
}

export function nlSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'nl' && nlIsCardLocaleManuallyPinned();
}

export function nlEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'nl') return;
  if (nlIsCardLocaleManuallyPinned()) return;
  const expected = nlDefaultCardLocale();
  const card = nlNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function nlSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'nl') return null;
  if (nlIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: nlDefaultCardLocale(), cardLocalePinned: false };
}

export function nlOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'nl-NL' };
  if (nlIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'nl' ? nlDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyNlCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(NL_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'nl' ? nlDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(NL_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function nlDictWordInputLabel(t) {
  return t('dict.wordLabelNl');
}

export function nlDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Nl`;
  return params != null ? t(key, params) : t(key);
}

export function nlPracticeStudyLangLabel(t) {
  return t('practice.inDutch');
}
