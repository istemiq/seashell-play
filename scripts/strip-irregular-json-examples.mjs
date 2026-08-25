/**
 * Убирает examples из JSON глаголов (меньше бандл) и пишет manifest для API.
 * Запуск: node scripts/strip-irregular-json-examples.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const contentDir = path.join(root, 'src/content');
const files = [
  'irregularVerbsTop50.json',
  'irregularVerbsTop100.json',
  'irregularVerbsAdvanced.json',
];

function stripVerb(verb) {
  const {
    id,
    block,
    pattern,
    infinitive,
    past_simple,
    past_participle,
    translation,
    transcription,
  } = verb;
  return {
    id,
    block,
    pattern,
    infinitive,
    past_simple,
    past_participle,
    translation,
    transcription,
  };
}

const manifest = [];

for (const name of files) {
  const filePath = path.join(contentDir, name);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stripped = raw.map(stripVerb);
  fs.writeFileSync(filePath, `${JSON.stringify(stripped, null, 2)}\n`, 'utf8');
  manifest.push(...stripped);
  console.log(`stripped ${name}: ${stripped.length} verbs`);
}

const outPath = path.join(root, 'server/data/irregular-verbs-manifest.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`manifest: ${manifest.length} verbs → ${outPath}`);
