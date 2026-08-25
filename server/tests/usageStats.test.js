import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseExcludedUserIds,
  formatUsageStatsText,
  formatUsageStatsTelegram,
  mskDayStartMs,
  classifyUserCohorts,
  describeUserActivity,
  pluralRu,
} from '../usageStats.js';

const sampleUser = {
  userId: 111,
  firstActivityAt: '2026-07-10T08:00:00.000Z',
  lastActivityAt: '2026-07-20T08:00:00.000Z',
  activeDays60d: 2,
  wordsAdded: 3,
  groupsCreated: 1,
  practiceFree: 0,
  practiceExpert: 2,
  practiceWord: 0,
  practiceMessages: 5,
  adsDictionary: 1,
  adsPractice: 0,
  customExamples: 0,
  topExpertId: 'art_historian',
  topExpertSessions: 2,
};

describe('usageStats', () => {
  const prevReviewer = process.env.VK_REVIEWER_USER_ID;
  const prevExclude = process.env.ADMIN_EXCLUDE_USER_IDS;

  beforeEach(() => {
    delete process.env.ADMIN_EXCLUDE_USER_IDS;
  });

  afterEach(() => {
    if (prevReviewer === undefined) delete process.env.VK_REVIEWER_USER_ID;
    else process.env.VK_REVIEWER_USER_ID = prevReviewer;
    if (prevExclude === undefined) delete process.env.ADMIN_EXCLUDE_USER_IDS;
    else process.env.ADMIN_EXCLUDE_USER_IDS = prevExclude;
  });

  it('parseExcludedUserIds includes reviewer and extra ids', () => {
    process.env.VK_REVIEWER_USER_ID = '1';
    process.env.ADMIN_EXCLUDE_USER_IDS = '42, 826648841';
    const ids = parseExcludedUserIds();
    assert.deepEqual(ids.sort((a, b) => a - b), [1, 42, 826648841]);
  });

  it('mskDayStartMs aligns with Moscow calendar day', () => {
    const noonUtc = Date.parse('2026-08-05T09:00:00.000Z');
    const start = mskDayStartMs(noonUtc);
    assert.equal(start, Date.parse('2026-08-05T00:00:00+03:00'));
  });

  it('pluralRu handles Russian plural forms', () => {
    assert.equal(pluralRu(1, 'слово', 'слова', 'слов'), '1 слово');
    assert.equal(pluralRu(3, 'слово', 'слова', 'слов'), '3 слова');
    assert.equal(pluralRu(5, 'слово', 'слова', 'слов'), '5 слов');
  });

  it('describeUserActivity explains concrete actions', () => {
    const text = describeUserActivity(sampleUser, { showFirst: true });
    assert.match(text, /добавил 3 слова/);
    assert.match(text, /создал 1 группу/);
    assert.match(text, /2 диалога с экспертом/);
    assert.match(text, /Искусствовед/);
    assert.match(text, /5 реплик/);
    assert.match(text, /1 рекламу за новые слова/);
  });

  it('classifyUserCohorts splits new vs returning regulars', () => {
    const since = Date.parse('2026-06-01T00:00:00+03:00');
    const { newUsers2m, regularUsers2m } = classifyUserCohorts(
      [
        { ...sampleUser, userId: 1, firstActivityAt: '2026-07-01T10:00:00.000Z', lastActivityAt: '2026-08-01T10:00:00.000Z' },
        {
          userId: 2,
          firstActivityAt: '2026-01-01T10:00:00.000Z',
          lastActivityAt: '2026-08-01T10:00:00.000Z',
          activeDays60d: 4,
          wordsAdded: 0,
          groupsCreated: 0,
          practiceFree: 0,
          practiceExpert: 0,
          practiceWord: 0,
          practiceMessages: 0,
          adsDictionary: 0,
          adsPractice: 0,
          customExamples: 0,
          topExpertId: null,
          topExpertSessions: 0,
        },
      ],
      since,
    );
    assert.deepEqual(newUsers2m.map((u) => u.userId), [1]);
    assert.deepEqual(regularUsers2m.map((u) => u.userId), [2]);
  });

  it('formatUsageStatsTelegram uses plain Russian labels for today only', () => {
    const text = formatUsageStatsTelegram({
      generatedAt: '2026-06-29T06:00:00.000Z',
      dayKey: '2026-06-29',
      users: { activeToday: 3, newToday: 1 },
      words: { today: 5 },
      sets: { today: 2 },
      practice: { sessionsToday: 2, messagesToday: 8 },
    });
    assert.match(text, /📊 Seashell — 2026-06-29/);
    assert.match(text, /Активных: 3 · новых: 1/);
    assert.match(text, /Слов: \+5/);
    assert.match(text, /Групп: \+2/);
    assert.match(text, /Диалогов: 2 · реплик: 8/);
    assert.doesNotMatch(text, /2 месяца/);
    assert.doesNotMatch(text, /за неделю/);
  });

  it('formatUsageStatsText includes readable practice summary', () => {
    const text = formatUsageStatsText({
      generatedAt: '2026-06-29T12:00:00.000Z',
      timezone: 'Europe/Moscow',
      excludedUserIds: [1],
      users: { total: 10, active24h: 3, active7d: 7, newToday: 1 },
      words: { total: 50, last24h: 5, last7d: 12, last30d: 20 },
      sets: { total: 8 },
      practice: {
        sessionsTotal: 5,
        sessions24h: 2,
        sessions7d: 3,
        messagesTotal: 30,
        messages24h: 8,
        freeSessions: 2,
        expertSessions: 2,
        wordSessions: 1,
        topExperts: [{ expertId: 'philosopher', sessions: 2 }],
      },
      recentUsers: [sampleUser],
    });
    assert.match(text, /5 диалогов всего/);
    assert.match(text, /свободных чата/);
    assert.match(text, /практика слова/);
  });
});
