import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STUDY_LANG_META } from '../dictionaryStudyLang.js';
import { extractStudyLangForTts, resolveSpeakText } from '../ttsSpeakText.js';

const MIXED_RU_UI = {
  en:
    'В предложении «The plane hit the tower» причастный оборот добавляет направление. ' +
    '• «Поезд приближался издалека.» → «The train hit the station coming from afar.»\n' +
    '• «Мяч упал на крышу.» → «The ball hit the roof falling from above.»\n' +
    'Напишите новое предложение.',
  de:
    'Объяснение по-русски. ' +
    '• «Поезд шёл издалека.» → «Der Zug traf den Bahnhof, von weit her kommend.»\n' +
    '• «Мяч падал.» → «Der Ball traf das Dach, von oben fallend.»\n' +
    'Schreiben Sie einen neuen Satz.',
  es:
    'Explicación en ruso. ' +
    '• «Поезд приближался.» → «El tren golpeó la estación viniendo de lejos.»\n' +
    '• «Мяч упал.» → «La pelota golpeó el tejado cayendo desde arriba.»\n' +
    'Escribe una oración nueva.',
  fr:
    'Explication russe. ' +
    '• «Поезд шёл.» → «Le train a frappé la gare en venant de loin.»\n' +
    'Écrivez une phrase.',
  ja:
    '説明 по-русски было бы здесь. ' +
    '• «電車が遠くから来た。» → 「電車が駅にぶつかり、遠くから来ながら。」\n' +
    '• «ボールが落ちた。» → 「ボールが屋根に当たり、上から落ちながら。」\n' +
    '同じ構造で新しい文を書いてください。',
  ar:
    'شرح بالروсية. ' +
    '• «قطار قاد من بعيد.» → «ضرب القطار المحطة وهو قادم من بعيد.»\n' +
    'اكتب جملة جديدة.',
  zh:
    '俄语说明。' +
    '• «火车从远处来。» → 「火车撞上车站，从远处开来。」\n' +
    '请写一个新句子。',
  el:
    'Εξήγηση στα ρωσικά. ' +
    '• «Το τρένο ήρθε.» → «Το τρένο χτύπησε τον σταθμό, έρχοντας από μακριά.»\n' +
    'Γράψτε μια νέα πρόταση.',
  he:
    'הסבר ברוסית. ' +
    '• «הרכבת באה מרחוק.» → «הרכבת פגעה בתחנה בזמן שהיא באה מרחוק.»\n' +
    'כתוב משפט חדש.',
};

const EXPECT_SNIPPET = {
  en: 'The train hit the station',
  de: 'Der Zug traf den Bahnhof',
  es: 'El tren golpeó la estación',
  fr: 'Le train a frappé la gare',
  ja: '電車が駅にぶつかり',
  ar: 'ضرب القطار المحطة',
  zh: '火车撞上车站',
  el: 'Το τρένο χτύπησε',
  he: 'הרכבת פגעה',
};

function studyOnly(code, text) {
  const out = extractStudyLangForTts(text, code);
  assert.ok(out.length >= 8, `${code}: empty or too short: "${out}"`);
  assert.doesNotMatch(out, /[А-Яа-яЁё]/, `${code}: still contains Cyrillic UI: "${out}"`);
  assert.ok(out.includes(EXPECT_SNIPPET[code]), `${code}: missing study example: "${out}"`);
}

describe('extractStudyLangForTts — mixed RU UI', () => {
  for (const code of Object.keys(MIXED_RU_UI)) {
    it(`extracts ${code} examples without Cyrillic`, () => {
      studyOnly(code, MIXED_RU_UI[code]);
    });
  }

  it('ru returns full reply', () => {
    const reply = 'Это предложение на русском. Примеры: «Поезд шёл.»';
    assert.equal(extractStudyLangForTts(reply, 'ru'), reply);
  });
});

describe('resolveSpeakText prefers replyTts', () => {
  it('uses clean replyTts for de', async () => {
    const reply = MIXED_RU_UI.de;
    const tts = 'Der Zug traf den Bahnhof, von weit her kommend.';
    const out = await resolveSpeakText({ text: reply, ttsText: tts, locale: 'de-DE', targetLang: 'de' });
    assert.equal(out, tts);
  });

  it('rejects replyTts with Cyrillic for latin study langs', async () => {
    const reply = MIXED_RU_UI.de;
    const tts = 'Der Zug. Это русский текст.';
    const out = await resolveSpeakText({ text: reply, ttsText: tts, locale: 'de-DE', targetLang: 'de' });
    assert.doesNotMatch(out, /[А-Яа-яЁё]/);
    assert.match(out, /Der Zug traf/);
  });
});

describe('all study langs have ttsLocale', () => {
  for (const [code, meta] of Object.entries(STUDY_LANG_META)) {
    it(`${code} has ttsLocale`, () => {
      assert.ok(meta.ttsLocale, code);
    });
  }
});
