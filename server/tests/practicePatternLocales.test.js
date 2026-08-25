import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { loadPracticePatternTurnPrompt } from '../promptLoader.js';
import { CONTENT_LOCALE_CODES, getPromptLocaleVars } from '../promptLocales.js';
import { TARGET_LANG_CODES } from '../targetLang.js';

const LOCALES = [...CONTENT_LOCALE_CODES].sort();
const STUDY_LANGS = [...TARGET_LANG_CODES].sort();

describe('practice pattern prompts — all UI locales', () => {
  for (const locale of LOCALES) {
    it(`loads pattern drill prompt for ${locale}`, () => {
      const vars = getPromptLocaleVars(locale);
      const prompt = loadPracticePatternTurnPrompt(
        locale,
        { patternSeed: "I've been doing it all night" },
        'en',
      );
      assert.match(prompt, /sentence-pattern/i);
      assert.match(prompt, /I've been doing it all night/);
      assert.match(prompt, new RegExp(vars.correctionsLanguage, 'i'));
      assert.match(prompt, new RegExp(vars.learnerL1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      const leftovers = prompt.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
      const bad = leftovers.filter(
        (p) => !['{{USER_TEXT}}', '{{HISTORY}}', '{{DIALOGUE_SUMMARY}}'].includes(p),
      );
      assert.equal(bad.length, 0, `unresolved placeholders: ${bad.join(', ')}`);
    });
  }
});

describe('practice pattern prompts — all study languages', () => {
  for (const study of STUDY_LANGS) {
    it(`uses ${study} as study language for ru UI`, () => {
      const prompt = loadPracticePatternTurnPrompt(
        'ru',
        { patternSeed: 'Я всю ночь этим занимаюсь' },
        study,
      );
      assert.match(prompt, /sentence-pattern/i);
      assert.doesNotMatch(prompt, /\{\{STUDY_LANGUAGE\}\}/);
      const leftovers = prompt.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
      const bad = leftovers.filter(
        (p) => !['{{USER_TEXT}}', '{{HISTORY}}', '{{DIALOGUE_SUMMARY}}'].includes(p),
      );
      assert.equal(bad.length, 0, `unresolved placeholders: ${bad.join(', ')}`);
    });
  }
});
