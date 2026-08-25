/**
 * UR-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const UR_CARD_LOCALE_AUTO_KEY = 'seashell_ur_card_locale_auto_v1';

export const UR_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ur');

export function urNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ur') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function urDefaultCardLocale() {
  return 'en';
}

export function urCardTranslationLocales() {
  return UR_CARD_TRANSLATION_LOCALES;
}

export function urIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function urShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ur';
}

export function urResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ur') {
    if (urIsCardLocaleManuallyPinned()) {
      const card = urNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return urDefaultCardLocale();
  }
  return ui;
}

export function urSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ur' && urIsCardLocaleManuallyPinned();
}

export function urEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ur') return;
  if (urIsCardLocaleManuallyPinned()) return;
  const expected = urDefaultCardLocale();
  const card = urNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function urSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ur') return null;
  if (urIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: urDefaultCardLocale(), cardLocalePinned: false };
}

export function urOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'ur-PK' };
  if (urIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ur' ? urDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyUrCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(UR_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ur' ? urDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(UR_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function urDictWordInputLabel(t) {
  return t('dict.wordLabelUr');
}

export function urDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ur`;
  return params != null ? t(key, params) : t(key);
}

export function urPracticeStudyLangLabel(t) {
  return t('practice.inUrdu');
}
