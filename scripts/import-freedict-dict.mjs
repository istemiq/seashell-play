#!/usr/bin/env node
/**
 * FreeDict TEI → компактный JSON для /api/reader/define.
 * Использование:
 *   node scripts/import-freedict-dict.mjs <pair> <path-to-tei>
 * Пример:
 *   node scripts/import-freedict-dict.mjs eng-rus C:/tmp/eng-rus/eng-rus.tei
 * Результат: server/dictionaries/<pair>.json = {word: {p: pos, t: [trans…]}}
 * Дампы: https://download.freedict.org/dictionaries/<pair>/<ver>/…src.tar.xz
 * Лицензия данных: см. TEI header (большинство GPL — нужна атрибуция в UI).
 */
import fs from 'node:fs';
import path from 'node:path';

const [pair, teiPath] = process.argv.slice(2);
if (!pair || !teiPath) {
  console.error('usage: import-freedict-dict.mjs <pair> <tei-file>');
  process.exit(1);
}

const xml = fs.readFileSync(teiPath, 'utf8');
const out = Object.create(null);
const ENTRY = /<entry[\s>]([\s\S]*?)<\/entry>/g;
const ORTH = /<orth[^>]*>([\s\S]*?)<\/orth>/;
const POS = /<pos[^>]*>([\s\S]*?)<\/pos>/;
const CIT_TRANS = /<cit[^>]*type="trans"[^>]*>([\s\S]*?)<\/cit>/g;
const QUOTE = /<quote[^>]*>([\s\S]*?)<\/quote>/g;
const strip = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

let m;
let count = 0;
while ((m = ENTRY.exec(xml))) {
  const body = m[1];
  const orth = ORTH.exec(body)?.[1];
  if (!orth) continue;
  const word = strip(orth);
  if (!word || word.length > 80) continue;
  const pos = strip(POS.exec(body)?.[1] || '');
  const tr = [];
  let c;
  while ((c = CIT_TRANS.exec(body))) {
    let q;
    while ((q = QUOTE.exec(c[1]))) {
      const t = strip(q[1]);
      if (t && t.length <= 120 && !tr.includes(t)) tr.push(t);
      if (tr.length >= 8) break;
    }
    if (tr.length >= 8) break;
  }
  if (!tr.length) continue;
  if (out[word]) {
    for (const t of tr) if (!out[word].t.includes(t)) out[word].t.push(t);
    if (!out[word].p && pos) out[word].p = pos;
  } else {
    out[word] = { p: pos, t: tr };
  }
  count += 1;
}

const dest = path.join('server', 'dictionaries', `${pair}.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`${pair}: ${count} entries -> ${dest} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
