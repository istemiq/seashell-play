import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../src/i18n/messages');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales-data.json'), 'utf8'));

function serialize(obj) {
  const lines = Object.entries(obj).map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`);
  return `export default {\n${lines.join('\n')}\n};\n`;
}

for (const [code, catalog] of Object.entries(data)) {
  fs.writeFileSync(path.join(outDir, `${code}.js`), serialize(catalog));
  console.log('wrote', code, Object.keys(catalog).length);
}
