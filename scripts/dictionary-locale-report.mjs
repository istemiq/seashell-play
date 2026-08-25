#!/usr/bin/env node
/**
 * Прогон словарной генерации: каждый модуль изучения × каждая локаль перевода.
 * Для каждой пары — одно слово и одна фраза; в текстовый файл пишутся промпты и ответ LLM.
 *
 * Примеры:
 *   node scripts/dictionary-locale-report.mjs --dry-run
 *   node scripts/dictionary-locale-report.mjs --study fi --locale ru
 *   node scripts/dictionary-locale-report.mjs --out reports/my-report.txt
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONTENT_LOCALE_CODES } from '../server/promptLocales.js';
import {
  getStudyLangMeta,
  isDictionaryGenerationReady,
  studyDictionaryRetryNote,
} from '../server/dictionaryStudyLang.js';
import { buildDictionarySystemPrompt, buildDictionaryUserPrompt } from '../server/dictionaryPromptBuild.js';
import { phraseInputRetryNote } from '../server/dictionaryInputMode.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = path.join(ROOT, 'server/prompts/targets');
const REPORTS_DIR = path.join(ROOT, 'reports');

function parseArgs(argv) {
  const opts = {
    studies: [],
    locales: [],
    out: '',
    dryRun: false,
    delayMs: Number(process.env.LLM_QUEUE_MIN_INTERVAL_MS || 1500),
    types: ['word', 'phrase'],
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--study') opts.studies.push(argv[++i]);
    else if (a === '--locale') opts.locales.push(argv[++i]);
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--delay') opts.delayMs = Number(argv[++i]) || 1500;
    else if (a === '--types') opts.types = argv[++i].split(',').map((x) => x.trim()).filter(Boolean);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/dictionary-locale-report.mjs [options]

Options:
  --study CODE     только модуль (fi, de, …); можно несколько раз
  --locale CODE    только локаль перевода (ru, en, …); можно несколько раз
  --out PATH       файл отчёта (default: reports/dictionary-locale-report-<timestamp>.txt)
  --dry-run        только промпты, без вызова LLM
  --delay MS       пауза между запросами (default: LLM_QUEUE_MIN_INTERVAL_MS или 1500)
  --types word,phrase   что генерировать (default: word,phrase)
`);
      process.exit(0);
    }
  }
  return opts;
}

function listStudies(filter) {
  const all = ['en', ...fs.readdirSync(TARGETS).filter((name) => {
    const p = path.join(TARGETS, name);
    return fs.statSync(p).isDirectory() && isDictionaryGenerationReady(name);
  })];
  const uniq = [...new Set(all)].sort();
  if (!filter.length) return uniq;
  return uniq.filter((s) => filter.includes(s));
}

function listLocales(filter) {
  const all = [...CONTENT_LOCALE_CODES].sort();
  if (!filter.length) return all;
  return all.filter((l) => filter.includes(l));
}

function loadSmokeInputs(study) {
  const fp = path.join(TARGETS, study, 'locales/en/word-dictionary-format-sample.json');
  if (fs.existsSync(fp)) {
    const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const word = String(j.headwordEn ?? 'water').replace(/\s*\[sample\]\s*/gi, '').trim();
    const phrase = String(j.examples?.[0]?.text ?? word).trim();
    if (word && phrase) return { word, phrase };
  }
  if (study === 'en') return { word: 'water', phrase: 'I need a glass of water' };
  if (study === 'ru') return { word: 'вода', phrase: 'Мне нужен стакан воды' };
  return { word: 'water', phrase: 'I need a glass of water' };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hr(title = '') {
  const line = '='.repeat(88);
  return title ? `${line}\n${title}\n${line}\n` : `${line}\n`;
}

function formatPayloadSummary(payload) {
  if (!payload) return '(нет разобранного JSON)\n';
  const lines = [];
  lines.push(`headwordEn: ${payload.headwordEn ?? '(empty)'}`);
  lines.push(`glossRu: ${String(payload.glossRu ?? '').slice(0, 240)}`);
  const examples = Array.isArray(payload.examples) ? payload.examples : [];
  lines.push(`examples: ${examples.length}`);
  for (const [i, ex] of examples.slice(0, 3).entries()) {
    lines.push(`  [${i}] text: ${String(ex?.text ?? '').slice(0, 120)}`);
    lines.push(`      translation: ${String(ex?.translation ?? '').slice(0, 160)}`);
  }
  if (examples.length > 3) lines.push(`  … +${examples.length - 3} more`);
  return `${lines.join('\n')}\n`;
}

function formatDryRunSection(study, locale, inputType, input) {
  const userContent =
    buildDictionaryUserPrompt(input, locale, study) +
    studyDictionaryRetryNote(locale, study) +
    phraseInputRetryNote(input, study);
  const systemContent = buildDictionarySystemPrompt(locale, study);
  return (
    hr(`STUDY: ${study} (${getStudyLangMeta(study).nameEn})  |  LOCALE: ${locale}  |  ${inputType}: «${input}»  |  DRY-RUN`)
    + `\n--- SYSTEM PROMPT ---\n${systemContent}\n\n`
    + `--- USER PROMPT ---\n${userContent}\n\n`
    + `--- LLM RESPONSE ---\n(skipped: --dry-run)\n\n`
  );
}

