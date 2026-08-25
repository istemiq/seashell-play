/**

 * Фасад: делегирует в EN-, RU-, AR-, ES-, … или TR/SV/NO/FI/KO/JA/ZH-модуль.

 */

import { UI_LOCALES } from '../i18n/config.js';

import { loadSettings } from './settings.js';

import { getStudyModuleCode } from '../modules/learnModuleSwitch.js';
import {
  isStudyWithoutDedicatedUi,
  resolveContentLocaleForOrphanStudy,
  showCardPickerForOrphanStudy,
  isOrphanStudyCardLocalePinned,
} from '../modules/studyContentLocaleHelpers.js';

import * as en from '../modules/en/enContentLocale.js';

import * as ru from '../modules/ru/ruContentLocale.js';

import * as ar from '../modules/ar/arContentLocale.js';

import * as es from '../modules/es/esContentLocale.js';

import * as pt from '../modules/pt/ptContentLocale.js';

import * as it from '../modules/it/itContentLocale.js';

import * as el from '../modules/el/elContentLocale.js';

import * as fa from '../modules/fa/faContentLocale.js';

import * as da from '../modules/da/daContentLocale.js';

import * as nl from '../modules/nl/nlContentLocale.js';

import * as fr from '../modules/fr/frContentLocale.js';

import * as de from '../modules/de/deContentLocale.js';

import * as tr from '../modules/tr/trContentLocale.js';

import * as sv from '../modules/sv/svContentLocale.js';

import * as no from '../modules/no/noContentLocale.js';

import * as fi from '../modules/fi/fiContentLocale.js';

import * as ko from '../modules/ko/koContentLocale.js';

import * as ja from '../modules/ja/jaContentLocale.js';

import * as zh from '../modules/zh/zhContentLocale.js';

import * as uk from '../modules/uk/ukContentLocale.js';

import * as pl from '../modules/pl/plContentLocale.js';

import * as hi from '../modules/hi/hiContentLocale.js';

import * as ur from '../modules/ur/urContentLocale.js';

import * as az from '../modules/az/azContentLocale.js';
import * as ug from '../modules/ug/ugContentLocale.js';
import * as vi from '../modules/vi/viContentLocale.js';
import * as cs from '../modules/cs/csContentLocale.js';
import * as hu from '../modules/hu/huContentLocale.js';
import * as ro from '../modules/ro/roContentLocale.js';
import * as id from '../modules/id/idContentLocale.js';
import * as he from '../modules/he/heContentLocale.js';
import * as ca from '../modules/ca/caContentLocale.js';
import * as sr from '../modules/sr/srContentLocale.js';



const MODULES = { ru, ar, es, pt, it, el, fa, da, nl, fr, de, tr, sv, no, fi, ko, ja, zh, uk, pl, hi, ur, az, ug, vi, cs, hu, ro, id, he, ca, sr };



function studyModule(learnLocale = loadSettings().learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  return MODULES[code] ?? en;

}



function modCall(learnLocale, fnName, ...args) {

  const mod = studyModule(learnLocale);

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en[fnName](...args);

  const prefixed = `${code}${fnName.charAt(0).toUpperCase()}${fnName.slice(1)}`;

  return mod[prefixed]?.(...args) ?? en[fnName]?.(...args);

}



export const CARD_TRANSLATION_LOCALES = en.EN_CARD_TRANSLATION_LOCALES;



export function normalizeCardLocale(code) {

  return en.enNormalizeCardLocale(code);

}



export function cardTranslationLocalesForLearn(learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enCardTranslationLocales();

  return modCall(learnLocale, 'cardTranslationLocales');

}



export function normalizeCardLocaleForLearn(code, learnLocale) {

  const codeStudy = getStudyModuleCode(learnLocale);

  if (codeStudy === 'en') return en.enNormalizeCardLocale(code);

  return modCall(learnLocale, 'normalizeCardLocale', code);

}



export function defaultCardLocaleForLearn(learnLocale = loadSettings().learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enDefaultCardLocale();

  return modCall(learnLocale, 'defaultCardLocale');

}



export function syncCardLocaleWithUi(uiLocale, learnLocale = loadSettings().learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enSyncCardLocaleWithUi(uiLocale);

  return modCall(learnLocale, 'syncCardLocaleWithUi', uiLocale);

}



export function isCardLocaleManuallyPinned() {

  const code = getStudyModuleCode();

  if (code === 'en') return false;

  if (isStudyWithoutDedicatedUi(code)) return isOrphanStudyCardLocalePinned();

  return modCall(loadSettings().learnLocale, 'isCardLocaleManuallyPinned');

}



export function ensureStudyModuleCardLocaleCoherent() {

  const code = getStudyModuleCode();

  if (code === 'en') return;

  modCall(loadSettings().learnLocale, 'ensureCardLocaleCoherent');

}



/** @deprecated use ensureStudyModuleCardLocaleCoherent */

export function ensureRuCardLocaleCoherent() {

  ensureStudyModuleCardLocaleCoherent();

}



export function resolveContentLocaleForApi() {

  const code = getStudyModuleCode();

  if (code === 'en') return en.enResolveContentLocaleForApi();

  if (isStudyWithoutDedicatedUi(code)) {
    return resolveContentLocaleForOrphanStudy(
      code,
      (c) => modCall(loadSettings().learnLocale, 'normalizeCardLocale', c),
      () => modCall(loadSettings().learnLocale, 'defaultCardLocale'),
    );
  }

  return modCall(loadSettings().learnLocale, 'resolveContentLocaleForApi');

}



export function skipAutoRefreshForPinnedCardLocale() {

  const code = getStudyModuleCode();

  if (code === 'en') return false;

  if (isStudyWithoutDedicatedUi(code)) return isOrphanStudyCardLocalePinned();

  return modCall(loadSettings().learnLocale, 'skipAutoRefreshForPinnedCardLocale');

}



export function showCardTranslationLocalePicker(learnLocale = loadSettings().learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enShowCardTranslationLocalePicker();

  if (isStudyWithoutDedicatedUi(code)) return true;

  return modCall(learnLocale, 'showCardTranslationLocalePicker');

}



export function dictWordInputLabel(t, learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enDictWordInputLabel(t);

  return modCall(learnLocale, 'dictWordInputLabel', t);

}



export function dictMessageForLearn(t, baseKey, learnLocale, params) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enDictMessageForLearn(t, baseKey, params);

  return modCall(learnLocale, 'dictMessageForLearn', t, baseKey, params);

}



export function practiceStudyLangLabel(t, learnLocale) {

  const code = getStudyModuleCode(learnLocale);

  if (code === 'en') return en.enPracticeStudyLangLabel(t);

  return modCall(learnLocale, 'practiceStudyLangLabel', t);

}



export function contentLocaleNativeName(code) {

  const c = String(code ?? '').trim().toLowerCase();

  return UI_LOCALES.find((l) => l.code === c)?.nativeName ?? c;

}

