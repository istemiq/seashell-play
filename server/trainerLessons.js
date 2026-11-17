/**
 * Реестр уроков-тренажёров для генерации примеров через LLM.
 *
 * Правило накопления словаря: разрешённый набор урока N = newWords всех
 * уроков 1..N (в порядке TRAINER_LESSONS) + extraForms (формы тех же
 * лексем: местоимённые падежи, глаголы 3-го лица) + carrierWords (нейтральные
 * существительные-носители, не изучаются) + functionWords (клей-фреймы).
 * Новые слова вне этих списков в сгенерированных предложениях запрещены —
 * нарушение ловит валидатор в trainerGenerator.js.
 */

export const TRAINER_LESSONS = [
  {
    id: 'pronouns-en',
    targetLang: 'en',
    level: 'beginner',
    newWords: [
      'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'eat', 'drink', 'run', 'read', 'play', 'walk', 'sleep',
    ],
    // Местоимённая парадигма + -s формы глаголов урока.
    extraForms: [
      'me', 'my', 'mine',
      'him', 'his',
      'her', 'hers',
      'us', 'our', 'ours',
      'them', 'their', 'theirs',
      'your', 'yours',
      'its',
      'eats', 'drinks', 'runs', 'reads', 'plays', 'walks', 'sleeps',
    ],
    // Нейтральные существительные-носители для рамок (This is ___ book).
    carrierWords: ['book', 'ball', 'food', 'dog', 'cat', 'water', 'tea'],
    // Служебные слова каркаса фразы.
    functionWords: [
      'look', 'at', 'now', 'this', 'is', 'a', 'the', 'see', 'with',
      'and', 'on', 'in', 'to', 'no', 'not', 'do', 'does',
    ],
    // Формы той же лексемы для wordExamples: «He runs.» — пример к «run».
    wordForms: {
      i: ['me', 'my', 'mine'],
      you: ['your', 'yours'],
      he: ['him', 'his'],
      she: ['her', 'hers'],
      it: ['its'],
      we: ['us', 'our', 'ours'],
      they: ['them', 'their', 'theirs'],
      eat: ['eats'], drink: ['drinks'], run: ['runs'], read: ['reads'],
      play: ['plays'], walk: ['walks'], sleep: ['sleeps'],
    },
    // Контрастные оси: пара форм в пропуске; правильную выбирает предложение.
    axes: [
      { id: 'i-me', target: 'me', wrong: 'i' },
      { id: 'i-my', target: 'my', wrong: 'me' },
      { id: 'he-him', target: 'he', wrong: 'him' },
      { id: 'she-her', target: 'her', wrong: 'she' },
      { id: 'we-us', target: 'us', wrong: 'we' },
      { id: 'they-them', target: 'they', wrong: 'them' },
      { id: 'you-your', target: 'your', wrong: 'you' },
      { id: 'it-its', target: 'its', wrong: 'it' },
    ],
    framesPerAxis: 2,
  },
];

export function trainerLesson(lessonId) {
  return TRAINER_LESSONS.find((l) => l.id === lessonId) || null;
}

/** Накопленный словарь: newWords урока + всех уроков до него в реестре. */
export function cumulativeVocab(lessonId) {
  const idx = TRAINER_LESSONS.findIndex((l) => l.id === lessonId);
  if (idx < 0) return new Set();
  const vocab = new Set();
  for (let i = 0; i <= idx; i += 1) {
    for (const w of TRAINER_LESSONS[i].newWords) vocab.add(w.toLowerCase());
  }
  return vocab;
}

/** Полный разрешённый набор токенов для генерации урока (lowercase). */
export function allowedTrainerWords(lesson) {
  const allowed = cumulativeVocab(lesson.id);
  for (const list of ['extraForms', 'carrierWords', 'functionWords']) {
    for (const w of lesson[list] || []) allowed.add(w.toLowerCase());
  }
  return allowed;
}
