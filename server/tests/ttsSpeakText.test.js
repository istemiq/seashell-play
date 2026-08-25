import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractStudyLangForTts } from '../ttsSpeakText.js';

describe('extractStudyLangForTts', () => {
  it('pulls English examples from mixed pattern reply', () => {
    const reply =
      'В предложении «The plane hit the tower» причастный оборот добавляет направление. ' +
      '• «Поезд приближался издалека.» → «The train hit the station coming from afar.»\n' +
      '• «Мяч упал на крышу.» → «The ball hit the roof falling from above.»\n' +
      'Напишите новое предложение с такой же структурой.';
    const out = extractStudyLangForTts(reply, 'en');
    assert.match(out, /The train hit the station coming from afar/);
    assert.match(out, /The ball hit the roof falling from above/);
    assert.doesNotMatch(out, /Напишите/);
  });
});
