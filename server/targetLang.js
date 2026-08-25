/** Язык, который пользователь учит (en, ru, …). Отделяет словари в БД. */
export const DEFAULT_TARGET_LANG = 'en';

export const TARGET_LANG_CODES = new Set([
  'en',
  'ru',
  'ar',
  'zh',
  'es',
  'de',
  'fr',
  'it',
  'ko',
  'uk',
  'tr',
  'sv',
  'no',
  'fi',
  'ja',
  'pl',
  'pt',
  'el',
  'fa',
  'da',
  'nl',
  'hi',
  'ur',
  'az',
  'ug',
  'vi',
  'cs',
  'hu',
  'ro',
  'id',
  'he',
  'ca',
  'sr',
]);

export function normalizeTargetLang(code) {
  const c = String(code ?? '').trim();
  return TARGET_LANG_CODES.has(c) ? c : DEFAULT_TARGET_LANG;
}

export function resolveTargetLang(req) {
  const fromHeader = req.headers['x-target-lang'] || req.headers['x-learn-locale'];
  const fromBody = req.body?.targetLang ?? req.body?.learnLocale;
  return normalizeTargetLang(fromHeader || fromBody);
}

export function isEnglishTargetLang(targetLang) {
  return normalizeTargetLang(targetLang) === DEFAULT_TARGET_LANG;
}
