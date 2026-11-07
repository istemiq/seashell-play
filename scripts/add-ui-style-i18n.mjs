#!/usr/bin/env node
/** Copy settings.uiStyle* keys from en.js into other locale catalogs. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import en from '../src/i18n/messages/en.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages');
const keys = Object.keys(en).filter((k) => k.startsWith('settings.uiStyle'));

for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'en.js')) {
  const fp = join(dir, file);
  let text = readFileSync(fp, 'utf8');
  const missing = keys.filter((k) => !text.includes(`'${k}'`));
  if (!missing.length) {
    console.log(`${file}: ok`);
    continue;
  }
  const lines = missing.map((k) => `  '${k}': ${JSON.stringify(en[k])},`).join('\n');
  text = text.replace(/\n};\s*$/, `\n${lines}\n};\n`);
  writeFileSync(fp, text);
  console.log(`${file}: added ${missing.length}`);
}
