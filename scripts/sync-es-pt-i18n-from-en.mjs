#!/usr/bin/env node
/** Copy missing *Es/*Pt keys from en.js into other locale message files. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import en from '../src/i18n/messages/en.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages');
const esPtKeys = Object.keys(en).filter(
  (k) => k.endsWith('Es') || k.endsWith('Pt') || k === 'practice.inSpanish' || k === 'practice.inPortuguese',
);

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'en.js')) {
  const fp = path.join(dir, file);
  let text = fs.readFileSync(fp, 'utf8');
  const additions = [];
  for (const key of esPtKeys) {
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
