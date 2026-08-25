#!/usr/bin/env node
/** Patch wiring after scaffold-vi-cs-hu-ro-id-he-ca-sr.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/.scaffold-lang-meta.json'), 'utf8'),
);
const CODES = LANGS.map((l) => l.code);
const CODE_LIST = CODES.map((c) => `'${c}'`).join(', ');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function write(rel, text) {
  fs.writeFileSync(path.join(ROOT, rel), text);
  console.log(`✓ ${rel}`);
}

function insertAfter(text, needle, insertion) {
  if (text.includes(insertion.trim().split('\n')[0])) return text;
  const i = text.indexOf(needle);
  if (i < 0) throw new Error(`needle not found: ${needle}`);
  const at = i + needle.length;
  return text.slice(0, at) + insertion + text.slice(at);
}

function insertBefore(text, needle, insertion) {
  if (text.includes(insertion.trim().split('\n')[0])) return text;
  const i = text.indexOf(needle);
  if (i < 0) throw new Error(`needle not found: ${needle}`);
  return text.slice(0, i) + insertion + text.slice(i);
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// learnLocales.js
{
  let t = read('src/i18n/learnLocales.js');
  for (const lang of LANGS) {
    const entry = lang.rtl
      ? `  { code: '${lang.code}', nativeName: '${lang.nativeName}', rtl: true },\n`
      : `  { code: '${lang.code}', nativeName: '${lang.nativeName}' },\n`;
    t = insertBefore(t, '];', entry);
  }
  write('src/i18n/learnLocales.js', t);
}

// targetLang.js
{
  let t = read('server/targetLang.js');
  for (const code of CODES) {
    t = insertBefore(t, ']);', `  '${code}',\n`);
  }
  write('server/targetLang.js', t);
}

// useLearnLocale.js DICT_READY
{
  let t = read('src/hooks/useLearnLocale.js');
  t = t.replace(
    "'tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh', 'uk', 'pl', 'hi', 'ur', 'az', 'ug',",
    `'tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh', 'uk', 'pl', 'hi', 'ur', 'az', 'ug', ${CODE_LIST},`,
  );
  write('src/hooks/useLearnLocale.js', t);
}

// learnModuleSwitch.js
{
  let t = read('src/modules/learnModuleSwitch.js');
  for (const lang of LANGS) {
    const c = lang.code;
    t = insertAfter(
      t,
      "import { ugOnLearnModuleEnter, ugSyncCardLocaleWithUi } from './ug/ugContentLocale.js';\n",
      `import { ${c}OnLearnModuleEnter, ${c}SyncCardLocaleWithUi } from './${c}/${c}ContentLocale.js';\n`,
    );
  }
  t = t.replace(
    "'tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh', 'uk', 'pl', 'hi', 'ur', 'az', 'ug',",
    `'tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh', 'uk', 'pl', 'hi', 'ur', 'az', 'ug', ${CODE_LIST},`,
  );
  for (const c of CODES) {
    t = insertBefore(
      t,
      '};',
      `  ${c}: { enter: ${c}OnLearnModuleEnter, sync: ${c}SyncCardLocaleWithUi },\n`,
    );
    // only MODULE_HANDLERS closing brace - find last occurrence before getStudyModuleCode comment
    const marker = '/** Код активного модуля изучения */';
    const idx = t.indexOf(marker);
    const before = t.slice(0, idx);
    const after = t.slice(idx);
    if (!before.includes(`${c}: { enter:`)) {
      t = before.replace(
        /(\n};)\n\n\/\*\* Код активного/,
        `\n  ${c}: { enter: ${c}OnLearnModuleEnter, sync: ${c}SyncCardLocaleWithUi },$1\n\n/** Код активного`,
      ) + after;
    }
  }
  // Add isXxxLearnModule functions
  for (const lang of LANGS) {
    const fn = `is${lang.nameEn.replace(/ /g, '')}LearnModule`;
    if (t.includes(`export function ${fn}`)) continue;
    t = insertBefore(
      t,
      'export function isEnglishLearnModule',
      `export function ${fn}(learnLocale = loadSettings().learnLocale) {\n  return getStudyModuleCode(learnLocale) === '${lang.code}';\n}\n\n`,
    );
  }
  write('src/modules/learnModuleSwitch.js', t);
}

// contentLocale.js
{
  let t = read('src/utils/contentLocale.js');
  for (const c of CODES) {
    t = insertAfter(
      t,
      "import * as ug from '../modules/ug/ugContentLocale.js';\n",
      `import * as ${c} from '../modules/${c}/${c}ContentLocale.js';\n`,
    );
  }
  t = t.replace(
    'const MODULES = { ru, ar, es, pt, it, el, fa, da, nl, fr, de, tr, sv, no, fi, ko, ja, zh, uk, pl, hi, ur, az, ug };',
    `const MODULES = { ru, ar, es, pt, it, el, fa, da, nl, fr, de, tr, sv, no, fi, ko, ja, zh, uk, pl, hi, ur, az, ug, ${CODES.join(', ')} };`,
  );
  write('src/utils/contentLocale.js', t);
}

// CardTranslationLocalePicker.jsx
{
  let t = read('src/components/CardTranslationLocalePicker.jsx');
  for (const lang of LANGS) {
    const c = lang.code;
    const C = cap(c);
    t = insertAfter(
      t,
      "import { UgCardTranslationLocalePicker } from './UgCardTranslationLocalePicker.jsx';\n",
      `import { ${C}CardTranslationLocalePicker } from './${C}CardTranslationLocalePicker.jsx';\n`,
    );
    t = insertBefore(t, '};', `  ${c}: ${C}CardTranslationLocalePicker,\n`);
  }
  for (const lang of LANGS) {
    const c = lang.code;
    const C = cap(c);
    if (t.includes(`export { ${C}CardTranslationLocalePicker }`)) continue;
    t = insertBefore(
      t,
      "export { EnCardTranslationLocalePicker }",
      `export { ${C}CardTranslationLocalePicker } from './${C}CardTranslationLocalePicker.jsx';\n`,
    );
  }
  write('src/components/CardTranslationLocalePicker.jsx', t);
}

