import { extractStudyLangForTts, resolveSpeakText } from '../ttsSpeakText.js';

const mixed =
  'RU: объяснение. • «Поезд.» → «STUDY_EXAMPLE_1»\n• «Мяч.» → «STUDY_EXAMPLE_2»\nНапишите.';

const cases = [
  ['en', 'The train hit the station coming from afar.', 'The ball hit the roof falling from above.'],
  ['de', 'Der Zug traf den Bahnhof, von weit her kommend.', 'Der Ball traf das Dach, von oben fallend.'],
  ['es', 'El tren golpeó la estación viniendo de lejos.', 'La pelota golpeó el tejado cayendo desde arriba.'],
  ['fr', 'Le train a frappé la gare en venant de loin.', 'La balle a frappé le toit.'],
  ['ja', '電車が駅にぶつかり、遠くから来ながら。', 'ボールが屋根に当たり、上から落ちながら。'],
  ['ar', 'ضرب القطار المحطة وهو قادم من بعيد.', 'ضربت الكرة السقف.'],
  ['zh', '火车撞上车站，从远处开来。', '球砸到屋顶，从上方落下。'],
  ['el', 'Το τρένο χτύπησε τον σταθμό, έρχοντας από μακριά.', 'Η μπάλα χτύπησε τη στέγη.'],
  ['he', 'הרכבת פגעה בתחנה בזמן שהיא באה מרחוק.', 'הכדור פגע בגג.'],
  ['ko', '기차가 역에 부딪혔다.', '공이 지붕에 맞았다.'],
  ['hi', 'ट्रेन स्टेशन से टकराई।', 'गेंद छत से टकराई।'],
];

for (const [lang, ex1, ex2] of cases) {
  const reply = mixed
    .replace('STUDY_EXAMPLE_1', ex1)
    .replace('STUDY_EXAMPLE_2', ex2);
  const extracted = extractStudyLangForTts(reply, lang);
  const resolved = await resolveSpeakText({
    text: reply,
    ttsText: null,
    locale: `${lang}-${lang.toUpperCase()}`,
    targetLang: lang,
  });
  const ok =
    extracted.includes(ex1.slice(0, Math.min(12, ex1.length))) &&
    !/[\u0400-\u04FF]/.test(extracted);
  console.log(`${lang}: ${ok ? 'OK' : 'FAIL'}`);
  console.log(`  extract: ${extracted.slice(0, 90)}${extracted.length > 90 ? '…' : ''}`);
  console.log(`  resolve: ${resolved.slice(0, 90)}${resolved.length > 90 ? '…' : ''}`);
}
