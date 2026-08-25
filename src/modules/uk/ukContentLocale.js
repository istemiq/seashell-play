/**
 * UK-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей. Менять только поведение украинского словаря.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const UK_CARD_LOCALE_AUTO_KEY = 'seashell_uk_card_locale_auto_v1';

/** Языки gloss при изучении украинского (все UI-кроме uk). */
export const UK_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'uk');

export function ukNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'uk') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function ukDefaultCardLocale() {
  return 'en';
}

export function ukCardTranslationLocales() {
  return UK_CARD_TRANSLATION_LOCALES;
}

export function ukIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

/** Picker «На какой язык переводить» — только при uk UI. */
export function ukShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'uk';
}

/**
 * Локаль для API (переводы gloss/translation).
 * uk UI → picker (cardLocale) или en; иначе → язык интерфейса.
 */
export function ukResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'uk') {
    if (ukIsCardLocaleManuallyPinned()) {
      const card = ukNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return ukDefaultCardLocale();
  }
  return ui;
}

export function ukSkipAutoRefreshForPinnedCardLocale() {
  return (
    normalizeUiLocale(loadSettings().uiLocale) === 'uk' && ukIsCardLocaleManuallyPinned()
  );
}

export function ukEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'uk') return;
  if (ukIsCardLocaleManuallyPinned()) return;
  const expected = ukDefaultCardLocale();
  const card = ukNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

/** При смене UI на украинский — сброс cardLocale UK-модуля (если не закреплён). */
export function ukSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'uk') return null;
  if (ukIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: ukDefaultCardLocale(), cardLocalePinned: false };
}

/** При входе в UK-модуль — инициализация cardLocale под текущий UI. */
export function ukOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'uk-UA' };
  if (ukIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'uk' ? ukDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

/** Одноразовая миграция localStorage при первом запуске UK-модуля. */
export function applyUkCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(UK_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'uk' ? ukDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(UK_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function ukDictWordInputLabel(t) {
  return t('dict.wordLabelUk');
}

export function ukDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Uk`;
  return params != null ? t(key, params) : t(key);
}

export function ukPracticeStudyLangLabel(t) {
  return t('practice.inUkrainian');
}
