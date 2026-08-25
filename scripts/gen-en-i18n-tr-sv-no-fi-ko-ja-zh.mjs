#!/usr/bin/env node
/** Append *Tr/*Sv/*No/*Fi/*Ko/*Ja/*Zh keys to en.js from De template. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/messages/en.js');
let en = fs.readFileSync(enPath, 'utf8');

const LANGS = [
  { suffix: 'Tr', label: 'Turkish', code: 'TR', sample: 'su', inKey: 'Turkish' },
  { suffix: 'Sv', label: 'Swedish', code: 'SV', sample: 'vatten', inKey: 'Swedish' },
  { suffix: 'No', label: 'Norwegian', code: 'NO', sample: 'vann', inKey: 'Norwegian' },
  { suffix: 'Fi', label: 'Finnish', code: 'FI', sample: 'vesi', inKey: 'Finnish' },
  { suffix: 'Ko', label: 'Korean', code: 'KO', sample: '물', inKey: 'Korean' },
  { suffix: 'Ja', label: 'Japanese', code: 'JA', sample: '水', inKey: 'Japanese' },
  { suffix: 'Zh', label: 'Chinese', code: 'ZH', sample: '水', inKey: 'Chinese' },
];

const ACCENTS = {
  Tr: "Turkish — DFKI (tr-TR)",
  Sv: "Swedish — NST (sv-SE)",
  No: "Norwegian — Talesyntese (no-NO)",
  Fi: "Finnish — Harri (fi-FI)",
  Zh: "Chinese — Huayan (zh-CN)",
};

function fromDe(suffix, label, code, sample) {
  const repl = [
    ['De', suffix],
    ['German', label],
    ['DE', code],
    ['Wasser', sample],
    ['inGerman', `in${LANGS.find((l) => l.suffix === suffix).inKey}`],
  ];
  let out = '';
  const deBlock = en.match(/'settings\.accentDe':[\s\S]*?'practice\.inGerman': 'In German',/);
  if (!deBlock) throw new Error('De block not found');
  out = deBlock[0];
  for (const [a, b] of repl) out = out.replaceAll(a, b);
  return out.replace("'practice.in" + LANGS.find((l) => l.suffix === suffix).inKey + "': 'In " + label + "',", `'practice.in${LANGS.find((l) => l.suffix === suffix).inKey}': 'In ${label}',`);
}

const additions = [];
for (const l of LANGS) {
  if (en.includes(`'dict.wordLabel${l.suffix}':`)) continue;
  const block = fromDe(l.suffix, l.label, l.code, l.sample);
  // extract individual keys from block - simpler: generate key list
}

// Generate keys programmatically from De keys
const deKeys = [...en.matchAll(/'([^']*De)':/g)].map((m) => m[1]);
const newLines = [];
for (const l of LANGS) {
  for (const deKey of deKeys) {
    const newKey = deKey.replace(/De$/, l.suffix);
    if (en.includes(`'${newKey}':`)) continue;
    const deMatch = en.match(new RegExp(`'${deKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}': ([\\s\\S]*?)(,\\n)`));
    if (!deMatch) continue;
    let val = deMatch[1];
    val = val.replace(/German/g, l.label).replace(/DE/g, l.code).replace(/Wasser/g, l.sample).replace(/de-DE/g, ({
      Tr: 'tr-TR', Sv: 'sv-SE', No: 'no-NO', Fi: 'fi-FI', Ko: 'ko-KR', Ja: 'ja-JP', Zh: 'zh-CN',
    })[l.suffix] || 'en-US');
    newLines.push(`  '${newKey}': ${val},`);
  }
  if (ACCENTS[l.suffix] && !en.includes(`'settings.accent${l.suffix}':`)) {
    newLines.push(`  'settings.accent${l.suffix}': "${ACCENTS[l.suffix]}",`);
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
