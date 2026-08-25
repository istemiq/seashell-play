/**
 * RU-модуль: язык переводов на карточках.
 * Не импортировать из EN-модуля. Менять только поведение русского словаря.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const RU_CARD_LOCALE_AUTO_KEY = 'seashell_ru_card_locale_auto_v1';

/** Языки gloss при изучении русского (все UI-кроме ru). */
export const RU_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ru');

export function ruNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ru') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function ruDefaultCardLocale() {
  return 'en';
}

export function ruCardTranslationLocales() {
  return RU_CARD_TRANSLATION_LOCALES;
}

export function ruIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

/** Picker «На какой язык переводить» — только при ru UI. */
export function ruShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ru';
}

/**
 * Локаль для API (переводы gloss/translation).
 * ru UI → picker (cardLocale) или en; иначе → язык интерфейса.
 */
export function ruResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ru') {
    if (ruIsCardLocaleManuallyPinned()) {
      const card = ruNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return ruDefaultCardLocale();
  }
  return ui;
}

export function ruSkipAutoRefreshForPinnedCardLocale() {
  return (
    normalizeUiLocale(loadSettings().uiLocale) === 'ru' && ruIsCardLocaleManuallyPinned()
  );
}

export function ruEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ru') return;
  if (ruIsCardLocaleManuallyPinned()) return;
  const expected = ruDefaultCardLocale();
  const card = ruNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

/** При смене UI на русский — сброс cardLocale RU-модуля (если не закреплён). */
export function ruSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ru') return null;
  if (ruIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: ruDefaultCardLocale(), cardLocalePinned: false };
}

/** При входе в RU-модуль — инициализация cardLocale под текущий UI. */
export function ruOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'ru-RU' };
  if (ruIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ru' ? ruDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

/** Одноразовая миграция localStorage при первом запуске RU-модуля. */
export function applyRuCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(RU_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ru' ? ruDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(RU_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function ruDictWordInputLabel(t) {
  return t('dict.wordLabelRu');
}

export function ruDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ru`;
  return params != null ? t(key, params) : t(key);
}

export function ruPracticeStudyLangLabel(t) {
  return t('practice.inRussian');
}
