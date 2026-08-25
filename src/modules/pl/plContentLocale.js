/**
 * PL-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const PL_CARD_LOCALE_AUTO_KEY = 'seashell_pl_card_locale_auto_v1';

export const PL_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'pl');

export function plNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'pl') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function plDefaultCardLocale() {
  return 'en';
}

export function plCardTranslationLocales() {
  return PL_CARD_TRANSLATION_LOCALES;
}

export function plIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function plShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'pl';
}

export function plResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'pl') {
    if (plIsCardLocaleManuallyPinned()) {
      const card = plNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return plDefaultCardLocale();
  }
  return ui;
}

export function plSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'pl' && plIsCardLocaleManuallyPinned();
}

export function plEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'pl') return;
  if (plIsCardLocaleManuallyPinned()) return;
  const expected = plDefaultCardLocale();
  const card = plNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function plSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'pl') return null;
  if (plIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: plDefaultCardLocale(), cardLocalePinned: false };
}

export function plOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'pl-PL' };
  if (plIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'pl' ? plDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyPlCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(PL_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'pl' ? plDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(PL_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function plDictWordInputLabel(t) {
  return t('dict.wordLabelPl');
}

export function plDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Pl`;
  return params != null ? t(key, params) : t(key);
}

export function plPracticeStudyLangLabel(t) {
  return t('practice.inPolish');
}
