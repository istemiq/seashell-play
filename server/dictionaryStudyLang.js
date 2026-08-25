/**
 * Язык, который учит пользователь (target_lang / learnLocale).
 * Отделяет «study language» (поле text, headwordEn) от content_locale (переводы/gloss).
 */
import { isPhraseLikeInput } from './dictionaryInputMode.js';
import { getPromptLocaleVars, normalizeContentLocale } from './promptLocales.js';
import { normalizeTargetLang } from './targetLang.js';

export const STUDY_LANG_META = {
  en: {
    code: 'en',
    nameEn: 'English',
    nameRu: 'английский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'en-US',
    supportsIrregularVerbs: true,
  },
  ru: {
    code: 'ru',
    nameEn: 'Russian',
    nameRu: 'русский',
    studyScriptNoteEn: 'Cyrillic for the sentence words',
    studyScriptNoteRu: 'кириллицей (слова предложения)',
    ttsLocale: 'ru-RU',
    supportsIrregularVerbs: false,
  },
  ar: {
    code: 'ar',
    nameEn: 'Arabic',
    nameRu: 'арабский',
    studyScriptNoteEn: 'Arabic script for the sentence words',
    studyScriptNoteRu: 'арабской вязью (слова предложения)',
    ttsLocale: 'ar-JO',
    supportsIrregularVerbs: false,
  },
  es: {
    code: 'es',
    nameEn: 'Spanish',
    nameRu: 'испанский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'es-ES',
    supportsIrregularVerbs: false,
  },
  pt: {
    code: 'pt',
    nameEn: 'Portuguese',
    nameRu: 'португальский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'pt-BR',
    supportsIrregularVerbs: false,
  },
  it: {
    code: 'it',
    nameEn: 'Italian',
    nameRu: 'итальянский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'it-IT',
    supportsIrregularVerbs: false,
  },
  el: {
    code: 'el',
    nameEn: 'Greek',
    nameRu: 'греческий',
    studyScriptNoteEn: 'Greek script for the sentence words',
    studyScriptNoteRu: 'греческим алфавитом (слова предложения)',
    ttsLocale: 'el-GR',
    supportsIrregularVerbs: false,
  },
  fa: {
    code: 'fa',
    nameEn: 'Persian',
    nameRu: 'персидский',
    studyScriptNoteEn: 'Persian script for the sentence words',
    studyScriptNoteRu: 'персидской вязью (слова предложения)',
    ttsLocale: 'fa-IR',
    supportsIrregularVerbs: false,
  },
  da: {
    code: 'da',
    nameEn: 'Danish',
    nameRu: 'датский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'da-DK',
    supportsIrregularVerbs: false,
  },
  nl: {
    code: 'nl',
    nameEn: 'Dutch',
    nameRu: 'нидерландский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'nl-NL',
    supportsIrregularVerbs: false,
  },
  fr: {
    code: 'fr',
    nameEn: 'French',
    nameRu: 'французский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'fr-FR',
    supportsIrregularVerbs: false,
  },
  de: {
    code: 'de',
    nameEn: 'German',
    nameRu: 'немецкий',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'de-DE',
    supportsIrregularVerbs: false,
  },
  tr: {
    code: 'tr',
    nameEn: 'Turkish',
    nameRu: 'турецкий',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'tr-TR',
    supportsIrregularVerbs: false,
  },
  sv: {
    code: 'sv',
    nameEn: 'Swedish',
    nameRu: 'шведский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'sv-SE',
    supportsIrregularVerbs: false,
  },
  no: {
    code: 'no',
    nameEn: 'Norwegian',
    nameRu: 'норвежский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'no-NO',
    supportsIrregularVerbs: false,
  },
  fi: {
    code: 'fi',
    nameEn: 'Finnish',
    nameRu: 'финский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'fi-FI',
    supportsIrregularVerbs: false,
  },
  ko: {
    code: 'ko',
    nameEn: 'Korean',
    nameRu: 'корейский',
    studyScriptNoteEn: 'Hangul for the sentence words',
    studyScriptNoteRu: 'хангылом (слова предложения)',
    ttsLocale: 'ko-KR',
    supportsIrregularVerbs: false,
  },
  ja: {
    code: 'ja',
    nameEn: 'Japanese',
    nameRu: 'японский',
    studyScriptNoteEn: 'Japanese script for the sentence words',
    studyScriptNoteRu: 'японской письменностью (слова предложения)',
    ttsLocale: 'ja-JP',
    supportsIrregularVerbs: false,
  },
  zh: {
    code: 'zh',
    nameEn: 'Chinese',
    nameRu: 'китайский',
    studyScriptNoteEn: 'Chinese characters for the sentence words',
    studyScriptNoteRu: 'китайскими иероглифами (слова предложения)',
    ttsLocale: 'zh-CN',
    supportsIrregularVerbs: false,
  },
  uk: {
    code: 'uk',
    nameEn: 'Ukrainian',
    nameRu: 'украинский',
    studyScriptNoteEn: 'Cyrillic for the sentence words',
    studyScriptNoteRu: 'кириллицей (слова предложения)',
    ttsLocale: 'uk-UA',
    supportsIrregularVerbs: false,
  },
  pl: {
    code: 'pl',
    nameEn: 'Polish',
    nameRu: 'польский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'pl-PL',
    supportsIrregularVerbs: false,
  },
  hi: {
    code: 'hi',
    nameEn: 'Hindi',
    nameRu: 'хинди',
    studyScriptNoteEn: 'Devanagari script for the sentence words',
    studyScriptNoteRu: 'деванагари (слова предложения)',
    ttsLocale: 'hi-IN',
    supportsIrregularVerbs: false,
  },
  ur: {
    code: 'ur',
    nameEn: 'Urdu',
    nameRu: 'урду',
    studyScriptNoteEn: 'Urdu Arabic script for the sentence words',
    studyScriptNoteRu: 'арабской вязью (слова предложения)',
    ttsLocale: 'ur-PK',
    supportsIrregularVerbs: false,
  },
  az: {
    code: 'az',
    nameEn: 'Azerbaijani',
    nameRu: 'азербайджанский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'az-AZ',
    supportsIrregularVerbs: false,
  },
  vi: {
    code: 'vi',
    nameEn: 'Vietnamese',
    nameRu: 'вьетнамский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'vi-VN',
    supportsIrregularVerbs: false,
  },
  cs: {
    code: 'cs',
    nameEn: 'Czech',
    nameRu: 'чешский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'cs-CZ',
    supportsIrregularVerbs: false,
  },
  hu: {
    code: 'hu',
    nameEn: 'Hungarian',
    nameRu: 'венгерский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'hu-HU',
    supportsIrregularVerbs: false,
  },
  ro: {
    code: 'ro',
    nameEn: 'Romanian',
    nameRu: 'румынский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'ro-RO',
    supportsIrregularVerbs: false,
  },
  id: {
    code: 'id',
    nameEn: 'Indonesian',
    nameRu: 'индонезийский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'id-ID',
    supportsIrregularVerbs: false,
  },
  he: {
    code: 'he',
    nameEn: 'Hebrew',
    nameRu: 'иврит',
    studyScriptNoteEn: 'Hebrew script for the sentence words',
    studyScriptNoteRu: 'ивритом (слова предложения)',
    ttsLocale: 'he-IL',
    supportsIrregularVerbs: false,
  },
  ca: {
    code: 'ca',
    nameEn: 'Catalan',
    nameRu: 'каталанский',
    studyScriptNoteEn: 'Latin letters for the sentence words',
    studyScriptNoteRu: 'латиницей (слова предложения)',
    ttsLocale: 'ca-ES',
    supportsIrregularVerbs: false,
  },
  sr: {
    code: 'sr',
    nameEn: 'Serbian',
    nameRu: 'сербский',
    studyScriptNoteEn: 'Cyrillic for the sentence words',
    studyScriptNoteRu: 'кириллицей (слова предложения)',
    ttsLocale: 'sr-RS',
    supportsIrregularVerbs: false,
  },
  ug: {
    code: 'ug',
    nameEn: 'Uyghur',
    nameRu: 'уйгурский',
    studyScriptNoteEn: 'Uyghur Arabic script for the sentence words',
    studyScriptNoteRu: 'уйгурской арабской вязью (слова предложения)',
    ttsLocale: 'ug-CN',
    supportsIrregularVerbs: false,
  },
};

