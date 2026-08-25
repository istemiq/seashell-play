#!/usr/bin/env node
import { ensureMp3Cached } from '../tts.js';

const cases = [
  { text: 'שלום עולם', locale: 'he-IL' },
  { text: '안녕하세요', locale: 'ko-KR' },
];

for (const c of cases) {
  const r = await ensureMp3Cached({ ...c, rate: 0.95 });
  console.log(c.locale, r.relUrl);
}
