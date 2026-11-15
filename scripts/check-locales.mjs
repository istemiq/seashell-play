// Locale coverage guard. Run: node scripts/check-locales.mjs
//
// English (`en`) is the primary development target — new UI keys only need
// en.js (optionally ru.js); every other locale falls back to English in
// translate(). Missing keys are reported as INFO, not errors.
//
// This script FAILS (exit 1) only on real breakage:
//   - a learn locale without src/modules/<code>/, STUDY_LANG_META entry,
//     prompt targets dir, or a speech/STT mapping;
//   - a UI locale file that fails to import;
//   - a reader dst (UI locale) missing from the Google translate map in
//     server/routes/reader.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);

let failures = 0;
const fail = (msg) => { failures += 1; console.error('FAIL', msg); };
const info = (msg) => console.log('info', msg);

// --- 1. UI locale files import cleanly; key parity vs en is informational ---
const msgDir = path.join(ROOT, 'src/i18n/messages');
const en = (await imp('src/i18n/messages/en.js')).default;
const enKeys = new Set(Object.keys(en));
for (const f of fs.readdirSync(msgDir).filter((x) => x.endsWith('.js') && !['en.js', 'index.js'].includes(x))) {
  try {
    const m = (await imp(`src/i18n/messages/${f}`)).default;
    const missing = [...enKeys].filter((k) => !(k in m));
    if (missing.length) info(`${f}: ${missing.length} keys fall back to English`);
  } catch (e) {
    fail(`${f}: cannot import — ${e.message}`);
  }
}

// --- 2. learn locales wiring ---
const { LEARN_LOCALES } = await imp('src/i18n/learnLocales.js');
const { STUDY_LANG_META } = await imp('server/dictionaryStudyLang.js');
const { speechLocaleForLearn, sttLanguageForLearn } = await imp('src/utils/studySpeech.js');

for (const { code } of LEARN_LOCALES) {
  if (!fs.existsSync(path.join(ROOT, 'src/modules', code))) fail(`learn locale ${code}: missing src/modules/${code}/`);
  if (!STUDY_LANG_META[code]) fail(`learn locale ${code}: missing STUDY_LANG_META entry`);
  if (code !== 'en' && !fs.existsSync(path.join(ROOT, 'server/prompts/targets', code))) {
    fail(`learn locale ${code}: missing server/prompts/targets/${code}/`);
  }
  if (!speechLocaleForLearn(code)) fail(`learn locale ${code}: speechLocaleForLearn returns empty`);
  if (!sttLanguageForLearn(code)) fail(`learn locale ${code}: sttLanguageForLearn returns empty`);
}

// --- 3. every UI locale is a valid reader translate dst (Google map) ---
const readerSrc = read('server/routes/reader.js');
const { UI_LOCALES } = await imp('src/i18n/config.js').catch(() => ({ UI_LOCALES: null }));
const uiCodes = UI_LOCALES?.map((l) => l.code) ?? ['en', 'ru', 'ar', 'es', 'pt', 'fa', 'uk', 'ko', 'ja', 'it', 'tr'];
for (const code of uiCodes) {
  if (!new RegExp(`\\b${code}:\\s*'`).test(readerSrc)) fail(`reader dst ${code}: not in GOOGLE_TL map in server/routes/reader.js`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nLocale coverage OK');
process.exit(failures ? 1 : 0);
