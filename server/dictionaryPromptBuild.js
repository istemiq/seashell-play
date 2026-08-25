/**
 * Сборка словарных промптов без LLM-клиента (для тестов и llmClient).
 */
import { WORD_EXAMPLE_COUNT } from './dictionaryConstants.js';
import {
  getInputModeRules,
  getPhraseEntryBanner,
} from './dictionaryInputMode.js';
import { getStudyLangMeta, getStudyPromptVars, normalizeStudyLang } from './dictionaryStudyLang.js';
import {
  loadDictionaryFormatSamples,
  loadDictionarySystemPrompt,
  loadWordExamplesUserPrompt,
} from './promptLoader.js';
import { normalizeContentLocale } from './promptLocales.js';
import { buildRegisterTagsGuide, registerTailExamples } from './registerTags.js';

function getWordDictionaryUserPromptParts(contentLocale, targetLang = 'en') {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const { formatSample, formatSampleVerb, formatSampleFormal } = loadDictionaryFormatSamples(locale, study);
  return {
    template: loadWordExamplesUserPrompt(locale, study),
    formatSample,
    formatSampleVerb,
    formatSampleFormal,
  };
}

export function buildDictionarySystemPrompt(contentLocale, targetLang = 'en') {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const raw = loadDictionarySystemPrompt(locale, study);
  const vars = {
    WORD_EXAMPLE_COUNT: String(WORD_EXAMPLE_COUNT),
    TRANSLATION_LANGUAGE: getStudyPromptVars(locale, study).translationLanguage,
    TRANSLATION_SCRIPT_NOTE: getStudyPromptVars(locale, study).translationScriptNote,
    STUDY_LANGUAGE: getStudyLangMeta(study).nameEn,
    STUDY_SCRIPT_NOTE: getStudyLangMeta(study).studyScriptNoteEn,
  };
  let out = String(raw).trim();
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, String(value));
  }
  return out;
}

export function buildDictionaryUserPrompt(userInput, contentLocale, targetLang = 'en') {
  const w = String(userInput).trim();
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeStudyLang(targetLang);
  const { template, formatSample, formatSampleVerb, formatSampleFormal } =
    getWordDictionaryUserPromptParts(locale, study);
  const vars = getStudyPromptVars(locale, study);
  const formatSamplePrefix =
    locale !== 'en'
      ? `**Sample locale note:** The JSON below shows structure only. Every "translation" and the gloss meaning after « — » MUST be in ${vars.translationLanguage}, even if the sample shows another language.\n\n`
      : '';
  let filled = getPhraseEntryBanner(w, study) + template;
  for (const [key, value] of Object.entries({
    INPUT: w,
    WORD: w,
    WORD_EXAMPLE_COUNT: String(WORD_EXAMPLE_COUNT),
    INPUT_MODE_RULES: getInputModeRules(locale, study),
    REGISTER_TAGS_GUIDE: buildRegisterTagsGuide(locale),
    REGISTER_TAIL_EXAMPLES: registerTailExamples(locale),
    FORMAT_SAMPLE: formatSamplePrefix + formatSample.trim(),
    FORMAT_SAMPLE_VERB: formatSampleVerb.trim(),
    FORMAT_SAMPLE_FORMAL: formatSampleFormal.trim(),
    LEARNER_AUDIENCE: vars.learnerAudience,
    TRANSLATION_LANGUAGE: vars.translationLanguage,
    INPUT_SCRIPT_NOTE: vars.inputScriptNote,
    INPUT_SCRIPT_EXAMPLE: vars.inputScriptExample,
    LEGAL_CONTENT_NOTE: vars.legalContentNote,
    STUDY_LANGUAGE: vars.STUDY_LANGUAGE,
    STUDY_SCRIPT_NOTE: vars.STUDY_SCRIPT_NOTE,
    TRANSLATION_SCRIPT_NOTE: vars.TRANSLATION_SCRIPT_NOTE ?? vars.translationScriptNote,
  })) {
    filled = filled.replaceAll(`{{${key}}}`, String(value));
  }
  return filled;
}
