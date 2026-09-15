import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { normalizeLearnLocale } from '../i18n/learnLocales.js';
import { loadSettings } from '../utils/settings.js';

export function readLearnLocale() {
  return normalizeLearnLocale(loadSettings().learnLocale);
}

/** English-learning module only when target language is en. */
export function isEnglishLearnModule(learnLocale) {
  return normalizeLearnLocale(learnLocale) === 'en';
}

const DICT_READY_CODES = new Set([
  'en', 'ru', 'ar', 'es', 'pt', 'it', 'el', 'fa', 'da', 'nl', 'fr', 'de',
  'tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh', 'uk', 'pl', 'hi', 'ur', 'az', 'ba', 'ug', 'vi', 'cs', 'hu', 'ro', 'id', 'he', 'ca', 'sr',
]);

/** Languages without server TTS — Web Speech on the device (ug has no espeak voice). */
export const STUDY_PIPER_UNSUPPORTED_CODES = new Set(['ug']);

/** Languages without speech recognition — whisper.cpp has no uyghur language code. */
export const STUDY_STT_UNSUPPORTED_CODES = new Set(['ug']);

/** Dictionary add/generate supported for this learn locale. */
export function isDictionaryGenerationReady(learnLocale) {
  return DICT_READY_CODES.has(normalizeLearnLocale(learnLocale));
}

/** Listen button: Piper when available, otherwise Web Speech on the user's device. */
export function isStudyTtsSupported(learnLocale) {
  return DICT_READY_CODES.has(normalizeLearnLocale(learnLocale));
}

/** Server Piper TTS model exists for this study language. */
export function isStudyPiperTtsSupported(learnLocale) {
  const code = normalizeLearnLocale(learnLocale);
  return DICT_READY_CODES.has(code) && !STUDY_PIPER_UNSUPPORTED_CODES.has(code);
}

/** STT (Whisper) — multilingual small model for ready study locales. */
export function isStudySttSupported(learnLocale) {
  const code = normalizeLearnLocale(learnLocale);
  return DICT_READY_CODES.has(code) && !STUDY_STT_UNSUPPORTED_CODES.has(code);
}

/** @deprecated use isStudySttSupported */
export function isStudyVoiceSupported(learnLocale) {
  return isStudySttSupported(learnLocale);
}

export function useLearnLocale() {
  const location = useLocation();
  const [learnLocale, setLearnLocale] = useState(readLearnLocale);

  useEffect(() => {
    setLearnLocale(readLearnLocale());
  }, [location.pathname, location.key]);

  useEffect(() => {
    const sync = () => setLearnLocale(readLearnLocale());
    window.addEventListener('seashell-settings-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('seashell-settings-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return learnLocale;
}
