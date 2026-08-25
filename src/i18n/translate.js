import { DEFAULT_UI_LOCALE, normalizeUiLocale } from './config.js';
import { messages } from './messages/index.js';

/**
 * @param {string} locale
 * @param {string} key
 * @param {Record<string, string | number> | undefined} params
 */
export function translate(locale, key, params) {
  const loc = normalizeUiLocale(locale);
  const catalog = messages[loc] || messages[DEFAULT_UI_LOCALE];
  const fallback = messages[DEFAULT_UI_LOCALE];
  let text = catalog[key] ?? fallback[key] ?? key;
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
  }
  return text;
}

/** Button labels: append English translation in parentheses for super-account QA. */
export function translateButton(locale, key, params, { superAccount = false } = {}) {
  const text = translate(locale, key, params);
  const loc = normalizeUiLocale(locale);
  if (!superAccount || loc === 'en') return text;
  const en = translate('en', key, params);
  if (!en || en === text) return text;
  return `${text} (${en})`;
}
