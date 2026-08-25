#!/usr/bin/env node
/**
 * Smoke-test Piper voices for study locales. Run on VPS:
 *   node scripts/test-tts-locales.mjs
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVoiceModelPath } from '../tts.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CASES = [
  ['en-US', 'Hello'],
  ['ru-RU', 'Привет'],
  ['no-NO', 'Hei'],
  ['nb-NO', 'Hei'],
  ['fi-FI', 'Hei'],
  ['sv-SE', 'Hej'],
  ['da-DK', 'Hej'],
  ['de-DE', 'Hallo'],
  ['vi-VN', 'Xin chào'],
  ['cs-CZ', 'Ahoj'],
  ['ko-KR', '안녕'],
  ['ja-JP', 'こんにちは'],
  ['zh-CN', '你好'],
  ['zh-TW', '你好'],
];

const piperBin = existsSync('/opt/piper/piper/piper') ? '/opt/piper/piper/piper' : 'piper';

let failed = 0;
for (const [locale, sample] of CASES) {
  const model = resolveVoiceModelPath(locale);
  const tag = locale.padEnd(8);
  if (!model) {
    console.log(`SKIP  ${tag} Web Speech only`);
    continue;
  }
  if (!existsSync(model)) {
    console.log(`FAIL  ${tag} missing model ${model}`);
    failed++;
    continue;
  }
  const out = join(root, `.tts-test-${locale.replace(/[^a-z0-9-]+/gi, '_')}.wav`);
  const r = spawnSync(piperBin, ['--model', model, '--output_file', out], {
    input: sample,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (r.status !== 0 || !existsSync(out)) {
    const err = (r.stderr || r.stdout || '').trim().slice(0, 100);
    console.log(`FAIL  ${tag} piper ${r.status}: ${err}`);
    failed++;
    continue;
  }
  const isNoVoice = model.includes('no_NO');
  const warn = locale === 'nb-NO' && !isNoVoice ? ' (WRONG MODEL!)' : '';
  console.log(`OK    ${tag} ${model.split('/').pop()}${warn}`);
}

process.exit(failed ? 1 : 0);
