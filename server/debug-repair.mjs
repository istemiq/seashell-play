import './load-env.js';
import { repairRuTargetTranslations } from './dictionaryTranslationRepair.js';

const payload = {
  headwordEn: 'тоска',
  glossRu: 'тоска [tɐsˈka] — sentimento português de saudade; neutro',
  examples: [
    {
      text: 'Он чувствовал тоску по родине.',
      translation: 'Он чувствовал тоску по родине. — neutro',
    },
  ],
};

const out = await repairRuTargetTranslations(payload, 'pt', 'ru');
console.log('repaired tr:', out.examples[0].translation);
