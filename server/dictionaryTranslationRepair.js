import { englishLineFromItem } from './exampleFields.js';
import { getStudyPromptVars, normalizeStudyLang } from './dictionaryStudyLang.js';
import { isPayloadValidForContentLocale } from './localeValidation.js';
import { normalizeContentLocale } from './promptLocales.js';
import { resolveLlmModel, resolveLlmProvider } from './llmProvider.js';
import { openRouterChatCompletion } from './openrouter.js';
import { deepSeekChatCompletion } from './deepseek.js';

async function llmChatCompletion(opts) {
  const model = resolveLlmModel();
  const provider = resolveLlmProvider();
  if (provider === 'openrouter') return openRouterChatCompletion({ model, ...opts });
  if (provider === 'deepseek') return deepSeekChatCompletion({ model, ...opts });
  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

const LATIN_GLOSS_LOCALES = new Set(['tr', 'es', 'pt', 'it', 'en']);

function scriptCounts(s) {
  const t = String(s ?? '');
  let latin = 0;
  let cyr = 0;
  let arabic = 0;
  let cjk = 0;
  for (const ch of t) {
    if (/[A-Za-z\u00C0-\u024F\u0300-\u036F]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
    if (/[\u0600-\u06FF]/.test(ch)) arabic += 1;
    if (/[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uFF66-\uFF9F]/.test(ch)) cjk += 1;
  }
  return { latin, cyr, arabic, cjk };
}

function translationMainLine(translation) {
  const t = String(translation ?? '');
  for (const sep of ['—', '–', '－']) {
    const i = t.indexOf(sep);
    if (i !== -1) return t.slice(0, i);
  }
  return t;
}

function translationStyleTail(translation) {
  const t = String(translation ?? '');
  for (const sep of ['—', '–', '－']) {
    const i = t.indexOf(sep);
    if (i !== -1) return t.slice(i).trim();
  }
  return ' — neutro';
}

function looksMostlyCyrillic(s) {
  const { latin, cyr } = scriptCounts(s);
  return cyr > 0 && cyr >= latin;
}

function needsTranslationRepair(translation, contentLocale) {
  const loc = normalizeContentLocale(contentLocale);
  const main = translationMainLine(translation);
  const counts = scriptCounts(main);
  if (LATIN_GLOSS_LOCALES.has(loc)) return counts.cyr > 0;
  if (loc === 'ar' || loc === 'fa') return counts.cyr > 0 || (counts.arabic === 0 && counts.latin > 8);
  if (loc === 'ko' || loc === 'ja') return counts.cyr > 0 || counts.cjk < 2;
  return false;
}

function extractJsonArray(text) {
  const t = String(text ?? '').trim();
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallthrough
  }
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start === -1 || end <= start) throw new Error('No JSON array in repair response');
  return JSON.parse(t.slice(start, end + 1));
}

async function translateRussianLines(lines, contentLocale) {
  const loc = normalizeContentLocale(contentLocale);
  const lang = getStudyPromptVars(loc, 'ru').translationLanguage || loc;
  const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
  const content = await llmChatCompletion({
    messages: [
      {
        role: 'system',
        content:
          `You translate Russian study sentences into ${lang}. Output ONLY a JSON array of strings, same length and order as input. No markdown.`,
      },
      { role: 'user', content: numbered },
    ],
    temperature: 0.2,
    max_tokens: 2500,
  });
  const out = extractJsonArray(content).map((s) => String(s ?? '').trim()).filter(Boolean);
  if (out.length !== lines.length) {
    throw new Error(`Repair translation count mismatch (${out.length} vs ${lines.length})`);
  }
  return out;
}

/**
 * When studying Russian with non-Russian UI, models often copy Cyrillic into translation.
 * Repair by translating Russian `text` lines into the content locale.
 */
export async function repairRuTargetTranslations(payload, contentLocale, targetLang = 'ru') {
  const study = normalizeStudyLang(targetLang);
  const loc = normalizeContentLocale(contentLocale);
  if (study !== 'ru' || loc === 'ru') return payload;

  if (isPayloadValidForContentLocale(loc, payload, study)) return payload;

  const examples = Array.isArray(payload.examples) ? payload.examples : [];
  const repairIdx = [];
  const repairLines = [];
  for (let i = 0; i < examples.length; i += 1) {
    const text = englishLineFromItem(examples[i]);
    const trMain = translationMainLine(examples[i]?.translation);
    const source = looksMostlyCyrillic(text)
      ? text
      : looksMostlyCyrillic(trMain)
        ? trMain
        : '';
    if (!source) continue;
    if (needsTranslationRepair(examples[i]?.translation, loc)) {
      repairIdx.push(i);
      repairLines.push(source);
    }
  }
  if (!repairLines.length) return payload;

  console.log(`[dict] repair translations ${loc}/ru for ${repairLines.length} examples`);
  const translated = await translateRussianLines(repairLines, loc);
  const nextExamples = examples.map((ex) => ({ ...ex }));
  for (let j = 0; j < repairIdx.length; j += 1) {
    const i = repairIdx[j];
    const tail = translationStyleTail(nextExamples[i]?.translation);
    const source = repairLines[j];
    const prevText = englishLineFromItem(nextExamples[i]);
    nextExamples[i] = {
      ...nextExamples[i],
      text: looksMostlyCyrillic(prevText) ? prevText : source,
      translation: `${translated[j]}${tail.startsWith('—') ? ` ${tail}` : tail}`,
    };
  }

  return { ...payload, examples: nextExamples };
}
