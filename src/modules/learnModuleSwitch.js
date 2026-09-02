/**
 * Единственная точка связи между модулями изучения — переключение learnLocale / uiLocale.
 */
import { normalizeLearnLocale } from '../i18n/learnLocales.js';
import {
  getSavedTtsLocaleForLearn,
  isTtsLocaleForLearn,
  loadSettings,
  rememberTtsLocaleForLearn,
} from '../utils/settings.js';
import { enOnLearnModuleEnter, enSyncCardLocaleWithUi } from './en/enContentLocale.js';
import { ruOnLearnModuleEnter, ruSyncCardLocaleWithUi } from './ru/ruContentLocale.js';
import { arOnLearnModuleEnter, arSyncCardLocaleWithUi } from './ar/arContentLocale.js';
import { esOnLearnModuleEnter, esSyncCardLocaleWithUi } from './es/esContentLocale.js';
import { ptOnLearnModuleEnter, ptSyncCardLocaleWithUi } from './pt/ptContentLocale.js';
import { itOnLearnModuleEnter, itSyncCardLocaleWithUi } from './it/itContentLocale.js';
import { elOnLearnModuleEnter, elSyncCardLocaleWithUi } from './el/elContentLocale.js';
import { faOnLearnModuleEnter, faSyncCardLocaleWithUi } from './fa/faContentLocale.js';
import { daOnLearnModuleEnter, daSyncCardLocaleWithUi } from './da/daContentLocale.js';
import { nlOnLearnModuleEnter, nlSyncCardLocaleWithUi } from './nl/nlContentLocale.js';
import { frOnLearnModuleEnter, frSyncCardLocaleWithUi } from './fr/frContentLocale.js';
import { deOnLearnModuleEnter, deSyncCardLocaleWithUi } from './de/deContentLocale.js';
import { trOnLearnModuleEnter, trSyncCardLocaleWithUi } from './tr/trContentLocale.js';
import { svOnLearnModuleEnter, svSyncCardLocaleWithUi } from './sv/svContentLocale.js';
import { noOnLearnModuleEnter, noSyncCardLocaleWithUi } from './no/noContentLocale.js';
import { fiOnLearnModuleEnter, fiSyncCardLocaleWithUi } from './fi/fiContentLocale.js';
import { koOnLearnModuleEnter, koSyncCardLocaleWithUi } from './ko/koContentLocale.js';
import { jaOnLearnModuleEnter, jaSyncCardLocaleWithUi } from './ja/jaContentLocale.js';
import { zhOnLearnModuleEnter, zhSyncCardLocaleWithUi } from './zh/zhContentLocale.js';
import { ukOnLearnModuleEnter, ukSyncCardLocaleWithUi } from './uk/ukContentLocale.js';
import { plOnLearnModuleEnter, plSyncCardLocaleWithUi } from './pl/plContentLocale.js';
import { hiOnLearnModuleEnter, hiSyncCardLocaleWithUi } from './hi/hiContentLocale.js';
import { urOnLearnModuleEnter, urSyncCardLocaleWithUi } from './ur/urContentLocale.js';
import { azOnLearnModuleEnter, azSyncCardLocaleWithUi } from './az/azContentLocale.js';
import { baOnLearnModuleEnter, baSyncCardLocaleWithUi } from './ba/baContentLocale.js';
import { ugOnLearnModuleEnter, ugSyncCardLocaleWithUi } from './ug/ugContentLocale.js';
import { srOnLearnModuleEnter, srSyncCardLocaleWithUi } from './sr/srContentLocale.js';
import { caOnLearnModuleEnter, caSyncCardLocaleWithUi } from './ca/caContentLocale.js';
import { heOnLearnModuleEnter, heSyncCardLocaleWithUi } from './he/heContentLocale.js';
import { idOnLearnModuleEnter, idSyncCardLocaleWithUi } from './id/idContentLocale.js';
import { roOnLearnModuleEnter, roSyncCardLocaleWithUi } from './ro/roContentLocale.js';
import { huOnLearnModuleEnter, huSyncCardLocaleWithUi } from './hu/huContentLocale.js';
import { csOnLearnModuleEnter, csSyncCardLocaleWithUi } from './cs/csContentLocale.js';
import { viOnLearnModuleEnter, viSyncCardLocaleWithUi } from './vi/viContentLocale.js';

const STUDY_MODULE_CODES = new Set([
  'ru', 'ar', 'es', 'pt', 'it', 'el', 'fa', 'da', 'nl', 'fr', 'de',
  'tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh', 'uk', 'pl', 'hi', 'ur', 'az', 'ba', 'ug', 'vi', 'cs', 'hu', 'ro', 'id', 'he', 'ca', 'sr',
]);

