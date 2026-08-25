#!/usr/bin/env node
import en from '../src/i18n/messages/en.js';
import { messages } from '../src/i18n/messages/index.js';

const practiceKeys = Object.keys(en).filter((k) => k.startsWith('practice.'));
let failed = false;

for (const [loc, catalog] of Object.entries(messages)) {
  const missing = practiceKeys.filter((k) => !catalog[k]);
  if (missing.length) {
    failed = true;
    console.error(`✗ ${loc}: missing ${missing.length} practice keys`);
    for (const k of missing) console.error(`    ${k}`);
  }
}

if (failed) process.exit(1);
console.log(
  `✓ practice i18n: ${practiceKeys.length} keys in ${Object.keys(messages).length} locales`,
);
