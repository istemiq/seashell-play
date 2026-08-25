import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { loadPracticeTurnPrompt, loadPracticeWordTurnPrompt, loadPracticePatternTurnPrompt } from '../promptLoader.js';

describe('practice prompts — Russian study language', () => {
  it('free dialog prompt uses Russian study language for fa UI', () => {
    const prompt = loadPracticeTurnPrompt('fa', 'ru');
    assert.match(prompt, /Russian conversation partner/i);
    assert.match(prompt, /practicing Russian/i);
    assert.match(prompt, /Reply: Russian/i);
    assert.match(prompt, /Persian/i);
    const leftovers = prompt.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
    const bad = leftovers.filter(
      (p) =>
        !['{{USER_TEXT}}', '{{HISTORY}}', '{{DIALOGUE_SUMMARY}}', '{{ACTIVE_THREAD}}'].includes(p),
    );
    assert.equal(bad.length, 0, `unresolved placeholders: ${bad.join(', ')}`);
  });

  it('word drill prompt uses Russian for pt UI', () => {
    const prompt = loadPracticeWordTurnPrompt(
      'pt',
      {
        targetWord: 'время',
        wordGloss: 'time',
        wordExamplesBlock: '- У меня мало времени. — Tenho pouco tempo.',
      },
      'ru',
    );
    assert.match(prompt, /Russian coach/i);
    assert.match(prompt, /время/);
    assert.match(prompt, /Portuguese/i);
    const leftovers = prompt.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
    const bad = leftovers.filter(
      (p) => !['{{USER_TEXT}}', '{{HISTORY}}', '{{DIALOGUE_SUMMARY}}'].includes(p),
    );
    assert.equal(bad.length, 0, `unresolved placeholders: ${bad.join(', ')}`);
  });

  it('pattern drill prompt uses Russian for en UI', () => {
    const prompt = loadPracticePatternTurnPrompt(
      'en',
      { patternSeed: 'Я всю ночь этим занимаюсь' },
      'ru',
    );
    assert.match(prompt, /Russian/i);
    assert.match(prompt, /Я всю ночь этим занимаюсь/);
    const leftovers = prompt.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
    const bad = leftovers.filter(
      (p) => !['{{USER_TEXT}}', '{{HISTORY}}', '{{DIALOGUE_SUMMARY}}'].includes(p),
    );
    assert.equal(bad.length, 0, `unresolved placeholders: ${bad.join(', ')}`);
  });
});
