export const DEFAULT_UI_LOCALE = 'en';

/** @typedef {{ code: string, nativeName: string, rtl?: boolean }} UiLocaleMeta */

/** @type {UiLocaleMeta[]} */
export const UI_LOCALES = [
  { code: 'en', nativeName: 'English' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'ar', nativeName: 'العربية', rtl: true },
  { code: 'es', nativeName: 'Español' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'fa', nativeName: 'فارسی', rtl: true },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'tr', nativeName: 'Türkçe' },
];

export const UI_LOCALE_CODES = new Set(UI_LOCALES.map((l) => l.code));

export function isRtlLocale(code) {
  return UI_LOCALES.some((l) => l.code === code && l.rtl);
}

/** Локали, где UI на sans-serif (моноширинный fallback для кириллицы/CJK визуально крупнее). */
export function usesSansUiFont(code) {
  const c = normalizeUiLocale(code);
  return isRtlLocale(c) || c === 'ru' || c === 'uk' || c === 'ja' || c === 'ko';
}

export function normalizeUiLocale(code) {
  const c = String(code ?? '').trim();
  return UI_LOCALE_CODES.has(c) ? c : DEFAULT_UI_LOCALE;
}
