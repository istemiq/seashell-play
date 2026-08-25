/**
 * Russian TTS stress marks (combining acute U+0301 after stressed vowels).
 * Piper/espeak uses them when present; UI shows text without marks.
 */
import crypto from 'crypto';
import { llmChatCompletion } from './llmClient.js';
import { markRussianStressWithRuaccent } from './ruTtsStressRuaccent.js';
import {
  hasRussianStressMarks,
  looksRussianForStress,
  markedTextLooksValid,
  stripRussianStressMarks,
  STRESS_MARK,
} from './ruTtsStressMark.js';

export {
  stripRussianStressMarks,
  hasRussianStressMarks,
  looksRussianForStress,
  STRESS_MARK,
} from './ruTtsStressMark.js';

const STRESS_CACHE_MAX = 800;
const stressCache = new Map();

function envBool(name, def = true) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return def;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function cacheKey(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function rememberStress(original, marked) {
  if (stressCache.size >= STRESS_CACHE_MAX) {
    const first = stressCache.keys().next().value;
    stressCache.delete(first);
  }
  stressCache.set(cacheKey(original), marked);
}

function recallStress(original) {
  return stressCache.get(cacheKey(original)) ?? null;
}

async function markWithLlm(original) {
  const content = await llmChatCompletion({
    messages: [
      {
        role: 'system',
        content:
          'You mark Russian word stress for speech synthesis. ' +
          'Place Unicode COMBINING ACUTE ACCENT (U+0301) immediately AFTER each stressed vowel (а, е, ё, и, о, у, ы, э, ю, я). ' +
          'Output ONLY the marked text — no quotes, markdown, or commentary. ' +
          'Keep Latin, digits, emoji, and punctuation unchanged. One primary stress per word.',
      },
      {
        role: 'user',
        content: `Mark stress:\n"""\n${original.slice(0, 1200)}\n"""`,
      },
    ],
    temperature: 0.08,
    max_tokens: Math.min(900, original.length * 2 + 80),
  });

  const marked = String(content ?? '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .normalize('NFC');

  if (markedTextLooksValid(original, marked)) return marked;
  return null;
}

/**
 * Add combining acute accents for Piper TTS. Returns original on failure.
 */
export async function addRussianStressMarks(text, { preferLlm = true } = {}) {
  const original = stripRussianStressMarks(String(text ?? '').trim());
  if (!original || !looksRussianForStress(original)) return original;

  const cached = recallStress(original);
  if (cached) return cached;

  const ruaccentMarked = await markRussianStressWithRuaccent(original);
  if (ruaccentMarked) {
    rememberStress(original, ruaccentMarked);
    return ruaccentMarked;
  }

  if (preferLlm && envBool('TTS_RU_STRESS_LLM', true)) {
    try {
      const marked = await markWithLlm(original);
      if (marked) {
        rememberStress(original, marked);
        return marked;
      }
    } catch (e) {
      console.warn('[ruTtsStress] LLM stress failed:', e?.message || e);
    }
  }

  return original;
}

/** Plain reply text is the source of truth — ignore client/LLM replyTts marks. */
export async function prepareRussianTtsText(plainText, _ttsText) {
  const plain = stripRussianStressMarks(String(plainText ?? '').trim());
  if (!plain || !looksRussianForStress(plain)) return plain;
  return addRussianStressMarks(plain);
}
