import { generateWordExamples } from '../server/llmClient.js';
import {
  isPayloadValidForContentLocale,
  isPayloadValidForTargetLang,
} from '../server/localeValidation.js';

const word = process.argv[2] || 'Saudade';
const contentLocale = process.argv[3] || 'pt';
const targetLang = process.argv[4] || 'ru';

console.log('gen', { word, contentLocale, targetLang });

try {
  const r = await generateWordExamples(word, { contentLocale, targetLang });
  console.log('OK headword:', r.headwordEn);
  console.log('gloss:', r.glossRu?.slice(0, 120));
  console.log('ex0:', r.examples[0]);
} catch (e) {
  console.error('FAIL', e.message);
  process.exit(1);
}