export function normalizeStudyLang(code) {
  return normalizeTargetLang(code);
}

export function getStudyLangMeta(targetLang) {
  return STUDY_LANG_META[normalizeStudyLang(targetLang)] ?? STUDY_LANG_META.en;
}

export function isDictionaryGenerationReady(targetLang) {
  const code = normalizeStudyLang(targetLang);
  return (
    code === 'en' ||
    code === 'ru' ||
    code === 'ar' ||
    code === 'es' ||
    code === 'pt' ||
    code === 'it' ||
    code === 'el' ||
    code === 'fa' ||
    code === 'da' ||
    code === 'nl' ||
    code === 'fr' ||
    code === 'de' ||
    code === 'tr' ||
    code === 'sv' ||
    code === 'no' ||
    code === 'fi' ||
    code === 'ko' ||
    code === 'ja' ||
    code === 'zh' ||
    code === 'uk' ||
    code === 'pl' ||
    code === 'hi' ||
    code === 'ur' ||
    code === 'az' ||
    code === 'vi' ||
    code === 'cs' ||
    code === 'hu' ||
    code === 'ro' ||
    code === 'id' ||
    code === 'he' ||
    code === 'ca' ||
    code === 'sr' ||
    code === 'ug'
  );
}

function scriptCounts(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let latin = 0;
  let cyr = 0;
  let arabic = 0;
  let greek = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
    if (/[\u0600-\u06FF]/.test(ch)) arabic += 1;
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(ch)) greek += 1;
  }
  return { latin, cyr, arabic, greek };
}

export function looksMostlyArabicStudyText(s) {
  const { latin, cyr, arabic } = scriptCounts(s);
  return arabic > 0 && arabic >= latin && arabic >= cyr;
}

const LATIN_STUDY_RE = /[A-Za-z\u00C0-\u024F\u011E\u011F\u0130\u0131\u015E\u015F\u00D6\u00F6\u00C7\u00E7\u00DC\u00FC\u00C5\u00E5\u00C4\u00E4\u00D8\u00F8]/;

export function looksMostlyLatinStudyText(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let latin = 0;
  let cyr = 0;
  for (const ch of t) {
    if (LATIN_STUDY_RE.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
  }
  return latin > 0 && latin >= cyr;
}

export function looksMostlyHebrewStudyText(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let hebrew = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\u0590-\u05FF]/.test(ch)) hebrew += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return hebrew > 0 && hebrew >= latin;
}

export function looksMostlyCyrillicStudyText(s) {
  const { latin, cyr } = scriptCounts(s);
  return cyr > 0 && cyr > latin;
}

export function looksMostlyChineseStudyText(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let cjk = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\u4E00-\u9FFF]/.test(ch)) cjk += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return cjk > 0 && cjk >= latin;
}

export function looksMostlyHangulStudyText(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let hangul = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(ch)) hangul += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return hangul > 0 && hangul >= latin;
}

export function looksMostlyJapaneseStudyText(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let ja = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\u3040-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/.test(ch)) ja += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return ja > 0 && ja >= latin;
}

export function looksMostlyDevanagariStudyText(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let dev = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\u0900-\u097F]/.test(ch)) dev += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return dev > 0 && dev >= latin;
}

export function looksMostlyGreekStudyText(s) {
  const { latin, greek } = scriptCounts(s);
  return greek > 0 && greek >= latin;
}

export function looksLikeStudyLanguageText(text, targetLang) {
  const study = normalizeStudyLang(targetLang);
  if (study === 'ru') return looksMostlyCyrillicStudyText(text);
  if (study === 'uk') return looksMostlyCyrillicStudyText(text);
  if (study === 'sr') return looksMostlyCyrillicStudyText(text);
  if (study === 'ar') return looksMostlyArabicStudyText(text);
  if (study === 'fa') return looksMostlyArabicStudyText(text);
  if (study === 'ur') return looksMostlyArabicStudyText(text);
  if (study === 'ug') return looksMostlyArabicStudyText(text);
  if (study === 'hi') return looksMostlyDevanagariStudyText(text);
  if (study === 'he') return looksMostlyHebrewStudyText(text);
  if (study === 'el') return looksMostlyGreekStudyText(text);
  if (study === 'zh') return looksMostlyChineseStudyText(text);
  if (study === 'ko') return looksMostlyHangulStudyText(text);
  if (study === 'ja') return looksMostlyJapaneseStudyText(text);
  return looksMostlyLatinStudyText(text);
}

