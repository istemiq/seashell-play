/**
 * EN-модуль: язык переводов на карточках.
 * Не импортировать из RU-модуля. Менять только поведение английского словаря.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings } from '../../utils/settings.js';

/** Языки перевода gloss (всё кроме en — примеры на английском). */
export const EN_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'en');

export function enNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'en') return '';
  return EN_CARD_TRANSLATION_LOCALES.some((l) => l.code === c) ? c : '';
}

export function enDefaultCardLocale() {
  return 'ru';
}

export function enCardTranslationLocales() {
  return EN_CARD_TRANSLATION_LOCALES;
}

/** Picker «На какой язык переводить» — только при en UI. */
export function enShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'en';
}

/**
 * Локаль для API (переводы gloss/translation).
 * en UI → cardLocale или ru; иначе → язык интерфейса.
 */
export function enResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'en') {
    return enNormalizeCardLocale(cardLocale) || enDefaultCardLocale();
  }
  return ui;
}

/** При входе в EN-модуль — ничего не меняем (сохраняем cardLocale как было). */
export function enOnLearnModuleEnter() {
  return null;
}

/** EN-модуль не синхронизирует cardLocale при смене UI. */
export function enSyncCardLocaleWithUi(_uiLocale) {
  return null;
}

export function enDictWordInputLabel(t) {
  return t('dict.wordLabel');
}

export function enDictMessageForLearn(t, baseKey, params) {
  return params != null ? t(baseKey, params) : t(baseKey);
}

export function enPracticeStudyLangLabel(t) {
  return t('practice.inEnglish');
}
