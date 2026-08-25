#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const fp = path.join(path.dirname(fileURLToPath(import.meta.url)), '../server/dictionaryInputMode.js');
let src = fs.readFileSync(fp, 'utf8');

const codes = ['tr', 'sv', 'no', 'fi', 'ko', 'ja', 'zh'];
const names = {
  tr: 'Turkish', sv: 'Swedish', no: 'Norwegian', fi: 'Finnish', ko: 'Korean', ja: 'Japanese', zh: 'Chinese',
};
const samples = {
  tr: 'su', sv: 'vatten', no: 'vann', fi: 'vesi', ko: '물', ja: '水', zh: '水',
};
const scriptDesc = {
  tr: 'Latin script', sv: 'Latin script', no: 'Latin script', fi: 'Latin script',
  ko: 'Hangul', ja: 'Japanese script', zh: 'Chinese characters',
};

for (const code of codes) {
  if (!src.includes(`if (lc === '${code}'`)) {
    src = src.replace(
      "  if (lc === 'de' || lc.startsWith('de')) return 'de';",
      `  if (lc === 'de' || lc.startsWith('de')) return 'de';\n  if (lc === '${code}' || lc.startsWith('${code}')) return '${code}';`,
    );
  }
}

for (const code of ['tr', 'sv', 'no', 'fi']) {
  const line = `  if (studyLangCode(targetLang) === '${code}' && looksMostlyLatinWord(hw)) return true;`;
  if (!src.includes(line)) {
    src = src.replace(
      "  if (studyLangCode(targetLang) === 'de' && looksMostlyLatinWord(hw)) return true;",
      `  if (studyLangCode(targetLang) === 'de' && looksMostlyLatinWord(hw)) return true;\n${line}`,
    );
  }
}

for (const [code, fn] of [['ko', 'looksMostlyHangulWord'], ['ja', 'looksMostlyJapaneseWord'], ['zh', 'looksMostlyChineseWord']]) {
  const line = `  if (studyLangCode(targetLang) === '${code}' && ${fn}(hw)) return true;`;
  if (!src.includes(line)) {
    src = src.replace('  return false;\n}\n\nexport function assertHeadwordMatchesInputShape', `${line}\n  return false;\n}\n\nexport function assertHeadwordMatchesInputShape`);
  }
}

if (!src.includes('looksMostlyHangulWord')) {
  src = src.replace(
    'function looksMostlyGreekWord(s) {',
    `function looksMostlyChineseWord(s) {
  const t = String(s ?? '').replace(/\\s+/g, '');
  let cjk = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\\u4E00-\\u9FFF]/.test(ch)) cjk += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return cjk > 0 && cjk >= latin;
}

function looksMostlyHangulWord(s) {
  const t = String(s ?? '').replace(/\\s+/g, '');
  let hangul = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\\uAC00-\\uD7AF\\u1100-\\u11FF\\u3130-\\u318F]/.test(ch)) hangul += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return hangul > 0 && hangul >= latin;
}

function looksMostlyJapaneseWord(s) {
  const t = String(s ?? '').replace(/\\s+/g, '');
  let ja = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\\u3040-\\u30FF\\u4E00-\\u9FFF\\uFF66-\\uFF9F]/.test(ch)) ja += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return ja > 0 && ja >= latin;
}

function looksMostlyGreekWord(s) {`,
  );
}

for (const code of codes) {
  const name = names[code];
  const sample = samples[code];
  const script = scriptDesc[code];
  const constName = `INPUT_MODE_RULES_${code.toUpperCase()}_TARGET`;
  if (src.includes(constName)) continue;
  const block = `
const ${constName} = {
  en: \`**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \\\`headwordEn\\\` = natural ${name} **lemma** in ${script} (e.g. \\\`${sample}\\\`).
- **Phrase or sentence** (2+ words) — \\\`headwordEn\\\` = **full natural ${name} translation of the entire entry** in ${script}, not one keyword. \\\`text\\\` examples teach that ${name} phrase.
- \\\`glossRu\\\`: \\\`headwordEn\\\` + ${code === 'zh' || code === 'ko' || code === 'ja' ? 'transliteration + ' : 'IPA + ' }**English** gloss/definition; you may note the original learner input in parentheses.\`,

  ${code}: \`**Learner entry** — \\\`headwordEn\\\` = natural ${name} **lemma** or full phrase translation; \\\`glossRu\\\` in learner L1.\`,
  ru: \`**Ввод ученика** — \\\`headwordEn\\\` = естественная **${name}** лемма или полный перевод фразы; \\\`glossRu\\\` на русском.\`,
};
`;
  src = src.replace('export function headwordQuickResolveSystemPrompt(isPhrase) {', `${block}\nexport function headwordQuickResolveSystemPrompt(isPhrase) {`);
}

for (const code of codes) {
  const caseLine = `  if (study === '${code}') {\n    return INPUT_MODE_RULES_${code.toUpperCase()}_TARGET[code] ?? INPUT_MODE_RULES_${code.toUpperCase()}_TARGET.en;\n  }`;
  if (!src.includes(`study === '${code}'`)) {
    src = src.replace(
      "  if (study === 'de') {\n    return INPUT_MODE_RULES_DE_TARGET[code] ?? INPUT_MODE_RULES_DE_TARGET.en;\n  }",
      `  if (study === 'de') {\n    return INPUT_MODE_RULES_DE_TARGET[code] ?? INPUT_MODE_RULES_DE_TARGET.en;\n  }\n${caseLine}`,
    );
  }
}

// Extend assertHeadwordMatchesInputShape langLabel
for (const code of codes) {
  const name = names[code];
  if (src.includes(`studyLangCode(targetLang) === '${code}'`)) continue;
}
if (!src.includes("studyLangCode(targetLang) === 'tr'")) {
  src = src.replace(
    ": studyLangCode(targetLang) === 'de'\n                          ? 'German'",
    `: studyLangCode(targetLang) === 'de'
                          ? 'German'
                          : studyLangCode(targetLang) === 'tr'
                            ? 'Turkish'
                            : studyLangCode(targetLang) === 'sv'
                              ? 'Swedish'
                              : studyLangCode(targetLang) === 'no'
                                ? 'Norwegian'
                                : studyLangCode(targetLang) === 'fi'
                                  ? 'Finnish'
                                  : studyLangCode(targetLang) === 'ko'
                                    ? 'Korean'
                                    : studyLangCode(targetLang) === 'ja'
                                      ? 'Japanese'
                                      : studyLangCode(targetLang) === 'zh'
                                        ? 'Chinese'`,
  );
}

fs.writeFileSync(fp, src);
console.log('patched dictionaryInputMode.js');
