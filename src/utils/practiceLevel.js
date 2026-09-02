import { loadSettings, updateSettings } from './settings.js';

export const PRACTICE_LEVELS = [
  { code: 'beginner', cefr: 'A1', labelKey: 'practice.level.beginner', hintKey: 'practice.level.beginnerHint' },
  { code: 'elementary', cefr: 'A2', labelKey: 'practice.level.elementary', hintKey: 'practice.level.elementaryHint' },
  {
    code: 'intermediate',
    cefr: 'B1',
    labelKey: 'practice.level.intermediate',
    hintKey: 'practice.level.intermediateHint',
  },
  { code: 'upper', cefr: 'B2', labelKey: 'practice.level.upper', hintKey: 'practice.level.upperHint' },
  { code: 'advanced', cefr: 'C1', labelKey: 'practice.level.advanced', hintKey: 'practice.level.advancedHint' },
];

export const DEFAULT_PRACTICE_LEVEL = 'intermediate';

const LEVEL_CODES = new Set(PRACTICE_LEVELS.map((l) => l.code));

export function normalizePracticeLevel(code) {
  const c = String(code ?? '').trim().toLowerCase();
  return LEVEL_CODES.has(c) ? c : DEFAULT_PRACTICE_LEVEL;
}

export function getPracticeLevel() {
  return normalizePracticeLevel(loadSettings().practiceLevel);
}

export function setPracticeLevel(code) {
  updateSettings({ practiceLevel: normalizePracticeLevel(code) });
}

export function practiceLevelMeta(code) {
  return PRACTICE_LEVELS.find((l) => l.code === normalizePracticeLevel(code)) ?? PRACTICE_LEVELS[2];
}

export function resolvePracticeLevelForApi() {
  return getPracticeLevel();
}
