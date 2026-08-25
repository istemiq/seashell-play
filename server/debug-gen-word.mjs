import './load-env.js';
import { generateWordExamples } from './llmClient.js';
import { isPayloadValidForContentLocale, isPayloadValidForTargetLang } from './localeValidation.js';

const word = process.argv[2] || 'Saudade';
const contentLocale = process.argv[3] || 'pt';
const targetLang = process.argv[4] || 'ru';

console.log('gen', { word, contentLocale, targetLang });

// Patch: monkey-patch won't work easily. Call generate and on fail use internal - instead duplicate one attempt via importing and hacking

// Simpler: import llm internals by copying one generation path
import { normalizeContentLocale } from './promptLocales.js';
import { normalizeStudyLang } from './dictionaryStudyLang.js';

try {
  const r = await generateWordExamples(word, { contentLocale, targetLang });
  console.log('OK headword:', r.headwordEn);
  console.log('gloss:', r.glossRu);
  console.log('contentOk', isPayloadValidForContentLocale(contentLocale, r, targetLang));
  console.log('targetOk', isPayloadValidForTargetLang(targetLang, r));
  console.log('ex0 tr:', r.examples[0]?.translation);
} catch (e) {
  console.error('FAIL', e.message);
  process.exit(1);
}
