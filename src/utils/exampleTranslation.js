import { buildLocalizationRules } from '../../server/registerTags.js';

/** Парсит хвост « — нейтр.; BrE/AmE» или « (разг.)». */
function splitTranslationTail(translation) {
  const raw = String(translation ?? '').trim();
  if (!raw) return { text: '', note: '' };

  const paren = raw.match(/^(.+?)\s*[\(\（]([^)\）]+)[\)\）]\s*$/);
  if (paren?.[1]?.trim()) {
    return { text: paren[1].trim(), note: paren[2].trim() };
  }

  const dash = raw.match(/^(.+?)\s+[—–]\s+(.+)$/);
  if (dash?.[1]?.trim()) {
    return { text: dash[1].trim(), note: dash[2].trim() };
  }

  return { text: raw, note: '' };
}

function localizeStylisticNote(note, cardLocale) {
  const raw = String(note ?? '').trim();
  if (!raw) return '';
  const loc = String(cardLocale ?? 'ru').trim().toLowerCase() || 'ru';
  if (loc === 'ru' || loc === 'uk') return raw.replace(/\s*;\s*/g, '; ').trim();

  let out = raw;
  const rules = buildLocalizationRules(loc);
  for (const [re, replacement] of rules) {
    out = out.replace(re, replacement);
  }
  return out.replace(/\s*;\s*/g, '; ').trim();
}

/** Текст примера для карточки: перевод + локализованная стилистическая пометка. */
export function formatExampleTranslationForLocale(translation, cardLocale) {
  const { text, note } = splitTranslationTail(translation);
  const localized = localizeStylisticNote(note, cardLocale);
  if (!localized) return text;
  return `${text} — ${localized}`;
}
