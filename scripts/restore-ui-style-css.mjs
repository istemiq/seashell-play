import fs from 'node:fs';

const files = process.argv.slice(2);

function restoreCss(css) {
  return css
    .split('\n')
    .map((line) => {
      if (!line.includes('html[') && !line.includes('html:not(')) return line;
      if (!line.includes('.seashell-crt')) return line;
      const idx = line.indexOf(', .seashell-crt');
      if (idx === -1) return line.replace(/\.ss-practice-tur\b/g, '.ss-practice-turn');
      return line.slice(0, idx).replace(/\.ss-practice-tur\b/g, '.ss-practice-turn');
    })
    .join('\n')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\{/g, ' {');
}

for (const file of files) {
  const css = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, restoreCss(css));
  console.log('restored', file);
}