// settings.js
{
  let t = read('src/utils/settings.js');
  for (const c of CODES) {
    const C = cap(c);
    t = insertAfter(
      t,
      "import { applyUgCardLocaleStorageMigration } from '../modules/ug/ugContentLocale.js';\n",
      `import { apply${C}CardLocaleStorageMigration } from '../modules/${c}/${c}ContentLocale.js';\n`,
    );
    t = insertBefore(t, '};', `  ${c}: apply${C}CardLocaleStorageMigration,\n`);
  }
  write('src/utils/settings.js', t);
}

// studySpeech.js
{
  let t = read('src/utils/studySpeech.js');
  for (const lang of LANGS) {
    t = insertBefore(
      t,
      "  const raw = String(learnLocale ?? '').trim();",
      `  if (code === '${lang.code}') return '${lang.ttsLocale}';\n`,
    );
    t = insertBefore(
      t,
      "  return 'en';",
      `  if (lc === '${lang.code}' || lc.startsWith('${lang.code}-')) return '${lang.code}';\n`,
    );
  }
  write('src/utils/studySpeech.js', t);
}

// SettingsPage.jsx accents
{
  let t = read('src/pages/SettingsPage.jsx');
  for (const lang of LANGS) {
    const S = cap(lang.code);
    t = insertBefore(
      t,
      '    return [',
      `    if (studyModule === '${lang.code}') {\n      return [{ labelKey: 'settings.accent${S}', value: '${lang.ttsLocale}' }];\n    }\n`,
    );
  }
  t = t.replace(
    "if (studyModule === 'zh') {\n      return [{ labelKey: 'settings.accentZh', value: 'zh-CN' }];",
    "if (studyModule === 'zh') {\n      return [\n        { labelKey: 'settings.accentZhCn', value: 'zh-CN' },\n        { labelKey: 'settings.accentZhTw', value: 'zh-TW' },\n      ];",
  );
  write('src/pages/SettingsPage.jsx', t);
}

// server tts.js
{
  let t = read('server/tts.js');
  t = t.replace(
    /if \(lc === 'zh' \|\| lc === 'zh-cn' \|\| lc\.startsWith\('zh-'\)\) \{\s*\n\s*return \(\s*\n\s*String\(process\.env\.TTS_MODEL_ZH[^}]+\}\s*\n\s*\}/s,
    `if (lc === 'zh-cn' || lc === 'zh') {
    return (
      String(process.env.TTS_MODEL_ZH ?? '').trim() ||
      '/opt/piper/voices/zh_CN-huayan-medium.onnx'
    );
  }
  if (lc === 'zh-tw') {
    return '';
  }`,
  );
  const piperVoices = {
    vi: ['TTS_MODEL_VI', 'vi_VN-vais1000-medium'],
    cs: ['TTS_MODEL_CS', 'cs_CZ-jirka-medium'],
    hu: ['TTS_MODEL_HU', 'hu_HU-anna-medium'],
    ro: ['TTS_MODEL_RO', 'ro_RO-mihai-medium'],
    id: ['TTS_MODEL_ID', 'id_ID-news_tts-medium'],
    he: ['TTS_MODEL_HE', 'he_IL-saspeech-medium'],
    ca: ['TTS_MODEL_CA', 'ca_ES-upc_ona-medium'],
    sr: ['TTS_MODEL_SR', 'sr_RS-serbski_institut-medium'],
  };
  for (const lang of LANGS) {
    const [env, file] = piperVoices[lang.code];
    const prefix = lang.code === 'vi' ? 'zh-tw' : lang.code;
    const insertNeedle =
      lang.code === 'vi'
        ? "if (lc === 'zh-tw') {\n    return '';\n  }"
        : `if (lc === '${LANGS[LANGS.indexOf(lang) - 1]?.code || 'zh-tw'}'`;
    // insert before default en-US
    const block = `
  if (lc === '${lang.code}' || lc === '${lang.ttsLocale.toLowerCase()}' || lc.startsWith('${lang.code}-')) {
    return (
      String(process.env.${env} ?? '').trim() ||
      '/opt/piper/voices/${file}.onnx'
    );
  }`;
    if (!t.includes(`TTS_MODEL_${env.split('_').pop()}`)) {
      t = insertBefore(t, '  // default en-US', block);
    }
  }
  write('server/tts.js', t);
}

// server stt.js
{
  let t = read('server/stt.js');
  for (const c of CODES) {
    t = insertBefore(
      t,
      "  return 'en';",
      `  if (lc === '${c}' || lc.startsWith('${c}-')) return '${c}';\n`,
    );
  }
  t = t.replace(
    "code === 'pl' || code === 'hi'",
    `code === 'pl' || code === 'hi' || ${CODES.map((c) => `code === '${c}'`).join(' || ')}`,
  );
  write('server/stt.js', t);
}

// dictionaryInputMode.js studyLangCode
{
  let t = read('server/dictionaryInputMode.js');
  for (const c of CODES) {
    t = insertBefore(
      t,
      "  return 'en';",
      `  if (lc === '${c}' || lc.startsWith('${c}')) return '${c}';\n`,
    );
  }
  write('server/dictionaryInputMode.js', t);
}

console.log('patch wiring done — manual: dictionaryStudyLang.js, llmClient.js');
