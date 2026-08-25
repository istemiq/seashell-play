/**
 * SV-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const SV_CARD_LOCALE_AUTO_KEY = 'seashell_sv_card_locale_auto_v1';

export const SV_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'sv');

export function svNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'sv') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function svDefaultCardLocale() {
  return 'en';
}

export function svCardTranslationLocales() {
  return SV_CARD_TRANSLATION_LOCALES;
}

export function svIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function svShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'sv';
}

export function svResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'sv') {
    if (svIsCardLocaleManuallyPinned()) {
      const card = svNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return svDefaultCardLocale();
  }
  return ui;
}

export function svSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'sv' && svIsCardLocaleManuallyPinned();
}

export function svEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'sv') return;
  if (svIsCardLocaleManuallyPinned()) return;
  const expected = svDefaultCardLocale();
  const card = svNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function svSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'sv') return null;
  if (svIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: svDefaultCardLocale(), cardLocalePinned: false };
}

export function svOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'sv-SE' };
  if (svIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'sv' ? svDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applySvCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SV_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'sv' ? svDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(SV_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function svDictWordInputLabel(t) {
  return t('dict.wordLabelSv');
}

export function svDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Sv`;
  return params != null ? t(key, params) : t(key);
}

export function svPracticeStudyLangLabel(t) {
  return t('practice.inSwedish');
}
