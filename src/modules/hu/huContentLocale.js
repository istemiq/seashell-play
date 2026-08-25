/**
 * HU-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const HU_CARD_LOCALE_AUTO_KEY = 'seashell_hu_card_locale_auto_v1';

export const HU_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'hu');

export function huNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'hu') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function huDefaultCardLocale() {
  return 'en';
}

export function huCardTranslationLocales() {
  return HU_CARD_TRANSLATION_LOCALES;
}

export function huIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function huShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'hu';
}

export function huResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'hu') {
    if (huIsCardLocaleManuallyPinned()) {
      const card = huNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return huDefaultCardLocale();
  }
  return ui;
}

export function huSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'hu' && huIsCardLocaleManuallyPinned();
}

export function huEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'hu') return;
  if (huIsCardLocaleManuallyPinned()) return;
  const expected = huDefaultCardLocale();
  const card = huNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function huSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'hu') return null;
  if (huIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: huDefaultCardLocale(), cardLocalePinned: false };
}

export function huOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'hu-HU' };
  if (huIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'hu' ? huDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyHuCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(HU_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'hu' ? huDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(HU_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function huDictWordInputLabel(t) {
  return t('dict.wordLabelHu');
}

export function huDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Hu`;
  return params != null ? t(key, params) : t(key);
}

export function huPracticeStudyLangLabel(t) {
  return t('practice.inHungarian');
}
