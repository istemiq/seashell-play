/**
 * Генерация примеров тренажёра через LLM (DeepSeek по умолчанию).
 * Один прогон на урок: результат пишется в trainer_examples и
 * раздаётся всем пользователям без повторных обращений к модели.
 *
 * Жёсткое правило: каждое слово сгенерированной фразы — из
 * allowedTrainerWords(lesson). Валидатор отбраковывает ответ с
 * новыми словами и даёт модели ещё попытку с явным списком ошибок.
 */
import { llmChatCompletion } from './llmClient.js';
import { trainerLesson, cumulativeVocab, allowedTrainerWords } from './trainerLessons.js';

const MAX_ATTEMPTS = 3;

function tokenize(text) {
  return String(text || '').toLowerCase().match(/[a-z']+/g) || [];
}

function extractJson(content) {
  const m = String(content || '').match(/\{[\s\S]*\}/);
  return m ? m[0] : String(content || '');
}

export function buildTrainerLessonMessages(lesson, feedback = null) {
  const vocab = [...cumulativeVocab(lesson.id)];
  const system =
    'You create practice sentences for absolute-beginner language learners. ' +
    'You answer with strict JSON only.';
  const axisLines = lesson.axes
    .map((a) => `- "${a.id}" → the gap is filled by either "${a.target}" or "${a.wrong}" — whichever is correct in YOUR sentence`)
    .join('\n');
  const user = [
    `Generate practice material for the "${lesson.id}" lesson (target language: ${lesson.targetLang}).`,
    '',
    'VOCABULARY the student has already learned — the ONLY content words allowed:',
    `  ${vocab.join(', ')}`,
    '',
    'Also allowed:',
    `- grammar forms of the lesson: ${(lesson.extraForms || []).join(', ')}`,
    `- carrier nouns for frame sentences: ${(lesson.carrierWords || []).join(', ')}`,
    `- glue words: ${(lesson.functionWords || []).join(', ')}`,
    '',
    'ABSOLUTE RULE: every word you write inside "before", "after" and "wordExamples" ' +
      'values MUST be in the lists above (case-insensitive). No other words: no names, ' +
      'places, adjectives or adverbs outside the lists.',
    '',
    'Return STRICT JSON:',
    '{',
    '  "frames": [',
    '    {"axis": "<axis-id>", "before": "<text before the gap>", "after": "<text after the gap>", "target": "<the correct gap word>"}',
    '  ],',
    '  "wordExamples": {"<vocabulary-word>": "<one simple sentence using it>"}',
    '}',
    '',
    `FRAMES: exactly ${lesson.framesPerAxis || 2} frames per axis (${lesson.axes.length * (lesson.framesPerAxis || 2)} total).`,
    '"before" + [target] + "after" must form one correct, very simple sentence.',
    '"target" MUST be exactly one of the two forms listed for that axis (the one that is correct in your sentence).',
    'Keep surrounding spaces inside before/after. Vary the verbs across frames.',
    'Axes:',
    axisLines,
    '',
    `wordExamples: one short sentence per vocabulary word (${vocab.length} keys, lowercase word as key).`,
  ];
  if (feedback?.length) {
    user.push(
      '',
      'Your previous answer was rejected. Forbidden words used:',
      ...feedback.slice(0, 12).map((f) => `- ${f}`),
      'Regenerate the WHOLE JSON obeying the word lists.',
    );
  }
  return [
    { role: 'system', content: system },
    { role: 'user', content: user.join('\n') },
  ];
}

/**
 * Валидация ответа модели. Возвращает { frames, wordExamples, errors } —
 * frames/wordExamples уже очищены от невалидных элементов.
 */
export function validateTrainerPayload(payload, lesson, allowed) {
  const errors = [];
  const frames = [];
  const seen = new Set();
  const axisIds = new Set(lesson.axes.map((a) => a.id));
  const axisById = new Map(lesson.axes.map((a) => [a.id, a]));
  const perAxis = new Map();

  for (const f of Array.isArray(payload?.frames) ? payload.frames : []) {
    const axis = String(f?.axis || '').trim();
    if (!axisIds.has(axis)) {
      errors.push(`frame axis "${axis}" is unknown`);
      continue;
    }
    const spec = axisById.get(axis);
    const pair = [spec.target.toLowerCase(), spec.wrong.toLowerCase()];
    const target = String(f?.target || '').trim();
    // target берём из предложения (форму диктует грамматика фрейма),
    // но он обязан быть одной из двух форм оси.
    const canon = pair.includes(target.toLowerCase())
      ? (spec.target.toLowerCase() === target.toLowerCase() ? spec.target : spec.wrong)
      : null;
    if (!canon) {
      errors.push(`frame ${axis}: target "${target}" is not in pair [${pair.join(', ')}]`);
      continue;
    }
    const before = String(f?.before ?? '');
    const after = String(f?.after ?? '');
    const sentence = `${before}${target}${after}`;
    const bad = tokenize(sentence).filter((tk) => !allowed.has(tk));
    if (bad.length) {
      errors.push(`frame "${sentence.trim()}": forbidden words [${[...new Set(bad)].join(', ')}]`);
      continue;
    }
    const key = `${axis}|${before.trim()}|${after.trim()}`;
    if (seen.has(key) || !sentence.trim()) continue;
    const count = perAxis.get(axis) || 0;
    if (count >= (lesson.framesPerAxis || 2)) continue;
    perAxis.set(axis, count + 1);
    seen.add(key);
    frames.push({ axis, before, after, target: canon });
  }

  const vocab = cumulativeVocab(lesson.id);
  const wordExamples = {};
  const raw = payload?.wordExamples && typeof payload.wordExamples === 'object'
    ? payload.wordExamples
    : {};
  for (const [k, v] of Object.entries(raw)) {
    const id = k.toLowerCase();
    const text = String(v || '').trim();
    if (!vocab.has(id) || !text) continue;
    const tokens = tokenize(text);
    const bad = tokens.filter((tk) => !allowed.has(tk));
    if (bad.length) {
      errors.push(`wordExample "${id}": forbidden words [${[...new Set(bad)].join(', ')}]`);
      continue;
    }
    const forms = [id, ...(lesson.wordForms?.[id] || [])];
    if (!tokens.some((tk) => forms.includes(tk))) {
      errors.push(`wordExample "${id}" does not contain the word or its form`);
      continue;
    }
    wordExamples[id] = text;
  }
  return { frames, wordExamples, errors };
}

export async function generateTrainerLesson(lessonId) {
  const lesson = trainerLesson(lessonId);
  if (!lesson) throw new Error(`Unknown trainer lesson: ${lessonId}`);
  const allowed = allowedTrainerWords(lesson);

  let feedback = null;
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let content;
    try {
      content = await llmChatCompletion({
        messages: buildTrainerLessonMessages(lesson, feedback),
        temperature: 0.7,
        max_tokens: 2500,
      });
      const parsed = JSON.parse(extractJson(content));
      const { frames, wordExamples, errors } = validateTrainerPayload(parsed, lesson, allowed);
      if (frames.length || Object.keys(wordExamples).length) {
        return {
          version: 1,
          lesson: lessonId,
          frames,
          wordExamples,
          rejected: errors,
        };
      }
      lastError = new Error(`empty payload (errors: ${errors.slice(0, 3).join('; ') || 'none'})`);
      feedback = errors;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      feedback = feedback || [];
    }
  }
  throw lastError || new Error('trainer generation failed');
}
