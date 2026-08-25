#!/usr/bin/env node
/**
 * Full i18n audit: every key in en.js × every UI locale.
 * Flags missing keys, keys identical to English, and tr() keys missing from catalog.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import en from '../src/i18n/messages/en.js';
import { messages } from '../src/i18n/messages/index.js';
import { UI_LOCALE_CODES } from '../src/i18n/config.js';
import { translate } from '../src/i18n/translate.js';
import { PRACTICE_EXPERTS } from '../server/practiceExperts.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const enKeys = Object.keys(en).sort();
const locales = [...UI_LOCALE_CODES].sort();

const UI_PREFIXES = [
  'nav.',
  'common.',
  'dict.',
  'practice.',
  'verbs.',
  'settings.',
  'home.',
  'lang.',
  'premium.',
  'ads.',
  'errors.',
  'boot.',
  'readme.',
];

function isUiKey(k) {
  return UI_PREFIXES.some((p) => k.startsWith(p));
}

function collectTrKeys(dir) {
  const keys = new Set();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'i18n') continue;
      for (const k of collectTrKeys(p)) keys.add(k);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      const text = readFileSync(p, 'utf8');
      for (const m of text.matchAll(/tr\(\s*['"`]([^'"`$]+)['"`]/g)) keys.add(m[1]);
    }
  }
  return keys;
}

let failed = false;

console.log('=== 1. MISSING KEYS (any locale lacks en key) ===');
for (const loc of locales) {
  const missing = enKeys.filter((k) => !messages[loc]?.[k]);
  if (missing.length) {
    failed = true;
    console.error(`✗ ${loc}: ${missing.length} missing`);
    for (const k of missing) console.error(`    ${k}`);
  }
}
if (!failed) console.log(`✓ All ${locales.length} locales have all ${enKeys.length} keys`);

console.log('\n=== 2. UI KEYS IDENTICAL TO ENGLISH (non-en locales) ===');
let identicalUiTotal = 0;
for (const loc of locales) {
  if (loc === 'en') continue;
  const sameUi = enKeys.filter((k) => isUiKey(k) && messages[loc][k] === en[k]);
  if (sameUi.length) {
    failed = true;
    identicalUiTotal += sameUi.length;
    console.error(`✗ ${loc}: ${sameUi.length} UI keys still English`);
    for (const k of sameUi) console.error(`    ${k} → ${JSON.stringify(en[k])}`);
  }
}
if (identicalUiTotal === 0) console.log('✓ No UI keys identical to English in non-en locales');

console.log('\n=== 3. tr() KEYS IN SOURCE WITHOUT en.js ENTRY ===');
const usedKeys = [...collectTrKeys(join(root, 'src'))].sort();
const missingInEn = usedKeys.filter((k) => !en[k]);
if (missingInEn.length) {
  failed = true;
  for (const k of missingInEn) console.error(`✗ missing en key: ${k}`);
} else {
  console.log(`✓ All ${usedKeys.length} static tr() keys exist in en.js`);
}

console.log('\n=== 4. EXPERT i18n (server id ↔ locale key) ===');
for (const id of Object.keys(PRACTICE_EXPERTS)) {
  const key = `practice.expert.${id}`;
  if (!en[key]) {
    failed = true;
    console.error(`✗ en missing ${key}`);
  }
}
for (const loc of locales) {
  for (const id of Object.keys(PRACTICE_EXPERTS)) {
    const key = `practice.expert.${id}`;
    const val = messages[loc][key];
    if (!val) {
      failed = true;
      console.error(`✗ ${loc} missing ${key}`);
    } else if (loc !== 'en' && val === en[key]) {
      failed = true;
      console.error(`✗ ${loc} ${key} still English: ${JSON.stringify(val)}`);
    }
  }
}
console.log(`✓ Checked ${Object.keys(PRACTICE_EXPERTS).length} experts × ${locales.length} locales`);

console.log('\n=== 5. translate() RESOLVES (no raw keys / placeholders left) ===');
const sampleParams = { count: 3, word: 'test', language: 'X', role: 'Expert', name: 'User', rate: '1.0' };
for (const loc of locales) {
  for (const k of enKeys.filter(isUiKey)) {
    const out = translate(loc, k, sampleParams);
    if (!out || out === k) {
      failed = true;
      console.error(`✗ ${loc} ${k} → ${JSON.stringify(out)}`);
    }
  }
}
console.log(`✓ UI keys resolve via translate() in all locales`);

console.log('\n=== 6. NON-EN LOCALES: keys that look untranslated (Latin-only, non-en locale) ===');
const latinLocales = new Set(['ar', 'fa', 'ru', 'uk', 'ja', 'ko']);
for (const loc of locales) {
  if (loc === 'en') continue;
  const suspicious = enKeys.filter((k) => {
    if (!isUiKey(k)) return false;
    const val = messages[loc][k];
    if (!val || val === en[k]) return false;
    if (!latinLocales.has(loc)) return false;
    // Mostly ASCII/Latin with optional parens — likely English left in RTL/CJK locale
    return /^[\x00-\x7F\u00C0-\u024F\s.,!?…—–\-+():;/'"%0-9]+$/.test(val) && /[A-Za-z]{4,}/.test(val);
  });
  if (suspicious.length) {
    console.warn(`⚠ ${loc}: ${suspicious.length} UI keys look Latin/English:`);
    for (const k of suspicious) console.warn(`    ${k} → ${JSON.stringify(messages[loc][k])}`);
  }
}

if (failed) {
  console.error('\n✗ i18n audit FAILED');
  process.exit(1);
}
console.log('\n✓ Full i18n audit passed');
