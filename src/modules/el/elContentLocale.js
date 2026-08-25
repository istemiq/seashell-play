/**
 * EL-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const EL_CARD_LOCALE_AUTO_KEY = 'seashell_el_card_locale_auto_v1';

export const EL_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'el');

export function elNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'el') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function elDefaultCardLocale() {
  return 'en';
}

export function elCardTranslationLocales() {
  return EL_CARD_TRANSLATION_LOCALES;
}

export function elIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function elShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'el';
}

export function elResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'el') {
    if (elIsCardLocaleManuallyPinned()) {
      const card = elNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return elDefaultCardLocale();
  }
  return ui;
}

export function elSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'el' && elIsCardLocaleManuallyPinned();
}

export function elEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'el') return;
  if (elIsCardLocaleManuallyPinned()) return;
  const expected = elDefaultCardLocale();
  const card = elNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function elSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'el') return null;
  if (elIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: elDefaultCardLocale(), cardLocalePinned: false };
}

export function elOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'el-GR' };
  if (elIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'el' ? elDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyElCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(EL_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'el' ? elDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(EL_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function elDictWordInputLabel(t) {
  return t('dict.wordLabelEl');
}

export function elDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}El`;
  return params != null ? t(key, params) : t(key);
}

export function elPracticeStudyLangLabel(t) {
  return t('practice.inGreek');
}
