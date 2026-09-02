/** CEFR-style practice levels for dialogue / phrase / pattern / expert modes. */

export const PRACTICE_LEVEL_CODES = ['beginner', 'elementary', 'intermediate', 'upper', 'advanced'];

export const DEFAULT_PRACTICE_LEVEL = 'intermediate';

export function normalizePracticeLevel(raw) {
  const c = String(raw ?? '').trim().toLowerCase();
  return PRACTICE_LEVEL_CODES.includes(c) ? c : DEFAULT_PRACTICE_LEVEL;
}

const LEVEL_META = {
  beginner: {
    label: 'A1 (beginner)',
    cefr: 'A1',
    replyWords: '3–8 words per sentence; max 2 short sentences in "reply"',
    vocabulary: 'top 500 words; present tense; no idioms',
    corrections: 'Explain simply in learner L1; one fix at a time; encourage, never overwhelm',
  },
  elementary: {
    label: 'A2 (elementary)',
    cefr: 'A2',
    replyWords: 'one short sentence, sometimes two; avoid subordinate clauses',
    vocabulary: 'common daily topics; simple past/future OK; rare idioms',
    corrections: 'Only blockers; keep gloss short in learner L1',
  },
  intermediate: {
    label: 'B1 (intermediate)',
    cefr: 'B1',
    replyWords: '1–2 natural sentences; chat length matches the user',
    vocabulary: 'everyday fluent chat; some phrasal verbs OK',
    corrections: 'Meaning blockers and clear unnatural phrasing only',
  },
  upper: {
    label: 'B2 (upper-intermediate)',
    cefr: 'B2',
    replyWords: '2–3 sentences when useful; nuanced but still conversational',
    vocabulary: 'richer vocabulary; natural collocations; light humor OK',
    corrections: 'Include style/naturalness tips when the line is understandable but stiff',
  },
  advanced: {
    label: 'C1 (advanced)',
    cefr: 'C1',
    replyWords: 'native conversational length; articulate, precise, still not academic',
    vocabulary: 'full native range except slang; subtle pragmatics and register',
    corrections: 'Fine-grained native polish; null only when truly native-sounding',
  },
};

function meta(level) {
  return LEVEL_META[normalizePracticeLevel(level)];
}

/** Template vars injected into practice prompt templates. */
export function practiceLevelTemplateVars(level, { mode = 'free' } = {}) {
  const m = meta(level);
  const L = normalizePracticeLevel(level);

  const freeBlock = `
Learner level: ${m.label}.
- In "reply": ${m.replyWords}.
- Vocabulary & grammar ceiling: ${m.vocabulary}.
- "corrections": ${m.corrections}.
- If the user writes above this level, still answer at THEIR chosen level — do not suddenly jump to C1 prose.`.trim();

  const wordBlock = `
Learner level: ${m.label}.
- Explanations in learner L1: short and matched to ${m.cefr}.
- Example sentences you model: ${m.vocabulary}.
- Prompts you give the learner: one simple sentence task; ${m.replyWords.replace('"reply": ', '')}.
- "corrections": ${m.corrections}.`.trim();

  const patternBlock = `
Learner level: ${m.label}.
- Grammar explanation in learner L1: ${L === 'beginner' || L === 'elementary' ? 'very plain words, no jargon' : 'clear but can name the pattern'}.
- Parallel examples: ${m.vocabulary}.
- Ask for one sentence at a time.`.trim();

  const expertReply =
    L === 'beginner' || L === 'elementary'
      ? `${m.cefr} ${'{{STUDY_LANGUAGE}}'} — short, clear, friendly; avoid field jargon in "reply"`
      : L === 'intermediate'
        ? `${m.cefr} ${'{{STUDY_LANGUAGE}}'} — conversational, articulate; light domain terms with quick gloss if needed`
        : `${m.cefr}+ ${'{{STUDY_LANGUAGE}}'} — rich, natural, domain-aware; still not stiff academic prose`;

  const expertTopic =
    L === 'beginner'
      ? 'Offer the simplest everyday hook — no jargon, no "-ism" labels, no theory names'
      : L === 'elementary'
        ? 'Everyday concrete topic; explain any domain word in the same breath'
        : L === 'intermediate'
          ? 'Concrete daily-life angle; name the topic in plain language a non-expert understands'
          : L === 'upper'
            ? 'Can offer moderately deeper angles once user engages; still one clear hook at open'
            : 'May open with a thoughtful angle; user chose advanced — depth OK after they accept';

  const blocks = {
    free: freeBlock,
    word: wordBlock,
    pattern: patternBlock,
    expert: `Learner level: ${m.label}.\n- "reply" language level: ${expertReply}.\n- Topic offers: ${expertTopic}.`,
  };

  return {
    LEARNER_LEVEL_LABEL: m.label,
    PRACTICE_LEVEL_BLOCK: blocks[mode] ?? freeBlock,
    EXPERT_REPLY_LEVEL: expertReply,
    EXPERT_TOPIC_DIFFICULTY: expertTopic,
  };
}

export function practiceLevelSystemHint(level, targetLang) {
  const m = meta(level);
  return `Learner chose ${m.label} for ${targetLang} practice — keep "reply" within that ceiling.`;
}
