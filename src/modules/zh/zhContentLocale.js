/**
 * ZH-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const ZH_CARD_LOCALE_AUTO_KEY = 'seashell_zh_card_locale_auto_v1';

export const ZH_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== 'zh');

export function zhNormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === 'zh') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function zhDefaultCardLocale() {
  return 'en';
}

export function zhCardTranslationLocales() {
  return ZH_CARD_TRANSLATION_LOCALES;
}

export function zhIsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function zhShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'zh';
}

export function zhResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === 'zh') {
    if (zhIsCardLocaleManuallyPinned()) {
      const card = zhNormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return zhDefaultCardLocale();
  }
  return ui;
}

export function zhSkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === 'zh' && zhIsCardLocaleManuallyPinned();
}

export function zhEnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== 'zh') return;
  if (zhIsCardLocaleManuallyPinned()) return;
  const expected = zhDefaultCardLocale();
  const card = zhNormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function zhSyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== 'zh') return null;
  if (zhIsCardLocaleManuallyPinned()) return null;
  return { cardLocale: zhDefaultCardLocale(), cardLocalePinned: false };
}

export function zhOnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: 'zh-CN' };
  if (zhIsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === 'zh' ? zhDefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function applyZhCardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(ZH_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === 'zh' ? zhDefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(ZH_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function zhDictWordInputLabel(t) {
  return t('dict.wordLabelZh');
}

export function zhDictMessageForLearn(t, baseKey, params) {
  const key = `${baseKey}Zh`;
  return params != null ? t(key, params) : t(key);
}

export function zhPracticeStudyLangLabel(t) {
  return t('practice.inChinese');
}
