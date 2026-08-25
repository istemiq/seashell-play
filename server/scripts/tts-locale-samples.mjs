#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { ensureMp3Cached } from '../tts.js';
import { resolveSpeakText } from '../ttsSpeakText.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = '/tmp/seashell-tts-samples';

const cases = [
  {
    id: 'de',
    locale: 'de-DE',
    reply:
      'Это предложение использует Partizipialphrase. ' +
      '• «Поезд шёл издалека.» → «Der Zug traf den Bahnhof, von weit her kommend.»\n' +
      '• «Мяч падал.» → «Der Ball traf das Dach, von oben fallend.»\n' +
      'Schreiben Sie einen neuen Satz.',
  },
  {
    id: 'ja',
    locale: 'ja-JP',
    reply:
      'この構文は過去形＋分詞構文です。' +
      '• «電車が遠くから来た。» → 「電車が駅にぶつかり、遠くから来ながら。」\n' +
      '• «ボールが落ちた。» → 「ボールが屋根に当たり、上から落ちながら。」\n' +
      '同じ構造で新しい文を書いてください。',
  },
  {
    id: 'ar',
    locale: 'ar-JO',
    reply:
      'شرح بالрусية. ' +
      '• «قطار قاد من بعيد.» → «ضرب القطار المحطة وهو قادم من بعيد.»\n' +
      '• «كرة سقطت.» → «ضربت الكرة السقف وهي تسقط من الأعلى.»\n' +
      'اكتب جملة جديدة.',
  },
];

await fs.mkdir(outDir, { recursive: true });

for (const c of cases) {
  const spoken = await resolveSpeakText({
    text: c.reply,
    ttsText: null,
    locale: c.locale,
    targetLang: c.id,
  });
  const { relUrl } = await ensureMp3Cached({
    text: c.reply,
    ttsText: null,
    locale: c.locale,
    rate: 0.95,
  });
  const cacheRoot = process.env.TTS_CACHE_DIR || '/var/lib/seashell-tts';
  const rel = relUrl.replace(/^\/tts\/v1\//, '').split('/');
  const srcMp3 = path.join(cacheRoot, 'v1', ...rel);
  const destMp3 = path.join(outDir, `${c.id}-fixed.mp3`);
  await fs.copyFile(srcMp3, destMp3);

  const meta = {
    locale: c.locale,
    spokenText: spoken,
    mp3: destMp3,
    bytes: (await fs.stat(destMp3)).size,
  };
  await fs.writeFile(path.join(outDir, `${c.id}-fixed.json`), JSON.stringify(meta, null, 2), 'utf8');
  console.log(`${c.id}: ${spoken.slice(0, 80)}${spoken.length > 80 ? '…' : ''}`);
  console.log(`  -> ${destMp3}`);
}

console.log(`\nDone. Files in ${outDir}`);
