/**
 * Pattern practice: all UI locale × study module pairs.
 * Usage (from server/): node scripts/pattern-locale-matrix-test.mjs [--limit N] [--resume]
 * Output: reports/pattern-locale-matrix.jsonl + reports/pattern-locale-matrix.txt
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import '../load-env.js';
import { generatePracticePatternTurn, llmChatCompletion } from '../llmClient.js';
import { CONTENT_LOCALE_CODES, getPromptLocaleVars } from '../promptLocales.js';
import { TARGET_LANG_CODES } from '../targetLang.js';
import { getStudyPromptVars } from '../dictionaryStudyLang.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const JSONL_PATH = path.join(REPORT_DIR, 'pattern-locale-matrix.jsonl');
const TXT_PATH = path.join(REPORT_DIR, 'pattern-locale-matrix.txt');

const UI_LOCALES = [...CONTENT_LOCALE_CODES].sort();
const STUDY_LANGS = [...TARGET_LANG_CODES].sort();

const ANCHORS = {
  en: "I've been doing it all night",
  ru: 'Я всю ночь этим занимаюсь',
  ar: 'أنا أفعل ذلك طوال الليل',
  es: 'Llevo toda la noche haciéndolo',
  pt: 'Estou fazendo isso a noite toda',
  it: 'Lo faccio tutta la notte',
  el: 'Το κάνω όλη τη νύχτα',
  fa: 'تمام شب دارم این کار را می‌کنم',
  da: 'Jeg har gjort det hele natten',
  nl: 'Ik doe het de hele nacht',
  fr: 'Je fais ça toute la nuit',
  de: 'Ich mache das schon die ganze Nacht',
  tr: 'Bütün gece bunu yapıyorum',
  sv: 'Jag har hållit på hela natten',
  no: 'Jeg har holdt på hele natten',
  fi: 'Olen tehnyt sitä koko yön',
  ko: '밤새 그걸 하고 있어요',
  ja: '一晩中それをやっています',
  zh: '我整晚都在做这件事',
  uk: 'Я всю ніч цим займаюся',
  pl: 'Robię to całą noc',
  hi: 'मैं पuri raat se yeh kar raha hoon',
  ur: 'میں ساری رات سے یہ کر رہا ہوں',
  az: 'Bütün gecə bunu edirəm',
  ug: 'مەن پۈتün كەچ بۇنى قىلىۋاتىمەن',
  vi: 'Tôi đã làm việc đó cả đêm',
  cs: 'Dělám to celou noc',
  hu: 'Egész éjjel ezt csinálom',
  ro: 'Fac asta toată noaptea',
  id: 'Saya sudah melakukannya sepanjang malam',
  he: 'אני עושה את זה כל הלילה',
  ca: 'Ho faig tota la nit',
  sr: 'Radim to celu noć',
};

/** Same present-perfect-continuous-style pattern as ANCHORS (not a different grammar). */
const FOLLOW_UPS = {
  en: "I've been practicing this pattern all morning.",
  ru: 'Я всё утро этим занимаюсь.',
  ar: 'أنا أمارس هذا النمط طوال الصباح.',
  es: 'Llevo toda la mañana practicando este patrón.',
  pt: 'Estou praticando esse padrão a manhã toda.',
  it: 'Lo sto praticando tutta la mattina.',
  el: 'Το εξασκώ όλη το πρωί.',
  fa: 'تمام صبح دارم این الگو را تمرین می‌کنم.',
  da: 'Jeg har øvet det hele morgenen.',
  nl: 'Ik oefen het de hele ochtend.',
  fr: 'Je fais ça toute la matinée.',
  de: 'Ich übe das schon den ganzen Morgen.',
  tr: 'Bütün sabah bunu pratik ediyorum.',
  sv: 'Jag har övat hela morgonen.',
  no: 'Jeg har øvd hele morgenen.',
  fi: 'Olen harjoitellut sitä koko aamun.',
  ko: '아침 내내 이 패턴을 연습하고 있어요.',
  ja: '午前中ずっとこのパターンを練習しています。',
  zh: '我整个上午都在练习这个句型。',
  uk: 'Я все ранок цим займаюся.',
  pl: 'Ćwiczę to całe rano.',
  hi: 'मैं पuri subah se is pattern ka abhyas kar raha hoon.',
  ur: 'میں ساری صبح سے اس پیٹرن کی مشق کر رہا ہوں۔',
  az: 'Bütün səhər bu nümunəni məşq edirəm.',
  ug: 'مەن پۈتün ئەتىگەن بۇ ئەندىزىنى مەشق قىلىۋاتىمەن.',
  vi: 'Tôi đã luyện tập mẫu câu này cả sáng.',
  cs: 'Cvičím to celé ráno.',
  hu: 'Egész reggel ezt a mintát gyakorlom.',
  ro: 'Exersez asta toată dimineața.',
  id: 'Saya sudah berlatih pola ini sepanjang pagi.',
  he: 'אני מתרגל את זה כל הבוקר.',
  ca: 'Ho practico tot el matí.',
  sr: 'Vežbam to celo jutro.',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pairKey(ui, study) {
  return `${ui}|${study}`;
}

function loadDone() {
  const done = new Set();
  if (!fs.existsSync(JSONL_PATH)) return done;
  for (const line of fs.readFileSync(JSONL_PATH, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.ui && row.study) done.add(pairKey(row.ui, row.study));
    } catch {
      /* skip */
    }
  }
  return done;
}