const MODULE_HANDLERS = {
  ru: { enter: ruOnLearnModuleEnter, sync: ruSyncCardLocaleWithUi },
  ar: { enter: arOnLearnModuleEnter, sync: arSyncCardLocaleWithUi },
  es: { enter: esOnLearnModuleEnter, sync: esSyncCardLocaleWithUi },
  pt: { enter: ptOnLearnModuleEnter, sync: ptSyncCardLocaleWithUi },
  it: { enter: itOnLearnModuleEnter, sync: itSyncCardLocaleWithUi },
  el: { enter: elOnLearnModuleEnter, sync: elSyncCardLocaleWithUi },
  fa: { enter: faOnLearnModuleEnter, sync: faSyncCardLocaleWithUi },
  da: { enter: daOnLearnModuleEnter, sync: daSyncCardLocaleWithUi },
  nl: { enter: nlOnLearnModuleEnter, sync: nlSyncCardLocaleWithUi },
  fr: { enter: frOnLearnModuleEnter, sync: frSyncCardLocaleWithUi },
  de: { enter: deOnLearnModuleEnter, sync: deSyncCardLocaleWithUi },
  tr: { enter: trOnLearnModuleEnter, sync: trSyncCardLocaleWithUi },
  sv: { enter: svOnLearnModuleEnter, sync: svSyncCardLocaleWithUi },
  no: { enter: noOnLearnModuleEnter, sync: noSyncCardLocaleWithUi },
  fi: { enter: fiOnLearnModuleEnter, sync: fiSyncCardLocaleWithUi },
  ko: { enter: koOnLearnModuleEnter, sync: koSyncCardLocaleWithUi },
  ja: { enter: jaOnLearnModuleEnter, sync: jaSyncCardLocaleWithUi },
  zh: { enter: zhOnLearnModuleEnter, sync: zhSyncCardLocaleWithUi },
  uk: { enter: ukOnLearnModuleEnter, sync: ukSyncCardLocaleWithUi },
  pl: { enter: plOnLearnModuleEnter, sync: plSyncCardLocaleWithUi },
  hi: { enter: hiOnLearnModuleEnter, sync: hiSyncCardLocaleWithUi },
  ur: { enter: urOnLearnModuleEnter, sync: urSyncCardLocaleWithUi },
  az: { enter: azOnLearnModuleEnter, sync: azSyncCardLocaleWithUi },
  ba: { enter: baOnLearnModuleEnter, sync: baSyncCardLocaleWithUi },
  ug: { enter: ugOnLearnModuleEnter, sync: ugSyncCardLocaleWithUi },
  vi: { enter: viOnLearnModuleEnter, sync: viSyncCardLocaleWithUi },
  cs: { enter: csOnLearnModuleEnter, sync: csSyncCardLocaleWithUi },
  hu: { enter: huOnLearnModuleEnter, sync: huSyncCardLocaleWithUi },
  ro: { enter: roOnLearnModuleEnter, sync: roSyncCardLocaleWithUi },
  id: { enter: idOnLearnModuleEnter, sync: idSyncCardLocaleWithUi },
  he: { enter: heOnLearnModuleEnter, sync: heSyncCardLocaleWithUi },
  ca: { enter: caOnLearnModuleEnter, sync: caSyncCardLocaleWithUi },
  sr: { enter: srOnLearnModuleEnter, sync: srSyncCardLocaleWithUi },
};

/** Код активного модуля изучения */
export function getStudyModuleCode(learnLocale = loadSettings().learnLocale) {
  const code = normalizeLearnLocale(learnLocale);
  if (STUDY_MODULE_CODES.has(code)) return code;
  return 'en';
}

export function isRussianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ru';
}

export function isArabicLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ar';
}

export function isSpanishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'es';
}

export function isPortugueseLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'pt';
}

export function isItalianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'it';
}

export function isGreekLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'el';
}

export function isFarsiLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'fa';
}

export function isDanishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'da';
}

export function isDutchLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'nl';
}

export function isFrenchLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'fr';
}

export function isGermanLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'de';
}

export function isTurkishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'tr';
}

export function isSwedishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'sv';
}

export function isNorwegianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'no';
}

export function isFinnishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'fi';
}

export function isKoreanLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ko';
}

export function isJapaneseLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ja';
}

export function isChineseLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'zh';
}

export function isUkrainianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'uk';
}

export function isPolishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'pl';
}

export function isHindiLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'hi';
}

export function isUrduLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ur';
}

export function isAzerbaijaniLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'az';
}

export function isUyghurLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ug';
}

export function isVietnameseLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'vi';
}

export function isCzechLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'cs';
}

export function isHungarianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'hu';
}

export function isRomanianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ro';
}

export function isIndonesianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'id';
}

export function isHebrewLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'he';
}

export function isCatalanLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'ca';
}

export function isSerbianLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'sr';
}

export function isEnglishLearnModule(learnLocale = loadSettings().learnLocale) {
  return getStudyModuleCode(learnLocale) === 'en';
}

/** Патч settings при выборе языка изучения на LearnLanguagePage. */
export function settingsPatchOnLearnModuleSwitch(nextLearn) {
  const current = loadSettings();
  const prevCode = getStudyModuleCode();
  const code = getStudyModuleCode(nextLearn);
  const modulePatch = MODULE_HANDLERS[code]?.enter() ?? enOnLearnModuleEnter();

  let next = { ...current };
  if (isTtsLocaleForLearn(prevCode, current.ttsLocale)) {
    next = rememberTtsLocaleForLearn(next, prevCode, current.ttsLocale);
  }

  const savedAccent = getSavedTtsLocaleForLearn(next, code);
  const accentPatch = savedAccent
    ? { ttsLocale: savedAccent }
    : modulePatch?.ttsLocale
      ? { ttsLocale: modulePatch.ttsLocale }
      : null;

  const patch = {
    ...(modulePatch ?? {}),
    ...(accentPatch ?? {}),
    ttsLocaleByLearn: next.ttsLocaleByLearn,
  };
  if (savedAccent) patch.ttsLocale = savedAccent;

  if (prevCode !== code) {
    return { ...patch, cardLocalePinned: false };
  }
  return patch;
}

/** Патч settings при смене UI-локали. */
export function settingsPatchOnUiLocaleChange(uiLocale) {
  const code = getStudyModuleCode();
  return MODULE_HANDLERS[code]?.sync(uiLocale) ?? enSyncCardLocaleWithUi(uiLocale);
}
