#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/.scaffold-lang-meta.json'), 'utf8'));
const fp = path.join(ROOT, 'server/dictionaryStudyLang.js');
let t = fs.readFileSync(fp, 'utf8');

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function scriptKind(lang) {
  if (lang.script === 'cyrillic') return 'cyrillic';
  if (lang.script === 'hebrew') return 'hebrew';
  return 'latin';
}

// STUDY_LANG_META entries before closing };
for (const lang of LANGS) {
  const block = `  ${lang.code}: {
    code: '${lang.code}',
    nameEn: '${lang.nameEn}',
    nameRu: '${lang.nameRu}',
    studyScriptNoteEn: '${lang.studyScriptNoteEn}',
    studyScriptNoteRu: '${lang.studyScriptNoteRu}',
    ttsLocale: '${lang.ttsLocale}',
    supportsIrregularVerbs: false,
  },
`;
  if (!t.includes(`${lang.code}: {\n    code: '${lang.code}'`)) {
    t = t.replace('  ug: {', block + '  ug: {');
  }
}

// isDictionaryGenerationReady
for (const lang of LANGS) {
  const needle = `    code === 'ug'`;
  if (!t.includes(`code === '${lang.code}'`)) {
    t = t.replace(needle, `    code === '${lang.code}' ||\n${needle}`);
  }
}

// looksMostlyHebrewStudyText
if (!t.includes('looksMostlyHebrewStudyText')) {
  t = t.replace(
    'export function looksMostlyCyrillicStudyText(s) {',
    `export function looksMostlyHebrewStudyText(s) {
  const t = String(s ?? '').replace(/\\s+/g, '');
  let hebrew = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\\u0590-\\u05FF]/.test(ch)) hebrew += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return hebrew > 0 && hebrew >= latin;
}

export function looksMostlyCyrillicStudyText(s) {`,
  );
}

// wordInputLooksLikeStudyLanguage
for (const lang of LANGS) {
  const sk = scriptKind(lang);
  const check =
    sk === 'cyrillic'
      ? 'looksMostlyCyrillicStudyText(word)'
      : sk === 'hebrew'
        ? 'looksMostlyHebrewStudyText(word)'
        : 'looksMostlyLatinStudyText(word)';
  const block = `  if (study === '${lang.code}') {
    if (loc !== '${lang.code}') return false;
    return ${check};
  }
`;
  if (!t.includes(`if (study === '${lang.code}')`)) {
    t = t.replace('  if (study === \'ug\') {', block + '  if (study === \'ug\') {');
  }
}

// L1_OF_EN
for (const lang of LANGS) {
  if (!t.includes(`  ${lang.code}: '${lang.nameEn}'`)) {
    t = t.replace('  ug: \'Uyghur\',', `  ${lang.code}: '${lang.nameEn}',\n  ug: 'Uyghur',`);
  }
}

// AUDIENCE_OF en block
for (const lang of LANGS) {
  if (!t.includes(`pl: 'English-speaking learners of Polish'`)) break;
  if (!t.includes(`${lang.code}: 'English-speaking learners of ${lang.nameEn}'`)) {
    t = t.replace(
      "    pl: 'English-speaking learners of Polish',",
      `    pl: 'English-speaking learners of Polish',\n    ${lang.code}: 'English-speaking learners of ${lang.nameEn}',`,
    );
  }
}

// ru audience block - add after pl
for (const lang of LANGS) {
  const ruAdj = lang.nameRu.replace(/ский$/, 'ского').replace(/ий$/, 'его');
  if (!t.includes(`${lang.code}: 'русскоязычным ученикам ${ruAdj}`)) {
    t = t.replace(
      "    pl: 'русскоязычным ученикам польского',",
      `    pl: 'русскоязычным ученикам польского',\n    ${lang.code}: 'русскоязычным ученикам ${ruAdj}',`,
    );
  }
}

// uk audience block
for (const lang of LANGS) {
  if (!t.includes(`${lang.code}: 'україномовним учням`)) {
    t = t.replace(
      "    pl: 'україномовним учням польської',",
      `    pl: 'україномовним учням польської',\n    ${lang.code}: 'україномовним учням ${lang.nameRu === 'украинский' ? 'української' : lang.nameRu.replace(/ский$/, 'ської').replace(/ий$/, 'ської')}',`,
    );
  }
}

