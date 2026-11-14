import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStudyPromptVars, normalizeStudyLang } from './dictionaryStudyLang.js';
import { getPromptLocaleVars, normalizeContentLocale } from './promptLocales.js';
import { practiceLevelTemplateVars } from './practiceLevel.js';
import { englishLineFromItem, russianLineFromItem } from './exampleFields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, 'prompts');
const TEMPLATES_DIR = path.join(PROMPTS_DIR, 'templates');
const LOCALES_DIR = path.join(PROMPTS_DIR, 'locales');
const TARGETS_DIR = path.join(PROMPTS_DIR, 'targets');

function fillTemplate(raw, vars) {
  let out = String(raw);
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, String(value));
  }
  return out;
}

/** Maps promptLocales + study lang fields to {{UPPER_SNAKE}} placeholders. */
function templateVarsFromLocale(locale, targetLang = 'en', practiceLevel, levelMode = 'free') {
  const v = getStudyPromptVars(locale, targetLang);
  const levelVars = practiceLevelTemplateVars(practiceLevel, { mode: levelMode });
  for (const [key, val] of Object.entries(levelVars)) {
    if (typeof val === 'string' && val.includes('{{')) {
      levelVars[key] = fillTemplate(val, v);
    }
  }
  return {
    LEARNER_L1: v.learnerL1,
    CORRECTIONS_LANGUAGE: v.correctionsLanguage,
    LAWFUL_SPEECH_BLOCK: v.lawfulSpeechBlock,
    LEARNER_AUDIENCE: v.learnerAudience,
    TRANSLATION_LANGUAGE: v.translationLanguage,
    INPUT_SCRIPT_NOTE: v.inputScriptNote,
    INPUT_SCRIPT_EXAMPLE: v.inputScriptExample,
    LEGAL_CONTENT_NOTE: v.legalContentNote,
    VERB_LABEL_PRESENT: v.verbLabelPresent,
    VERB_LABEL_PAST: v.verbLabelPast,
    VERB_LABEL_PARTICIPLE: v.verbLabelParticiple,
    TRANSLATION_SCRIPT: v.translationScript,
    TRANSLATION_SCRIPT_NOTE: v.translationScriptNote,
    STUDY_LANGUAGE: v.STUDY_LANGUAGE,
    STUDY_LANGUAGE_RU: v.STUDY_LANGUAGE_RU,
    STUDY_SCRIPT_NOTE: v.STUDY_SCRIPT_NOTE,
    STUDY_SCRIPT_NOTE_RU: v.STUDY_SCRIPT_NOTE_RU,
    STUDY_LANGUAGE_EN: v.STUDY_LANGUAGE_EN,
    TARGET_LANG: v.TARGET_LANG,
    ...levelVars,
  };
}

function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');
}

