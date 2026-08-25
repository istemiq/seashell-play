/**
 * ES-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const ES_CARD_LOCALE_AUTO_KEY = 'seashell_es_card_locale_auto_v1';

export const ES_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'es');

export function esNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'es') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function esDefaultCardLocale() {
  return 'en';
}

export function esCardTranslationLocales() {
  return ES_CARD_TRANSLATION_LOCALES;
}

export function esIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function esShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'es';
}

export function esResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'es') {
    if (esIsCardLocaleManuallyPinned()) {
      const card = esNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return esDefaultCardLocale();
  }
  return ui;
}

export function esSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'es' && esIsCardLocaleManuallyPinned();
}

export function esEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'es') return;
  if (esIsCardLocaleManuallyPinned()) return;
  const expected = esDefaultCardLocale();
  const card = esNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function esSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'es') return null;
  if (esIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: esDefaultCardLocale(), cardLocalePinned: false };
}

export function esOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'es-ES' };
  if (esIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'es' ? esDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyEsCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(ES_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'es' ? esDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(ES_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function esDictWordInputLabel(t) {
  return t('dict.wordLabelEs');
}

export function esDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Es`;
  return params != null ? t(key, params) : t(key);
}

export function esPracticeStudyLangLabel(t) {
  return t('practice.inSpanish');
}