function formatProbeSection(probe, inputType) {
  const { targetLang, contentLocale, word, messages, rawResponse, error, parseError, payload, validation, durationMs } =
    probe;
  let out = hr(
    `STUDY: ${targetLang} (${getStudyLangMeta(targetLang).nameEn})  |  LOCALE: ${contentLocale}  |  ${inputType}: «${word}»  |  ${durationMs} ms`,
  );
  out += `\n--- SYSTEM PROMPT ---\n${messages[0]?.content ?? ''}\n\n`;
  out += `--- USER PROMPT ---\n${messages[1]?.content ?? ''}\n\n`;
  out += `--- LLM RESPONSE (raw) ---\n${rawResponse ?? `(error: ${error})`}\n\n`;
  if (parseError) out += `--- PARSE ERROR ---\n${parseError}\n\n`;
  out += `--- PARSED SUMMARY ---\n${formatPayloadSummary(payload)}`;
  if (validation) {
    out += '--- VALIDATION ---\n';
    out += `content locale (${contentLocale}): ${validation.contentLocaleOk ? 'OK' : 'FAIL'}\n`;
    if (validation.contentLocaleDetail) {
      out += `  ${validation.contentLocaleDetail.field}: ${validation.contentLocaleDetail.reason}\n`;
      out += `  sample: ${validation.contentLocaleDetail.sample}\n`;
    }
    out += `study language (${targetLang}): ${validation.targetLangOk ? 'OK' : 'FAIL'}\n\n`;
  }
  if (error) out += `--- REQUEST ERROR ---\n${error}\n\n`;
  return out;
}

const opts = parseArgs(process.argv);
const studies = listStudies(opts.studies);
const locales = listLocales(opts.locales);

let probeDictionaryGeneration;
let resolveLlmModel;
let resolveLlmProvider;

if (!opts.dryRun) {
  await import('../server/load-env.js');
  ({ probeDictionaryGeneration } = await import('../server/llmClient.js'));
  ({ resolveLlmModel, resolveLlmProvider } = await import('../server/llmProvider.js'));
}

if (!studies.length || !locales.length) {
  console.error('No studies/locales matched filters.');
  process.exit(1);
}

if (!opts.dryRun) {
  const provider = resolveLlmProvider();
  const key = provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.DEEPSEEK_API_KEY;
  if (!String(key ?? '').trim()) {
    console.error(`Missing API key for LLM_PROVIDER=${provider}. Set in .env or use --dry-run.`);
    process.exit(1);
  }
}

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outPath = opts.out
  ? path.resolve(opts.out)
  : path.join(REPORTS_DIR, `dictionary-locale-report-${stamp}.txt`);

const totalCalls = studies.length * locales.length * opts.types.length;
let done = 0;
let failed = 0;

const header =
  hr('Dictionary locale report')
  + `Generated: ${new Date().toISOString()}\n`
  + `LLM: ${opts.dryRun ? '(dry-run)' : `${resolveLlmProvider()} / ${resolveLlmModel()}`}\n`
  + `Studies: ${studies.join(', ')}\n`
  + `Content locales: ${locales.join(', ')}\n`
  + `Input types: ${opts.types.join(', ')}\n`
  + `Planned LLM calls: ${totalCalls}\n\n`;

fs.writeFileSync(outPath, header, 'utf8');
console.log(`Report: ${outPath}`);
console.log(`Planned: ${studies.length} studies × ${locales.length} locales × ${opts.types.length} inputs = ${totalCalls} calls`);

for (const study of studies) {
  const inputs = loadSmokeInputs(study);
  for (const locale of locales) {
    for (const inputType of opts.types) {
      const input = inputType === 'phrase' ? inputs.phrase : inputs.word;
      done += 1;
      const label = `[${done}/${totalCalls}] ${study}+${locale} ${inputType}`;
      process.stdout.write(`${label} … `);

      try {
        let section;
        if (opts.dryRun) {
          section = formatDryRunSection(study, locale, inputType, input);
          console.log('dry-run');
        } else {
          const probe = await probeDictionaryGeneration(input, { contentLocale: locale, targetLang: study });
          section = formatProbeSection(probe, inputType);
          const ok = !probe.error && !probe.parseError && probe.validation?.contentLocaleOk && probe.validation?.targetLangOk;
          console.log(ok ? 'ok' : 'CHECK');
          if (!ok) failed += 1;
          if (done < totalCalls && opts.delayMs > 0) await sleep(opts.delayMs);
        }
        fs.appendFileSync(outPath, section, 'utf8');
      } catch (e) {
        failed += 1;
        console.log('ERROR');
        fs.appendFileSync(
          outPath,
          hr(`STUDY: ${study} | LOCALE: ${locale} | ${inputType}: «${input}» | SCRIPT ERROR`)
            + `${e instanceof Error ? e.stack : String(e)}\n\n`,
          'utf8',
        );
      }
    }
  }
}

const footer =
  hr('Summary')
  + `Finished: ${new Date().toISOString()}\n`
  + `Total sections: ${done}\n`
  + `Needs review: ${failed}\n`
  + `Report file: ${outPath}\n`;

fs.appendFileSync(outPath, footer, 'utf8');
console.log(`\nDone. Review flagged: ${failed}. File: ${outPath}`);
