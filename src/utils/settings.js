import { DEFAULT_LEARN_LOCALE, normalizeLearnLocale } from '../i18n/learnLocales.js';
import { getStudyModuleCode } from '../modules/learnModuleSwitch.js';
import { speechLocaleForLearn } from './studySpeech.js';
import { applyRuCardLocaleStorageMigration } from '../modules/ru/ruContentLocale.js';
import { applyArCardLocaleStorageMigration } from '../modules/ar/arContentLocale.js';
import { applyEsCardLocaleStorageMigration } from '../modules/es/esContentLocale.js';
import { applyPtCardLocaleStorageMigration } from '../modules/pt/ptContentLocale.js';
import { applyItCardLocaleStorageMigration } from '../modules/it/itContentLocale.js';
import { applyElCardLocaleStorageMigration } from '../modules/el/elContentLocale.js';
import { applyFaCardLocaleStorageMigration } from '../modules/fa/faContentLocale.js';
import { applyDaCardLocaleStorageMigration } from '../modules/da/daContentLocale.js';
import { applyNlCardLocaleStorageMigration } from '../modules/nl/nlContentLocale.js';
import { applyFrCardLocaleStorageMigration } from '../modules/fr/frContentLocale.js';
import { applyDeCardLocaleStorageMigration } from '../modules/de/deContentLocale.js';
import { applyTrCardLocaleStorageMigration } from '../modules/tr/trContentLocale.js';
import { applySvCardLocaleStorageMigration } from '../modules/sv/svContentLocale.js';
import { applyNoCardLocaleStorageMigration } from '../modules/no/noContentLocale.js';
import { applyFiCardLocaleStorageMigration } from '../modules/fi/fiContentLocale.js';
import { applyKoCardLocaleStorageMigration } from '../modules/ko/koContentLocale.js';
import { applyJaCardLocaleStorageMigration } from '../modules/ja/jaContentLocale.js';
import { applyZhCardLocaleStorageMigration } from '../modules/zh/zhContentLocale.js';
import { applyUkCardLocaleStorageMigration } from '../modules/uk/ukContentLocale.js';
import { applyPlCardLocaleStorageMigration } from '../modules/pl/plContentLocale.js';
import { applyHiCardLocaleStorageMigration } from '../modules/hi/hiContentLocale.js';
import { applyUrCardLocaleStorageMigration } from '../modules/ur/urContentLocale.js';
import { applyAzCardLocaleStorageMigration } from '../modules/az/azContentLocale.js';
import { applyUgCardLocaleStorageMigration } from '../modules/ug/ugContentLocale.js';
import { applyViCardLocaleStorageMigration } from '../modules/vi/viContentLocale.js';
import { applyCsCardLocaleStorageMigration } from '../modules/cs/csContentLocale.js';
import { applyHuCardLocaleStorageMigration } from '../modules/hu/huContentLocale.js';
import { applyRoCardLocaleStorageMigration } from '../modules/ro/roContentLocale.js';
import { applyIdCardLocaleStorageMigration } from '../modules/id/idContentLocale.js';
import { applyHeCardLocaleStorageMigration } from '../modules/he/heContentLocale.js';
import { applyCaCardLocaleStorageMigration } from '../modules/ca/caContentLocale.js';
import { applySrCardLocaleStorageMigration } from '../modules/sr/srContentLocale.js';
import { isSuperAccountUser } from '../platform/superAccount.js';
import { resolvePlatformUserId } from '../platform/platformUser.js';

const STORAGE_KEY = 'seashell_settings_v1';
const THEME_MIGRATION_KEY = 'seashell_theme_follow_tg_v1';
const UI_LOCALE_EN_MIGRATION_KEY = 'seashell_ui_locale_en_default_v1';

export const DEFAULT_SETTINGS = {
  theme: 'system',
  uiLocale: 'en',
  /** Target language the user is learning (dictionary/practice content). */
  learnLocale: DEFAULT_LEARN_LOCALE,
  /** Язык переводов на карточках при uiLocale=ru (picker в словаре). */
  cardLocale: '',
  /** true после ручного выбора языка карточек в picker (только RU UI). */
  cardLocalePinned: false,
  ttsEnabled: true,
  ttsRate: 0.95,
  ttsLocale: 'en-US',
  /** Per study-language TTS accent (en → en-GB, ru → ru-RU, …). */
  ttsLocaleByLearn: {},
  fontScale: 'normal',
};

export function isTtsLocaleForLearn(learnCode, locale) {
  const loc = String(locale ?? '').trim();
  if (!loc) return false;
  const code = String(learnCode ?? '').trim().toLowerCase();
  if (code === 'en') return loc === 'en-US' || loc === 'en-GB';
  if (code === 'zh') return loc === 'zh-CN' || loc === 'zh-TW';
  return loc.split('-')[0].toLowerCase() === code;
}

export function defaultTtsLocaleForLearn(learnCode) {
  return speechLocaleForLearn(learnCode);
}

export function getSavedTtsLocaleForLearn(settings, learnCode) {
  const map = settings?.ttsLocaleByLearn;
  if (!map || typeof map !== 'object') return null;
  const saved = map[learnCode];
  return saved && isTtsLocaleForLearn(learnCode, saved) ? saved : null;
}

