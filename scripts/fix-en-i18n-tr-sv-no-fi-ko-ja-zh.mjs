#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const enPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages/en.js');
const raw = fs.readFileSync(enPath, 'utf8').replace(/\r\n/g, '\n');

const marker = "  'practice.inGerman': 'In German',";
const head = raw.slice(0, raw.indexOf(marker) + marker.length);

function extractKey(src, key) {
  const i = src.indexOf(`'${key}':`);
  if (i === -1) return null;
  let j = i + `'${key}':`.length;
  while (src[j] === ' ' || src[j] === '\n') j += 1;
  if (src[j] === '"' || src[j] === "'") {
    const quote = src[j];
    j += 1;
    const buf = [];
    while (j < src.length) {
      const ch = src[j];
      if (ch === '\\') {
        buf.push(src.slice(j, j + 2));
        j += 2;
        continue;
      }
      if (ch === quote) {
        j += 1;
        break;
      }
      buf.push(ch);
      j += 1;
    }
    return `${quote}${buf.join('')}${quote}`;
  }
  // multiline: next line quoted string
  while (src[j] === ' ' || src[j] === '\n') j += 1;
  if (src[j] === '"' || src[j] === "'") {
    const quote = src[j];
    j += 1;
    const buf = [];
    while (j < src.length) {
      const ch = src[j];
      if (ch === '\\') {
        buf.push(src.slice(j, j + 2));
        j += 2;
        continue;
      }
      if (ch === quote) break;
      buf.push(ch);
      j += 1;
    }
    return `${quote}${buf.join('')}${quote}`;
  }
  return null;
}

const DE_KEYS = [
  'lang.hintDe',
  'practice.expertDisclaimerDe',
  'practice.expertDisclaimerShortDe',
  'practice.expertPlaceholderDe',
  'practice.emptyDe',
  'practice.placeholderDe',
  'errors.customExampleHeadwordDe',
  'dict.wordLabelDe',
  'dict.placeholderWordDe',
  'dict.cardLangHintDe',
  'dict.addHintDe',
  'dict.addHintGroupDe',
  'dict.myExamplesEmptyDe',
  'dict.wordPracticeHintDe',
  'dict.wordPracticePlaceholderDe',
];

const LANGS = [
  { s: 'Tr', label: 'Turkish', code: 'TR', sample: 'su', tts: 'tr-TR', voice: 'DFKI', in: 'Turkish', accent: true },
  { s: 'Sv', label: 'Swedish', code: 'SV', sample: 'vatten', tts: 'sv-SE', voice: 'NST', in: 'Swedish', accent: true },
  { s: 'No', label: 'Norwegian', code: 'NO', sample: 'vann', tts: 'no-NO', voice: 'Talesyntese', in: 'Norwegian', accent: true },
  { s: 'Fi', label: 'Finnish', code: 'FI', sample: 'vesi', tts: 'fi-FI', voice: 'Harri', in: 'Finnish', accent: true },
  { s: 'Ko', label: 'Korean', code: 'KO', sample: '물', in: 'Korean', accent: false },
  { s: 'Ja', label: 'Japanese', code: 'JA', sample: '水', in: 'Japanese', accent: false },
  { s: 'Zh', label: 'Chinese', code: 'ZH', sample: '水', tts: 'zh-CN', voice: 'Huayan', in: 'Chinese', accent: true },
];

function xlat(v, l) {
  return v
    .replace(/Wasser/g, l.sample)
    .replace(/de-DE/g, l.tts ?? '')
    .replace(/German/g, l.label)
    .replace(/\(DE or/g, `(${l.code} or`)
    .replace(/in German/g, `in ${l.label}`)
    .replace(/Into German/g, `Into ${l.label}`)
    .replace(/stay in German/g, `stay in ${l.label}`)
    .replace(/stays in German/g, `stays in ${l.label}`);
}

const lines = [];
for (const l of LANGS) {
  if (l.accent) lines.push(`  'settings.accent${l.s}': "${l.label} — ${l.voice} (${l.tts})",`);
  for (const dk of DE_KEYS) {
    const val = extractKey(raw, dk);
    if (!val) throw new Error(`missing ${dk}`);
    const nk = dk.replace(/De$/, l.s);
    lines.push(`  '${nk}': ${xlat(val, l)},`);
  }
  lines.push(`  'practice.in${l.in}': 'In ${l.label}',`);
}

const out = `${head}\n\n${lines.join('\n')}\n};\n`;
fs.writeFileSync(enPath, out);
console.log(`ok ${lines.length} keys, expertDisclaimerTr=${out.includes('expertDisclaimerTr')}`);
