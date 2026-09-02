#!/usr/bin/env node
/** Smoke: one LLM dictionary generation per locale (run on VPS with API keys in .env). */
import '../load-env.js';
import { generateWordExamples } from '../llmClient.js';
import { isDictionaryGenerationReady } from '../dictionaryStudyLang.js';

const samples = {
  en: 'apple',
  ru: 'дом',
  ar: 'كتاب',
  es: 'casa',
  de: 'Haus',
  fr: 'maison',
  it: 'casa',
  pt: 'casa',
  uk: 'dim',
  ba: 'Кролик',
  ja: '本',
  zh: '书',
  ko: '책',
  tr: 'ev',
  pl: 'dom',
  he: 'ספר',
  fa: 'کتاب',
  nl: 'huis',
  sv: 'hus',
  no: 'hus',
  fi: 'talo',
  el: 'σπίτι',
  da: 'hus',
  hi: 'घर',
  ur: 'گھر',
  az: 'ev',
  ug: 'uy',
  vi: 'nhà',
  cs: 'dům',
  hu: 'ház',
  ro: 'casă',
  id: 'rumah',
  ca: 'casa',
  sr: 'кућа',
};

const content = 'ru';
const results = [];

for (const [lang, word] of Object.entries(samples)) {
  if (!isDictionaryGenerationReady(lang)) {
    results.push({ lang, ok: false, err: 'not ready' });
    continue;
  }
  try {
    const t0 = Date.now();
    const payload = await generateWordExamples(word, { contentLocale: content, targetLang: lang });
    const ms = Date.now() - t0;
    const ex = Array.isArray(payload?.examples) ? payload.examples.length : 0;
    results.push({
      lang,
      ok: ex >= 5,
      ms,
      headword: String(payload?.headwordEn ?? '').slice(0, 48),
      examples: ex,
    });
  } catch (e) {
    results.push({ lang, ok: false, err: String(e?.message ?? e).slice(0, 100) });
  }
}

const ok = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok);
console.log(JSON.stringify({ ok, total: results.length, fail: fail.length, results }, null, 2));
process.exit(fail.length ? 1 : 0);
