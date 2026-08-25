#!/usr/bin/env node
/**
 * Analyze pattern-locale-matrix.jsonl for QA issues.
 * Usage: node scripts/pattern-locale-matrix-analyze.mjs [path-to.jsonl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStudyPromptVars } from '../dictionaryStudyLang.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.join(__dirname, '..', 'reports', 'pattern-locale-matrix.jsonl');
const jsonlPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultPath;

if (!fs.existsSync(jsonlPath)) {
  console.error('File not found:', jsonlPath);
  process.exit(1);
}

const rows = fs
  .readFileSync(jsonlPath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const ok = rows.filter((r) => !r.error && r.turn1);
const errors = rows.filter((r) => r.error);

let emptyT1 = 0;
let t1BadEcho = 0;
let nullEchoT2 = 0;
let nullEchoT2Localized = 0;
let engFollowUp = 0;
let t2NoReply = 0;
let t2Rejected = 0;
let t2AllNull = 0;

const engFollowUpStudies = new Set();
const cyrillicLeak = [];
const langMismatch = [];
const nullEchoByUi = {};
const rejectSamples = [];

for (const r of ok) {
  const t1 = r.turn1;
  const t2 = r.turn2 ?? {};
  const reply1 = String(t1.reply ?? '').trim();
  const reply2 = String(t2.reply ?? '').trim();

  if (!reply1) emptyT1++;
  if (t1.echo != null || t1.corrections != null) t1BadEcho++;

  if (t2.echo == null) {
    nullEchoT2++;
    nullEchoByUi[r.ui] = (nullEchoByUi[r.ui] ?? 0) + 1;
    if (r.followUp && !r.followUp.startsWith('I tried') && !r.followUp.startsWith("I've been")) {
      nullEchoT2Localized++;
    }
  }

  if (
    r.followUp === 'I tried a new sentence with the same pattern.' ||
    r.followUp?.startsWith("I've been practicing")
  ) {
    engFollowUp++;
    engFollowUpStudies.add(r.study);
  }

  if (!reply2) t2NoReply++;
  if (t2.echo == null && t2.corrections == null && !reply2) t2AllNull++;

  const vars = getStudyPromptVars(r.ui, r.study);
  const corrLang = String(vars.correctionsLanguage ?? '');
  const blob = [reply1, t2.corrections, reply2].filter(Boolean).join(' ');

  if (
    !['ru', 'uk', 'bg', 'sr'].includes(r.study) &&
    /[а-яА-ЯёЁ]{4,}/.test(blob)
  ) {
    cyrillicLeak.push({ ui: r.ui, study: r.study, snippet: blob.slice(0, 90) });
  }

  if (corrLang.toLowerCase().includes('arabic') && /\b(the|this sentence|pattern|try)\b/i.test(blob)) {
    langMismatch.push({ ui: r.ui, study: r.study, corrLang, snippet: blob.slice(0, 100) });
  }

  const rejectRe =
    /different pattern|not the same pattern|doesn't match|does not match|не тот шаблон|не соответствует|مختلف|different from the pattern/i;
  if (
    reply2 &&
    rejectRe.test(reply2) &&
    r.followUp &&
    !r.followUp.startsWith('I tried') &&
    !r.followUp.startsWith("I've been")
  ) {
    t2Rejected++;
    if (rejectSamples.length < 8) {
      rejectSamples.push({
        pair: `${r.ui}|${r.study}`,
        followUp: r.followUp,
        reply: reply2.slice(0, 160),
      });
    }
  }
}

const byStudy = {};
for (const r of ok) {
  byStudy[r.study] ??= { n: 0, nullEcho: 0, engFu: 0 };
  byStudy[r.study].n++;
  if (r.turn2?.echo == null) byStudy[r.study].nullEcho++;
  if (r.followUp?.startsWith('I tried')) byStudy[r.study].engFu++;
}

const worstEcho = Object.entries(byStudy)
  .map(([study, v]) => ({ study, rate: v.nullEcho / v.n, ...v }))
  .sort((a, b) => b.rate - a.rate)
  .slice(0, 10);

console.log('File:', jsonlPath);
console.log('Total rows:', rows.length);
console.log('Errors:', errors.length);
console.log('OK pairs:', ok.length);
console.log('');
console.log('=== Turn 1 ===');
console.log('Empty reply:', emptyT1);
console.log('Non-null echo/corrections (should be 0):', t1BadEcho);
console.log('');
console.log('=== Turn 2 ===');
console.log('null echo:', nullEchoT2, `(${Math.round((100 * nullEchoT2) / ok.length)}%)`);
console.log('null echo with localized follow-up:', nullEchoT2Localized);
console.log('all null (echo+corrections+reply):', t2AllNull);
console.log('empty reply:', t2NoReply);
console.log('model says sentence off-pattern (localized follow-up):', t2Rejected);
console.log('');
console.log('=== Test harness gaps ===');
console.log('English placeholder follow-up:', engFollowUp, `(${Math.round((100 * engFollowUp) / ok.length)}%)`);
console.log('Studies always on placeholder:', [...engFollowUpStudies].sort().join(', '));
console.log('');
console.log('=== Language quality ===');
console.log('Cyrillic leak in non-Slavic study module:', cyrillicLeak.length);
console.log('Arabic UI but English explanation tokens:', langMismatch.length);
if (cyrillicLeak.length) {
  console.log('  sample:', cyrillicLeak.slice(0, 3));
}
console.log('');
console.log('=== Worst null-echo by study language ===');
for (const w of worstEcho) {
  console.log(`  ${w.study}: ${w.nullEcho}/${w.n} (${Math.round(w.rate * 100)}%)`);
}
console.log('');
console.log('=== UI locales with most null echo ===');
console.log(
  Object.entries(nullEchoByUi)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ui, n]) => `${ui}:${n}`)
    .join(', '),
);
console.log('');
if (rejectSamples.length) {
  console.log('=== Turn2 off-pattern rejection samples ===');
  for (const s of rejectSamples) {
    console.log(`  ${s.pair}`);
    console.log(`    USER: ${s.followUp}`);
    console.log(`    REPLY: ${s.reply}`);
  }
}
if (errors.length) {
  console.log('');
  console.log('=== API errors ===');
  for (const e of errors.slice(0, 5)) console.log(`  ${e.ui}|${e.study}: ${e.error}`);
}
