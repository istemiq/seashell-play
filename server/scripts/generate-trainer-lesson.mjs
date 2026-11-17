#!/usr/bin/env node
/**
 * Ручная генерация примеров тренажёра → trainer_examples.
 * Результат раздаётся всем пользователям без повторных обращений к LLM.
 *
 *   node scripts/generate-trainer-lesson.mjs pronouns-en
 *   node scripts/generate-trainer-lesson.mjs --all
 *   node scripts/generate-trainer-lesson.mjs pronouns-en --force   # перегенерировать
 *   node scripts/generate-trainer-lesson.mjs pronouns-en --dry-run # промпт без вызова LLM
 *
 * Запускать на сервере, где есть DATABASE_URL и DEEPSEEK_API_KEY (.env).
 */
import '../load-env.js';
import { getDbPool, initDb } from '../db.js';
import { TRAINER_LESSONS, trainerLesson, allowedTrainerWords } from '../trainerLessons.js';
import { buildTrainerLessonMessages, generateTrainerLesson } from '../trainerGenerator.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
const lessonArg = args.find((a) => !a.startsWith('--'));

if (!all && !lessonArg) {
  console.error('Usage: generate-trainer-lesson.mjs <lessonId|--all> [--force] [--dry-run]');
  console.error(`Lessons: ${TRAINER_LESSONS.map((l) => l.id).join(', ')}`);
  process.exit(1);
}

const lessons = all
  ? TRAINER_LESSONS
  : [trainerLesson(lessonArg)].filter(Boolean);
if (!lessons.length) {
  console.error(`Unknown lesson: ${lessonArg}`);
  process.exit(1);
}

await initDb();
const pool = getDbPool();

for (const lesson of lessons) {
  const { rows } = await pool.query(
    'SELECT created_at FROM trainer_examples WHERE lesson_id = $1',
    [lesson.id],
  );
  if (rows.length && !force && !dryRun) {
    console.log(`skip ${lesson.id}: already generated at ${new Date(Number(rows[0].created_at)).toISOString()}`);
    continue;
  }
  if (dryRun) {
    const msgs = buildTrainerLessonMessages(lesson);
    console.log(`=== ${lesson.id} ===\n${msgs.map((m) => `[${m.role}]\n${m.content}`).join('\n\n')}\n`);
    console.log(`allowed words (${allowedTrainerWords(lesson).size}): ${[...allowedTrainerWords(lesson)].join(', ')}`);
    continue;
  }
  console.log(`generate ${lesson.id}…`);
  const payload = await generateTrainerLesson(lesson.id);
  await pool.query(
    `INSERT INTO trainer_examples (lesson_id, payload, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (lesson_id) DO UPDATE SET payload = EXCLUDED.payload, created_at = EXCLUDED.created_at`,
    [lesson.id, payload, Date.now()],
  );
  console.log(
    `ok ${lesson.id}: ${payload.frames.length} frames, ` +
      `${Object.keys(payload.wordExamples).length} word examples` +
      (payload.rejected?.length ? ` (rejected ${payload.rejected.length} invalid items)` : ''),
  );
}

await pool.end();