const OFF_PATTERN_REPLY_RE =
  /different pattern|not the same pattern|doesn't match|does not match|не тот шаблон|не соответствует|مختلف|different from the pattern/i;

function detectLanguageIssues(ui, study, turn1, turn2) {
  const issues = [];
  const vars = getStudyPromptVars(ui, study);
  const reply1 = String(turn1?.reply ?? '');
  const reply2 = String(turn2?.reply ?? '');
  if (!reply1.trim()) issues.push('empty reply on turn 1');
  if (turn1?.echo != null || turn1?.corrections != null) {
    issues.push('turn1 should have null echo/corrections');
  }
  if (study === 'en' && ui === 'en' && /Russian|русск/i.test(reply1)) {
    issues.push('en/en: unexpected Russian in reply');
  }
  if (study === 'ru' && /English sentence coach/i.test(reply1)) {
    issues.push('study=ru but English-only coach phrasing in prompt leak');
  }
  if (!vars.correctionsLanguage) issues.push('missing corrections language');

  if (!reply2.trim() && turn2?.echo == null && turn2?.corrections == null) {
    issues.push('turn2: empty reply and no echo/corrections');
  }
  if (turn2?.echo == null && turn2?.corrections == null && reply2.trim()) {
    issues.push('turn2: reply without echo or corrections');
  }
  if (reply2 && OFF_PATTERN_REPLY_RE.test(reply2) && turn2?.corrections == null) {
    issues.push('turn2: off-pattern reply without corrections');
  }
  const t1Intro = reply1.slice(0, 280);
  const t2Intro = reply2.slice(0, 280);
  if (
    reply2.length > 350 &&
    /pattern|шаблон|структур|sentence structure|grammar pattern/i.test(t1Intro) &&
    /pattern|шаблон|структур|sentence structure|grammar pattern/i.test(t2Intro) &&
    !turn2?.echo
  ) {
    issues.push('turn2: possible turn-1-style pattern lecture');
  }
  return issues;
}

async function ruGloss(text, ui) {
  if (!text?.trim()) return '';
  if (ui === 'ru' || ui === 'uk') return '';
  try {
    const out = await llmChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'Translate the following assistant message into concise Russian for a developer QA log. Keep structure. One paragraph.',
        },
        { role: 'user', content: text.slice(0, 3500) },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });
    return String(out ?? '').trim();
  } catch (e) {
    return `(gloss failed: ${e.message})`;
  }
}

async function runPair(ui, study) {
  const anchor = ANCHORS[study] ?? ANCHORS.en;
  const followUp = FOLLOW_UPS[study] ?? FOLLOW_UPS.en;
  const vars = getStudyPromptVars(ui, study);
  const promptVars = getPromptLocaleVars(ui);

  const turn1 = await generatePracticePatternTurn({
    userText: anchor,
    dialogueSummary: '(none yet)',
    historyBlock: '(empty)',
    contentLocale: ui,
    patternSeed: anchor,
    targetLang: study,
  });

  await sleep(600);

  const historyBlock = `User: ${anchor}\nAssistant: ${String(turn1.reply ?? '').slice(0, 1500)}`;
  const turn2 = await generatePracticePatternTurn({
    userText: followUp,
    dialogueSummary: '(none yet)',
    historyBlock,
    contentLocale: ui,
    patternSeed: anchor,
    targetLang: study,
  });

  const issues = detectLanguageIssues(ui, study, turn1, turn2);

  return {
    ui,
    study,
    correctionsLanguage: vars.correctionsLanguage,
    studyLanguage: vars.STUDY_LANGUAGE,
    learnerL1: promptVars.learnerL1,
    anchor,
    followUp,
    turn1,
    turn2,
    issues,
    at: new Date().toISOString(),
  };
}

