/**
 * Тренажёры: раздача сгенерированных примеров урока.
 * Первый запрос урока (если в базе пусто) триггерит LLM-генерацию
 * в фоне; последующие читают готовый payload из trainer_examples.
 */
import { getDbPool } from '../db.js';
import { respondDatabaseError } from '../routeHelpers.js';
import { trainerLesson } from '../trainerLessons.js';
import { generateTrainerLesson } from '../trainerGenerator.js';

const generating = new Set();

async function generateAndStore(lessonId) {
  const payload = await generateTrainerLesson(lessonId);
  await getDbPool().query(
    `INSERT INTO trainer_examples (lesson_id, payload, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (lesson_id) DO UPDATE SET payload = EXCLUDED.payload, created_at = EXCLUDED.created_at`,
    [lessonId, payload, Date.now()],
  );
}

export function registerTrainerRoutes(app) {
  app.get('/api/trainer/examples', async (req, res) => {
    const lessonId = String(req.query.lesson || '').trim();
    const lesson = trainerLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'unknown_lesson' });
    }
    try {
      const { rows } = await getDbPool().query(
        'SELECT payload FROM trainer_examples WHERE lesson_id = $1',
        [lessonId],
      );
      if (rows.length) {
        return res.json({ found: true, lesson: lessonId, ...rows[0].payload });
      }
      // Ленивая генерация при первом обращении — в фоне, без блокировки ответа.
      if (!generating.has(lessonId)) {
        generating.add(lessonId);
        generateAndStore(lessonId)
          .catch((e) => console.error(`trainer generate ${lessonId}:`, e?.message || e))
          .finally(() => generating.delete(lessonId));
      }
      return res.json({ found: false, pending: true, lesson: lessonId });
    } catch (e) {
      return respondDatabaseError(res, e);
    }
  });
}
