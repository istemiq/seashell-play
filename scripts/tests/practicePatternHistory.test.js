import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  patternHistoryTitle,
  upsertPatternHistoryCache,
  loadPatternHistoryCache,
  removePatternHistoryCache,
  savePatternHistoryCache,
} from '../src/utils/practicePatternHistory.js';

describe('practicePatternHistory', () => {
  it('truncates long pattern titles', () => {
    const long = 'A'.repeat(80);
    const title = patternHistoryTitle(long);
    assert.equal(title.length, 72);
    assert.match(title, /…$/);
  });

  it('upserts and removes cached sessions per learn locale', () => {
    const store = {};
    const original = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
      },
    };

    try {
      upsertPatternHistoryCache('ru', {
        id: 1,
        patternSeed: 'Я всю ночь этим занимаюсь',
        targetLang: 'ru',
        updatedAt: 100,
      });
      upsertPatternHistoryCache('ru', {
        id: 2,
        patternSeed: 'Rosehips are rich in vitamin C',
        targetLang: 'ru',
        updatedAt: 200,
      });
      const list = loadPatternHistoryCache('ru');
      assert.equal(list.length, 2);
      assert.equal(list[0].id, 2);

      removePatternHistoryCache('ru', 2);
      assert.equal(loadPatternHistoryCache('ru').length, 1);

      savePatternHistoryCache('en', [{ id: 9, patternSeed: 'Test', targetLang: 'en', updatedAt: 1 }]);
      assert.equal(loadPatternHistoryCache('en').length, 1);
      assert.equal(loadPatternHistoryCache('ru').length, 1);
    } finally {
      globalThis.localStorage = original;
    }
  });
});
