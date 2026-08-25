/** Fix missing commas after pattern i18n key insertions. */
import fs from 'fs';
import path from 'path';

const dir = 'src/i18n/messages';

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.js') || file === 'index.js') continue;
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, 'utf8');
  const before = src;
  src = src.replace(
    /('practice\.patternHint':[^\n]+)\n(\s+'practice\.patternSeedLabel')/g,
    '$1,\n$2',
  );
  src = src.replace(
    /('practice\.patternSeedPlaceholder':[^\n]+)\n(\s+'practice\.patternAnalyze')/g,
    '$1,\n$2',
  );
  if (src !== before) {
    fs.writeFileSync(p, src);
    console.log('fixed', file);
  }
}
