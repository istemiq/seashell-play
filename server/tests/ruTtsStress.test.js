import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  stripRussianStressMarks,
  hasRussianStressMarks,
  looksRussianForStress,
  convertRuaccentPlusToCombining,
  STRESS_MARK,
} from '../ruTtsStressMark.js';

describe('ruTtsStress utilities', () => {
  it('stripStressMarks removes combining acute', () => {
    const marked = 'молоко' + STRESS_MARK;
    assert.equal(stripRussianStressMarks(marked), 'молоко');
    assert.equal(hasRussianStressMarks(marked), true);
  });

  it('detects Russian text', () => {
    assert.equal(looksRussianForStress('Hello'), false);
    assert.equal(looksRussianForStress('Привет'), true);
  });

  it('converts RUAccent plus format to combining acute', () => {
    const marked = convertRuaccentPlusToCombining('прив+ет');
    assert.equal(stripRussianStressMarks(marked), 'привет');
    assert.equal(hasRussianStressMarks(marked), true);
  });
});
