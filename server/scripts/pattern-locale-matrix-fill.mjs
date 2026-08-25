/** Run missing matrix pairs only */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import '../load-env.js';
import { generatePracticePatternTurn, llmChatCompletion } from '../llmClient.js';
import { CONTENT_LOCALE_CODES } from '../promptLocales.js';
import { TARGET_LANG_CODES } from '../targetLang.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSONL = path.join(__dirname, '..', 'reports', 'pattern-locale-matrix.jsonl');

const MISSING = [
  ['ar', 'sv'],
  ['ja', 'ko'],
];

const ANCHORS = {
  sv: 'Jag har hållit på hela natten',
  ko: '밤새 그걸 하고 있어요',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runPair(ui, study) {
  const anchor = ANCHORS[study] ?? "I've been doing it all night";
  const turn1 = await generatePracticePatternTurn({
    userText: anchor,
    historyBlock: '(empty)',
    contentLocale: ui,
    patternSeed: anchor,
    targetLang: study,
  });
  await sleep(600);
  const historyBlock = `User: ${anchor}\nAssistant: ${String(turn1.reply ?? '').slice(0, 1500)}`;
  const turn2 = await generatePracticePatternTurn({
    userText: 'I tried a new sentence with the same pattern.',
    historyBlock,
    contentLocale: ui,
    patternSeed: anchor,
    targetLang: study,
  });
  return { ui, study, anchor, turn1, turn2, at: new Date().toISOString() };
}

for (const [ui, study] of MISSING) {
  console.log('run', ui, study);
  const row = await runPair(ui, study);
  fs.appendFileSync(JSONL, JSON.stringify(row) + '\n');
}
console.log('done');
