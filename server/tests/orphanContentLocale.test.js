import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { UI_LOCALES } from '../../src/i18n/config.js';
import {
  defaultCardLocaleForOrphanStudy,
  isStudyWithoutDedicatedUi,
  resolveContentLocaleForOrphanStudyFromSettings,
  showCardPickerForOrphanStudy,
} from '../../src/modules/orphanContentLocaleLogic.js';

const UI_CODES = UI_LOCALES.map((l) => l.code);
const ORPHAN_STUDIES = ['fi', 'pl', 'de', 'vi', 'zh', 'cs', 'hu', 'ro', 'id', 'he', 'ca', 'sr'];

function normalizeCard(code) {
  const c = String(code ?? '').trim();
  return UI_CODES.includes(c) ? c : '';
}

describe('orphan study modules — content locale resolution', () => {
  for (const study of ORPHAN_STUDIES) {
    it(`${study}: shows card translation picker (no dedicated UI)`, () => {
      assert.equal(showCardPickerForOrphanStudy(study), true);
      assert.equal(isStudyWithoutDedicatedUi(study), true);
    });
  }

  for (const ui of UI_CODES) {
    it(`orphan fi + ui ${ui} (not pinned) → content locale ${ui}`, () => {
      const resolved = resolveContentLocaleForOrphanStudyFromSettings(
        { uiLocale: ui, cardLocalePinned: false, cardLocale: '' },
        normalizeCard,
        defaultCardLocaleForOrphanStudy,
      );
      assert.equal(resolved, ui);
    });
  }

  it('orphan fi + ui en + pinned uk → uk', () => {
    const resolved = resolveContentLocaleForOrphanStudyFromSettings(
      { uiLocale: 'en', cardLocalePinned: true, cardLocale: 'uk' },
      normalizeCard,
      defaultCardLocaleForOrphanStudy,
    );
    assert.equal(resolved, 'uk');
  });

  it('orphan pl + uiLocale pl (normalizes to en) → en', () => {
    const resolved = resolveContentLocaleForOrphanStudyFromSettings(
      { uiLocale: 'pl', cardLocalePinned: false, cardLocale: '' },
      normalizeCard,
      defaultCardLocaleForOrphanStudy,
    );
    assert.equal(resolved, 'en');
  });

  it('default orphan card locale is ru', () => {
    assert.equal(defaultCardLocaleForOrphanStudy(), 'ru');
  });

  for (const ui of ['ru', 'ar', 'es', 'uk', 'tr']) {
    it(`dedicated UI study ${ui} is not orphan`, () => {
      assert.equal(isStudyWithoutDedicatedUi(ui), false);
    });
  }
});
