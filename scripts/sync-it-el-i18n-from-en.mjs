#!/usr/bin/env node
/** Copy missing *It/*El keys from en.js into other locale message files. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import en from '../src/i18n/messages/en.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages');
const itElKeys = Object.keys(en).filter(
  (k) =>
    k.endsWith('It') ||
    k.endsWith('El') ||
    k === 'practice.inItalian' ||
    k === 'practice.inGreek',
);

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'en.js')) {
  const fp = path.join(dir, file);
  let text = fs.readFileSync(fp, 'utf8');
  const additions = [];
  for (const key of itElKeys) {
    if (text.includes(`'${key}':`)) continue;
    const val = String(en[key]).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    additions.push(`  '${key}': '${val}',`);
  }
  if (!additions.length) continue;
  const insertAt = text.lastIndexOf('};');
  text = `${text.slice(0, insertAt)}${additions.join('\n')}\n${text.slice(insertAt)}`;
  fs.writeFileSync(fp, text);
  console.log(`✓ ${file}: +${additions.length}`);
}
