import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { studyExampleUsesHeadword } from '../dictionaryStudyLang.js';

describe('studyExampleUsesHeadword — Russian forms', () => {
  it('accepts plural adjective form for одинаковый', () => {
    assert.equal(
      studyExampleUsesHeadword('одинаковый', 'Эти кошки одинаковые', 'ru'),
      true,
    );
  });

  it('accepts feminine form', () => {
    assert.equal(
      studyExampleUsesHeadword('одинаковый', 'Эта кошка одинаковая', 'ru'),
      true,
    );
  });

  it('rejects unrelated paraphrase', () => {
    assert.equal(studyExampleUsesHeadword('одинаковый', 'Эти кошки такие же', 'ru'), false);
  });

  it('English still accepts inflected forms with suffix', () => {
    assert.equal(studyExampleUsesHeadword('run', 'I run every day', 'en'), true);
    assert.equal(studyExampleUsesHeadword('run', 'I running every day', 'en'), true);
  });
});
