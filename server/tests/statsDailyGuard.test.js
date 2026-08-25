import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  dailyStatsSendDecision,
  markStatsSentDay,
  readStatsSentDay,
} from '../statsDailyGuard.js';

describe('statsDailyGuard', () => {
  let tmpDir;
  const prevFile = process.env.STATS_DAILY_SENT_FILE;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seashell-stats-'));
    process.env.STATS_DAILY_SENT_FILE = path.join(tmpDir, 'sent.json');
  });

  afterEach(() => {
    if (prevFile === undefined) delete process.env.STATS_DAILY_SENT_FILE;
    else process.env.STATS_DAILY_SENT_FILE = prevFile;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('allows first send of the day', () => {
    const now = Date.parse('2026-08-10T06:00:00+03:00');
    const d = dailyStatsSendDecision({ now });
    assert.equal(d.skip, false);
    assert.equal(d.dayKey, '2026-08-10');
  });

  it('skips second send on the same Moscow day', () => {
    const now = Date.parse('2026-08-10T15:00:00+03:00');
    markStatsSentDay('2026-08-10');
    const d = dailyStatsSendDecision({ now });
    assert.equal(d.skip, true);
    assert.equal(d.reason, 'already_sent_today');
  });

  it('allows send again on next Moscow day', () => {
    markStatsSentDay('2026-08-10');
    const now = Date.parse('2026-08-11T01:00:00+03:00');
    const d = dailyStatsSendDecision({ now });
    assert.equal(d.skip, false);
    assert.equal(d.dayKey, '2026-08-11');
  });

  it('--force bypasses guard via decision flag', () => {
    markStatsSentDay('2026-08-10');
    const d = dailyStatsSendDecision({ force: true, now: Date.parse('2026-08-10T20:00:00+03:00') });
    assert.equal(d.skip, false);
    assert.equal(readStatsSentDay(), '2026-08-10');
  });
});