/** Можно ли считать ввод готовой леммой на языке обучения без вызова модели. */
export function wordInputLooksLikeStudyLanguage(word, contentLocale, targetLang) {
  if (isPhraseLikeInput(word)) return false;
  const study = normalizeStudyLang(targetLang);
  const loc = normalizeContentLocale(contentLocale);
  if (study === 'en') {
    if (loc !== 'en') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'ru') {
    if (loc !== 'ru') return false;
    return looksMostlyCyrillicStudyText(word);
  }
  if (study === 'ar') {
    if (loc !== 'ar') return false;
    return looksMostlyArabicStudyText(word);
  }
  if (study === 'es') {
    if (loc !== 'es') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'pt') {
    if (loc !== 'pt') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'it') {
    if (loc !== 'it') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'el') {
    if (loc !== 'el') return false;
    return looksMostlyGreekStudyText(word);
  }
  if (study === 'fa') {
    if (loc !== 'fa') return false;
    return looksMostlyArabicStudyText(word);
  }
  if (study === 'da') {
    if (loc !== 'da') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'nl') {
    if (loc !== 'nl') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'fr') {
    if (loc !== 'fr') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'de') {
    if (loc !== 'de') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'uk') {
    if (loc !== 'uk') return false;
    return looksMostlyCyrillicStudyText(word);
  }
  if (study === 'pl') {
    if (loc !== 'pl') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'hi') {
    if (loc !== 'hi') return false;
    return looksMostlyDevanagariStudyText(word);
  }
  if (study === 'ur') {
    if (loc !== 'ur') return false;
    return looksMostlyArabicStudyText(word);
  }
  if (study === 'az') {
    if (loc !== 'az') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'vi') {
    if (loc !== 'vi') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'cs') {
    if (loc !== 'cs') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'hu') {
    if (loc !== 'hu') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'ro') {
    if (loc !== 'ro') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'id') {
    if (loc !== 'id') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'he') {
    if (loc !== 'he') return false;
    return looksMostlyHebrewStudyText(word);
  }
  if (study === 'ca') {
    if (loc !== 'ca') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'sr') {
    if (loc !== 'sr') return false;
    return looksMostlyCyrillicStudyText(word);
  }
  if (study === 'tr') {
    if (loc !== 'tr') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'sv') {
    if (loc !== 'sv') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'no') {
    if (loc !== 'no') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'fi') {
    if (loc !== 'fi') return false;
    return looksMostlyLatinStudyText(word);
  }
  if (study === 'ko') {
    if (loc !== 'ko') return false;
    return looksMostlyHangulStudyText(word);
  }
  if (study === 'ja') {
    if (loc !== 'ja') return false;
    return looksMostlyJapaneseStudyText(word);
  }
  if (study === 'zh') {
    if (loc !== 'zh') return false;
    return looksMostlyChineseStudyText(word);
  }
  if (study === 'ug') {
    if (loc !== 'ug') return false;
    return looksMostlyArabicStudyText(word);
  }
  return false;
}

const L1_OF_EN = {
  en: 'English',
  ru: 'Russian',
  uk: 'Ukrainian',
  tr: 'Turkish',
  es: 'Spanish',
  pt: 'Portuguese',
  it: 'Italian',
  ar: 'Arabic',
  fa: 'Persian',
  da: 'Danish',
  nl: 'Dutch',
  fr: 'French',
  de: 'German',
  pl: 'Polish',
  hi: 'Hindi',
  ur: 'Urdu',
  az: 'Azerbaijani',
  vi: 'Vietnamese',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  id: 'Indonesian',
  he: 'Hebrew',
  ca: 'Catalan',
  sr: 'Serbian',
  ug: 'Uyghur',
  ko: 'Korean',
  ja: 'Japanese',
};

