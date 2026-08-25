/** Strip Arabic harakat / tatweel for STT vs example comparison. */
function stripArabicDiacritics(text) {
  return String(text ?? '').replace(/[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

/** Strip Greek diacritics (NFD + remove combining marks in Greek range). */
function stripGreekDiacritics(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g, '')
    .normalize('NFC');
}

/** Normalize CJK / fullwidth punctuation for speak-aloud comparison. */
function normalizeCjkSpeakText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(/[\u3000-\u303F\uFF00-\uFFEF]/g, ' ')
    .replace(/[。、，．！？：；「」『』（）【】]/g, ' ')
    .replace(/[\.!,?;:()[\]{}]/g, ' ');
}

/** Normalize spoken or written line for comparison (ignore case, punctuation, Arabic/Greek vowel marks). */
export function normalizeSpeakLine(text) {
  return normalizeCjkSpeakText(
    stripGreekDiacritics(stripArabicDiacritics(String(text ?? ''))),
  )
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when heard transcript matches the example line, ignoring punctuation. */
export function speakAloudMatchesExpected(heard, expected) {
  const h = normalizeSpeakLine(heard);
  const e = normalizeSpeakLine(expected);
  if (!h || !e) return false;
  return h === e;
}
