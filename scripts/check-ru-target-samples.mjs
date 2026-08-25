import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isPayloadValidForContentLocale,
  isPayloadValidForTargetLang,
} from '../server/localeValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, '../server/prompts/targets/ru/locales');
const codes = fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory());

let failed = 0;
for (const code of codes) {
  const file = path.join(base, code, 'word-dictionary-format-sample.json');
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const okContent = isPayloadValidForContentLocale(code, payload, 'ru');
  const okTarget = isPayloadValidForTargetLang('ru', payload);
  if (!okContent || !okTarget) {
    console.error('FAIL', code, { okContent, okTarget });
    failed += 1;
  } else {
    console.log('ok', code);
  }
}
if (failed) process.exit(1);
