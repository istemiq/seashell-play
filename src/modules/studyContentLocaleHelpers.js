/**
 * Общая логика языка переводов на карточках для языков изучения без своего UI.
 * (pl, de, vi, zh, … — всё, чего нет в UI_LOCALES)
 */
import { loadSettings } from '../utils/settings.js';
import {
  defaultCardLocaleForOrphanStudy,
  isOrphanStudyCardLocalePinned as isOrphanStudyCardLocalePinnedFromSettings,
  isStudyWithoutDedicatedUi,
  resolveContentLocaleForOrphanStudyFromSettings,
  showCardPickerForOrphanStudy,
} from './orphanContentLocaleLogic.js';

export {
  defaultCardLocaleForOrphanStudy,
  isStudyWithoutDedicatedUi,
  resolveContentLocaleForOrphanStudyFromSettings,
  showCardPickerForOrphanStudy,
} from './orphanContentLocaleLogic.js';

export function resolveContentLocaleForOrphanStudy(studyCode, normalizeCardLocale, defaultCardLocale) {
  return resolveContentLocaleForOrphanStudyFromSettings(
    loadSettings(),
    normalizeCardLocale,
    defaultCardLocale,
  );
}

export function isOrphanStudyCardLocalePinned() {
  return isOrphanStudyCardLocalePinnedFromSettings(loadSettings());
}
