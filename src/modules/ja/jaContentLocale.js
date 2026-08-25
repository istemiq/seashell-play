/**
 * JA-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const JA_CARD_LOCALE_AUTO_KEY = 'seashell_ja_card_locale_auto_v1';

export const JA_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ja');

export function jaNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ja') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function jaDefaultCardLocale() {
  return 'en';
}

export function jaCardTranslationLocales() {
  return JA_CARD_TRANSLATION_LOCALES;
}

export function jaIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function jaShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ja';
}

export function jaResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ja') {
    if (jaIsCardLocaleManuallyPinned()) {
      const card = jaNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return jaDefaultCardLocale();
  }
  return ui;
}

export function jaSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ja' && jaIsCardLocaleManuallyPinned();
}

export function jaEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ja') return;
  if (jaIsCardLocaleManuallyPinned()) return;
  const expected = jaDefaultCardLocale();
  const card = jaNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function jaSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ja') return null;
  if (jaIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: jaDefaultCardLocale(), cardLocalePinned: false };
}

export function jaOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = {};
  if (jaIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ja' ? jaDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyJaCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(JA_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ja' ? jaDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(JA_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function jaDictWordInputLabel(t) {
  return t('dict.wordLabelJa');
}

export function jaDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ja`;
  return params != null ? t(key, params) : t(key);
}

export function jaPracticeStudyLangLabel(t) {
  return t('practice.inJapanese');
}
