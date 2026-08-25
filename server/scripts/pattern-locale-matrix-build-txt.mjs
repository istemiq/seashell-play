/** Build final pattern-locale-matrix.txt from JSONL */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStudyPromptVars } from '../dictionaryStudyLang.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSONL = path.join(__dirname, '..', 'reports', 'pattern-locale-matrix.jsonl');
const OUT = path.join(__dirname, '..', '..', 'pattern-locale-matrix-test.txt');

const rows = fs
  .readFileSync(JSONL, 'utf8')
  .trim()
  .split(/\n/)
  .map((l) => JSON.parse(l))
  .filter((r) => !r.error && r.turn1)
  .sort((a, b) => (a.ui === b.ui ? a.study.localeCompare(b.study) : a.ui.localeCompare(b.ui)));

const lines = [];
lines.push('PATTERN PRACTICE — МАТРИЦА UI-ЛОКАЛЬ × МОДУЛЬ ИЗУЧЕНИЯ');
lines.push(`Сгенерировано: ${new Date().toISOString()}`);
lines.push(`Связок: ${rows.length}`);
lines.push('');
lines.push('Формат:');
lines.push('- UI = язык интерфейса приложения');
lines.push('- Study = изучаемый язык (модуль)');
lines.push('- Turn 1: пользователь вставляет опорное предложение (anchor)');
lines.push('- Turn 2: пользователь пишет своё предложение по тому же паттерну');
lines.push('- ru/uk UI: без переводов в скобках');
lines.push('- остальные UI: [RU gloss] — русский пересказ ответа LLM для разработчика');
lines.push('- Примечание: Turn 2 USER иногда на англ. placeholder, если для языка не задан локальный follow-up в тесте');
lines.push('- Промпт усилен 2026-08-05: explanation strictly in CORRECTIONS language');
lines.push('='.repeat(80));
lines.push('');

for (const row of rows) {
  const vars = getStudyPromptVars(row.ui, row.study);
  lines.push(`### UI: ${row.ui} | Study: ${row.study}`);
  lines.push(`Язык пояснений (CORRECTIONS): ${vars.correctionsLanguage}`);
  lines.push(`Язык примеров (STUDY): ${vars.STUDY_LANGUAGE}`);
  if (row.issues?.length) lines.push(`⚠ ISSUES: ${row.issues.join('; ')}`);
  lines.push('');
  lines.push('--- Turn 1: anchor ---');
  lines.push(`USER: ${row.anchor}`);
  lines.push(`LLM reply:\n${row.turn1?.reply ?? '(empty)'}`);
  lines.push('');
  lines.push('--- Turn 2: practice ---');
  lines.push(`USER: ${row.followUp ?? '(follow-up)'}`);
  lines.push(`LLM echo: ${row.turn2?.echo ?? 'null'}`);
  lines.push(`LLM corrections: ${row.turn2?.corrections ?? 'null'}`);
  lines.push(`LLM reply:\n${row.turn2?.reply ?? '(empty)'}`);
  if (row.ui !== 'ru' && row.ui !== 'uk' && row.ruGloss) {
    lines.push(`[RU gloss]: ${row.ruGloss}`);
  }
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
}

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log('Wrote', OUT, 'rows', rows.length);
