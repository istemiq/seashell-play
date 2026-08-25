/**
 * FA-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const FA_CARD_LOCALE_AUTO_KEY = 'seashell_fa_card_locale_auto_v1';

export const FA_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'fa');

export function faNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'fa') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function faDefaultCardLocale() {
  return 'en';
}

export function faCardTranslationLocales() {
  return FA_CARD_TRANSLATION_LOCALES;
}

export function faIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function faShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'fa';
}

export function faResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'fa') {
    if (faIsCardLocaleManuallyPinned()) {
      const card = faNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return faDefaultCardLocale();
  }
  return ui;
}

export function faSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'fa' && faIsCardLocaleManuallyPinned();
}

export function faEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'fa') return;
  if (faIsCardLocaleManuallyPinned()) return;
  const expected = faDefaultCardLocale();
  const card = faNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function faSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'fa') return null;
  if (faIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: faDefaultCardLocale(), cardLocalePinned: false };
}

export function faOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'fa-IR' };
  if (faIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'fa' ? faDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyFaCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(FA_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'fa' ? faDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(FA_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function faDictWordInputLabel(t) {
  return t('dict.wordLabelFa');
}

export function faDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Fa`;
  return params != null ? t(key, params) : t(key);
}

export function faPracticeStudyLangLabel(t) {
  return t('practice.inFarsi');
}
