import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDictionaryPayloadFromIrregularVerb } from '../irregularVerbDictionaryImport.js';

test('buildDictionaryPayloadFromIrregularVerb maps cached examples without LLM shape', () => {
  const verb = {
    infinitive: 'go',
    past_simple: 'went',
    past_participle: 'gone',
    translation: 'идти, ехать',
    transcription: 'ɡəʊ',
  };
  const mixed = {
    examples: [
      { form: 'present', en: 'I go to work.', translation: 'Я хожу на работу. — нейтр.' },
      { form: 'past_simple', en: 'We went home.', translation: 'Мы пошли домой. — нейтр.' },
      { form: 'past_participle', en: 'She has gone.', translation: 'Она уехала. — нейтр.' },
      { form: 'present', en: 'Time goes quickly.', translation: 'Время летит быстро. — нейтр.' },
    ],
  };

  const payload = buildDictionaryPayloadFromIrregularVerb(verb, mixed, 'ru');

  assert.match(payload.glossRu, /go.*идти/);
  assert.equal(payload.verbUsage.length, 3);
  assert.equal(payload.examples.length, 4);
  assert.equal(payload.examples[0].text, 'I go to work.');
  assert.equal(payload.verbUsage[0].text, 'I go to work.');
  assert.match(payload.verbUsage[1].label, /went/);
});
