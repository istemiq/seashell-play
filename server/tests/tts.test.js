import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { localeUsesEspeakFallback } from '../tts.js';

describe('tts espeak fallback', () => {
  it('routes he and ko through espeak on the server', () => {
    assert.equal(localeUsesEspeakFallback('he-IL'), true);
    assert.equal(localeUsesEspeakFallback('ko-KR'), true);
    assert.equal(localeUsesEspeakFallback('ja-JP'), true);
    assert.equal(localeUsesEspeakFallback('en-US'), false);
    assert.equal(localeUsesEspeakFallback('ru-RU'), false);
  });
});
