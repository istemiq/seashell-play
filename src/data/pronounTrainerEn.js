/**
 * Контент тренажёра местоимений (English, beginner).
 * Шаг: фраза с пропуском (before/after), ситуация на языке UI,
 * две опции с семантическими тегами и объяснением сдвига смысла.
 * `target` — правильный вариант.
 */
export const PRONOUN_STEPS_EN = [
  {
    axis: 'trainer.pronouns.axisI',
    before: 'Look at ',
    after: ' now.',
    situation: 'trainer.pronouns.sit1',
    target: 'me',
    options: [
      { word: 'I', tag: 'trainer.pronouns.tagDoer', text: 'trainer.pronouns.i1wrong' },
      { word: 'me', tag: 'trainer.pronouns.tagTarget', text: 'trainer.pronouns.i1right' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisMy',
    before: 'Where is ',
    after: ' coffee?',
    situation: 'trainer.pronouns.sit2',
    target: 'my',
    options: [
      { word: 'my', tag: 'trainer.pronouns.tagThing', text: 'trainer.pronouns.i2right' },
      { word: 'me', tag: 'trainer.pronouns.tagToMe', text: 'trainer.pronouns.i2wrong' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisHe',
    before: '',
    after: ' knows the way.',
    situation: 'trainer.pronouns.sit3',
    target: 'He',
    options: [
      { word: 'He', tag: 'trainer.pronouns.tagSource', text: 'trainer.pronouns.i3right' },
      { word: 'Him', tag: 'trainer.pronouns.tagReceiver', text: 'trainer.pronouns.i3wrong' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisShe',
    before: 'I gave ',
    after: ' the keys.',
    situation: 'trainer.pronouns.sit4',
    target: 'her',
    options: [
      { word: 'she', tag: 'trainer.pronouns.tagSelf', text: 'trainer.pronouns.i4wrong' },
      { word: 'her', tag: 'trainer.pronouns.tagReceiver', text: 'trainer.pronouns.i4right' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisWe',
    before: 'Come with ',
    after: '.',
    situation: 'trainer.pronouns.sit5',
    target: 'us',
    options: [
      { word: 'we', tag: 'trainer.pronouns.tagWeAct', text: 'trainer.pronouns.i5wrong' },
      { word: 'us', tag: 'trainer.pronouns.tagWithUs', text: 'trainer.pronouns.i5right' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisThey',
    before: '',
    after: ' left early.',
    situation: 'trainer.pronouns.sit6',
    target: 'They',
    options: [
      { word: 'They', tag: 'trainer.pronouns.tagTheyLeft', text: 'trainer.pronouns.i6right' },
      { word: 'Them', tag: 'trainer.pronouns.tagToThem', text: 'trainer.pronouns.i6wrong' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisIt',
    before: 'The cat licked ',
    after: ' paw.',
    situation: 'trainer.pronouns.sit7',
    target: 'its',
    options: [
      { word: 'it', tag: 'trainer.pronouns.tagItself', text: 'trainer.pronouns.i7wrong' },
      { word: 'its', tag: 'trainer.pronouns.tagLink', text: 'trainer.pronouns.i7right' },
    ],
  },
  {
    axis: 'trainer.pronouns.axisYou',
    before: 'Is this ',
    after: ' bag?',
    situation: 'trainer.pronouns.sit8',
    target: 'your',
    options: [
      { word: 'you', tag: 'trainer.pronouns.tagYouSelf', text: 'trainer.pronouns.i8wrong' },
      { word: 'your', tag: 'trainer.pronouns.tagYourThing', text: 'trainer.pronouns.i8right' },
    ],
  },
];
