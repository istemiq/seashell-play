/**
 * Контент тренажёра смолтолка (English, beginner, урок 2).
 * Словарь строится на местоимениях/глаголах урока 1 — новые слова
 * добавляются порцией (правило накопления, см. server/trainerLessons.js).
 * Шаг: короткая реплика с пропуском (before/after), ситуация на языке UI,
 * две опции с семантическими тегами и объяснением сдвига смысла.
 */
/**
 * Уровень 0 — словарь к уроку. Карточка = картинка + слово + перевод
 * «за шторкой» (i18n-ключ trKey). Картинки: public/trainer/smalltalk/<id>.png
 */
export const SMALLTALK_WORDS_EN = [
  { id: 'hello', word: 'hello', trKey: 'trainer.word.hello' },
  { id: 'bye', word: 'bye', trKey: 'trainer.word.bye' },
  { id: 'please', word: 'please', trKey: 'trainer.word.please' },
  { id: 'thanks', word: 'thanks', trKey: 'trainer.word.thanks' },
  { id: 'sorry', word: 'sorry', trKey: 'trainer.word.sorry' },
  { id: 'yes', word: 'yes', trKey: 'trainer.word.yes' },
  { id: 'no', word: 'no', trKey: 'trainer.word.no' },
  { id: 'good', word: 'good', trKey: 'trainer.word.good' },
  { id: 'morning', word: 'morning', trKey: 'trainer.word.morning' },
  { id: 'evening', word: 'evening', trKey: 'trainer.word.evening' },
  { id: 'night', word: 'night', trKey: 'trainer.word.night' },
  { id: 'name', word: 'name', trKey: 'trainer.word.name' },
  { id: 'nice', word: 'nice', trKey: 'trainer.word.nice' },
  { id: 'meet', word: 'meet', trKey: 'trainer.word.meet' },
  { id: 'fine', word: 'fine', trKey: 'trainer.word.fine' },
];

