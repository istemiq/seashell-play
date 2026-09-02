/**
 * LLM-клиент: словарь, практика, неправильные глаголы (OpenRouter / DeepSeek).
 * Промпты в `server/prompts/`. Ответы парсятся в JSON.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import {
  englishLineFromItem,
  lineFromField,
  russianLineFromItem,
  stylisticNoteFromItem,
  splitTranslationTail,
  normalizeVerbUsage,
} from './exampleFields.js';
import { WORD_EXAMPLE_COUNT, IRREGULAR_VERB_EXAMPLES_PER_FORM } from './dictionaryConstants.js';
import {
  examplesOverlapRatio,
  refreshAvoidExamplesNote,
  refreshExamplesTemperature,
} from './dictionaryRefreshHelpers.js';
import {
  getInputModeRules,
  getPhraseEntryBanner,
  isHeadwordValidForInput,
  isPhraseLikeInput,
  phraseInputRetryNote,
  assertHeadwordMatchesInputShape,
  wordInputLooksEnglish,
} from './dictionaryInputMode.js';
import {
  customExampleSystemPrompt,
  getStudyLangMeta,
  getStudyPromptVars,
  headwordQuickResolveSystemPrompt,
  looksMostlyCyrillicStudyText,
  looksMostlyLatinStudyText,
  looksMostlyGreekStudyText,
  looksMostlyArabicStudyText,
  looksMostlyDevanagariStudyText,
  looksMostlyHebrewStudyText,
  looksMostlyChineseStudyText,
  looksMostlyHangulStudyText,
  looksMostlyJapaneseStudyText,
  normalizeStudyLang,
  practiceExpertSystemPrompt,
  practiceFreeSystemPrompt,
  practiceWordSystemPrompt,
  practicePatternSystemPrompt,
  studyDictionaryRetryNote,
  studyExampleUsesHeadword,
  wordInputLooksLikeStudyLanguage,
} from './dictionaryStudyLang.js';
import { localeDictionaryRetryNote, normalizeContentLocale } from './promptLocales.js';
import { normalizePracticeLevel } from './practiceLevel.js';
import { buildRegisterTagsGuide, registerTailExamples } from './registerTags.js';
import {
  assertPayloadMatchesContentLocale,
  assertPayloadMatchesTargetLang,
  describeContentLocaleValidationFailure,
  isPayloadValidForContentLocale,
  isPayloadValidForTargetLang,
} from './localeValidation.js';
import { repairRuTargetTranslations } from './dictionaryTranslationRepair.js';
import {
  loadDictionaryFormatSamples,
  loadDictionarySystemPrompt,
  loadPracticeExpertTurnPrompt,
  loadPracticeTurnPrompt,
  loadPracticeWordTurnPrompt,
  loadPracticePatternTurnPrompt,
  loadWordExamplesUserPrompt,
  loadIrregularVerbExamplesSingleFormPrompt,
  loadWordCustomExamplePrompt,
  listPromptLocaleStatus,
} from './promptLoader.js';
import {
  PRACTICE_EXPERT_START_MARKER,
} from './practiceExperts.js';
import { sanitizePracticeEcho, sanitizeWordPracticeEcho, sanitizeWordPracticeCorrections } from './practiceEcho.js';
import { extractActiveThreadHint } from './practiceContext.js';
import { resolveLlmModel, resolveLlmProvider } from './llmProvider.js';
import { openRouterChatCompletion } from './openrouter.js';
import { deepSeekChatCompletion } from './deepseek.js';
import { buildDictionarySystemPrompt, buildDictionaryUserPrompt } from './dictionaryPromptBuild.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** При старте API: пути и размеры файлов словарного промпта. */
export function logDictionaryPromptStartupInfo() {
  const { templatesDir, localeDirs } = listPromptLocaleStatus();
  console.log(`[seashell] dictionary prompt templates: ${path.resolve(templatesDir)}`);
  console.log(`[seashell] dictionary prompt locales: ${localeDirs.join(', ') || '(none)'}`);
  console.log(`[seashell] word example limit: ${WORD_EXAMPLE_COUNT}`);
}

/** True if строка в основном латиница (англ. ввод без headwordEn из модели — допустимый fallback). */
function looksMostlyEnglish(s) {
  const t = String(s).replace(/\s+/g, '');
  if (!t) return false;
  let latin = 0;
  let cyr = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
  }
  return latin > 0 && latin >= cyr;
}

/** Кириллицы больше, чем латиницы (типичный русский текст). */
function looksMostlyCyrillic(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  if (!t) return false;
  let latin = 0;
  let cyr = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
  }
  return cyr > 0 && cyr > latin;
}

/**
 * В glossRu должна быть видна английская лемма. При «Обновить примеры» в API приходит уже англ. слово (lemma), не кириллица ввода — поэтому смотрим ещё и на сам gloss: если он в основном русский без леммы, дописываем «lemma — …».
 */
function glossAlreadyContainsLemma(gloss, lemma) {
  const g = String(gloss).trim();
  const hw = String(lemma).trim();
  if (!g || !hw) return true;
  if (!/\s/.test(hw)) {
    const esc = hw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (
      new RegExp(`(?:^|[^A-Za-z])${esc}(?:[^A-Za-z]|$)`, 'i').test(g) || new RegExp(`^${esc}\\b`, 'i').test(g)
    );
  }
  return g.toLowerCase().includes(hw.toLowerCase());
}

