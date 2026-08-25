import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadDictionaryFormatSamples,
  loadDictionarySystemPrompt,
  loadWordExamplesUserPrompt,
} from '../promptLoader.js';
import { CONTENT_LOCALE_CODES, getPromptLocaleVars } from '../promptLocales.js';
import {
  getStudyLangMeta,
  getStudyPromptVars,
  isDictionaryGenerationReady,
  normalizeStudyLang,
  STUDY_LANG_META,
} from '../dictionaryStudyLang.js';
import { isPayloadValidForContentLocale } from '../localeValidation.js';
import { buildDictionarySystemPrompt, buildDictionaryUserPrompt } from '../dictionaryPromptBuild.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGETS_DIR = path.join(__dirname, '../prompts/targets');

const CONTENT_LOCALES = [...CONTENT_LOCALE_CODES].sort();
const STUDY_LANGS = [
  'en',
  ...fs.readdirSync(TARGETS_DIR).filter((name) => {
    const p = path.join(TARGETS_DIR, name);
    return fs.statSync(p).isDirectory() && isDictionaryGenerationReady(name);
  }),
].sort();

const OTHER_STUDY_NAMES = Object.values(STUDY_LANG_META)
  .map((m) => m.nameEn)
  .filter(Boolean);

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unresolvedPlaceholders(text) {
  return (String(text).match(/\{\{[A-Z0-9_]+\}\}/g) ?? []).filter(
    (p) => !['{{USER_TEXT}}', '{{HISTORY}}', '{{DIALOGUE_SUMMARY}}'].includes(p),
  );
}

function assertNoWrongStudyLanguage(filled, studyCode, contentLocale) {
  const expected = getStudyLangMeta(studyCode).nameEn;
  const translationLang = getStudyPromptVars(contentLocale, studyCode).translationLanguage;
  assert.match(
    filled,
    new RegExp(`\\*\\*${escapeRe(expected)}\\*\\*`),
    `prompt must name study language "${expected}"`,
  );
  for (const name of OTHER_STUDY_NAMES) {
    if (name === expected || name === translationLang) continue;
    const wrongCritical = new RegExp(`= \\*\\*${escapeRe(name)}\\*\\*`, 'i');
    assert.doesNotMatch(
      filled,
      wrongCritical,
      `prompt must not claim critical split language is "${name}" for ${studyCode} study`,
    );
  }
}

describe('dictionary prompts — study × content locale matrix', () => {
  for (const study of STUDY_LANGS) {
    for (const locale of CONTENT_LOCALES) {
      it(`${study} + ${locale}: format sample loads and matches content locale`, () => {
        const { formatSample } = loadDictionaryFormatSamples(locale, study);
        assert.ok(formatSample?.trim(), 'format sample must not be empty');
        const parsed = JSON.parse(formatSample);
        assert.ok(
          isPayloadValidForContentLocale(locale, parsed, study),
          `sample translations/gloss must look like ${locale}, not another language`,
        );
      });

      it(`${study} + ${locale}: user prompt fills without wrong study language`, () => {
        const filled = buildDictionaryUserPrompt('sample-word', locale, study);
        const vars = getStudyPromptVars(locale, study);
        assert.equal(unresolvedPlaceholders(filled).length, 0, 'unresolved template placeholders');
        assert.match(
          filled,
          new RegExp(escapeRe(vars.translationLanguage), 'i'),
          'prompt must instruct translation language',
        );
        if (study !== 'en') {
          assertNoWrongStudyLanguage(filled, study, locale);
        }
        if (locale !== 'en') {
          assert.match(
            filled,
            /Sample locale note/i,
            'non-en content locale must warn model about translation language',
          );
        }
      });

      it(`${study} + ${locale}: system prompt loads and fills`, () => {
        const raw = loadDictionarySystemPrompt(locale, study);
        assert.ok(raw.trim(), 'system template must exist');
        const filled = buildDictionarySystemPrompt(locale, study);
        assert.equal(unresolvedPlaceholders(filled).length, 0);
        assert.match(filled, new RegExp(escapeRe(getStudyLangMeta(study).nameEn), 'i'));
      });
    }
  }
});

describe('dictionary prompt templates — placeholders present', () => {
  for (const study of STUDY_LANGS.filter((s) => s !== 'en')) {
    for (const file of ['word-examples.template.txt', 'word-dictionary-system.template.txt']) {
      it(`${study}/${file} uses STUDY_LANGUAGE and TRANSLATION_LANGUAGE`, () => {
        const text = fs.readFileSync(path.join(TARGETS_DIR, study, file), 'utf8');
        assert.match(text, /\{\{STUDY_LANGUAGE\}\}/);
        assert.match(text, /\{\{TRANSLATION_LANGUAGE\}\}/);
      });
    }
  }
});

describe('dictionary prompts — orphan study regression (fi + ru)', () => {
  it('fi + ru UI: filled prompt asks for Russian translations', () => {
    const filled = buildDictionaryUserPrompt('vesi', 'ru', 'fi');
    const vars = getPromptLocaleVars('ru');
    assert.match(filled, new RegExp(escapeRe(vars.translationLanguage), 'i'));
    assert.match(filled, /Finnish/i);
    assert.doesNotMatch(filled, /= \*\*Italian\*\*/i);
    const { formatSample } = loadDictionaryFormatSamples('ru', 'fi');
    const parsed = JSON.parse(formatSample);
    assert.ok(isPayloadValidForContentLocale('ru', parsed, 'fi'));
  });
});
