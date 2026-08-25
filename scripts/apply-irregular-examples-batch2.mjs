import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXAMPLES as TOP100_EX } from './irregular-examples-top100.mjs';
import { EXAMPLES as ADV_EX } from './irregular-examples-advanced.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src/content');

function validateExamples(id, examples) {
  if (!Array.isArray(examples) || examples.length !== 10) {
    throw new Error(`id ${id}: expected 10 examples, got ${examples?.length ?? 0}`);
  }
  const counts = { present: 0, past_simple: 0, past_participle: 0 };
  const seen = new Set();
  for (const ex of examples) {
    if (!['present', 'past_simple', 'past_participle'].includes(ex.form)) {
      throw new Error(`id ${id}: invalid form "${ex.form}"`);
    }
    counts[ex.form]++;
    if (!ex.en?.trim() || !ex.ru?.trim()) throw new Error(`id ${id}: empty en/ru`);
    if (seen.has(ex.en)) throw new Error(`id ${id}: duplicate en "${ex.en}"`);
    seen.add(ex.en);
  }
  if (counts.present !== 3 || counts.past_simple !== 4 || counts.past_participle !== 3) {
    throw new Error(`id ${id}: bad form counts ${JSON.stringify(counts)}`);
  }
}

function apply(fileName, examplesMap, idRange) {
  const path = join(contentDir, fileName);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  for (const verb of data) {
    if (verb.id < idRange[0] || verb.id > idRange[1]) continue;
    const ex = examplesMap[verb.id];
    if (!ex) throw new Error(`missing examples for id ${verb.id} in ${fileName}`);
    validateExamples(verb.id, ex);
    verb.examples = ex;
  }
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Updated ${fileName}: ids ${idRange[0]}-${idRange[1]}`);
}

apply('irregularVerbsTop100.json', TOP100_EX, [51, 86]);
apply('irregularVerbsAdvanced.json', ADV_EX, [87, 174]);
console.log('Done.');
