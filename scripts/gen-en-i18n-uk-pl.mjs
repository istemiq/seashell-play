#!/usr/bin/env node
/** Append *Uk/*Pl keys to en.js from De template. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/messages/en.js');
let en = fs.readFileSync(enPath, 'utf8');

const LANGS = [
  {
    suffix: 'Uk',
    label: 'Ukrainian',
    code: 'UA',
    sample: 'вода',
    tts: 'uk-UA',
    accent: 'Ukrainian — Ukrainian TTS (uk-UA)',
    inKey: 'Ukrainian',
  },
  {
    suffix: 'Pl',
    label: 'Polish',
    code: 'PL',
    sample: 'woda',
    tts: 'pl-PL',
    accent: 'Polish — Gosia (pl-PL)',
    inKey: 'Polish',
  },
];

const deKeys = [...en.matchAll(/'([^']*De)':/g)].map((m) => m[1]);
const newLines = [];

for (const l of LANGS) {
  for (const deKey of deKeys) {
    const newKey = deKey.replace(/De$/, l.suffix);
    if (en.includes(`'${newKey}':`)) continue;
    const deMatch = en.match(new RegExp(`'${deKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}': ([\\s\\S]*?)(,\\n)`));
    if (!deMatch) continue;
    let val = deMatch[1];
    val = val
      .replace(/German/g, l.label)
      .replace(/\bDE\b/g, l.code)
      .replace(/Wasser/g, l.sample)
      .replace(/de-DE/g, l.tts);
    newLines.push(`  '${newKey}': ${val},`);
  }
  if (!en.includes(`'settings.accent${l.suffix}':`)) {
    newLines.push(`  'settings.accent${l.suffix}': "${l.accent}",`);
  }
  const inKey = `practice.in${l.inKey}`;
  if (!en.includes(`'${inKey}':`)) {
    newLines.push(`  '${inKey}': 'In ${l.label}',`);
  }
}

if (newLines.length) {
  const insertAt = en.lastIndexOf('};');
  en = `${en.slice(0, insertAt)}${newLines.join('\n')}\n${en.slice(insertAt)}`;
  fs.writeFileSync(enPath, en);
  console.log(`en.js: +${newLines.length} keys`);
} else {
  console.log('en.js: nothing to add');
}