const AUDIENCE_OF = {
  en: {
    en: 'English-speaking learners of English',
    ru: 'English-speaking learners of Russian',
    ar: 'English-speaking learners of Arabic',
    es: 'English-speaking learners of Spanish',
    pt: 'English-speaking learners of Portuguese',
    it: 'English-speaking learners of Italian',
    el: 'English-speaking learners of Greek',
    fa: 'English-speaking learners of Persian',
    da: 'English-speaking learners of Danish',
    nl: 'English-speaking learners of Dutch',
    fr: 'English-speaking learners of French',
    de: 'English-speaking learners of German',
    tr: 'English-speaking learners of Turkish',
    sv: 'English-speaking learners of Swedish',
    no: 'English-speaking learners of Norwegian',
    fi: 'English-speaking learners of Finnish',
    ko: 'English-speaking learners of Korean',
    ja: 'English-speaking learners of Japanese',
    zh: 'English-speaking learners of Chinese',
    uk: 'English-speaking learners of Ukrainian',
    pl: 'English-speaking learners of Polish',
    sr: 'English-speaking learners of Serbian',
    ca: 'English-speaking learners of Catalan',
    he: 'English-speaking learners of Hebrew',
    id: 'English-speaking learners of Indonesian',
    ro: 'English-speaking learners of Romanian',
    hu: 'English-speaking learners of Hungarian',
    cs: 'English-speaking learners of Czech',
    vi: 'English-speaking learners of Vietnamese',
    hi: 'English-speaking learners of Hindi',
    ur: 'English-speaking learners of Urdu',
    az: 'English-speaking learners of Azerbaijani',
    ug: 'English-speaking learners of Uyghur',
  },
  ru: {
    en: 'русскоязычным ученикам английского',
    ru: 'русскоязычным ученикам русского',
    ar: 'русскоязычным ученикам арабского',
    es: 'русскоязычным ученикам испанского',
    pt: 'русскоязычным ученикам португальского',
    it: 'русскоязычным ученикам итальянского',
    el: 'русскоязычным ученикам греческого',
    fa: 'русскоязычным ученикам персидского',
    da: 'русскоязычным ученикам датского',
    nl: 'русскоязычным ученикам нидерландского',
    fr: 'русскоязычным ученикам французского',
    de: 'русскоязычным ученикам немецкого',
    tr: 'русскоязычным ученикам турецкого',
    sv: 'русскоязычным ученикам шведского',
    no: 'русскоязычным ученикам норвежского',
    fi: 'русскоязычным ученикам финского',
    ko: 'русскоязычным ученикам корейского',
    ja: 'русскоязычным ученикам японского',
    zh: 'русскоязычным ученикам китайского',
    uk: 'русскоязычным ученикам украинского',
    pl: 'русскоязычным ученикам польского',
    sr: 'русскоязычным ученикам сербского',
    ca: 'русскоязычным ученикам каталанского',
    he: 'русскоязычным ученикам иврит',
    id: 'русскоязычным ученикам индонезийского',
    ro: 'русскоязычным ученикам румынского',
    hu: 'русскоязычным ученикам венгерского',
    cs: 'русскоязычным ученикам чешского',
    vi: 'русскоязычным ученикам вьетнамского',
    hi: 'русскоязычным ученикам хинди',
    ur: 'русскоязычным ученикам урду',
    az: 'русскоязычным ученикам азербайджанского',
    ug: 'русскоязычным ученикам уйгурского',
  },
  es: {
    en: 'estudiantes hispanohablantes de inglés',
    ru: 'estudiantes hispanohablantes de ruso',
    ar: 'estudiantes hispanohablantes de árabe',
    es: 'estudiantes hispanohablantes de español',
    pt: 'estudiantes hispanohablantes de portugués',
    it: 'estudiantes hispanohablantes de italiano',
    el: 'estudiantes hispanohablantes de griego',
    fa: 'estudiantes hispanohablantes de persa',
    da: 'estudiantes hispanohablantes de danés',
    nl: 'estudiantes hispanohablantes de neerlandés',
    fr: 'estudiantes hispanohablantes de francés',
    de: 'estudiantes hispanohablantes de alemán',
  },
  pt: {
    en: 'estudantes lusófonos de inglês',
    ru: 'estudantes lusófonos de russo',
    ar: 'estudantes lusófonos de árabe',
    es: 'estudantes lusófonos de espanhol',
    pt: 'estudantes lusófonos de português',
    it: 'estudantes lusófonos de italiano',
    el: 'estudantes lusófonos de grego',
    fa: 'estudantes lusófonos de persa',
    da: 'estudantes lusófonos de dinamarquês',
    nl: 'estudantes lusófonos de holandês',
    fr: 'estudantes lusófonos de francês',
    de: 'estudantes lusófonos de alemão',
  },
  it: {
    en: 'studenti italofoni di inglese',
    ru: 'studenti italofoni di russo',
    ar: 'studenti italofoni di arabo',
    es: 'studenti italofoni di spagnolo',
    pt: 'studenti italofoni di portoghese',
    it: 'studenti italofoni di italiano',
    el: 'studenti italofoni di greco',
    fa: 'studenti italofoni di persiano',
    da: 'studenti italofoni di danese',
    nl: 'studenti italofoni di olandese',
    fr: 'studenti italofoni di francese',
    de: 'studenti italofoni di tedesco',
  },
  uk: {
    en: 'україномовним учням англійської',
    ru: 'україномовним учням російської',
    ar: 'україномовним учням арабської',
    es: 'україномовним учням іспанської',
    pt: 'україномовним учням португальської',
    it: 'україномовним учням італійської',
    el: 'україномовним учням грецької',
    fa: 'україномовним учням перської',
    da: 'україномовним учням данської',
    nl: 'україномовним учням нідерландської',
    fr: 'україномовним учням французької',
    de: 'україномовним учням німецької',
    uk: 'україномовним учням української',
    pl: 'україномовним учням польської',
    sr: 'україномовним учням сербської',
    ca: 'україномовним учням каталанської',
    he: 'україномовним учням иврит',
    id: 'україномовним учням индонезийської',
    ro: 'україномовним учням румынської',
    hu: 'україномовним учням венгерської',
    cs: 'україномовним учням чешської',
    vi: 'україномовним учням вьетнамської',
  },
  tr: {
    en: 'İngilizce öğrenen Türkçe konuşan öğrenciler',
    ru: 'Rusça öğrenen Türkçe konuşan öğrenciler',
    ar: 'Arapça öğrenen Türkçe konuşan öğrenciler',
    es: 'İspanyolca öğrenen Türkçe konuşan öğrenciler',
    pt: 'Portekizce öğrenen Türkçe konuşan öğrenciler',
    it: 'İtalyanca öğrenen Türkçe konuşan öğrenciler',
    el: 'Yunanca öğrenen Türkçe konuşan öğrenciler',
    fa: 'Farsça öğrenen Türkçe konuşan öğrenciler',
    da: 'Danca öğrenen Türkçe konuşan öğrenciler',
    nl: 'Felemenkçe öğrenen Türkçe konuşan öğrenciler',
    fr: 'Fransızca öğrenen Türkçe konuşan öğrenciler',
    de: 'Almanca öğrenen Türkçe konuşan öğrenciler',
  },
  ar: {
    en: 'متعلمي الإنجليزية الناطقين بالعربية',
    ru: 'متعلمي الروسية الناطقين بالعربية',
    ar: 'متعلمي العربية الناطقين بالعربية',
    es: 'متعلمي الإسبانية الناطقين بالعربية',
    pt: 'متعلمي البرتغالية الناطقين بالعربية',
    it: 'متعلمي الإيطالية الناطقين بالعربية',
    el: 'متعلمي اليونانية الناطقين بالعربية',
    fa: 'متعلمي الفارسية الناطقين بالعربية',
    da: 'متعلمي الدنماركية الناطقين بالعربية',
    nl: 'متعلمي الهولندية الناطقين بالعربية',
    fr: 'متعلمي الفرنسية الناطقين بالعربية',
    de: 'متعلمي الألمانية الناطقين بالعربية',
  },
  fa: {
    en: 'زبان‌آموزان انگلیسی فارسی‌زبان',
    ru: 'زبان‌آموزان روسی فارسی‌زبان',
    ar: 'زبان‌آموزان عربی فارسی‌زبان',
    es: 'زبان‌آموزان اسپانیایی فارسی‌زبان',
    pt: 'زبان‌آموزان پرتغالی فارسی‌زبان',
    it: 'زبان‌آموزان ایتالیایی فارسی‌زبان',
    el: 'زبان‌آموزان یونانی فارسی‌زبان',
    fa: 'زبان‌آموزان فارسی فارسی‌زبان',
    da: 'زبان‌آموزان دانمارکی فارسی‌زبان',
    nl: 'زبان‌آموزان هلندی فارسی‌زبان',
    fr: 'زبان‌آموزان فرانسوی فارسی‌زبان',
    de: 'زبان‌آموزان آلمانی فارسی‌زبان',
  },
  ko: {
    en: '한국어 사용자 영어 학습자',
    ru: '한국어 사용자 러시아어 학습자',
    ar: '한국어 사용자 아랍어 학습자',
    es: '한국어 사용자 스페인어 학습자',
    pt: '한국어 사용자 포르투갈어 학습자',
    it: '한국어 사용자 이탈리아어 학습자',
    el: '한국어 사용자 그리스어 학습자',
    fa: '한국어 사용자 페르시아어 학습자',
    da: '한국어 사용자 덴마크어 학습자',
    nl: '한국어 사용자 네덜란드어 학습자',
    fr: '한국어 사용자 프랑스어 학습자',
    de: '한국어 사용자 독일어 학습자',
  },
  ja: {
    en: '日本語話者の英語学習者',
    ru: '日本語話者のロシア語学習者',
    ar: '日本語話者のアラビア語学習者',
    es: '日本語話者のスペイン語学習者',
    pt: '日本語話者のポルトガル語学習者',
    it: '日本語話者のイタリア語学習者',
    el: '日本語話者のギリシャ語学習者',
    fa: '日本語話者のペルシア語学習者',
    da: '日本語話者のデンマーク語学習者',
    nl: '日本語話者のオランダ語学習者',
    fr: '日本語話者のフランス語学習者',
    de: '日本語話者のドイツ語学習者',
  },
};

