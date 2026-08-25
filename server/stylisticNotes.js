import { normalizeContentLocale } from './promptLocales.js';
import { splitTranslationTail } from './exampleFields.js';
import { buildLocalizationRules } from './registerTags.js';

/** Заменяет сокращения стиля на язык карточки; BrE/AmE сохраняет. */
export function localizeStylisticNote(note, contentLocale) {
  const raw = String(note ?? '').trim();
  if (!raw) return '';
  const loc = normalizeContentLocale(contentLocale);
  if (loc === 'ru' || loc === 'uk') return raw.replace(/\s*;\s*/g, '; ').trim();

  let out = raw;
  const rules = buildLocalizationRules(loc);
  for (const [re, replacement] of rules) {
    out = out.replace(re, replacement);
  }
  return out.replace(/\s*;\s*/g, '; ').trim();
}

/** Отделяет хвост стиля и локализует его для языка карточки. */
export function formatExampleTranslationForLocale(translation, contentLocale) {
  const raw = String(translation ?? '').trim();
  if (!raw) return '';
  const { translation: base, noteRu } = splitTranslationTail(raw);
  const note = localizeStylisticNote(noteRu, contentLocale);
  if (!note) return base.trim();
  return `${base.trim()} — ${note}`;
}