function reconcileTtsLocaleForCurrentLearn(settings) {
  const learnCode = getStudyModuleCode(settings.learnLocale);
  const map =
    settings.ttsLocaleByLearn && typeof settings.ttsLocaleByLearn === 'object'
      ? { ...settings.ttsLocaleByLearn }
      : {};

  const saved = getSavedTtsLocaleForLearn({ ttsLocaleByLearn: map }, learnCode);
  if (saved) {
    settings.ttsLocale = saved;
    settings.ttsLocaleByLearn = map;
    return;
  }

  const pref = String(settings.ttsLocale || '').trim();
  if (isTtsLocaleForLearn(learnCode, pref)) {
    map[learnCode] = pref;
    settings.ttsLocale = pref;
    settings.ttsLocaleByLearn = map;
    return;
  }

  settings.ttsLocale = defaultTtsLocaleForLearn(learnCode);
  settings.ttsLocaleByLearn = map;
}

export function rememberTtsLocaleForLearn(settings, learnCode, ttsLocale) {
  if (!isTtsLocaleForLearn(learnCode, ttsLocale)) return settings;
  return {
    ...settings,
    ttsLocale,
    ttsLocaleByLearn: { ...(settings.ttsLocaleByLearn || {}), [learnCode]: ttsLocale },
  };
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const CARD_LOCALE_MIGRATIONS = {
  ru: applyRuCardLocaleStorageMigration,
  ar: applyArCardLocaleStorageMigration,
  es: applyEsCardLocaleStorageMigration,
  pt: applyPtCardLocaleStorageMigration,
  it: applyItCardLocaleStorageMigration,
  el: applyElCardLocaleStorageMigration,
  fa: applyFaCardLocaleStorageMigration,
  da: applyDaCardLocaleStorageMigration,
  nl: applyNlCardLocaleStorageMigration,
  fr: applyFrCardLocaleStorageMigration,
  de: applyDeCardLocaleStorageMigration,
  tr: applyTrCardLocaleStorageMigration,
  sv: applySvCardLocaleStorageMigration,
  no: applyNoCardLocaleStorageMigration,
  fi: applyFiCardLocaleStorageMigration,
  ko: applyKoCardLocaleStorageMigration,
  ja: applyJaCardLocaleStorageMigration,
  zh: applyZhCardLocaleStorageMigration,
  uk: applyUkCardLocaleStorageMigration,
  pl: applyPlCardLocaleStorageMigration,
  hi: applyHiCardLocaleStorageMigration,
  ur: applyUrCardLocaleStorageMigration,
  az: applyAzCardLocaleStorageMigration,
  ug: applyUgCardLocaleStorageMigration,
  vi: applyViCardLocaleStorageMigration,
  cs: applyCsCardLocaleStorageMigration,
  hu: applyHuCardLocaleStorageMigration,
  ro: applyRoCardLocaleStorageMigration,
  id: applyIdCardLocaleStorageMigration,
  he: applyHeCardLocaleStorageMigration,
  ca: applyCaCardLocaleStorageMigration,
  sr: applySrCardLocaleStorageMigration,
};

export function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (!raw) return { ...DEFAULT_SETTINGS };
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
  const merged = { ...DEFAULT_SETTINGS, ...parsed };
  merged.learnLocale = normalizeLearnLocale(merged.learnLocale);
  if (String(merged.ttsLocale || '').trim() === 'nb-NO') {
    merged.ttsLocale = 'no-NO';
    saveSettings(merged);
  }
  if (
    typeof window !== 'undefined' &&
    !window.localStorage.getItem(THEME_MIGRATION_KEY) &&
    merged.theme === 'light'
  ) {
    merged.theme = 'system';
    window.localStorage.setItem(THEME_MIGRATION_KEY, '1');
    saveSettings(merged);
  }
  if (
    typeof window !== 'undefined' &&
    !window.localStorage.getItem(UI_LOCALE_EN_MIGRATION_KEY) &&
    !isSuperAccountUser(resolvePlatformUserId())
  ) {
    merged.uiLocale = 'en';
    window.localStorage.setItem(UI_LOCALE_EN_MIGRATION_KEY, '1');
    saveSettings(merged);
  }
  if (typeof window !== 'undefined') {
    const migrate = CARD_LOCALE_MIGRATIONS[normalizeLearnLocale(merged.learnLocale)];
    if (migrate) migrate(merged, saveSettings);
  }
  merged.cardLocalePinned = merged.cardLocalePinned === true;
  if (!merged.ttsLocaleByLearn || typeof merged.ttsLocaleByLearn !== 'object') {
    merged.ttsLocaleByLearn = {};
  }
  reconcileTtsLocaleForCurrentLearn(merged);
  return merged;
}

export function saveSettings(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* iOS private mode / storage full */
  }
}

export function updateSettings(patch) {
  const current = loadSettings();
  let next = { ...current, ...patch };
  if (patch.learnLocale != null) {
    next.learnLocale = normalizeLearnLocale(patch.learnLocale);
  }
  if (patch.ttsLocale != null) {
    next = rememberTtsLocaleForLearn(next, getStudyModuleCode(next.learnLocale), patch.ttsLocale);
  }
  if (patch.ttsLocaleByLearn != null) {
    next.ttsLocaleByLearn = { ...(next.ttsLocaleByLearn || {}), ...patch.ttsLocaleByLearn };
    reconcileTtsLocaleForCurrentLearn(next);
  }
  saveSettings(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('seashell-settings-changed'));
  }
  return next;
}