function learnerAudience(contentLocale, targetLang) {
  const loc = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const row = AUDIENCE_OF[loc];
  if (row) {
    if (study === 'ru') return row.ru;
    if (study === 'ar') return row.ar ?? row.en;
    if (study === 'es') return row.es ?? row.en;
    if (study === 'pt') return row.pt ?? row.en;
    if (study === 'it') return row.it ?? row.en;
    if (study === 'el') return row.el ?? row.en;
    if (study === 'fa') return row.fa ?? row.en;
    if (study === 'da') return row.da ?? row.en;
    if (study === 'nl') return row.nl ?? row.en;
    if (study === 'fr') return row.fr ?? row.en;
    if (study === 'de') return row.de ?? row.en;
    if (study === 'tr') return row.tr ?? row.en;
    if (study === 'sv') return row.sv ?? row.en;
    if (study === 'no') return row.no ?? row.en;
    if (study === 'fi') return row.fi ?? row.en;
    if (study === 'ko') return row.ko ?? row.en;
    if (study === 'ja') return row.ja ?? row.en;
    if (study === 'zh') return row.zh ?? row.en;
    if (study === 'uk') return row.uk ?? row.en;
    if (study === 'pl') return row.pl ?? row.en;
    if (study === 'hi') return row.hi ?? row.en;
    if (study === 'ur') return row.ur ?? row.en;
    if (study === 'az') return row.az ?? row.en;
    if (study === 'ug') return row.ug ?? row.en;
    return row.en;
  }
  const base = getPromptLocaleVars(loc);
  if (study === 'ru') {
    return base.learnerAudience.replace(/английск/gi, 'русск').replace(/English/gi, 'Russian');
  }
  if (study === 'ar') {
    return base.learnerAudience.replace(/английск/gi, 'арабск').replace(/English/gi, 'Arabic');
  }
  if (study === 'es') {
    return base.learnerAudience.replace(/английск/gi, 'испанск').replace(/English/gi, 'Spanish');
  }
  if (study === 'pt') {
    return base.learnerAudience.replace(/английск/gi, 'португальск').replace(/English/gi, 'Portuguese');
  }
  if (study === 'it') {
    return base.learnerAudience.replace(/английск/gi, 'итальянск').replace(/English/gi, 'Italian');
  }
  if (study === 'el') {
    return base.learnerAudience.replace(/английск/gi, 'греческ').replace(/English/gi, 'Greek');
  }
  if (study === 'fa') {
    return base.learnerAudience.replace(/английск/gi, 'персидск').replace(/English/gi, 'Persian');
  }
  if (study === 'da') {
    return base.learnerAudience.replace(/английск/gi, 'датск').replace(/English/gi, 'Danish');
  }
  if (study === 'nl') {
    return base.learnerAudience.replace(/английск/gi, 'нидерландск').replace(/English/gi, 'Dutch');
  }
  if (study === 'fr') {
    return base.learnerAudience.replace(/английск/gi, 'французск').replace(/English/gi, 'French');
  }
  if (study === 'de') {
    return base.learnerAudience.replace(/английск/gi, 'немецк').replace(/English/gi, 'German');
  }
  if (study === 'uk') {
    return base.learnerAudience.replace(/английск/gi, 'украинск').replace(/English/gi, 'Ukrainian');
  }
  if (study === 'pl') {
    return base.learnerAudience.replace(/английск/gi, 'польск').replace(/English/gi, 'Polish');
  }
  if (study === 'hi') {
    return base.learnerAudience.replace(/английск/gi, 'хинди').replace(/English/gi, 'Hindi');
  }
  if (study === 'ur') {
    return base.learnerAudience.replace(/английск/gi, 'урду').replace(/English/gi, 'Urdu');
  }
  if (study === 'az') {
    return base.learnerAudience.replace(/английск/gi, 'азербайджанск').replace(/English/gi, 'Azerbaijani');
  }
  if (study === 'ug') {
    return base.learnerAudience.replace(/английск/gi, 'уйгурск').replace(/English/gi, 'Uyghur');
  }
  return base.learnerAudience;
}

