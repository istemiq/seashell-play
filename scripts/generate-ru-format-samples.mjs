#!/usr/bin/env node
/** Create locales/ru format samples for study targets (Russian card translations). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = path.join(ROOT, 'server/prompts/targets');

const TRANSLATION_MAP = {
  'I need a glass of water. — neutral': 'Мне нужен стакан воды. — нейтр.',
  'Is the water hot enough for tea? — neutral': 'Вода достаточно горячая для чая? — нейтр.',
  'We walked along the water. — neutral': 'Мы шли вдоль воды. — нейтр.',
  'The water was cut off all morning. — neutral': 'Воду отключили на всё утро. — нейтр.',
  'Can I get some water, please? — neutral': 'Можно немного воды, пожалуйста? — нейтр.',
  "Got any water? I'm parched. — informal": 'Есть водичка? Умираю от жажды. — неформ.',
  'The municipality shall ensure uninterrupted supply of potable water. — formal':
    'Муниципалитет обязан обеспечить бесперебойное снабжение питьевой водой. — офиц.',
  'They tested the water for safety. — neutral': 'Они проверили воду на безопасность. — нейтр.',
  'Save water when you brush your teeth. — informal': 'Экономь воду, когда чистишь зубы. — неформ.',
  'Fresh water is important for health. — neutral': 'Пресная вода важна для здоровья. — нейтр.',
  'The water is cold. — neutral': 'Вода холодная. — нейтр.',
  'Do you have water? — neutral': 'У тебя есть вода? — нейтр.',
};

function localizeTail(s) {
  return String(s ?? '')
    .replace(/ — neutral/g, ' — нейтр.')
    .replace(/ — informal/g, ' — неформ.')
    .replace(/ — formal/g, ' — офиц.');
}

function localizeTranslation(str) {
  const t = localizeTail(str);
  return TRANSLATION_MAP[t] ?? TRANSLATION_MAP[str] ?? t;
}

const GLOSS_TAIL_EN = 'water as a substance; drinking water; neutral';
const GLOSS_TAIL_RU = 'вода как вещество; питьевая вода; нейтр.';

function localizeSample(obj) {
  const out = structuredClone(obj);
  if (typeof out.glossRu === 'string') {
    out.glossRu = out.glossRu.replace(GLOSS_TAIL_EN, GLOSS_TAIL_RU);
    out.glossRu = out.glossRu.replace(/; neutral/g, '; нейтр.');
  }
  if (Array.isArray(out.examples)) {
    for (const ex of out.examples) {
      if (typeof ex.translation === 'string') {
        ex.translation = localizeTranslation(ex.translation);
      }
    }
  }
  return out;
}

for (const study of fs.readdirSync(TARGETS)) {
  if (study === 'en') continue;
  const enSample = path.join(TARGETS, study, 'locales/en/word-dictionary-format-sample.json');
  if (!fs.existsSync(enSample)) continue;
  const ruDir = path.join(TARGETS, study, 'locales/ru');
  fs.mkdirSync(ruDir, { recursive: true });
  const raw = JSON.parse(fs.readFileSync(enSample, 'utf8'));
  const ru = localizeSample(raw);
  fs.writeFileSync(
    path.join(ruDir, 'word-dictionary-format-sample.json'),
    `${JSON.stringify(ru, null, 2)}\n`,
  );
  console.log(`✓ ${study}/locales/ru`);
}