async function formatTxt(rows) {
  const lines = [];
  lines.push('PATTERN PRACTICE — UI LOCALE × STUDY MODULE MATRIX');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Pairs: ${rows.length}`);
  lines.push('');
  lines.push('Legend: UI = interface language; Study = language being learned.');
  lines.push('Turn 1 = anchor analysis; Turn 2 = learner tries the pattern.');
  lines.push('ru/uk UI: no RU gloss. Other UI: [RU gloss] after LLM reply.');
  lines.push('='.repeat(80));
  lines.push('');

  for (const row of rows) {
    lines.push(`### UI: ${row.ui} | Study: ${row.study}`);
    lines.push(`Corrections/explanation language: ${row.correctionsLanguage}`);
    lines.push(`Study language (examples/drill): ${row.studyLanguage}`);
    if (row.issues?.length) lines.push(`ISSUES: ${row.issues.join('; ')}`);
    lines.push('');
    lines.push('--- Turn 1: anchor ---');
    lines.push(`USER (anchor): ${row.anchor}`);
    lines.push(`LLM reply: ${row.turn1?.reply ?? '(empty)'}`);
    lines.push('');
    lines.push('--- Turn 2: practice ---');
    lines.push(`USER: ${row.followUp}`);
    lines.push(`LLM echo: ${row.turn2?.echo ?? 'null'}`);
    lines.push(`LLM corrections: ${row.turn2?.corrections ?? 'null'}`);
    lines.push(`LLM reply: ${row.turn2?.reply ?? '(empty)'}`);
    if (row.ui !== 'ru' && row.ui !== 'uk' && row.ruGloss) {
      lines.push(`[RU gloss]: ${row.ruGloss}`);
    }
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('');
  }

  fs.writeFileSync(TXT_PATH, lines.join('\n'), 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const resume = args.includes('--resume');
  const glossOnly = args.includes('--gloss-only');
  const skipGloss = args.includes('--skip-gloss');

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  let rows = [];
  if (resume && fs.existsSync(JSONL_PATH)) {
    for (const line of fs.readFileSync(JSONL_PATH, 'utf8').split(/\r?\n/)) {
      if (line.trim()) rows.push(JSON.parse(line));
    }
  } else if (!glossOnly) {
    fs.writeFileSync(JSONL_PATH, '', 'utf8');
  } else {
    rows = fs.readFileSync(JSONL_PATH, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  }

  const done = glossOnly ? new Set(rows.map((r) => pairKey(r.ui, r.study))) : loadDone();
  let count = 0;

  if (!glossOnly) {
    for (const ui of UI_LOCALES) {
      for (const study of STUDY_LANGS) {
        if (done.has(pairKey(ui, study))) continue;
        if (count >= limit) break;
        console.log(`[${count + 1}] ui=${ui} study=${study}`);
        try {
          const row = await runPair(ui, study);
          fs.appendFileSync(JSONL_PATH, `${JSON.stringify(row)}\n`, 'utf8');
          rows.push(row);
          done.add(pairKey(ui, study));
          count++;
          await sleep(800);
        } catch (e) {
          console.error(`FAIL ui=${ui} study=${study}`, e.message);
          const errRow = {
            ui,
            study,
            error: e.message,
            at: new Date().toISOString(),
          };
          fs.appendFileSync(JSONL_PATH, `${JSON.stringify(errRow)}\n`, 'utf8');
          count++;
          await sleep(2000);
        }
      }
      if (count >= limit) break;
    }
  }

  console.log(skipGloss ? 'Skipping RU gloss (--skip-gloss)' : 'Adding RU gloss for non-ru/uk UI...');
  if (!skipGloss) {
    for (const row of rows) {
      if (row.error || row.ui === 'ru' || row.ui === 'uk') continue;
      if (!row.ruGloss && (row.turn1?.reply || row.turn2?.reply)) {
        const blob = [
          row.turn1?.reply ? `Turn1 reply:\n${row.turn1.reply}` : '',
          row.turn2?.reply
            ? `Turn2 echo: ${row.turn2.echo ?? 'null'}\nTurn2 corrections: ${row.turn2.corrections ?? 'null'}\nTurn2 reply:\n${row.turn2.reply}`
            : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        row.ruGloss = await ruGloss(blob, row.ui);
        await sleep(500);
      }
    }
  }

  fs.writeFileSync(JSONL_PATH, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  await formatTxt(rows.filter((r) => !r.error));
  console.log(`Done. JSONL: ${JSONL_PATH}`);
  console.log(`TXT: ${TXT_PATH}`);
  const issueCount = rows.filter((r) => r.issues?.length).length;
  console.log(`Rows with issues: ${issueCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
