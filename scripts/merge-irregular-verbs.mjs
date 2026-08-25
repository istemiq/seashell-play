import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mainPath = join(root, 'src/content/irregularVerbsAdvanced.json');
const addPath = join(root, 'src/content/irregularVerbsAdvanced161-174.json');

const existing = JSON.parse(readFileSync(mainPath, 'utf8'));
const toAdd = JSON.parse(readFileSync(addPath, 'utf8'));
const ids = new Set(existing.map((v) => v.id));

for (const item of toAdd) {
  if (ids.has(item.id)) {
    throw new Error(`duplicate id ${item.id}`);
  }
}

const merged = [...existing, ...toAdd];
writeFileSync(mainPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
console.log(`merged: ${existing.length} + ${toAdd.length} = ${merged.length}`);
