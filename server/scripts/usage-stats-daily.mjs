#!/usr/bin/env node
/**
 * Daily usage report → Telegram (cron on VPS).
 *
 *   node server/scripts/usage-stats-daily.mjs
 *   node server/scripts/usage-stats-daily.mjs --dry-run
 *   node server/scripts/usage-stats-daily.mjs --force   # ignore once-per-day guard
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN — bot from @BotFather (same as mini app)
 *   TELEGRAM_STATS_CHAT_IDS — your Telegram user id (private chat_id = user id)
 *   STATS_DAILY_SENT_FILE — optional path to last-sent marker (default /var/lib/seashell/...)
 *   Each recipient must /start the bot once.
 */
import '../load-env.js';
import pg from 'pg';
import { fetchTodayUsageStats, formatUsageStatsTelegram, mskDayKey } from '../usageStats.js';
import { sendStatsToAdmins } from '../telegramNotify.js';
import { dailyStatsSendDecision, markStatsSentDay } from '../statsDailyGuard.js';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const decision = dailyStatsSendDecision({ force });
if (decision.skip) {
  console.log(`Skip: daily stats already sent for ${decision.dayKey} (MSK)`);
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const stats = await fetchTodayUsageStats(pool);
  stats.dayKey = decision.dayKey ?? mskDayKey();
  const text = formatUsageStatsTelegram(stats);
  const result = await sendStatsToAdmins(text, { dryRun });
  if (!dryRun) {
    markStatsSentDay(stats.dayKey);
    console.log(`Done: sent to ${result.sent} chat(s) for ${stats.dayKey}`);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
