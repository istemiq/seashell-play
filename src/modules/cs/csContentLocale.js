/**
 * CS-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const CS_CARD_LOCALE_AUTO_KEY = 'seashell_cs_card_locale_auto_v1';

export const CS_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'cs');

export function csNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'cs') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function csDefaultCardLocale() {
  return 'en';
}

export function csCardTranslationLocales() {
  return CS_CARD_TRANSLATION_LOCALES;
}

export function csIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function csShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'cs';
}

export function csResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'cs') {
    if (csIsCardLocaleManuallyPinned()) {
      const card = csNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return csDefaultCardLocale();
  }
  return ui;
}

export function csSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'cs' && csIsCardLocaleManuallyPinned();
}

export function csEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'cs') return;
  if (csIsCardLocaleManuallyPinned()) return;
  const expected = csDefaultCardLocale();
  const card = csNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function csSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'cs') return null;
  if (csIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: csDefaultCardLocale(), cardLocalePinned: false };
}

export function csOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'cs-CZ' };
  if (csIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'cs' ? csDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyCsCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(CS_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'cs' ? csDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(CS_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function csDictWordInputLabel(t) {
  return t('dict.wordLabelCs');
}

export function csDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Cs`;
  return params != null ? t(key, params) : t(key);
}

export function csPracticeStudyLangLabel(t) {
  return t('practice.inCzech');
}
