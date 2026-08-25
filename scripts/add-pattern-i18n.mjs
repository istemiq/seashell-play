import fs from 'fs';
import path from 'path';

const dir = 'src/i18n/messages';
const enKeys = {
  'practice.hubPattern': 'Sentence patterns',
  'practice.patternTitle': 'Sentence patterns',
  'practice.patternHint':
    'Paste an English sentence. The AI explains its structure in your language, shows parallel examples with the same grammar, and asks you to write your own.',
  'practice.patternSeedLabel': 'Anchor sentence',
  'practice.patternSeedPlaceholder': "e.g. I've been doing it all night",
  'practice.patternAnalyze': 'Analyze pattern',
  'practice.patternAnchor': 'Pattern: {sentence}',
};
const ruKeys = {
  'practice.hubPattern': 'Структура предложений',
  'practice.patternTitle': 'Структура предложений',
  'practice.patternHint':
    'Вставьте английское предложение. ИИ кратко объяснит его структуру на вашем языке, покажет параллельные примеры с той же грамматикой и попросит написать своё.',
  'practice.patternSeedLabel': 'Опорное предложение',
  'practice.patternSeedPlaceholder': "например: I've been doing it all night",
  'practice.patternAnalyze': 'Разобрать',
  'practice.patternAnchor': 'Паттерн: {sentence}',
};

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.js') || file === 'index.js') continue;
  const loc = file.replace('.js', '');
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, 'utf8');
  if (src.includes('practice.hubPattern')) {
    console.log('skip', file);
    continue;
  }
  const keys = loc === 'ru' ? ruKeys : enKeys;
  const block = Object.entries(keys)
    .map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`)
    .join('\n');
  src = src.replace(/('practice\.hubExpert':[^\n]+\n)/, `$1${block}\n`);
  fs.writeFileSync(p, src);
  console.log('updated', file);
}
