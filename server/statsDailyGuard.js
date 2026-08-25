/**
 * Ensure usage stats Telegram report is sent at most once per Moscow calendar day.
 */
import fs from 'fs';
import path from 'path';
import { mskDayKey } from './usageStats.js';

export function statsSentStatePath() {
  const raw = String(process.env.STATS_DAILY_SENT_FILE ?? '').trim();
  if (raw) return raw;
  return '/var/lib/seashell/stats-daily-sent.json';
}

export function readStatsSentDay() {
  try {
    const raw = fs.readFileSync(statsSentStatePath(), 'utf8');
    const parsed = JSON.parse(raw);
    const dayKey = String(parsed?.dayKey ?? '').trim();
    return dayKey || null;
  } catch {
    return null;
  }
}

export function markStatsSentDay(dayKey, { sentAt = new Date().toISOString() } = {}) {
  const filePath = statsSentStatePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ dayKey, sentAt }, null, 2), 'utf8');
}

/** @returns {{ skip: boolean, dayKey: string, reason?: string }} */
export function dailyStatsSendDecision({ force = false, now = Date.now() } = {}) {
  const dayKey = mskDayKey(now);
  if (force) return { skip: false, dayKey };
  const last = readStatsSentDay();
  if (last === dayKey) {
    return { skip: true, dayKey, reason: 'already_sent_today' };
  }
  return { skip: false, dayKey };
}

export { mskDayKey };
