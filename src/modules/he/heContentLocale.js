/**
 * HE-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const HE_CARD_LOCALE_AUTO_KEY = 'seashell_he_card_locale_auto_v1';

export const HE_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'he');

export function heNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'he') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function heDefaultCardLocale() {
  return 'en';
}

export function heCardTranslationLocales() {
  return HE_CARD_TRANSLATION_LOCALES;
}

export function heIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function heShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'he';
}

export function heResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'he') {
    if (heIsCardLocaleManuallyPinned()) {
      const card = heNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return heDefaultCardLocale();
  }
  return ui;
}

export function heSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'he' && heIsCardLocaleManuallyPinned();
}

export function heEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'he') return;
  if (heIsCardLocaleManuallyPinned()) return;
  const expected = heDefaultCardLocale();
  const card = heNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function heSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'he') return null;
  if (heIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: heDefaultCardLocale(), cardLocalePinned: false };
}

export function heOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'he-IL' };
  if (heIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'he' ? heDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyHeCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(HE_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'he' ? heDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(HE_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function heDictWordInputLabel(t) {
  return t('dict.wordLabelHe');
}

export function heDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}He`;
  return params != null ? t(key, params) : t(key);
}

export function hePracticeStudyLangLabel(t) {
  return t('practice.inHebrew');
}
