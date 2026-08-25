import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages');

const navLabels = {
  es: 'Verbos irregulares',
  it: 'Verbi irregolari',
  pt: 'Verbos irregulares',
  ja: '不規則動詞',
  ko: '불규칙 동사',
  ar: 'أفعال شاذة',
  fa: 'افعال بی‌قاعده',
  tr: 'Düzensiz fiiller',
};

const verbBlock = `  'verbs.title': 'Irregular verbs',
  'verbs.hubHint':
    'Pick a list (Top 50, Top 100, or Advanced), search for a verb, and open its card with three forms and examples. Add to your dictionary to practice in dialogue.',
  'verbs.addWord': 'Add verb',
  'verbs.chooseList': 'Choose a list',
  'verbs.blockTop50': 'Top 50',
  'verbs.blockTop100': 'Top 100',
  'verbs.blockAdvanced': 'Advanced',
  'verbs.blockCount': '{count} verbs',
  'verbs.searchLabel': 'Search',
  'verbs.searchPlaceholder': 'Type a verb in English or your language…',
  'verbs.emptySearch': 'No verbs match your search.',
  'verbs.myVerbs': 'My verbs',
  'verbs.emptyMyVerbs': 'No verbs yet — tap «Add verb» and pick one from a list.',
  'verbs.pattern': 'Pattern',
  'verbs.infinitive': 'Infinitive',
  'verbs.pastSimple': 'Past simple',
  'verbs.pastParticiple': 'Past participle',
  'verbs.transcription': 'Transcription',
  'verbs.examplePastSimple': 'Past simple',
  'verbs.examplePastParticiple': 'Past participle',
  'verbs.addToDictionary': 'Add to dictionary',
  'verbs.inDictionary': 'Already in your dictionary — you can practice in dialogue.',
`;

for (const loc of ['es', 'it', 'pt', 'ja', 'ko', 'ar', 'fa', 'tr']) {
  const file = join(dir, `${loc}.js`);
  let s = readFileSync(file, 'utf8');
  if (s.includes('verbs.title')) {
    console.log('skip', loc);
    continue;
  }
  if (!s.includes('nav.irregularVerbs')) {
    s = s.replace(
      /('nav\.dictionary':[^\n]+)/,
      `$1\n  'nav.irregularVerbs': '${navLabels[loc].replace(/'/g, "\\'")}',`,
    );
  }
  s = s.replace(/\n};\s*$/, `\n${verbBlock}\n};\n`);
  writeFileSync(file, s);
  console.log('patched', loc);
}
