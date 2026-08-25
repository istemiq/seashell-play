import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../src/i18n/messages');
const localesDir = path.join(__dirname, 'locales');
const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-flat.json'), 'utf8'));
const keyOrder = Object.keys(en);

function serialize(catalog) {
  const lines = keyOrder.map((k) => `  '${k}': ${JSON.stringify(catalog[k] ?? en[k])},`);
  return `export default {\n${lines.join('\n')}\n};\n`;
}

for (const file of fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'))) {
  const code = file.replace(/\.json$/, '');
  const patch = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  const catalog = { ...en, ...patch };
  fs.writeFileSync(path.join(outDir, `${code}.js`), serialize(catalog));
  console.log('wrote', code, Object.keys(catalog).length);
}