function readTargetTemplate(targetLang, name) {
  const code = normalizeStudyLang(targetLang);
  const p = path.join(TARGETS_DIR, code, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing target prompt template: ${code}/${name}`);
  }
  return fs.readFileSync(p, 'utf8');
}

function readLocaleFile(locale, name, targetLang = 'en') {
  const code = normalizeContentLocale(locale);
  const study = normalizeStudyLang(targetLang);
  if (study !== 'en') {
    const targetLocalized = path.join(TARGETS_DIR, study, 'locales', code, name);
    if (fs.existsSync(targetLocalized)) {
      return fs.readFileSync(targetLocalized, 'utf8');
    }
    const targetFallback = path.join(TARGETS_DIR, study, 'locales', 'en', name);
    if (fs.existsSync(targetFallback)) {
      return fs.readFileSync(targetFallback, 'utf8');
    }
  }
  const localized = path.join(LOCALES_DIR, code, name);
  if (fs.existsSync(localized)) {
    return fs.readFileSync(localized, 'utf8');
  }
  const legacy = path.join(PROMPTS_DIR, name);
  if (fs.existsSync(legacy)) {
    return fs.readFileSync(legacy, 'utf8');
  }
  throw new Error(`Missing prompt file for locale ${code} target ${study}: ${name}`);
}

/**
 * Тон примеров: домашний экран показывает цитаты из словаря — просим нейтрально-тёплый
 * повседневный контекст, чтобы примеры не попадали в блэклист цитат и поднимали настрой.
 */
const EXAMPLES_TONE_NOTE =
  '\n\n**Tone of examples:** prefer calm, everyday, mildly positive or neutral contexts ' +
  '(home, nature, food, music, work, friends, small everyday wins). Keep each example ' +
  'short — a single brief sentence, up to about 10–12 words. Avoid sad, scary, ' +
  'violent or otherwise gloomy situations unless the headword itself requires them.\n';

/** User prompt for dictionary generation (word-examples). */
export function loadWordExamplesUserPrompt(locale, targetLang = 'en') {
  const study = normalizeStudyLang(targetLang);
  if (study === 'en') {
    return readLocaleFile(locale, 'word-examples.txt', 'en') + EXAMPLES_TONE_NOTE;
  }
  return readTargetTemplate(study, 'word-examples.template.txt') + EXAMPLES_TONE_NOTE;
}

/** System prompt for dictionary generation. */
export function loadDictionarySystemPrompt(locale, targetLang = 'en') {
  const study = normalizeStudyLang(targetLang);
  if (study === 'en') {
    return String(readLocaleFile(locale, 'word-dictionary-system.txt', 'en')).trim();
  }
  return String(readTargetTemplate(study, 'word-dictionary-system.template.txt')).trim();
}

export function loadDictionaryFormatSamples(locale, targetLang = 'en') {
  let formatSampleFormal = '';
  try {
    formatSampleFormal = readLocaleFile(locale, 'word-dictionary-format-sample-formal.json', targetLang);
  } catch {
    try {
      formatSampleFormal = readLocaleFile('ru', 'word-dictionary-format-sample-formal.json', targetLang);
    } catch {
      formatSampleFormal = '';
    }
  }
  let formatSampleVerb = '';
  try {
    formatSampleVerb = readLocaleFile(locale, 'word-dictionary-format-sample-verb.json', targetLang);
  } catch {
    formatSampleVerb = '';
  }
  return {
    formatSample: readLocaleFile(locale, 'word-dictionary-format-sample.json', targetLang),
    formatSampleVerb,
    formatSampleFormal,
  };
}

/** Practice turn user prompt template. */
export function loadPracticeTurnPrompt(locale, targetLang = 'en', practiceLevel) {
  return fillTemplate(
    readTemplate('practice-turn.template.txt'),
    templateVarsFromLocale(locale, targetLang, practiceLevel, 'free'),
  );
}

/** Expert practice turn user prompt (role substituted from practiceExperts). */
export function loadPracticeExpertTurnPrompt(locale, expert, targetLang = 'en', practiceLevel) {
  const vars = {
    ...templateVarsFromLocale(locale, targetLang, practiceLevel, 'expert'),
    EXPERT_ROLE_TITLE: expert.roleTitle,
    EXPERT_DOMAIN: expert.domain,
    EXPERT_STYLE: expert.style,
    SAMPLE_TOPICS: expert.sampleTopics,
    EXPERT_SAFEGUARDS: expert.safeguards
      ? `\nRole-specific rules:\n${expert.safeguards}\n`
      : '',
    START_MARKER: '__start__',
  };
  return fillTemplate(readTemplate('practice-expert-turn.template.txt'), vars);
}

/** Word-focused practice dialogue for one dictionary lemma. */
export function loadPracticeWordTurnPrompt(
  locale,
  { targetWord, wordGloss, wordExamplesBlock },
  targetLang = 'en',
  practiceLevel,
) {
  const vars = {
    ...templateVarsFromLocale(locale, targetLang, practiceLevel, 'word'),
    TARGET_WORD: targetWord,
    WORD_GLOSS: wordGloss || '(no gloss)',
    WORD_EXAMPLES_BLOCK: wordExamplesBlock || '(none)',
    START_MARKER: '__start__',
  };
  return fillTemplate(readTemplate('practice-word-turn.template.txt'), vars);
}

/** Sentence-pattern drill: anchor sentence + parallel examples. */
export function loadPracticePatternTurnPrompt(locale, { patternSeed }, targetLang = 'en', practiceLevel) {
  const vars = {
    ...templateVarsFromLocale(locale, targetLang, practiceLevel, 'pattern'),
    PATTERN_SEED: String(patternSeed ?? '').trim().slice(0, 500) || '(none)',
  };
  return fillTemplate(readTemplate('practice-pattern-turn.template.txt'), vars);
}

/** Irregular verb examples user prompt (30 examples: 10 × 3 forms). */
export function loadIrregularVerbExamplesPrompt(locale, extraVars = {}) {
  let formatSample;
  try {
    formatSample = readLocaleFile(locale, 'irregular-verb-examples-format-sample.json');
  } catch {
    formatSample = readLocaleFile('ru', 'irregular-verb-examples-format-sample.json');
  }
  return fillTemplate(readTemplate('irregular-verb-examples.template.txt'), {
    ...templateVarsFromLocale(locale),
    FORMAT_SAMPLE: formatSample.trim(),
    ...extraVars,
  }) + EXAMPLES_TONE_NOTE;
}

const IRREGULAR_FORM_LABEL_KEYS = {
  present: 'VERB_LABEL_PRESENT',
  past_simple: 'VERB_LABEL_PAST',
  past_participle: 'VERB_LABEL_PARTICIPLE',
};

const IRREGULAR_FORM_TO_USAGE_INDEX = {
  present: 0,
  past_simple: 1,
  past_participle: 2,
};

function irregularVerbSampleFromVerbPack(locale, formKey) {
  try {
    const parsed = JSON.parse(readLocaleFile(locale, 'word-dictionary-format-sample-verb.json'));
    const examples = [];
    const usage = parsed.verbUsage?.[IRREGULAR_FORM_TO_USAGE_INDEX[formKey]];
    if (usage) {
      const en = englishLineFromItem(usage);
      const translation = russianLineFromItem(usage);
      if (en && translation) {
        examples.push({ form: formKey, en, translation });
      }
    }
    for (const item of Array.isArray(parsed.examples) ? parsed.examples : []) {
      if (examples.length >= 2) break;
      const en = englishLineFromItem(item);
      const translation = russianLineFromItem(item);
      if (en && translation) {
        examples.push({ form: formKey, en, translation });
      }
    }
    if (examples.length) {
      return JSON.stringify({ examples: examples.slice(0, 2) }, null, 2);
    }
  } catch {
    // fall through
  }
  return null;
}

function irregularVerbSingleFormFormatSample(locale, formKey) {
  let raw;
  try {
    raw = readLocaleFile(locale, 'irregular-verb-examples-format-sample.json');
  } catch {
    const fromVerbPack = irregularVerbSampleFromVerbPack(locale, formKey);
    if (fromVerbPack) return fromVerbPack;
    raw = readLocaleFile('ru', 'irregular-verb-examples-format-sample.json');
  }
  try {
    const parsed = JSON.parse(raw);
    const examples = (Array.isArray(parsed?.examples) ? parsed.examples : []).filter(
      (item) => String(item?.form ?? '') === formKey,
    );
    return JSON.stringify({ examples: examples.slice(0, 2) }, null, 2);
  } catch {
    return raw.trim();
  }
}

/** Один запрос LLM: {{EXAMPLES_PER_FORM}} примеров одной формы глагола. */
export function loadIrregularVerbExamplesSingleFormPrompt(locale, { formKey, ...extraVars } = {}) {
  const localeVars = templateVarsFromLocale(locale);
  const labelKey = IRREGULAR_FORM_LABEL_KEYS[formKey];
  const formLabel = labelKey ? localeVars[labelKey] : formKey;
  return fillTemplate(readTemplate('irregular-verb-examples-single-form.template.txt'), {
    ...localeVars,
    FORMAT_SAMPLE: irregularVerbSingleFormFormatSample(locale, formKey),
    FORM_KEY: formKey,
    FORM_LABEL: formLabel,
    ...extraVars,
  }) + EXAMPLES_TONE_NOTE;
}

/** Пользовательский пример: родная фраза → естественное предложение на языке обучения. */
export function loadWordCustomExamplePrompt(locale, { headword, nativeText, targetLang = 'en' } = {}) {
  const study = normalizeStudyLang(targetLang);
  const vars = {
    ...templateVarsFromLocale(locale, targetLang),
    HEADWORD: String(headword ?? '').trim(),
    NATIVE_TEXT: String(nativeText ?? '').trim().slice(0, 2000),
  };
  if (study === 'en') {
    return fillTemplate(readTemplate('word-custom-example.template.txt'), vars);
  }
  return fillTemplate(readTargetTemplate(study, 'word-custom-example.template.txt'), vars);
}

export function listPromptLocaleStatus() {
  const codes = fs.existsSync(LOCALES_DIR)
    ? fs.readdirSync(LOCALES_DIR).filter((d) => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory())
    : [];
  return { templatesDir: TEMPLATES_DIR, localeDirs: codes.sort() };
}