// learnerAudienceRu replace block
for (const lang of LANGS) {
  const block = `  if (study === '${lang.code}') {
    return base.learnerAudience.replace(/английск/gi, '${lang.nameRu.slice(0, -2)}').replace(/English/gi, '${lang.nameEn}');
  }
`;
  if (!t.includes(`if (study === '${lang.code}') {\n    return base.learnerAudience`)) {
    t = t.replace('  if (study === \'ug\') {', block + '  if (study === \'ug\') {');
  }
}

function scriptLabel(lang) {
  if (lang.script === 'cyrillic') return 'Cyrillic script';
  if (lang.script === 'hebrew') return 'Hebrew script';
  return 'Latin script';
}

// customExampleHeadwordInstruction
for (const lang of LANGS) {
  const sl = scriptLabel(lang);
  const block = `  if (study.code === '${lang.code}') {
    if (isPhrase) {
      return (
        'Output only valid JSON: {"headwordEn":"..."} — natural ${lang.nameEn} translation of the ENTIRE learner ' +
        'phrase/sentence in ${sl}. Preserve full meaning. Do NOT reduce to a single keyword. No markdown.'
      );
    }
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural ${lang.nameEn} dictionary lemma (${sl}) for the single-word ' +
      'learner input. No markdown.'
    );
  }
`;
  if (!t.includes(`if (study.code === '${lang.code}')`)) {
    t = t.replace('  if (study.code === \'ug\') {', block + '  if (study.code === \'ug\') {');
  }
}

// studyDictionarySystemPreamble
for (const lang of LANGS) {
  const sl = scriptLabel(lang);
  const block = `  if (study.code === '${lang.code}') {
    return 'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural ${lang.nameEn} sentence in ${sl}.';
  }
`;
  if (!t.includes(`study.code === '${lang.code}') {\n    return 'You output only valid JSON`)) {
    t = t.replace('  if (study.code === \'ug\') {', block + '  if (study.code === \'ug\') {');
  }
}

// studyDictionaryRetryNote
for (const lang of LANGS) {
  const sl = scriptLabel(lang);
  const block = `  if (study.code === '${lang.code}') {
    return \`\\n\\nREMINDER: every "text" MUST be a ${lang.nameEn} sentence (${sl}). "translation" and gloss meaning MUST be in \${trans}. headwordEn must be the ${lang.nameEn} lemma/phrase in ${sl}.\`;
  }
`;
  if (!t.includes(`study.code === '${lang.code}') {\n    return \`\\n\\nREMINDER: every "text" MUST be a ${lang.nameEn}`)) {
    t = t.replace('  if (study.code === \'ug\') {', block + '  if (study.code === \'ug\') {');
  }
}

// getStudyPromptVars TRANSLATION_SCRIPT_NOTE chain - add before ug
for (const lang of LANGS) {
  const chain = `: studyCode === '${lang.code}'
                                ? \`\${base.translationLanguage} for the gloss/translation of that same ${lang.nameEn} sentence\``;
  if (!t.includes(`studyCode === '${lang.code}'`)) {
    t = t.replace(
      ": studyCode === 'ug'",
      `${chain}\n                              : studyCode === 'ug'`,
    );
  }
}

fs.writeFileSync(fp, t);
console.log('✓ dictionaryStudyLang.js');

// llmClient.js - add to latin study groups
const llmFp = path.join(ROOT, 'server/llmClient.js');
let llm = fs.readFileSync(llmFp, 'utf8');
const latinCodes = LANGS.filter((l) => l.script === 'latin').map((l) => `'${l.code}'`).join(' || study === ');
const extraLatin = LANGS.filter((l) => l.script === 'latin').map((l) => `'${l.code}'`).join(', ');
llm = llm.replace(
  /study === 'pl' \|\| study === 'az'/g,
  `study === 'pl' || study === 'az' || study === ${latinCodes.replace(/ \|\| study === /g, ' || study === ')}`,
);
// Fix double additions - run simpler replace
for (const lang of LANGS.filter((l) => l.script === 'latin')) {
  llm = llm.replace(
    "study === 'pl' || study === 'az'",
    `study === 'pl' || study === 'az' || study === '${lang.code}'`,
  );
}
for (const lang of LANGS.filter((l) => l.script === 'cyrillic' || l.script === 'hebrew')) {
  // sr and he need separate handling in llmClient - read file
}
fs.writeFileSync(llmFp, llm);
console.log('✓ llmClient.js (partial)');
