/**
 * Verify pattern turn-2 grades against anchor (not re-analysis).
 * Usage: node scripts/pattern-turn2-verify.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import '../load-env.js';
import { generatePracticePatternTurn } from '../llmClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'reports', 'pattern-turn2-verify.txt');

const CASES = [
  {
    name: 'ru/ru — wrong skeleton (pain, not duration+activity)',
    ui: 'ru',
    study: 'ru',
    anchor: 'Я всю ночь этим занимаюсь',
    followUp: 'У меня болит спина от долгого сидения.',
    expectCorrections: true,
  },
  {
    name: 'ru/ru — same skeleton, new topic',
    ui: 'ru',
    study: 'ru',
    anchor: 'Я всю ночь этим занимаюсь',
    followUp: 'Я весь день этим занимаюсь.',
    expectCorrections: false,
  },
  {
    name: 'ru/en — wrong skeleton',
    ui: 'ru',
    study: 'en',
    anchor: "I've been doing it all night",
    followUp: 'My back hurts from sitting so long.',
    expectCorrections: true,
  },
  {
    name: 'en/ru — wrong skeleton (UI English)',
    ui: 'en',
    study: 'ru',
    anchor: 'Я всю ночь этим занимаюсь',
    followUp: 'У меня болит спина от долгого сидения.',
    expectCorrections: true,
  },
  {
    name: 'en/en — matching present perfect continuous',
    ui: 'en',
    study: 'en',
    anchor: "I've been doing it all night",
    followUp: "She's been reading that book all morning.",
    expectCorrections: false,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function looksLikeNewPatternLesson(reply, anchor) {
  const r = String(reply ?? '').toLowerCase();
  // Heuristic: full re-teach lists numbered steps like turn 1
  return /^\s*1[\.)]/.test(String(reply ?? '')) || (r.includes('структур') && r.includes('пример') && !r.includes('anchor'));
}

async function runCase(c) {
  const turn1 = await generatePracticePatternTurn({
    userText: c.anchor,
    historyBlock: '(empty)',
    contentLocale: c.ui,
    patternSeed: c.anchor,
    targetLang: c.study,
  });
  await sleep(800);
  const historyBlock = `User: ${c.anchor}\nAssistant: ${String(turn1.reply ?? '').slice(0, 2000)}`;
  const turn2 = await generatePracticePatternTurn({
    userText: c.followUp,
    historyBlock,
    contentLocale: c.ui,
    patternSeed: c.anchor,
    targetLang: c.study,
  });

  const hasCorrections = turn2.corrections != null && String(turn2.corrections).trim() !== '';
  const passCorrections = c.expectCorrections ? hasCorrections : !hasCorrections;
  const reTeach = looksLikeNewPatternLesson(turn2.reply, c.anchor);

  return {
    ...c,
    turn1Reply: turn1.reply,
    turn2,
    hasCorrections,
    passCorrections,
    reTeach,
    pass: passCorrections,
  };
}

const lines = [`Pattern turn-2 verify — ${new Date().toISOString()}`, ''];
let passed = 0;

for (const c of CASES) {
  console.log('case', c.name);
  const r = await runCase(c);
  if (r.pass) passed++;
  lines.push(`=== ${c.name} ${r.pass ? 'PASS' : 'FAIL'} ===`);
  lines.push(`Anchor: ${c.anchor}`);
  lines.push(`User turn2: ${c.followUp}`);
  lines.push(`Expected corrections: ${c.expectCorrections ? 'yes' : 'no'} | got: ${r.hasCorrections ? 'yes' : 'no'}`);
  lines.push(`Reply looks like new pattern lesson: ${r.reTeach ? 'YES (bad)' : 'no'}`);
  lines.push(`echo: ${r.turn2.echo ?? 'null'}`);
  lines.push(`corrections: ${r.turn2.corrections ?? 'null'}`);
  lines.push(`reply:\n${r.turn2.reply ?? ''}`);
  lines.push('');
  await sleep(600);
}

lines.unshift(`Summary: ${passed}/${CASES.length} passed`, '');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`\n${passed}/${CASES.length} passed → ${OUT}`);
process.exit(passed === CASES.length ? 0 : 1);
