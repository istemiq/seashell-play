/**
 * RO-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const RO_CARD_LOCALE_AUTO_KEY = 'seashell_ro_card_locale_auto_v1';

export const RO_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'ro');

export function roNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'ro') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function roDefaultCardLocale() {
  return 'en';
}

export function roCardTranslationLocales() {
  return RO_CARD_TRANSLATION_LOCALES;
}

export function roIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function roShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ro';
}

export function roResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'ro') {
    if (roIsCardLocaleManuallyPinned()) {
      const card = roNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return roDefaultCardLocale();
  }
  return ui;
}

export function roSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'ro' && roIsCardLocaleManuallyPinned();
}

export function roEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'ro') return;
  if (roIsCardLocaleManuallyPinned()) return;
  const expected = roDefaultCardLocale();
  const card = roNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function roSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'ro') return null;
  if (roIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: roDefaultCardLocale(), cardLocalePinned: false };
}

export function roOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'ro-RO' };
  if (roIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'ro' ? roDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyRoCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(RO_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'ro' ? roDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(RO_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function roDictWordInputLabel(t) {
  return t('dict.wordLabelRo');
}

export function roDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Ro`;
  return params != null ? t(key, params) : t(key);
}

export function roPracticeStudyLangLabel(t) {
  return t('practice.inRomanian');
}
