#!/usr/bin/env node
/**
 * Generate word-dictionary-format-sample.json for every study target × content locale.
 * Translations are mapped from the reference ru-target locale packs (correct language per locale).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = path.join(ROOT, 'server/prompts/targets');
const CONTENT_LOCALES = ['en', 'ru', 'ar', 'es', 'pt', 'fa', 'uk', 'ko', 'ja', 'it', 'tr'];
const REF_STUDY = 'ru';

const EXTRA_EN_TO = {
  ru: {
    'Please give me a glass of water. — neutral': 'Дайте, пожалуйста, стакан воды. — нейтр.',
    'The water is cold. — neutral': 'Вода холодная. — нейтр.',
    'Do you have water? — neutral': 'У вас есть вода? — нейтр.',
    'I want a glass of water. — neutral': 'Я хочу стакан воды. — нейтр.',
    'The water is very cold. — neutral': 'Вода очень холодная. — нейтр.',
    'Are you boiling the water? — neutral': 'Вы кипятите воду? — нейтр.',
    'Got any water? — informal': 'Есть водичка? — неформ.',
    'Got any water? — neutral': 'Есть водичка? — нейтр.',
    'water as a substance; drinking water; neutral': 'вода как вещество; питьевая вода; нейтр.',
  },
  uk: {
    'Please give me a glass of water. — neutral': 'Дайте, будь ласка, склянку води. — нейтр.',
    'The water is cold. — neutral': 'Вода холодна. — нейтр.',
    'Do you have water? — neutral': 'У вас є вода? — нейтр.',
    'I want a glass of water. — neutral': 'Я хочу склянку води. — нейтр.',
    'The water is very cold. — neutral': 'Вода дуже холодна. — нейтр.',
    'Are you boiling the water? — neutral': 'Ви кип’ятите воду? — нейтр.',
    'Got any water? — informal': 'Є водичка? Помираю від спраги. — розм.',
    'Got any water? — neutral': 'Є водичка? — нейтр.',
  },
  ar: {
    'Please give me a glass of water. — neutral': 'من فضلك أعطني كوباً من الماء. — محايد',
    'The water is cold. — neutral': 'الماء بارد. — محايد',
    'Do you have water? — neutral': 'هل لديك ماء؟ — محايد',
    'I want a glass of water. — neutral': 'أريد كوباً من الماء. — محايد',
    'The water is very cold. — neutral': 'الماء بارد جداً. — محايد',
    'Are you boiling the water? — neutral': 'هل تغلي الماء؟ — محايد',
    'Got any water? — informal': 'هل يوجد ماء؟ — غير رسمي',
  },
  es: {
    'Please give me a glass of water. — neutral': 'Por favor, deme un vaso de agua. — neutro',
    'The water is cold. — neutral': 'El agua está fría. — neutro',
    'Do you have water? — neutral': '¿Tiene agua? — neutro',
    'I want a glass of water. — neutral': 'Quiero un vaso de agua. — neutro',
    'The water is very cold. — neutral': 'El agua está muy fría. — neutro',
    'Are you boiling the water? — neutral': '¿Está hirviendo el agua? — neutro',
    'Got any water? — informal': '¿Hay agüita? — informal',
  },
  pt: {
    'Please give me a glass of water. — neutral': 'Por favor, me dê um copo de água. — neutro',
    'The water is cold. — neutral': 'A água está fria. — neutro',
    'Do you have water? — neutral': 'Você tem água? — neutro',
    'I want a glass of water. — neutral': 'Quero um copo de água. — neutro',
    'The water is very cold. — neutral': 'A água está muito fria. — neutro',
    'Are you boiling the water? — neutral': 'Você está fervendo a água? — neutro',
    'Got any water? — informal': 'Tem água aí? — informal',
  },
  tr: {
    'Please give me a glass of water. — neutral': 'Lütfen bana bir bardak su verin. — nötr',
    'The water is cold. — neutral': 'Su soğuk. — nötr',
    'Do you have water? — neutral': 'Suyunuz var mı? — nötr',
    'I want a glass of water. — neutral': 'Bir bardak su istiyorum. — nötr',
    'The water is very cold. — neutral': 'Su çok soğuk. — nötr',
    'Are you boiling the water? — neutral': 'Suyu kaynatıyor musunuz? — nötr',
    'Got any water? — informal': 'Su var mı? — gündelik',
  },
  it: {
    'Please give me a glass of water. — neutral': 'Per favore, mi dia un bicchiere d’acqua. — neutro',
    'The water is cold. — neutral': 'L’acqua è fredda. — neutro',
    'Do you have water? — neutral': 'Ha dell’acqua? — neutro',
    'I want a glass of water. — neutral': 'Voglio un bicchiere d’acqua. — neutro',
    'The water is very cold. — neutral': 'L’acqua è molto fredda. — neutro',
    'Are you boiling the water? — neutral': 'Sta bollendo l’acqua? — neutro',
    'Got any water? — informal': 'Hai un po’ d’acqua? — informale',
  },
  ko: {
    'Please give me a glass of water. — neutral': '물 한 잔 주세요. — 중립',
    'The water is cold. — neutral': '물이 차갑습니다. — 중립',
    'Do you have water? — neutral': '물 있어요? — 중립',
    'I want a glass of water. — neutral': '물 한 잔 원해요. — 중립',
    'The water is very cold. — neutral': '물이 아주 차가워요. — 중립',
    'Are you boiling the water? — neutral': '물 끓이고 있어요? — 중립',
    'Got any water? — informal': '물 좀 있어? — 비격식',
  },
  ja: {
    'Please give me a glass of water. — neutral': 'お水を一杯ください。 — 中立',
    'The water is cold. — neutral': '水が冷たいです。 — 中立',
    'Do you have water? — neutral': 'お水はありますか。 — 中立',
    'I want a glass of water. — neutral': 'お水を一杯ください。 — 中立',
    'The water is very cold. — neutral': '水がとても冷たいです。 — 中立',
    'Are you boiling the water? — neutral': 'お湯を沸かしていますか。 — 中立',
    'Got any water? — informal': '水ある？ — カジュアル',
  },
  fa: {
    'Please give me a glass of water. — neutral': 'لطفاً یک لیوان آب بدهید. — خنثی',
    'The water is cold. — neutral': 'آب سرد است. — خنثی',
    'Do you have water? — neutral': 'آب دارید؟ — خنثی',
    'I want a glass of water. — neutral': 'یک لیوان آب می‌خواهم. — خنثی',
    'The water is very cold. — neutral': 'آب خیلی سرد است. — خنثی',
    'Are you boiling the water? — neutral': 'آیا آب را می‌جوشانید؟ — خنثی',
    'Got any water? — informal': 'آب دارید؟ — غیررسمی',
    'Got any water? — neutral': 'آب دارید؟ — خنثی',
  },
};

function normalizeTail(s) {
  return String(s ?? '')
    .replace(/ — neutral/g, ' — neutral')
    .replace(/ — informal/g, ' — informal')
    .replace(/ — formal/g, ' — formal');
}

function buildTranslationMap(contentLocale) {
  const map = new Map();
  const enRef = path.join(TARGETS, REF_STUDY, 'locales/en/word-dictionary-format-sample.json');
  const locRef = path.join(TARGETS, REF_STUDY, 'locales', contentLocale, 'word-dictionary-format-sample.json');
  if (!fs.existsSync(enRef) || !fs.existsSync(locRef)) return map;
  const en = JSON.parse(fs.readFileSync(enRef, 'utf8'));
  const loc = JSON.parse(fs.readFileSync(locRef, 'utf8'));
  for (let i = 0; i < (en.examples?.length ?? 0); i++) {
    const from = en.examples[i]?.translation;
    const to = loc.examples[i]?.translation;
    if (from && to) map.set(normalizeTail(from), to);
  }
  if (contentLocale === 'ru' || EXTRA_EN_TO[contentLocale]) {
    for (const [k, v] of Object.entries(EXTRA_EN_TO[contentLocale] ?? EXTRA_EN_TO.ru ?? {})) {
      map.set(k, v);
    }
  }
  return map;
}

function localizeGloss(glossRu, contentLocale, maps) {
  let g = String(glossRu ?? '');
  if (contentLocale === 'en') return g;
  const enRef = JSON.parse(
    fs.readFileSync(path.join(TARGETS, REF_STUDY, 'locales/en/word-dictionary-format-sample.json'), 'utf8'),
  );
  const locRef = JSON.parse(
    fs.readFileSync(path.join(TARGETS, REF_STUDY, 'locales', contentLocale, 'word-dictionary-format-sample.json'), 'utf8'),
  );
  const enTail = enRef.glossRu?.split('—').slice(1).join('—').trim();
  const locTail = locRef.glossRu?.split('—').slice(1).join('—').trim();
  if (enTail && locTail && g.includes(enTail)) {
    g = g.replace(enTail, locTail);
  }
  g = g.replace(/water as a substance; drinking water; neutral/i, maps.get('water as a substance; drinking water; neutral') ?? locTail ?? g);
  g = g.replace(/; neutral/g, contentLocale === 'ru' ? '; нейтр.' : g.includes('neutral') ? g : g);
  return g;
}

function localizeSample(enSample, contentLocale, map) {
  const out = structuredClone(enSample);
  out.glossRu = localizeGloss(out.glossRu, contentLocale, map);
  for (const ex of out.examples ?? []) {
    if (typeof ex.translation !== 'string') continue;
    const key = normalizeTail(ex.translation);
    if (map.has(key)) {
      ex.translation = map.get(key);
      continue;
    }
    const extra = EXTRA_EN_TO[contentLocale]?.[key];
    if (extra) {
      ex.translation = extra;
      continue;
    }
    if (contentLocale === 'ru') {
      const ruExtra = EXTRA_EN_TO.ru?.[key];
      if (ruExtra) {
        ex.translation = ruExtra;
        continue;
      }
    }
    if (contentLocale !== 'en') {
      ex.translation = ex.translation
        .replace(/ — neutral/g, contentLocale === 'ru' ? ' — нейтр.' : ' — neutral')
        .replace(/ — informal/g, contentLocale === 'ru' ? ' — неформ.' : ' — informal')
        .replace(/ — formal/g, contentLocale === 'ru' ? ' — офиц.' : ' — formal');
    }
  }
  return out;
}

const mapsByLocale = Object.fromEntries(CONTENT_LOCALES.map((loc) => [loc, buildTranslationMap(loc)]));

let written = 0;
for (const study of fs.readdirSync(TARGETS)) {
  if (study === 'en') continue;
  const enSamplePath = path.join(TARGETS, study, 'locales/en/word-dictionary-format-sample.json');
  if (!fs.existsSync(enSamplePath)) continue;
  const enSample = JSON.parse(fs.readFileSync(enSamplePath, 'utf8'));

  for (const loc of CONTENT_LOCALES) {
    const map = mapsByLocale[loc];
    if (!map.size && loc !== 'en') continue;
    const localized = loc === 'en' ? enSample : localizeSample(enSample, loc, map);
    const outDir = path.join(TARGETS, study, 'locales', loc);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'word-dictionary-format-sample.json'),
      `${JSON.stringify(localized, null, 2)}\n`,
    );
    written += 1;
  }
}
console.log(`✓ wrote ${written} format samples`);
