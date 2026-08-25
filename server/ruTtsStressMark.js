/** Pure helpers for Russian TTS stress marks (U+0301). */

export const STRESS_MARK = '\u0301';

export function stripRussianStressMarks(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/\u0301/g, '');
}

export function hasRussianStressMarks(text) {
  return /\u0301/.test(String(text ?? ''));
}

export function looksRussianForStress(text) {
  return /[\u0400-\u04FF]/.test(String(text ?? ''));
}

const RU_VOWELS = new Set('аеёиоуыэюяАЕЁИОУЫЭЮЯ');

/** RUAccent/Silero synthesis format: plus BEFORE stressed vowel → U+0301 AFTER vowel for Piper. */
export function convertRuaccentPlusToCombining(text) {
  const src = String(text ?? '');
  let out = '';
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '+' && i + 1 < src.length && RU_VOWELS.has(src[i + 1])) {
      const vowel = src[i + 1];
      out += vowel + STRESS_MARK;
      i += 1;
      continue;
    }
    if ((ch === "'" || ch === '’') && out.length > 0) {
      const last = out[out.length - 1];
      if (RU_VOWELS.has(last)) {
        out += STRESS_MARK;
        continue;
      }
    }
    out += ch;
  }
  return out.normalize('NFC');
}

export function normalizeWs(s) {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function markedTextLooksValid(original, marked) {
  const m = String(marked ?? '').trim();
  if (!m || !looksRussianForStress(m)) return false;
  if (!hasRussianStressMarks(m)) return false;
  const stripped = stripRussianStressMarks(m);
  const a = normalizeWs(stripRussianStressMarks(original));
  const b = normalizeWs(stripped);
  if (a === b) return true;
  if (a.replace(/[«»""]/g, '"') === b.replace(/[«»""]/g, '"')) return true;
  return Math.abs(a.length - b.length) <= Math.max(3, Math.floor(a.length * 0.08));
}