/** Доп. переменные для шаблонов словаря (study + content locale). */
export function getStudyPromptVars(contentLocale, targetLang) {
  const loc = normalizeContentLocale(contentLocale);
  const base = getPromptLocaleVars(loc);
  const study = getStudyLangMeta(targetLang);
  const studyCode = study.code;
  let lawfulSpeechBlock = base.lawfulSpeechBlock;
  if (studyCode !== 'en') {
    lawfulSpeechBlock = lawfulSpeechBlock.replace(
      /safe English practice/gi,
      `safe ${study.nameEn} practice`,
    );
  }
  return {
    ...base,
    lawfulSpeechBlock,
    LEARNER_AUDIENCE: learnerAudience(loc, studyCode),
    STUDY_LANGUAGE: study.nameEn,
    STUDY_LANGUAGE_RU: study.nameRu,
    STUDY_SCRIPT_NOTE: study.studyScriptNoteEn,
    STUDY_SCRIPT_NOTE_RU: study.studyScriptNoteRu,
    STUDY_LANGUAGE_EN: study.nameEn,
    TARGET_LANG: studyCode,
    TRANSLATION_SCRIPT_NOTE:
      studyCode === 'ru'
        ? `${base.translationLanguage} for the gloss/translation of that same Russian sentence`
        : studyCode === 'ar'
          ? `${base.translationLanguage} for the gloss/translation of that same Arabic sentence`
          : studyCode === 'es'
            ? `${base.translationLanguage} for the gloss/translation of that same Spanish sentence`
            : studyCode === 'pt'
              ? `${base.translationLanguage} for the gloss/translation of that same Portuguese sentence`
              : studyCode === 'it'
                ? `${base.translationLanguage} for the gloss/translation of that same Italian sentence`
                : studyCode === 'el'
                  ? `${base.translationLanguage} for the gloss/translation of that same Greek sentence`
                  : studyCode === 'fa'
                    ? `${base.translationLanguage} for the gloss/translation of that same Persian sentence`
                    : studyCode === 'da'
                      ? `${base.translationLanguage} for the gloss/translation of that same Danish sentence`
                      : studyCode === 'nl'
                        ? `${base.translationLanguage} for the gloss/translation of that same Dutch sentence`
                        : studyCode === 'fr'
                          ? `${base.translationLanguage} for the gloss/translation of that same French sentence`
                          : studyCode === 'de'
                            ? `${base.translationLanguage} for the gloss/translation of that same German sentence`
                            
                          : studyCode === 'tr'
                            ? `${base.translationLanguage} for the gloss/translation of that same Turkish sentence`
                            : studyCode === 'sv'
                              ? `${base.translationLanguage} for the gloss/translation of that same Swedish sentence`
                              : studyCode === 'no'
                                ? `${base.translationLanguage} for the gloss/translation of that same Norwegian sentence`
                                : studyCode === 'fi'
                                  ? `${base.translationLanguage} for the gloss/translation of that same Finnish sentence`
                                  : studyCode === 'ko'
                                    ? `${base.translationLanguage} for the gloss/translation of that same Korean sentence`
                                    : studyCode === 'ja'
                                      ? `${base.translationLanguage} for the gloss/translation of that same Japanese sentence`
                                      : studyCode === 'zh'
                                        ? `${base.translationLanguage} for the gloss/translation of that same Chinese sentence`
                                        : studyCode === 'uk'
                                          ? `${base.translationLanguage} for the gloss/translation of that same Ukrainian sentence`
                                          : studyCode === 'pl'
                                            ? `${base.translationLanguage} for the gloss/translation of that same Polish sentence`
                                            : studyCode === 'hi'
                                              ? `${base.translationLanguage} for the gloss/translation of that same Hindi sentence`
                                              : studyCode === 'ur'
                                                ? `${base.translationLanguage} for the gloss/translation of that same Urdu sentence`
                                                : studyCode === 'az'
                                                  ? `${base.translationLanguage} for the gloss/translation of that same Azerbaijani sentence`
                                                  : studyCode === 'vi'
                                ? `${base.translationLanguage} for the gloss/translation of that same Vietnamese sentence`
                              : studyCode === 'cs'
                                ? `${base.translationLanguage} for the gloss/translation of that same Czech sentence`
                              : studyCode === 'hu'
                                ? `${base.translationLanguage} for the gloss/translation of that same Hungarian sentence`
                              : studyCode === 'ro'
                                ? `${base.translationLanguage} for the gloss/translation of that same Romanian sentence`
                              : studyCode === 'id'
                                ? `${base.translationLanguage} for the gloss/translation of that same Indonesian sentence`
                              : studyCode === 'he'
                                ? `${base.translationLanguage} for the gloss/translation of that same Hebrew sentence`
                              : studyCode === 'ca'
                                ? `${base.translationLanguage} for the gloss/translation of that same Catalan sentence`
                              : studyCode === 'sr'
                                ? `${base.translationLanguage} for the gloss/translation of that same Serbian sentence`
                              : studyCode === 'ug'
                                                    ? `${base.translationLanguage} for the gloss/translation of that same Uyghur sentence`
                                        : base.translationScriptNote,
  };
}

export function headwordQuickResolveSystemPrompt(isPhrase, targetLang) {
  const study = getStudyLangMeta(targetLang);
  if (study.code === 'ru') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Russian translation of the ENTIRE learner ' +
        'phrase/sentence in Cyrillic. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Russian dictionary lemma (Cyrillic) for the single-word ' +
      'learner input. If input is Ukrainian/Belarusian/etc., translate to the equivalent Russian lemma. No markdown.'
    );
  }
  if (study.code === 'ar') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Arabic translation of the ENTIRE learner ' +
        'phrase/sentence in Arabic script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Arabic dictionary lemma (Arabic script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'es') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Spanish translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Spanish dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'pt') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Portuguese translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Portuguese dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'it') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Italian translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Italian dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'el') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Greek translation of the ENTIRE learner ' +
        'phrase/sentence in Greek script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Greek dictionary lemma (Greek script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'fa') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Persian translation of the ENTIRE learner ' +
        'phrase/sentence in Persian script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Persian dictionary lemma (Persian script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'da') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Danish translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Danish dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'nl') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Dutch translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Dutch dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'fr') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural French translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural French dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'de') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural German translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural German dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'uk') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Ukrainian translation of the ENTIRE learner ' +
        'phrase/sentence in Cyrillic. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Ukrainian dictionary lemma (Cyrillic) for the single-word ' +
      'learner input. If input is Russian/Belarusian/etc., translate to the equivalent Ukrainian lemma. No markdown.'
    );
  }
  if (study.code === 'pl') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Polish translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Polish dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'hi') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Hindi translation of the ENTIRE learner ' +
        'phrase/sentence in Devanagari script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Hindi dictionary lemma (Devanagari script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'ur') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Urdu translation of the ENTIRE learner ' +
        'phrase/sentence in Arabic script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Urdu dictionary lemma (Arabic script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'az') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Azerbaijani translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Azerbaijani dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'vi') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Vietnamese translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Vietnamese dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'cs') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Czech translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Czech dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'hu') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Hungarian translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Hungarian dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'ro') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Romanian translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Romanian dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'id') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Indonesian translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Indonesian dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'he') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Hebrew translation of the ENTIRE learner ' +
        'phrase/sentence in Hebrew script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Hebrew dictionary lemma (Hebrew script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'ca') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Catalan translation of the ENTIRE learner ' +
        'phrase/sentence in Latin script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Catalan dictionary lemma (Latin script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'sr') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Serbian translation of the ENTIRE learner ' +
        'phrase/sentence in Cyrillic script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Serbian dictionary lemma (Cyrillic script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (study.code === 'vi') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Vietnamese sentence in Latin script.';
  }
  if (study.code === 'cs') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Czech sentence in Latin script.';
  }
  if (study.code === 'hu') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Hungarian sentence in Latin script.';
  }
  if (study.code === 'ro') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Romanian sentence in Latin script.';
  }
  if (study.code === 'id') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Indonesian sentence in Latin script.';
  }
  if (study.code === 'he') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Hebrew sentence in Hebrew script.';
  }
  if (study.code === 'ca') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Catalan sentence in Latin script.';
  }
  if (study.code === 'sr') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Serbian sentence in Cyrillic script.';
  }
  if (study.code === 'vi') {
    return `\n\nREMINDER: every "text" MUST be a Vietnamese sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Vietnamese lemma/phrase in Latin script.`;
  }
  if (study.code === 'cs') {
    return `\n\nREMINDER: every "text" MUST be a Czech sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Czech lemma/phrase in Latin script.`;
  }
  if (study.code === 'hu') {
    return `\n\nREMINDER: every "text" MUST be a Hungarian sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Hungarian lemma/phrase in Latin script.`;
  }
  if (study.code === 'ro') {
    return `\n\nREMINDER: every "text" MUST be a Romanian sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Romanian lemma/phrase in Latin script.`;
  }
  if (study.code === 'id') {
    return `\n\nREMINDER: every "text" MUST be a Indonesian sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Indonesian lemma/phrase in Latin script.`;
  }
  if (study.code === 'he') {
    return `\n\nREMINDER: every "text" MUST be a Hebrew sentence (Hebrew script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Hebrew lemma/phrase in Hebrew script.`;
  }
  if (study.code === 'ca') {
    return `\n\nREMINDER: every "text" MUST be a Catalan sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Catalan lemma/phrase in Latin script.`;
  }
  if (study.code === 'sr') {
    return `\n\nREMINDER: every "text" MUST be a Serbian sentence (Cyrillic script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Serbian lemma/phrase in Cyrillic script.`;
  }
  if (study.code === 'ug') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural Uyghur translation of the ENTIRE learner ' +
        'phrase/sentence in Uyghur Arabic script. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural Uyghur dictionary lemma (Uyghur Arabic script) for the single-word ' +
      'learner input. No markdown.'
    );
  }
  if (isPhrase) {
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural English translation of the ENTIRE learner ' +
      'phrase/sentence. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
    );
  }
  return (
    'Output only valid JSON: {"headwordEn":"..."} — natural English dictionary lemma for the single-word ' +
    'learner input. No markdown.'
  );
}

