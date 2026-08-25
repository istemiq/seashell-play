/**
 * ID-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const ID_CARD_LOCALE_AUTO_KEY = 'seashell_id_card_locale_auto_v1';

export const ID_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'id');

export function idNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'id') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function idDefaultCardLocale() {
  return 'en';
}

export function idCardTranslationLocales() {
  return ID_CARD_TRANSLATION_LOCALES;
}

export function idIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function idShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'id';
}

export function idResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'id') {
    if (idIsCardLocaleManuallyPinned()) {
      const card = idNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return idDefaultCardLocale();
  }
  return ui;
}

export function idSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'id' && idIsCardLocaleManuallyPinned();
}

export function idEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'id') return;
  if (idIsCardLocaleManuallyPinned()) return;
  const expected = idDefaultCardLocale();
  const card = idNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function idSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'id') return null;
  if (idIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: idDefaultCardLocale(), cardLocalePinned: false };
}

export function idOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'id-ID' };
  if (idIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'id' ? idDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyIdCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(ID_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'id' ? idDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(ID_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function idDictWordInputLabel(t) {
  return t('dict.wordLabelId');
}

export function idDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Id`;
  return params != null ? t(key, params) : t(key);
}

export function idPracticeStudyLangLabel(t) {
  return t('practice.inIndonesian');
}
