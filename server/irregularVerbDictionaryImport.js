import { WORD_EXAMPLE_COUNT } from './dictionaryConstants.js';
import { normalizeVerbUsage, splitTranslationTail } from './exampleFields.js';
import { getPromptLocaleVars, normalizeContentLocale } from './promptLocales.js';

const FORM_SPECS = [
  { form: 'present', field: 'infinitive', labelKey: 'verbLabelPresent' },
  { form: 'past_simple', field: 'past_simple', labelKey: 'verbLabelPast' },
  { form: 'past_participle', field: 'past_participle', labelKey: 'verbLabelParticiple' },
];

function labelForForm(locale, labelKey, formWord) {
  const vars = getPromptLocaleVars(locale);
  const template = vars[labelKey] ?? '';
  return String(template).replace(/\(go\)/i, `(${formWord})`);
}

function exampleToDictItem(ex) {
  const text = String(ex?.en ?? '').trim();
  const rawTr = String(ex?.translation ?? '').trim();
  if (!text || !rawTr) return null;
  const sp = splitTranslationTail(rawTr);
  const item = { text, translation: sp.translation || rawTr };
  if (sp.noteRu) item.noteRu = sp.noteRu;
  return item;
}

/** Build dictionary insert payload from irregular-verb manifest row + cached examples. */
export function buildDictionaryPayloadFromIrregularVerb(verb, mixedExamples, contentLocale) {
  const locale = normalizeContentLocale(contentLocale);
  const examples = Array.isArray(mixedExamples?.examples) ? mixedExamples.examples : [];

  const verbUsageRaw = [];
  for (const spec of FORM_SPECS) {
    const formWord = String(verb?.[spec.field] ?? '').trim();
    const match = examples.find((e) => e.form === spec.form);
    if (!formWord || !match?.en || !match?.translation) continue;
    const sp = splitTranslationTail(String(match.translation).trim());
    verbUsageRaw.push({
      label: labelForForm(locale, spec.labelKey, formWord),
      text: String(match.en).trim(),
      translation: sp.translation || String(match.translation).trim(),
      ...(sp.noteRu ? { noteRu: sp.noteRu } : {}),
    });
  }

  const seen = new Set();
  const dictExamples = [];
  for (const ex of examples) {
    const item = exampleToDictItem(ex);
    if (!item) continue;
    const key = item.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dictExamples.push(item);
    if (dictExamples.length >= WORD_EXAMPLE_COUNT) break;
  }

  const glossParts = [String(verb.infinitive ?? '').trim()];
  if (verb.transcription) glossParts.push(`[${String(verb.transcription).trim()}]`);
  glossParts.push('—', String(verb.translation ?? '').trim());

  return {
    glossRu: glossParts.filter(Boolean).join(' '),
    verbUsage: normalizeVerbUsage(verbUsageRaw),
    examples: dictExamples,
  };
}
