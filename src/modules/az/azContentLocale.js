/**
 * AZ-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const AZ_CARD_LOCALE_AUTO_KEY = 'seashell_az_card_locale_auto_v1';

export const AZ_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'az');

export function azNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'az') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function azDefaultCardLocale() {
  return 'en';
}

export function azCardTranslationLocales() {
  return AZ_CARD_TRANSLATION_LOCALES;
}

export function azIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function azShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'az';
}

export function azResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'az') {
    if (azIsCardLocaleManuallyPinned()) {
      const card = azNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return azDefaultCardLocale();
  }
  return ui;
}

export function azSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'az' && azIsCardLocaleManuallyPinned();
}

export function azEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'az') return;
  if (azIsCardLocaleManuallyPinned()) return;
  const expected = azDefaultCardLocale();
  const card = azNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function azSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'az') return null;
  if (azIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: azDefaultCardLocale(), cardLocalePinned: false };
}

export function azOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'az-AZ' };
  if (azIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'az' ? azDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyAzCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(AZ_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'az' ? azDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(AZ_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function azDictWordInputLabel(t) {
  return t('dict.wordLabelAz');
}

export function azDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Az`;
  return params != null ? t(key, params) : t(key);
}

export function azPracticeStudyLangLabel(t) {
  return t('practice.inAzerbaijani');
}
