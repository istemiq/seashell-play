export const DEFAULT_LEARN_LOCALE = 'en';

/** @typedef {{ code: string, nativeName: string, rtl?: boolean }} LearnLocaleMeta */

/** @type {LearnLocaleMeta[]} */
export const LEARN_LOCALES = [
  { code: 'en', nativeName: 'English' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'ar', nativeName: 'العربية', rtl: true },
  { code: 'zh', nativeName: '中文' },
  { code: 'es', nativeName: 'Español' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'tr', nativeName: 'Türkçe' },
  { code: 'sv', nativeName: 'Svenska' },
  { code: 'no', nativeName: 'Norsk' },
  { code: 'fi', nativeName: 'Suomi' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'pl', nativeName: 'Polski' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'el', nativeName: 'Ελληνικά' },
  { code: 'fa', nativeName: 'فارسی', rtl: true },
  { code: 'da', nativeName: 'Dansk' },
  { code: 'nl', nativeName: 'Nederlands' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'ur', nativeName: 'اردو', rtl: true },
  { code: 'az', nativeName: 'Azərbaycan' },
  { code: 'ug', nativeName: 'ئۇيغۇرچە', rtl: true },
  { code: 'vi', nativeName: 'Tiếng Việt' },
  { code: 'cs', nativeName: 'Čeština' },
  { code: 'hu', nativeName: 'Magyar' },
  { code: 'ro', nativeName: 'Română' },
  { code: 'id', nativeName: 'Bahasa Indonesia' },
  { code: 'he', nativeName: 'עברית', rtl: true },
  { code: 'ca', nativeName: 'Català' },
  { code: 'sr', nativeName: 'Српски' },
];

export const LEARN_LOCALE_CODES = new Set(LEARN_LOCALES.map((l) => l.code));

export function normalizeLearnLocale(code) {
  const c = String(code ?? '').trim();
  return LEARN_LOCALE_CODES.has(c) ? c : DEFAULT_LEARN_LOCALE;
}

export function learnLocaleMeta(code) {
  return LEARN_LOCALES.find((l) => l.code === normalizeLearnLocale(code)) ?? null;
}
