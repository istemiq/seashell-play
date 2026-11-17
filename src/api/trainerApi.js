/**
 * Сгенерированные примеры тренажёра: GET /api/trainer/examples?lesson=<id>.
 * Ответ: { found, pending?, frames: [{axis,before,after}], wordExamples: {id: text} }.
 * found:false — генерация ещё идёт/не запускалась; фронт работает на бандловых данных.
 */
import { apiUrl } from './apiUrl.js';
import { buildAuthHeaders } from './buildAuthHeaders.js';
import { networkFetchError } from './apiErrors.js';

export async function fetchTrainerExamples(lessonId) {
  const q = new URLSearchParams({ lesson: lessonId });
  let r;
  try {
    r = await fetch(apiUrl(`/trainer/examples?${q}`), {
      headers: { ...(await buildAuthHeaders()) },
    });
  } catch (e) {
    throw new Error(e?.name === 'TypeError' ? networkFetchError(e) : String(e?.message || e));
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
