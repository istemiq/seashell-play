/**
 * PT-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const PT_CARD_LOCALE_AUTO_KEY = 'seashell_pt_card_locale_auto_v1';

export const PT_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'pt');

export function ptNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'pt') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function ptDefaultCardLocale() {
  return 'en';
}

export function ptCardTranslationLocales() {
  return PT_CARD_TRANSLATION_LOCALES;
}

export function ptIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function ptShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'pt';
}

export function ptResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'pt') {
    if (ptIsCardLocaleManuallyPinned()) {
      const card = ptNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return ptDefaultCardLocale();
  }
  return ui;
}

export function ptSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'pt' && ptIsCardLocaleManuallyPinned();
}

export function ptEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'pt') return;
  if (ptIsCardLocaleManuallyPinned()) return;
  const expected = ptDefaultCardLocale();
  const card = ptNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function ptSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'pt') return null;
  if (ptIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: ptDefaultCardLocale(), cardLocalePinned: false };
}

export function ptOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'pt-BR' };
  if (ptIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'pt' ? ptDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyPtCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(PT_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'pt' ? ptDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(PT_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function ptDictWordInputLabel(t) {
  return t('dict.wordLabelPt');
}

export function ptDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Pt`;
  return params != null ? t(key, params) : t(key);
}

export function ptPracticeStudyLangLabel(t) {
  return t('practice.inPortuguese');
}
