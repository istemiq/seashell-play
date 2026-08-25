import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enSrc = fs.readFileSync(path.join(__dirname, '../src/i18n/messages/en.js'), 'utf8');
const en = {};
for (const m of enSrc.matchAll(/'([^']+)':\s*"((?:\\.|[^"\\])*)"/g)) {
  en[m[1]] = JSON.parse(`"${m[2]}"`);
}
fs.writeFileSync(path.join(__dirname, 'en-flat.json'), JSON.stringify(en, null, 2));
console.log(Object.keys(en).length);