function ensureGlossShowsHeadword(userWord, headword, glossNullable, targetLang = 'en', contentLocale = 'en') {
  if (glossNullable == null) return null;
  const raw = String(glossNullable).trim();
  if (!raw) return null;
  const hw = String(headword ?? '').trim();
  if (!hw) return raw;
  if (glossAlreadyContainsLemma(raw, hw)) return raw;
  const study = normalizeStudyLang(targetLang);
  const loc = normalizeContentLocale(contentLocale);
  const needPrefix =
    study === 'ru' || study === 'uk'
      ? !looksMostlyCyrillicStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
        : study === 'ar' || study === 'fa' || study === 'ur' || study === 'ug'
          ? !looksMostlyArabicStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
          : study === 'hi'
            ? !looksMostlyDevanagariStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
          : study === 'es' || study === 'pt' || study === 'it' || study === 'da' || study === 'nl' || study === 'fr' || study === 'de' || study === 'tr' || study === 'sv' || study === 'no' || study === 'fi' || study === 'pl' || study === 'az' || study === 'vi' || study === 'cs' || study === 'hu' || study === 'ro' || study === 'id' || study === 'ca'
          ? !looksMostlyLatinStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
          : study === 'he'
            ? !looksMostlyHebrewStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
            : study === 'sr'
              ? !looksMostlyCyrillicStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
          : study === 'el'
            ? !looksMostlyGreekStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
            : study === 'zh'
              ? !looksMostlyChineseStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
              : study === 'ko'
                ? !looksMostlyHangulStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
                : study === 'ja'
                  ? !looksMostlyJapaneseStudyText(raw) || !wordInputLooksLikeStudyLanguage(userWord, loc, study)
                  : !looksMostlyLatinStudyText(userWord) || looksMostlyCyrillicStudyText(raw);
  if (!needPrefix) return raw;
  return `${hw} — ${raw}`;
}

function pickHeadwordEnFromParsed(parsed) {
  const keys = ['headwordEn', 'headword', 'englishHeadword', 'lemmaEn', 'wordEn'];
  for (const k of keys) {
    const v = parsed[k];
    if (typeof v === 'string' && v.trim()) return v.trim().replace(/\s+/g, ' ');
  }
  return '';
}

function extractJsonArray(text) {
  const t = text.trim();
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallthrough
  }
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start === -1 || end <= start) {
    throw new Error('No JSON array in model response');
  }
  const parsed = JSON.parse(t.slice(start, end + 1));
  if (!Array.isArray(parsed)) {
    throw new Error('Parsed JSON is not an array');
  }
  return parsed;
}

function parseObjectPayload(parsed) {
  const glossRaw =
    parsed.glossRu ?? parsed.gloss_ru ?? parsed.wordRu ?? parsed.ru_gloss ?? parsed.gloss;
  let glossRu =
    typeof glossRaw === 'string' ? glossRaw.trim() : lineFromField(glossRaw);
  const glossNoteRaw = parsed.glossNoteRu ?? parsed.gloss_note_ru;
  const glossNoteRu =
    typeof glossNoteRaw === 'string' ? glossNoteRaw.trim() : lineFromField(glossNoteRaw);
  if (glossNoteRu) {
    if (glossRu) glossRu = `${glossRu} (${glossNoteRu})`;
    else glossRu = glossNoteRu;
  }
  const arr = parsed.examples ?? parsed.items ?? parsed.sentences;
  if (!Array.isArray(arr)) {
    throw new Error('Expected examples array in JSON object');
  }
  const headwordEn = pickHeadwordEnFromParsed(parsed);
  const verbUsage = normalizeVerbUsage(
    parsed.verbUsage ?? parsed.verb_usage ?? parsed.verbForms ?? parsed.verb_forms,
  );
  return {
    glossRu: glossRu || '',
    glossNoteRu: '',
    examples: normalizeExamples(arr),
    headwordEn,
    verbUsage,
  };
}

/** Объект { glossRu, examples } или устаревший массив из 15 примеров. */
function extractGenerationPayload(text) {
  const t = text.trim();
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) {
      return {
        glossRu: '',
        glossNoteRu: '',
        examples: normalizeExamples(parsed),
        headwordEn: '',
        verbUsage: [],
      };
    }
    if (parsed && typeof parsed === 'object') {
      try {
        return parseObjectPayload(parsed);
      } catch {
        // не тот формат объекта — ниже пробуем вырезать JSON или массив
      }
    }
  } catch {
    // не полный JSON
  }
  const startObj = t.indexOf('{');
  const endObj = t.lastIndexOf('}');
  if (startObj !== -1 && endObj > startObj) {
    try {
      const parsed = JSON.parse(t.slice(startObj, endObj + 1));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parseObjectPayload(parsed);
      }
    } catch {
      // fallthrough
    }
  }
  const arr = extractJsonArray(text);
  return {
    glossRu: '',
    glossNoteRu: '',
    examples: normalizeExamples(arr),
    headwordEn: '',
    verbUsage: [],
  };
}

/** Нормализует ответ модели к { text, translation, noteRu }[]; пометки только в translation, noteRu пустой. */
function normalizeExamples(arr) {
  const out = [];
  for (const item of arr) {
    if (typeof item === 'string') {
      const text = item.trim();
      if (text) out.push({ text, translation: '', noteRu: '' });
    } else if (item && typeof item === 'object') {
      let text = englishLineFromItem(item);
      let translation = russianLineFromItem(item);
      if (
        text &&
        translation &&
        looksMostlyCyrillic(text) &&
        !looksMostlyCyrillic(translation) &&
        /[A-Za-z]{2,}/.test(translation)
      ) {
        const swap = text;
        text = translation;
        translation = swap;
      }
      let noteRu = stylisticNoteFromItem(item);
      const sp = splitTranslationTail(translation);
      if (sp.noteRu) {
        translation = sp.translation;
        if (!String(noteRu).trim()) noteRu = sp.noteRu;
      }
      const tr = String(translation).trim();
      const nt = String(noteRu).trim();
      let oneLine = tr;
      if (tr && nt) oneLine = `${tr} (${nt})`;
      else if (!tr && nt) oneLine = nt;
      if (text) out.push({ text, translation: oneLine, noteRu: '' });
    }
  }
  return out;
}

