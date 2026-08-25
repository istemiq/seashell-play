#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tests = [
  'server/tests/ttsSpeakText.test.js',
  'server/tests/ttsSpeakTextLocales.test.js',
  'server/tests/ruTtsStress.test.js',
  'server/tests/tts.test.js',
];

const cmd = process.execPath;
const args = ['--test', ...tests.map((t) => path.join(root, t))];
const r = spawnSync(cmd, args, {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, NODE_TEST_REPORT: '1' },
});

const out = `${r.stdout || ''}${r.stderr || ''}`.replace(/\r/g, '');
const lines = out.split('\n').map((line) =>
  line
    .replace(/^▶ /, '[SUITE] ')
    .replace(/^✔ /, '[PASS] ')
    .replace(/^✖ /, '[FAIL] ')
    .replace(/^ℹ /, '[INFO] '),
);

const pass = /ℹ pass (\d+)/.exec(out)?.[1] ?? '?';
const fail = /ℹ fail (\d+)/.exec(out)?.[1] ?? '?';
const duration = /ℹ duration_ms ([\d.]+)/.exec(out)?.[1] ?? '?';

const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
const desktop = path.join(process.env.USERPROFILE || '', 'Desktop');
const file = path.join(desktop, `seashell-tts-tests-${stamp.replace(/[: ]/g, '-').slice(0, 16)}.txt`);

const report = [
  'Seashell TTS tests report',
  `Date: ${stamp}`,
  `Repo: ${root}`,
  `Command: node --test ${tests.join(' ')}`,
  `Exit code: ${r.status ?? 1}`,
  `Result: ${pass} passed, ${fail} failed (${duration} ms)`,
  '',
  ...lines,
  '',
].join('\n');

fs.writeFileSync(file, report, 'utf8');
console.log(`Saved: ${file}`);
console.log(`Result: ${pass} passed, ${fail} failed`);
process.exit(r.status ?? 1);
