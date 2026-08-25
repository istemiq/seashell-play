/**
 * DA-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const DA_CARD_LOCALE_AUTO_KEY = 'seashell_da_card_locale_auto_v1';

export const DA_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'da');

export function daNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'da') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function daDefaultCardLocale() {
  return 'en';
}

export function daCardTranslationLocales() {
  return DA_CARD_TRANSLATION_LOCALES;
}

export function daIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function daShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'da';
}

export function daResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'da') {
    if (daIsCardLocaleManuallyPinned()) {
      const card = daNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return daDefaultCardLocale();
  }
  return ui;
}

export function daSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'da' && daIsCardLocaleManuallyPinned();
}

export function daEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'da') return;
  if (daIsCardLocaleManuallyPinned()) return;
  const expected = daDefaultCardLocale();
  const card = daNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function daSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'da') return null;
  if (daIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: daDefaultCardLocale(), cardLocalePinned: false };
}

export function daOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'da-DK' };
  if (daIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'da' ? daDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyDaCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(DA_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'da' ? daDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(DA_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function daDictWordInputLabel(t) {
  return t('dict.wordLabelDa');
}

export function daDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Da`;
  return params != null ? t(key, params) : t(key);
}

export function daPracticeStudyLangLabel(t) {
  return t('practice.inDanish');
}