function sanitizeGlossRu(glossRuRaw) {
  const g = String(glossRuRaw ?? '').trim();
  if (!g) return null;
  // Если модель сама пишет, что слово выдуманное/не слово — не показываем "значение".
  if (/(вымыш|придуман|не\s*слово|не\s*существ|имя\s*собствен|без\s*конкретн)/i.test(g)) {
    return null;
  }
  return g;
}

export async function llmChatCompletion({ messages, temperature, max_tokens, top_p, repetition_penalty }) {
  const model = resolveLlmModel();
  const provider = resolveLlmProvider();
  if (provider === 'openrouter') {
    return openRouterChatCompletion({ model, messages, temperature, max_tokens, top_p });
  }
  if (provider === 'deepseek') {
    return deepSeekChatCompletion({ model, messages, temperature, max_tokens, top_p, repetition_penalty });
  }
  throw new Error(`Unsupported LLM_PROVIDER: ${provider}. Use openrouter or deepseek.`);
}

async function dictionaryLlmCompletion(userContent, temperature, contentLocale, targetLang = 'en') {
  return llmChatCompletion({
    messages: [
      { role: 'system', content: buildDictionarySystemPrompt(contentLocale, targetLang) },
      { role: 'user', content: userContent },
    ],
    temperature,
    max_tokens: 4000,
  });
}

/** Температура для генерации словаря: из .env или 0.38. */
function wordExamplesTemperature() {
  const raw = process.env.LLM_WORD_TEMPERATURE?.trim();
  if (!raw) return 0.38;
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return 0.38;
  return Math.min(2, Math.max(0, n));
}

/**
 * Один запрос к LLM для аудита промптов: промпты, сырой ответ, разбор JSON, проверка локали.
 * Без ретраев и post-processing (headwordQuickResolve и т.д.).
 */