export function cyrillicStemForHeadwordMatch(headword) {
  let w = String(headword ?? '').trim().toLowerCase();
  if (!w) return '';
  const suffixes = [
    'ующий',
    'ивший',
    'ывающий',
    'ующая',
    'ившая',
    'ый',
    'ий',
    'ой',
    'ая',
    'ое',
    'ые',
    'ого',
    'ому',
    'ым',
    'ом',
    'ей',
    'ую',
    'ою',
    'ыми',
    'ать',
    'ять',
    'ить',
    'еть',
    'уть',
    'ыть',
    'ти',
    'ов',
    'ев',
    'ам',
    'ами',
    'ах',
    'ем',
    'у',
    'ю',
    'а',
    'я',
    'ы',
    'и',
    'е',
    'о',
  ];
  for (const suf of suffixes) {
    if (w.length > suf.length + 3 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w.length >= 3 ? w : String(headword ?? '').trim().toLowerCase();
}

export function studyExampleUsesHeadword(headword, text, targetLang) {
  const hw = String(headword ?? '').trim();
  const body = String(text ?? '').trim();
  if (!hw || !body) return false;
  const study = normalizeStudyLang(targetLang);
  if (study === 'ru' || study === 'uk') {
    const parts = hw.split(/\s+/).filter(Boolean);
    return parts.every((part) => {
      const stem = cyrillicStemForHeadwordMatch(part);
      if (stem.length < 3) return body.toLowerCase().includes(part.toLowerCase());
      return new RegExp(`${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[а-яёіїєґ]*`, 'iu').test(body);
    });
  }
  if (study === 'ar' || study === 'fa' || study === 'ur' || study === 'ug') {
    const stripMarks = (s) => String(s).replace(/[\u064B-\u065F\u0670]/g, '');
    const bodyNorm = stripMarks(body);
    const parts = hw.split(/\s+/).filter(Boolean);
    return parts.every((part) => bodyNorm.includes(stripMarks(part)));
  }
  if (study === 'hi') {
    const parts = hw.split(/\s+/).filter(Boolean);
    return parts.every((part) => body.includes(part));
  }
  if (study === 'el') {
    const stripGreekMarks = (s) =>
      String(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g, '')
        .normalize('NFC');
    const bodyNorm = stripGreekMarks(body);
    const parts = hw.split(/\s+/).filter(Boolean);
    return parts.every((part) => bodyNorm.includes(stripGreekMarks(part)));
  }
  const parts = hw.split(/\s+/).filter(Boolean);
  return parts.every((part) => {
    const rePart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${rePart}\\w*\\b`, 'i').test(body);
  });
}

export function customExampleSystemPrompt(targetLang) {
  const study = getStudyLangMeta(targetLang);
  if (study.code === 'ru') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Russian sentence in Cyrillic.';
  }
  if (study.code === 'ar') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Arabic sentence in Arabic script.';
  }
  if (study.code === 'es') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Spanish sentence in Latin script.';
  }
  if (study.code === 'pt') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Portuguese sentence in Latin script.';
  }
  if (study.code === 'it') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Italian sentence in Latin script.';
  }
  if (study.code === 'el') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Greek sentence in Greek script.';
  }
  if (study.code === 'fa') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Persian sentence in Persian script.';
  }
  if (study.code === 'da') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Danish sentence in Latin script.';
  }
  if (study.code === 'nl') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Dutch sentence in Latin script.';
  }
  if (study.code === 'fr') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural French sentence in Latin script.';
  }
  if (study.code === 'de') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural German sentence in Latin script.';
  }

  if (study.code === 'tr') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Turkish sentence in Latin script.';
  }
  if (study.code === 'sv') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Swedish sentence in Latin script.';
  }
  if (study.code === 'no') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Norwegian sentence in Latin script.';
  }
  if (study.code === 'fi') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Finnish sentence in Latin script.';
  }
  if (study.code === 'ko') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Korean sentence in Hangul.';
  }
  if (study.code === 'ja') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Japanese sentence in Japanese script.';
  }
  if (study.code === 'zh') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Chinese sentence in Chinese characters.';
  }
  if (study.code === 'uk') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Ukrainian sentence in Cyrillic.';
  }
  if (study.code === 'pl') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Polish sentence in Latin script.';
  }
  if (study.code === 'hi') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Hindi sentence in Devanagari script.';
  }
  if (study.code === 'ur') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Urdu sentence in Arabic script.';
  }
  if (study.code === 'az') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Azerbaijani sentence in Latin script.';
  }
  if (study.code === 'ug') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural Uyghur sentence in Uyghur Arabic script.';
  }
  return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural English sentence.';
}

export function studyDictionaryRetryNote(contentLocale, targetLang) {
  const study = getStudyLangMeta(targetLang);
  const loc = normalizeContentLocale(contentLocale);
  const trans = getPromptLocaleVars(loc)?.translationLanguage ?? loc;
  if (study.code === 'ru') {
    return `\n\nREMINDER: every "text" MUST be a Russian sentence (Cyrillic). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Russian lemma/phrase in Cyrillic.`;
  }
  if (study.code === 'ar') {
    return `\n\nREMINDER: every "text" MUST be an Arabic sentence (Arabic script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Arabic lemma/phrase in Arabic script.`;
  }
  if (study.code === 'es') {
    return `\n\nREMINDER: every "text" MUST be a Spanish sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Spanish lemma/phrase in Latin script.`;
  }
  if (study.code === 'pt') {
    return `\n\nREMINDER: every "text" MUST be a Portuguese sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Portuguese lemma/phrase in Latin script.`;
  }
  if (study.code === 'it') {
    return `\n\nREMINDER: every "text" MUST be an Italian sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Italian lemma/phrase in Latin script.`;
  }
  if (study.code === 'el') {
    return `\n\nREMINDER: every "text" MUST be a Greek sentence (Greek script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Greek lemma/phrase in Greek script.`;
  }
  if (study.code === 'fa') {
    return `\n\nREMINDER: every "text" MUST be a Persian sentence (Persian script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Persian lemma/phrase in Persian script.`;
  }
  if (study.code === 'da') {
    return `\n\nREMINDER: every "text" MUST be a Danish sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Danish lemma/phrase in Latin script.`;
  }
  if (study.code === 'nl') {
    return `\n\nREMINDER: every "text" MUST be a Dutch sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Dutch lemma/phrase in Latin script.`;
  }
  if (study.code === 'fr') {
    return `\n\nREMINDER: every "text" MUST be a French sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the French lemma/phrase in Latin script.`;
  }
  if (study.code === 'de') {
    return `\n\nREMINDER: every "text" MUST be a German sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the German lemma/phrase in Latin script.`;
  }
  if (study.code === 'uk') {
    return `\n\nREMINDER: every "text" MUST be a Ukrainian sentence (Cyrillic). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Ukrainian lemma/phrase in Cyrillic.`;
  }
  if (study.code === 'pl') {
    return `\n\nREMINDER: every "text" MUST be a Polish sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Polish lemma/phrase in Latin script.`;
  }
  if (study.code === 'hi') {
    return `\n\nREMINDER: every "text" MUST be a Hindi sentence (Devanagari script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Hindi lemma/phrase in Devanagari script.`;
  }
  if (study.code === 'ur') {
    return `\n\nREMINDER: every "text" MUST be an Urdu sentence (Arabic script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Urdu lemma/phrase in Arabic script.`;
  }
  if (study.code === 'az') {
    return `\n\nREMINDER: every "text" MUST be an Azerbaijani sentence (Latin script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Azerbaijani lemma/phrase in Latin script.`;
  }
  if (study.code === 'ug') {
    return `\n\nREMINDER: every "text" MUST be an Uyghur sentence (Uyghur Arabic script). "translation" and gloss meaning MUST be in ${trans}. headwordEn must be the Uyghur lemma/phrase in Uyghur Arabic script.`;
  }
  return '';
}

export function ttsLocaleForStudyLang(targetLang) {
  return getStudyLangMeta(targetLang).ttsLocale ?? 'en-US';
}

function practiceReplyTtsHint(study) {
  if (study.code === 'ru') {
    return ' replyTts: same words as reply but with Unicode combining acute (U+0301) after each stressed vowel for TTS; reply itself has NO stress marks.';
  }
  return (
    ` replyTts: ONLY ${study.nameEn} example sentences from reply (no learner L1 text), for speech synthesis. ` +
    `Required when reply mixes learner L1 and ${study.nameEn}.`
  );
}

export function practiceFreeSystemPrompt(targetLang) {
  const study = getStudyLangMeta(targetLang);
  return (
    'You output only valid JSON when asked. No markdown fences. Keys: echo, corrections, reply, replyTts.' +
    practiceReplyTtsHint(study) +
    ` The "reply" must read like a sharp, natural native ${study.nameEn} speaker in chat — specific, coherent with prior turns, not generic and not therapeutic. ` +
    'Never re-ask a premise the user already rejected or doubted.'
  );
}

export function practiceExpertSystemPrompt(targetLang) {
  const study = getStudyLangMeta(targetLang);
  return (
    'You output only valid JSON when asked. No markdown fences. Keys: echo, corrections, reply, replyTts.' +
    practiceReplyTtsHint(study) +
    ` "reply" is always ${study.nameEn} at native conversational level (not slang).` +
    ' "corrections" gloss is in the learner L1 when provided. ' +
    'On session start (user message __start__), echo and corrections must be null; reply is the expert opening with a topic offer. ' +
    'Echo must restate the user line with typo fixes only — never invent a different question. Reply must address the Last user message, not a paraphrased echo. ' +
    'After the user accepts or engages with a topic, develop that thread — do not offer to switch topics every turn. ' +
    'Short user replies comment on your previous message; keep the same subject (names, examples) in view. ' +
    'You are an AI language-practice persona, not a licensed professional.'
  );
}

export function practiceWordSystemPrompt(targetLang) {
  const study = getStudyLangMeta(targetLang);
  return (
    'You output only valid JSON when asked. No markdown fences. Keys: echo, corrections, reply, replyTts.' +
    practiceReplyTtsHint(study) +
    'Phrase practice: explain usage, ask the learner to say a sentence. ' +
    `Corrections: use when ${study.nameEn} is understandable but unnatural; suggest a natural line. null only if already native-sounding. ` +
    'Echo: light fixes only; keep the target phrase. Never swap the practiced phrase for a synonym in corrections. ' +
    'On session start (__start__), echo and corrections must be null.'
  );
}

export function practicePatternSystemPrompt(targetLang) {
  const study = getStudyLangMeta(targetLang);
  return (
    'You output only valid JSON when asked. No markdown fences. Keys: echo, corrections, reply, replyTts.' +
    practiceReplyTtsHint(study) +
    'Sentence-pattern drill in ' +
    study.nameEn +
    ': one fixed anchor skeleton; turn 1 teaches it; later turns grade learner lines ONLY against that anchor skeleton. ' +
    'Later turns: if learner skeleton differs from anchor, corrections is REQUIRED (never null); do not re-teach their sentence as a new pattern. ' +
    'Corrections in learner L1 when the user misses the anchor pattern; null only when skeleton matches anchor. ' +
    'Reply body: explanation/reaction ONLY in learner L1; parallel examples and write-sentence ask ONLY in ' +
    study.nameEn +
    '. Never explain the pattern in ' +
    study.nameEn +
    ' when learner L1 differs. ' +
    'Echo: light ' +
    study.nameEn +
    ' fixes only. On the first turn (anchor submission), echo and corrections must be null.'
  );
}

export { L1_OF_EN as studyL1Names };
