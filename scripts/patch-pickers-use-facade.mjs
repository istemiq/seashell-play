#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/components');

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('CardTranslationLocalePicker.jsx')) continue;
  let text = fs.readFileSync(path.join(dir, file), 'utf8');
  if (text.includes("from '../utils/contentLocale.js'")) {
    console.log(`skip ${file}`);
    continue;
  }

  text = text.replace(
    /import \{ updateSettings \} from '\.\.\/utils\/settings\.js';/,
    `import { updateSettings } from '../utils/settings.js';\nimport {\n  resolveContentLocaleForApi,\n  defaultCardLocaleForLearn,\n} from '../utils/contentLocale.js';`,
  );

  text = text.replace(
    /const readEffectiveCode = useCallback\(\(\) => \w+ResolveContentLocaleForApi\(\), \[\]\);/,
    'const readEffectiveCode = useCallback(() => resolveContentLocaleForApi(), []);',
  );

  text = text.replace(
    /const effectiveCode = cardLocale \|\| \w+DefaultCardLocale\(\);/,
    'const effectiveCode = cardLocale || defaultCardLocaleForLearn();',
  );

  fs.writeFileSync(path.join(dir, file), text);
  console.log(`✓ ${file}`);
}