export async function probeDictionaryGeneration(word, { contentLocale, targetLang = 'en' } = {}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const userContent =
    buildDictionaryUserPrompt(word, locale, study) +
    studyDictionaryRetryNote(locale, study) +
    phraseInputRetryNote(word, study);
  const systemContent = buildDictionarySystemPrompt(locale, study);
  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
  const started = Date.now();
  let rawResponse = null;
  let error = null;
  try {
    rawResponse = await llmChatCompletion({
      messages,
      temperature: wordExamplesTemperature(),
      max_tokens: 4000,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  let payload = null;
  let parseError = null;
  if (rawResponse) {
    try {
      payload = extractGenerationPayload(rawResponse);
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }
  }

  let validation = null;
  if (payload) {
    const contentLocaleOk = isPayloadValidForContentLocale(locale, payload, study);
    validation = {
      contentLocaleOk,
      contentLocaleDetail: contentLocaleOk
        ? null
        : describeContentLocaleValidationFailure(locale, payload, study),
      targetLangOk: isPayloadValidForTargetLang(study, payload),
    };
  }

  return {
    word: String(word).trim(),
    contentLocale: locale,
    targetLang: study,
    messages,
    rawResponse,
    error,
    parseError,
    payload,
    validation,
    durationMs: Date.now() - started,
  };
}

export async function generateWordExamples(word, { contentLocale, targetLang = 'en', avoidExamples = [] } = {}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const avoidList = Array.isArray(avoidExamples)
    ? avoidExamples.map((t) => String(t ?? '').trim()).filter(Boolean)
    : [];
  const isRefresh = avoidList.length > 0;
  const userContent =
    buildDictionaryUserPrompt(word, locale, study) + (isRefresh ? refreshAvoidExamplesNote(avoidList) : '');
  const baseTemperature = isRefresh
    ? refreshExamplesTemperature(wordExamplesTemperature())
    : wordExamplesTemperature();

  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const retryNote =
      studyDictionaryRetryNote(locale, study) +
      (attempt > 0 ? localeDictionaryRetryNote(locale, study) : '') +
      phraseInputRetryNote(word, study);
    const attemptTemperature = isRefresh
      ? Math.min(0.9, baseTemperature + attempt * 0.1)
      : attempt > 0
        ? Math.min(0.55, wordExamplesTemperature() + 0.08)
        : baseTemperature;
    const content = await dictionaryLlmCompletion(
      userContent + retryNote,
      attemptTemperature,
      locale,
      study,
    );

    let payload;
    try {
      payload = extractGenerationPayload(content);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Ответ модели не разобрался как JSON (${msg}). Частые причины: в ответе есть markdown вместо чистого JSON, обрезан длинный ответ, или ошибка в структуре. Попробуй ещё раз.`,
      );
    }
    const { glossRu, examples, headwordEn: headFromPayload, verbUsage } = payload;

    if (examples.length < WORD_EXAMPLE_COUNT) {
      throw new Error(`Expected ${WORD_EXAMPLE_COUNT} examples, got ${examples.length}`);
    }

    const g = sanitizeGlossRu(glossRu);
    let headwordEn = typeof headFromPayload === 'string' ? headFromPayload.trim().replace(/\s+/g, ' ') : '';
    if (!headwordEn) {
      if (wordInputLooksLikeStudyLanguage(word, locale, study)) {
        headwordEn = String(word).trim().replace(/\s+/g, ' ');
      } else {
        const langLabel = getStudyLangMeta(study).nameEn;
        throw new Error(
          `Модель не вернула форму слова (headwordEn) на ${langLabel}. Попробуй добавить ещё раз.`,
        );
      }
    }
    if (study === 'ru' && headwordEn && !looksMostlyCyrillicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyCyrillicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'uk' && headwordEn && !looksMostlyCyrillicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyCyrillicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'ar' && headwordEn && !looksMostlyArabicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyArabicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'fa' && headwordEn && !looksMostlyArabicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyArabicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'ur' && headwordEn && !looksMostlyArabicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyArabicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'ug' && headwordEn && !looksMostlyArabicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyArabicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'hi' && headwordEn && !looksMostlyDevanagariStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyDevanagariStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (
      (study === 'es' || study === 'pt' || study === 'it' || study === 'da' || study === 'nl' || study === 'fr' || study === 'de' || study === 'tr' || study === 'sv' || study === 'no' || study === 'fi' || study === 'pl' || study === 'az' || study === 'vi' || study === 'cs' || study === 'hu' || study === 'ro' || study === 'id' || study === 'ca') &&
      headwordEn &&
      !looksMostlyLatinStudyText(headwordEn)
    ) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyLatinStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'he' && headwordEn && !looksMostlyHebrewStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyHebrewStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'sr' && headwordEn && !looksMostlyCyrillicStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyCyrillicStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'zh' && headwordEn && !looksMostlyChineseStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyChineseStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'ko' && headwordEn && !looksMostlyHangulStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyHangulStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'ja' && headwordEn && !looksMostlyJapaneseStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyJapaneseStudyText(resolved)) {
        headwordEn = resolved;
      }
    }
    if (study === 'el' && headwordEn && !looksMostlyGreekStudyText(headwordEn)) {
      const resolved = await resolveHeadwordEnQuick(word, locale, study);
      if (resolved && looksMostlyGreekStudyText(resolved)) {
        headwordEn = resolved;
      }
    }

    const trimmed = examples.slice(0, WORD_EXAMPLE_COUNT);
    const glossOut = ensureGlossShowsHeadword(word, headwordEn, g, study, locale);
    let result = {
      glossRu: glossOut,
      glossNoteRu: null,
      examples: trimmed,
      headwordEn,
      verbUsage:
        study === 'en' && Array.isArray(verbUsage) && verbUsage.length === 3 ? verbUsage : [],
    };

    try {
      result = await repairRuTargetTranslations(result, locale, study);
    } catch (repairErr) {
      console.warn('[llm] dictionary translation repair failed', repairErr?.message);
    }

    try {
      assertHeadwordMatchesInputShape(word, headwordEn, study);
      assertPayloadMatchesContentLocale(locale, result, study);
      assertPayloadMatchesTargetLang(study, result);
      if (isRefresh) {
        const newTexts = trimmed.map((ex) => englishLineFromItem(ex));
        const overlap = examplesOverlapRatio(avoidList, newTexts);
        if (overlap >= 0.35) {
          lastErr = new Error(
            `Refresh examples too similar to previous set (${Math.round(overlap * 100)}% overlap)`,
          );
          console.warn(
            `[llm] dictionary refresh overlap ${locale}, attempt ${attempt + 1}/4`,
            lastErr.message,
          );
          continue;
        }
      }
      return result;
    } catch (e) {
      lastErr = e;
      const detail = describeContentLocaleValidationFailure(locale, result, study);
      console.warn(
        `[llm] dictionary validation ${locale}/${study}, attempt ${attempt + 1}/4`,
        e?.message,
        detail?.field !== '?' ? detail : '',
      );
    }
  }

  throw lastErr instanceof Error
    ? Object.assign(lastErr, { status: lastErr.status ?? 422 })
    : Object.assign(new Error('Wrong translation language from model'), { status: 422 });
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exampleUsesHeadword(headword, text, targetLang = 'en') {
  return studyExampleUsesHeadword(headword, text, targetLang);
}

const CUSTOM_EXAMPLE_SYSTEM_PROMPT_EN =
  'You output only valid JSON when asked. No markdown fences. Single object with key "text" — one natural English sentence.';

/** Перевод родной фразы ученика в естественное предложение на языке обучения. */
export async function generateCustomWordExample(
  headword,
  nativeText,
  { contentLocale, targetLang = 'en' } = {},
) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const hw = String(headword ?? '').trim();
  const native = String(nativeText ?? '').trim();
  if (!hw || !native) {
    throw new Error('Invalid custom example input');
  }

  const userContent = loadWordCustomExamplePrompt(locale, {
    headword: hw,
    nativeText: native,
    targetLang: study,
  });
  const systemPrompt =
    study === 'en' ? CUSTOM_EXAMPLE_SYSTEM_PROMPT_EN : customExampleSystemPrompt(study);
  let lastErr;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const langLabel = getStudyLangMeta(study).nameEn;
    const retryNote =
      attempt > 0
        ? study === 'ru'
          ? `\n\nПредыдущий ответ не подошёл: нужен валидный JSON с ключом text — одно предложение на ${langLabel}, обязательно с формой слова «${hw}» (например одинаковый → одинаковые, одинакова).`
          : `\n\nПредыдущий ответ не подошёл: нужен валидный JSON с ключом text — одно предложение на ${langLabel}, обязательно со словом «${hw}».`
        : '';
    const content = await llmChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent + retryNote },
      ],
      temperature: Math.min(0.65, wordExamplesTemperature() + attempt * 0.08),
      max_tokens: 400,
    });

    try {
      const parsed = extractJsonObject(content);
      let text = englishLineFromItem(parsed);
      if (study === 'en') {
        if (
          text &&
          looksMostlyCyrillicStudyText(text) &&
          !looksMostlyCyrillicStudyText(native) &&
          /[A-Za-z]{2,}/.test(native)
        ) {
          text = '';
        }
        if (!text || looksMostlyCyrillicStudyText(text)) {
          throw new Error('Model returned non-English text');
        }
      } else if (study === 'ru') {
        if (!text || !looksMostlyCyrillicStudyText(text)) {
          throw new Error('Model returned non-Russian text');
        }
      } else if (study === 'uk') {
        if (!text || !looksMostlyCyrillicStudyText(text)) {
          throw new Error('Model returned non-Ukrainian text');
        }
      } else if (study === 'ar') {
        if (!text || !looksMostlyArabicStudyText(text)) {
          throw new Error('Model returned non-Arabic text');
        }
      } else if (study === 'fa') {
        if (!text || !looksMostlyArabicStudyText(text)) {
          throw new Error('Model returned non-Farsi text');
        }
      } else if (study === 'ur') {
        if (!text || !looksMostlyArabicStudyText(text)) {
          throw new Error('Model returned non-Urdu text');
        }
      } else if (study === 'ug') {
        if (!text || !looksMostlyArabicStudyText(text)) {
          throw new Error('Model returned non-Uyghur text');
        }
      } else if (study === 'hi') {
        if (!text || !looksMostlyDevanagariStudyText(text)) {
          throw new Error('Model returned non-Hindi text');
        }
      } else if (study === 'es' || study === 'pt' || study === 'it' || study === 'da' || study === 'nl' || study === 'fr' || study === 'de' || study === 'tr' || study === 'sv' || study === 'no' || study === 'fi' || study === 'pl' || study === 'az' || study === 'vi' || study === 'cs' || study === 'hu' || study === 'ro' || study === 'id' || study === 'ca') {
        if (!text || !looksMostlyLatinStudyText(text)) {
          const langName =
            study === 'es'
              ? 'Spanish'
              : study === 'pt'
                ? 'Portuguese'
                : study === 'it'
                  ? 'Italian'
                  : study === 'da'
                    ? 'Danish'
                    : study === 'nl'
                      ? 'Dutch'
                      : study === 'fr'
                        ? 'French'
                        : study === 'de'
                          ? 'German'
                          : study === 'tr'
                            ? 'Turkish'
                            : study === 'sv'
                              ? 'Swedish'
                              : study === 'no'
                                ? 'Norwegian'
                                : study === 'pl'
                                  ? 'Polish'
                                  : study === 'vi'
                                    ? 'Vietnamese'
                                    : study === 'cs'
                                      ? 'Czech'
                                      : study === 'hu'
                                        ? 'Hungarian'
                                        : study === 'ro'
                                          ? 'Romanian'
                                          : study === 'id'
                                            ? 'Indonesian'
                                            : study === 'ca'
                                              ? 'Catalan'
                                              : study === 'az'
                                                ? 'Azerbaijani'
                                                : 'Finnish';
          throw new Error(`Model returned non-${langName} text`);
        }
      } else if (study === 'he') {
        if (!text || !looksMostlyHebrewStudyText(text)) {
          throw new Error('Model returned non-Hebrew text');
        }
      } else if (study === 'sr') {
        if (!text || !looksMostlyCyrillicStudyText(text)) {
          throw new Error('Model returned non-Serbian text');
        }
      } else if (study === 'el') {
        if (!text || !looksMostlyGreekStudyText(text)) {
          throw new Error('Model returned non-Greek text');
        }
      } else if (study === 'zh') {
        if (!text || !looksMostlyChineseStudyText(text)) {
          throw new Error('Model returned non-Chinese text');
        }
      } else if (study === 'ko') {
        if (!text || !looksMostlyHangulStudyText(text)) {
          throw new Error('Model returned non-Korean text');
        }
      } else if (study === 'ja') {
        if (!text || !looksMostlyJapaneseStudyText(text)) {
          throw new Error('Model returned non-Japanese text');
        }
      }
      if (!exampleUsesHeadword(hw, text, study)) {
        throw new Error('Headword missing in custom example');
      }
      return { text: text.trim(), translation: native };
    } catch (e) {
      lastErr = e;
      console.warn(`[llm] custom example ${locale}/${study}, attempt ${attempt + 1}/3`, e?.message);
    }
  }

  throw lastErr instanceof Error
    ? Object.assign(lastErr, { status: lastErr.status ?? 422 })
    : Object.assign(new Error('Failed to generate custom example'), { status: 422 });
}

const IRREGULAR_FORM_KEYS = ['present', 'past_simple', 'past_participle'];

function normalizeIrregularExampleItem(item) {
  if (!item || typeof item !== 'object') return null;
  const form = String(item.form ?? '').trim();
  if (!IRREGULAR_FORM_KEYS.includes(form)) return null;
  let en = englishLineFromItem(item);
  let translation = russianLineFromItem(item);
  const sp = splitTranslationTail(translation);
  if (sp.noteRu) translation = sp.translation;
  if (!en) return null;
  return { form, en: en.trim(), translation: String(translation ?? '').trim() };
}

function extractIrregularExamplesPayload(text) {
  const t = text.trim();
  let parsed;
  try {
    parsed = JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('No JSON object in model response');
    parsed = JSON.parse(t.slice(start, end + 1));
  }
  const arr = Array.isArray(parsed?.examples) ? parsed.examples : Array.isArray(parsed) ? parsed : [];
  return arr.map((item) => normalizeIrregularExampleItem(item)).filter(Boolean);
}

/** {{IRREGULAR_VERB_EXAMPLES_PER_FORM}} примеров одной формы неправильного глагола. */
async function generateIrregularVerbExamplesForForm(verb, formKey, { contentLocale } = {}) {
  const locale = normalizeContentLocale(contentLocale);
  const infinitive = String(verb?.infinitive ?? '').trim();
  const pastSimple = String(verb?.past_simple ?? '').trim();
  const pastParticiple = String(verb?.past_participle ?? '').trim();
  if (!infinitive || !pastSimple || !pastParticiple) {
    throw new Error('Invalid verb forms');
  }
  if (!IRREGULAR_FORM_KEYS.includes(formKey)) {
    throw new Error(`Invalid verb form: ${formKey}`);
  }

  const userContent = loadIrregularVerbExamplesSingleFormPrompt(locale, {
    INFINITIVE: infinitive,
    PAST_SIMPLE: pastSimple,
    PAST_PARTICIPLE: pastParticiple,
    FORM_KEY: formKey,
    EXAMPLES_PER_FORM: String(IRREGULAR_VERB_EXAMPLES_PER_FORM),
  });

  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const retryNote = attempt > 0 ? localeDictionaryRetryNote(locale) : '';
    const content = await llmChatCompletion({
      messages: [
        { role: 'system', content: buildDictionarySystemPrompt(locale) },
        { role: 'user', content: userContent + retryNote },
      ],
      temperature:
        attempt > 0 ? Math.min(0.55, wordExamplesTemperature() + 0.08) : wordExamplesTemperature(),
      max_tokens: 4000,
    });

    let examples;
    try {
      examples = extractIrregularExamplesPayload(content).filter((ex) => ex.form === formKey);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Ответ модели не разобрался как JSON (${msg}).`);
    }

    if (examples.length < IRREGULAR_VERB_EXAMPLES_PER_FORM) {
      lastErr = new Error(
        `Expected ${IRREGULAR_VERB_EXAMPLES_PER_FORM} examples for ${formKey}, got ${examples.length}`,
      );
      continue;
    }

    const trimmed = examples.slice(0, IRREGULAR_VERB_EXAMPLES_PER_FORM);
    const payload = { examples: trimmed };
    try {
      assertPayloadMatchesContentLocale(locale, payload);
      return trimmed;
    } catch (e) {
      lastErr = e;
      console.warn(
        `[llm] irregular verb ${formKey} locale mismatch ${locale}, attempt ${attempt + 1}/4`,
        e?.message,
      );
    }
  }

  throw lastErr instanceof Error
    ? Object.assign(lastErr, { status: lastErr.status ?? 422 })
    : Object.assign(new Error('Wrong translation language from model'), { status: 422 });
}

/** 30 примеров (10 × present / past_simple / past_participle) — три параллельных запроса к LLM. */
export async function generateIrregularVerbExamples(verb, { contentLocale } = {}) {
  const infinitive = String(verb?.infinitive ?? '').trim();
  if (!infinitive) throw new Error('Invalid verb forms');

  const startedAt = Date.now();
  const chunks = await Promise.all(
    IRREGULAR_FORM_KEYS.map((formKey) =>
      generateIrregularVerbExamplesForForm(verb, formKey, { contentLocale }),
    ),
  );
  console.log(
    `[llm] irregular verb ${infinitive}: parallel forms done in ${Date.now() - startedAt}ms`,
  );
  return { examples: chunks.flat() };
}

/** Быстро получить headword до полной генерации (проверка дубликатов). */
export async function resolveHeadwordEnQuick(word, contentLocale = 'en', targetLang = 'en') {
  const w = String(word ?? '').trim().replace(/\s+/g, ' ');
  if (!w) return '';
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  if (wordInputLooksLikeStudyLanguage(w, locale, study)) return w;
  const isPhrase = isPhraseLikeInput(w);
  const content = await llmChatCompletion({
    messages: [
      {
        role: 'system',
        content: headwordQuickResolveSystemPrompt(isPhrase, study),
      },
      { role: 'user', content: w.slice(0, 200) },
    ],
    temperature: 0.1,
    max_tokens: 64,
  });
  try {
    const parsed = extractJsonObject(content);
    const hw = pickHeadwordEnFromParsed(parsed) || String(parsed?.headwordEn ?? '').trim();
    const normalized = hw.replace(/\s+/g, ' ');
    if (!isHeadwordValidForInput(w, normalized, study)) return '';
    return normalized;
  } catch {
    return '';
  }
}

export { wordInputLooksEnglish } from './dictionaryInputMode.js';

function buildPracticePrompt(userText, dialogueSummary, historyBlock, contentLocale, targetLang = 'en', practiceLevel) {
  const locale = normalizeContentLocale(contentLocale);
  const level = normalizePracticeLevel(practiceLevel);
  const h = historyBlock ?? '(empty)';
  const summary = String(dialogueSummary ?? '').trim() || '(none yet)';
  const activeThread = extractActiveThreadHint(h);
  return loadPracticeTurnPrompt(locale, targetLang, level)
    .replace('{{USER_TEXT}}', String(userText).trim().slice(0, 4000))
    .replace('{{HISTORY}}', h)
    .replace('{{DIALOGUE_SUMMARY}}', summary.slice(0, 900))
    .replace('{{ACTIVE_THREAD}}', activeThread);
}

function extractJsonObject(text) {
  const t = text.trim();
  try {
    const parsed = JSON.parse(t);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // fallthrough
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('No JSON object in model response');
  }
  return JSON.parse(t.slice(start, end + 1));
}

function normalizePracticeTurn(obj, targetLang = 'en') {
  const echo = String(obj.echo ?? obj.user ?? '').trim();
  const reply = String(obj.reply ?? obj.answer ?? '').trim();
  let corrections = obj.corrections;
  if (corrections === null || corrections === undefined || corrections === 'null') {
    corrections = null;
  } else {
    corrections = String(corrections).trim() || null;
  }
  if (!reply) {
    throw new Error('Empty reply in practice response');
  }
  let replyTts = null;
  const rawTts = obj.replyTts ?? obj.reply_tts ?? obj.tts ?? null;
  if (rawTts != null && String(rawTts).trim()) {
    replyTts = String(rawTts).trim();
  }
  return { echo: echo || null, corrections, reply, replyTts };
}

/** Один ход диалога: эхо реплики, правки, ответ собеседника. */
export async function generatePracticeTurn({
  userText,
  dialogueSummary,
  historyBlock,
  history,
  contentLocale,
  targetLang = 'en',
  practiceLevel,
} = {}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const level = normalizePracticeLevel(practiceLevel);
  let block = historyBlock ?? '(empty)';
  let summary = dialogueSummary;
  if (block === '(empty)' && Array.isArray(history) && history.length) {
    const historyLines = history
      .filter((m) => m && typeof m.text === 'string')
      .slice(-28)
      .map((m) => ({
        role: m.role === 'assistant' ? 'Assistant' : 'User',
        text: m.text.slice(0, 1200),
      }));
    block =
      !historyLines.length
        ? '(empty)'
        : historyLines
            .map((m) => `${m.role}: ${m.text}`)
            .join('\n')
            .slice(0, 16000);
    summary = summary ?? '(none yet)';
  }
  const userContent = buildPracticePrompt(userText, summary, block, locale, study, level);

  const content = await llmChatCompletion({
    messages: [
      {
        role: 'system',
        content: practiceFreeSystemPrompt(study, level),
      },
      { role: 'user', content: userContent },
    ],
    temperature: 0.52,
    top_p: 0.92,
    max_tokens: 700,
    repetition_penalty: 1.06,
  });

  const raw = extractJsonObject(content);
  const turn = normalizePracticeTurn(raw, study);
  turn.echo = sanitizePracticeEcho(userText, turn.echo);
  return turn;
}

function buildPracticeExpertPrompt(
  userText,
  dialogueSummary,
  historyBlock,
  contentLocale,
  expert,
  targetLang = 'en',
  practiceLevel,
) {
  if (!expert) {
    throw new Error('Unknown expert role');
  }
  const level = normalizePracticeLevel(practiceLevel);
  const h = historyBlock ?? '(empty)';
  const summary = String(dialogueSummary ?? '').trim() || '(none yet)';
  const activeThread = extractActiveThreadHint(h);
  return loadPracticeExpertTurnPrompt(contentLocale, expert, targetLang, level)
    .replaceAll('{{USER_TEXT}}', String(userText).trim().slice(0, 4000))
    .replaceAll('{{HISTORY}}', h)
    .replaceAll('{{DIALOGUE_SUMMARY}}', summary.slice(0, 900))
    .replaceAll('{{ACTIVE_THREAD}}', activeThread);
}

/** Expert practice turn: role-play specialist (all content locales + study languages). */
export async function generatePracticeExpertTurn({
  userText,
  dialogueSummary,
  historyBlock,
  history,
  contentLocale,
  expert,
  targetLang = 'en',
  practiceLevel,
} = {}) {
  if (!expert) {
    throw new Error('Unknown expert role');
  }
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const level = normalizePracticeLevel(practiceLevel);
  let block = historyBlock;
  let summary = dialogueSummary;
  if (!block && Array.isArray(history)) {
    const historyLines = history
      .filter((m) => m && typeof m.text === 'string')
      .slice(-28)
      .map((m) => ({
        role: m.role === 'assistant' ? 'Assistant' : 'User',
        text: m.text.slice(0, 1200),
      }));
    block =
      !historyLines.length
        ? '(empty)'
        : historyLines
            .map((m) => `${m.role}: ${m.text}`)
            .join('\n')
            .slice(0, 16000);
    summary = summary ?? '(none yet)';
  }
  const userContent = buildPracticeExpertPrompt(userText, summary, block, locale, expert, study, level);

  const content = await llmChatCompletion({
    messages: [
      { role: 'system', content: practiceExpertSystemPrompt(study, level) },
      { role: 'user', content: userContent },
    ],
    temperature: 0.48,
    top_p: 0.92,
    max_tokens: 900,
    repetition_penalty: 1.06,
  });

  const raw = extractJsonObject(content);
  const turn = normalizePracticeTurn(raw, study);
  if (String(userText).trim() === PRACTICE_EXPERT_START_MARKER) {
    return { echo: null, corrections: null, reply: turn.reply, replyTts: turn.replyTts ?? null };
  }
  turn.echo = sanitizePracticeEcho(userText, turn.echo);
  return turn;
}

function formatWordExamplesBlock(examples) {
  if (!Array.isArray(examples) || !examples.length) return '(none)';
  return examples
    .slice(0, 3)
    .map((ex) => {
      const en = englishLineFromItem(ex);
      const ru = russianLineFromItem(ex);
      if (!en) return null;
      return ru ? `- ${en} — ${ru}` : `- ${en}`;
    })
    .filter(Boolean)
    .join('\n');
}

function buildPracticeWordPrompt(
  userText,
  dialogueSummary,
  historyBlock,
  contentLocale,
  wordMeta,
  targetLang = 'en',
  practiceLevel,
) {
  const locale = normalizeContentLocale(contentLocale);
  const level = normalizePracticeLevel(practiceLevel);
  const h = historyBlock ?? '(empty)';
  const summary = String(dialogueSummary ?? '').trim() || '(none yet)';
  const lemma = String(wordMeta?.word ?? '').trim();
  const gloss = String(wordMeta?.gloss_ru ?? wordMeta?.glossRu ?? '').trim() || '(no gloss)';
  const examplesBlock = formatWordExamplesBlock(wordMeta?.examples);
  return loadPracticeWordTurnPrompt(
    locale,
    {
      targetWord: lemma,
      wordGloss: gloss,
      wordExamplesBlock: examplesBlock,
    },
    targetLang,
    level,
  )
    .replace('{{USER_TEXT}}', String(userText).trim().slice(0, 4000))
    .replace('{{HISTORY}}', h)
    .replace('{{DIALOGUE_SUMMARY}}', summary.slice(0, 900));
}

/** Word drill: short simple dialogue focused on one dictionary lemma. */
export async function generatePracticeWordTurn({
  userText,
  dialogueSummary,
  historyBlock,
  history,
  contentLocale,
  wordMeta,
  targetLang = 'en',
  practiceLevel,
} = {}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const level = normalizePracticeLevel(practiceLevel);
  let block = historyBlock;
  let summary = dialogueSummary;
  if (!block && Array.isArray(history)) {
    const historyLines = history
      .filter((m) => m && typeof m.text === 'string')
      .slice(-20)
      .map((m) => ({
        role: m.role === 'assistant' ? 'Assistant' : 'User',
        text: m.text.slice(0, 800),
      }));
    block =
      !historyLines.length
        ? '(empty)'
        : historyLines
            .map((m) => `${m.role}: ${m.text}`)
            .join('\n')
            .slice(0, 12000);
    summary = summary ?? '(none yet)';
  }
  const userContent = buildPracticeWordPrompt(userText, summary, block, locale, wordMeta, study, level);

  const content = await llmChatCompletion({
    messages: [
      { role: 'system', content: practiceWordSystemPrompt(study, level) },
      { role: 'user', content: userContent },
    ],
    temperature: 0.48,
    top_p: 0.9,
    max_tokens: 550,
    repetition_penalty: 1.06,
  });

  const raw = extractJsonObject(content);
  const turn = normalizePracticeTurn(raw, study);
  if (String(userText).trim() === PRACTICE_EXPERT_START_MARKER) {
    return { echo: null, corrections: null, reply: turn.reply, replyTts: turn.replyTts ?? null };
  }
  const targetLemma = String(wordMeta?.word ?? '').trim();
  turn.echo = sanitizeWordPracticeEcho(userText, turn.echo, targetLemma);
  turn.corrections = sanitizeWordPracticeCorrections(userText, turn.corrections, targetLemma);
  return turn;
}

function buildPracticePatternPrompt(
  userText,
  dialogueSummary,
  historyBlock,
  contentLocale,
  patternSeed,
  targetLang = 'en',
  practiceLevel,
) {
  const locale = normalizeContentLocale(contentLocale);
  const level = normalizePracticeLevel(practiceLevel);
  const h = historyBlock ?? '(empty)';
  const summary = String(dialogueSummary ?? '').trim() || '(none yet)';
  return loadPracticePatternTurnPrompt(locale, { patternSeed }, targetLang, level)
    .replace('{{USER_TEXT}}', String(userText).trim().slice(0, 4000))
    .replace('{{HISTORY}}', h)
    .replace('{{DIALOGUE_SUMMARY}}', summary.slice(0, 900));
}

/** Sentence-pattern drill anchored on one learner-chosen sentence. */
export async function generatePracticePatternTurn({
  userText,
  dialogueSummary,
  historyBlock,
  history,
  contentLocale,
  patternSeed,
  targetLang = 'en',
  practiceLevel,
} = {}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const level = normalizePracticeLevel(practiceLevel);
  let block = historyBlock;
  let summary = dialogueSummary;
  if (!block && Array.isArray(history)) {
    const historyLines = history
      .filter((m) => m && typeof m.text === 'string')
      .slice(-20)
      .map((m) => ({
        role: m.role === 'assistant' ? 'Assistant' : 'User',
        text: m.text.slice(0, 800),
      }));
    block =
      !historyLines.length
        ? '(empty)'
        : historyLines
            .map((m) => `${m.role}: ${m.text}`)
            .join('\n')
            .slice(0, 12000);
    summary = summary ?? '(none yet)';
  }
  const userContent = buildPracticePatternPrompt(
    userText,
    summary,
    block,
    locale,
    patternSeed,
    study,
    level,
  );
  const isFirstTurn = String(block ?? '').trim() === '(empty)';

  const content = await llmChatCompletion({
    messages: [
      { role: 'system', content: practicePatternSystemPrompt(study, level) },
      { role: 'user', content: userContent },
    ],
    temperature: 0.45,
    top_p: 0.9,
    max_tokens: 900,
    repetition_penalty: 1.05,
  });

  const raw = extractJsonObject(content);
  const turn = normalizePracticeTurn(raw, study);
  if (isFirstTurn) {
    return { echo: null, corrections: null, reply: turn.reply, replyTts: turn.replyTts ?? null };
  }
  return turn;
}