export const SMALLTALK_STEPS_EN = [
  {
    axis: 'trainer.smalltalk.axisGreet',
    before: '— ',
    after: '! Nice to meet you.',
    situation: 'trainer.smalltalk.sit1',
    target: 'Hello',
    options: [
      { word: 'Hello', tag: 'trainer.smalltalk.tagGreet', text: 'trainer.smalltalk.greetRight' },
      { word: 'Bye', tag: 'trainer.smalltalk.tagFarewell', text: 'trainer.smalltalk.greetWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisFarewell',
    before: '— ',
    after: '! Good night.',
    situation: 'trainer.smalltalk.sit2',
    target: 'Bye',
    options: [
      { word: 'Bye', tag: 'trainer.smalltalk.tagFarewell', text: 'trainer.smalltalk.byeRight' },
      { word: 'Hello', tag: 'trainer.smalltalk.tagGreet', text: 'trainer.smalltalk.byeWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisYes',
    before: '— Is it good? — ',
    after: ', it is good.',
    situation: 'trainer.smalltalk.sit3',
    target: 'Yes',
    options: [
      { word: 'Yes', tag: 'trainer.smalltalk.tagAgree', text: 'trainer.smalltalk.yesRight' },
      { word: 'No', tag: 'trainer.smalltalk.tagRefuse', text: 'trainer.smalltalk.yesWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisNo',
    before: '— Do you run? — ',
    after: ', I sleep.',
    situation: 'trainer.smalltalk.sit4',
    target: 'No',
    options: [
      { word: 'No', tag: 'trainer.smalltalk.tagRefuse', text: 'trainer.smalltalk.noRight' },
      { word: 'Yes', tag: 'trainer.smalltalk.tagAgree', text: 'trainer.smalltalk.noWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisPlease',
    before: '— Read the book, ',
    after: '!',
    situation: 'trainer.smalltalk.sit5',
    target: 'please',
    options: [
      { word: 'please', tag: 'trainer.smalltalk.tagAsk', text: 'trainer.smalltalk.pleaseRight' },
      { word: 'thanks', tag: 'trainer.smalltalk.tagThank', text: 'trainer.smalltalk.pleaseWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisThanks',
    before: '— The tea is good. — ',
    after: '!',
    situation: 'trainer.smalltalk.sit6',
    target: 'Thanks',
    options: [
      { word: 'Thanks', tag: 'trainer.smalltalk.tagThank', text: 'trainer.smalltalk.thanksRight' },
      { word: 'Sorry', tag: 'trainer.smalltalk.tagSorry', text: 'trainer.smalltalk.thanksWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisSorry',
    before: '— I eat your food. — ',
    after: '!',
    situation: 'trainer.smalltalk.sit7',
    target: 'Sorry',
    options: [
      { word: 'Sorry', tag: 'trainer.smalltalk.tagSorry', text: 'trainer.smalltalk.sorryRight' },
      { word: 'Thanks', tag: 'trainer.smalltalk.tagThank', text: 'trainer.smalltalk.sorryWrong' },
    ],
  },
  {
    axis: 'trainer.smalltalk.axisNight',
    before: '— She sleeps. Good ',
    after: '!',
    situation: 'trainer.smalltalk.sit8',
    target: 'night',
    options: [
      { word: 'night', tag: 'trainer.smalltalk.tagNight', text: 'trainer.smalltalk.nightRight' },
      { word: 'morning', tag: 'trainer.smalltalk.tagMorning', text: 'trainer.smalltalk.nightWrong' },
    ],
  },
];

/**
 * Шаблоны контрастных осей для сгенерированных сервером фреймов
 * (GET /api/trainer/examples?lesson=smalltalk-en). Инсайты общие для
 * любой рамки оси — контраст слов не меняется от реплики к реплике.
 */
export const SMALLTALK_AXES_EN = {
  'hello-bye': {
    axis: 'trainer.smalltalk.axisGreet',
    target: 'Hello',
    options: [
      { word: 'Hello', tag: 'trainer.smalltalk.tagGreet', text: 'trainer.smalltalk.greetRight' },
      { word: 'Bye', tag: 'trainer.smalltalk.tagFarewell', text: 'trainer.smalltalk.greetWrong' },
    ],
  },
  'bye-hello': {
    axis: 'trainer.smalltalk.axisFarewell',
    target: 'Bye',
    options: [
      { word: 'Bye', tag: 'trainer.smalltalk.tagFarewell', text: 'trainer.smalltalk.byeRight' },
      { word: 'Hello', tag: 'trainer.smalltalk.tagGreet', text: 'trainer.smalltalk.byeWrong' },
    ],
  },
  'yes-no': {
    axis: 'trainer.smalltalk.axisYes',
    target: 'Yes',
    options: [
      { word: 'Yes', tag: 'trainer.smalltalk.tagAgree', text: 'trainer.smalltalk.yesRight' },
      { word: 'No', tag: 'trainer.smalltalk.tagRefuse', text: 'trainer.smalltalk.yesWrong' },
    ],
  },
  'no-yes': {
    axis: 'trainer.smalltalk.axisNo',
    target: 'No',
    options: [
      { word: 'No', tag: 'trainer.smalltalk.tagRefuse', text: 'trainer.smalltalk.noRight' },
      { word: 'Yes', tag: 'trainer.smalltalk.tagAgree', text: 'trainer.smalltalk.noWrong' },
    ],
  },
  'please-thanks': {
    axis: 'trainer.smalltalk.axisPlease',
    target: 'please',
    options: [
      { word: 'please', tag: 'trainer.smalltalk.tagAsk', text: 'trainer.smalltalk.pleaseRight' },
      { word: 'thanks', tag: 'trainer.smalltalk.tagThank', text: 'trainer.smalltalk.pleaseWrong' },
    ],
  },
  'thanks-sorry': {
    axis: 'trainer.smalltalk.axisThanks',
    target: 'Thanks',
    options: [
      { word: 'Thanks', tag: 'trainer.smalltalk.tagThank', text: 'trainer.smalltalk.thanksRight' },
      { word: 'Sorry', tag: 'trainer.smalltalk.tagSorry', text: 'trainer.smalltalk.thanksWrong' },
    ],
  },
  'sorry-thanks': {
    axis: 'trainer.smalltalk.axisSorry',
    target: 'Sorry',
    options: [
      { word: 'Sorry', tag: 'trainer.smalltalk.tagSorry', text: 'trainer.smalltalk.sorryRight' },
      { word: 'Thanks', tag: 'trainer.smalltalk.tagThank', text: 'trainer.smalltalk.sorryWrong' },
    ],
  },
  'night-morning': {
    axis: 'trainer.smalltalk.axisNight',
    target: 'night',
    options: [
      { word: 'night', tag: 'trainer.smalltalk.tagNight', text: 'trainer.smalltalk.nightRight' },
      { word: 'morning', tag: 'trainer.smalltalk.tagMorning', text: 'trainer.smalltalk.nightWrong' },
    ],
  },
};

/**
 * Превращает сгенерированные фреймы {axis, before, after} в шаги тренажёра
 * по шаблону оси. Невалидные/неизвестные оси отбрасываются.
 */
export function smalltalkGeneratedSteps(frames) {
  return (Array.isArray(frames) ? frames : [])
    .map((f) => {
      const tpl = SMALLTALK_AXES_EN[String(f?.axis || '')];
      if (!tpl || typeof f?.before !== 'string' || typeof f?.after !== 'string') return null;
      const words = tpl.options.map((o) => o.word.toLowerCase());
      const target = words.includes(String(f?.target || '').toLowerCase())
        ? tpl.options[words.indexOf(String(f.target).toLowerCase())].word
        : tpl.target;
      return {
        axis: tpl.axis,
        before: f.before,
        after: f.after,
        situation: 'trainer.sitExtra',
        target,
        options: tpl.options,
      };
    })
    .filter(Boolean);
}
