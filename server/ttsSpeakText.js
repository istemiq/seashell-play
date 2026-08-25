/**
 * Pick text for Piper/espeak — avoid speaking mixed L1 + study-language replies.
 */
import { prepareRussianTtsText } from './ruTtsStress.js';
import { normalizeStudyLang } from './dictionaryStudyLang.js';

const CYRILLIC = /[\u0400-\u04FF]/;
const LATIN_HEAVY = /^[\sA-Za-z0-9.,;:!?'""''«»()\[\]\-–—/]+$/;

const CYRILLIC_STUDY = new Set(['ru', 'uk', 'sr']);
const LATIN_STUDY = new Set([
  'en', 'es', 'pt', 'it', 'da', 'nl', 'fr', 'de', 'tr', 'sv', 'no', 'fi',
  'pl', 'vi', 'cs', 'hu', 'ro', 'id', 'ca', 'az',
]);

function normalizeWs(s) {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkMatchesStudyLang(code, chunk) {
  const c = normalizeWs(chunk);
  if (!c || c.length < 4) return false;
  if (CYRILLIC_STUDY.has(code)) return true;
  if (CYRILLIC.test(c)) return false;

  if (LATIN_STUDY.has(code)) return /[A-Za-zÀ-ÿ]{3,}/.test(c);
  if (code === 'el') return /[\u0370-\u03FF]/.test(c);
  if (code === 'he') return /[\u0590-\u05FF]/.test(c);
  if (code === 'ar' || code === 'fa' || code === 'ur' || code === 'ug') {
    return /[\u0600-\u06FF]/.test(c);
  }
  if (code === 'ja') return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(c);
  if (code === 'zh') return /[\u4E00-\u9FFF]/.test(c);
  if (code === 'ko') return /[\uAC00-\uD7AF]/.test(c);
  if (code === 'hi') return /[\u0900-\u097F]/.test(c);
  return c.length >= 8;
}

function pushPart(parts, chunk, code) {
  const c = normalizeWs(chunk);
  if (!chunkMatchesStudyLang(code, c)) return;
  parts.push(c);
}

function extractQuotedAfterArrow(src, code, parts) {
  for (const m of src.matchAll(/→\s*[«""'「『(\[]?([^»""'」』\]\)\n]+)[»""'」』\]\)]?/gu)) {
    pushPart(parts, m[1], code);
  }
}

function extractLatinQuotes(src, code, parts) {
  if (!LATIN_STUDY.has(code)) return;
  for (const m of src.matchAll(/[«""']([A-Za-zÀ-ÿ][^»""']{8,})[»""']/gu)) {
    pushPart(parts, m[1], code);
  }
}

function extractCjkQuotes(src, code, parts) {
  if (code !== 'ja' && code !== 'zh') return;
  for (const m of src.matchAll(/[「『]([^」』]{4,})[」』]/gu)) {
    pushPart(parts, m[1], code);
  }
}

function extractLatinLines(src, code, parts) {
  if (!LATIN_STUDY.has(code)) return;
  for (const line of src.split(/\n+/)) {
    const chunk = normalizeWs(line.replace(/^[\s•\-–*]+/, ''));
    if (chunk.length < 12 || CYRILLIC.test(chunk)) continue;
    if (LATIN_HEAVY.test(chunk) && /[A-Za-z]{3,}/.test(chunk)) pushPart(parts, chunk, code);
  }
}

function dedupeParts(parts) {
  const uniq = [];
  const seen = new Set();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(p);
  }
  return uniq.join(' ').trim();
}

/** Extract study-language snippets from a mixed reply (pattern drill, L1 UI + study examples). */
export function extractStudyLangForTts(text, targetLang) {
  const src = String(text ?? '').trim();
  if (!src) return '';

  const code = normalizeStudyLang(targetLang);
  if (CYRILLIC_STUDY.has(code)) return src;

  const parts = [];
  extractQuotedAfterArrow(src, code, parts);
  extractLatinQuotes(src, code, parts);
  extractCjkQuotes(src, code, parts);
  extractLatinLines(src, code, parts);
  return dedupeParts(parts);
}

function ttsAltLooksUsable(original, alt, targetLang) {
  const a = normalizeWs(alt);
  if (!a || a.length < 3) return false;
  const code = normalizeStudyLang(targetLang);
  if (!CYRILLIC_STUDY.has(code) && CYRILLIC.test(a)) return false;
  if (!chunkMatchesStudyLang(code, a)) return false;
  if (a.length > normalizeWs(original).length * 1.5 + 40) return false;
  return true;
}

/** Text that actually goes to the synthesizer. */
export async function resolveSpeakText({ text, ttsText, locale, targetLang }) {
  const plain = normalizeWs(text);
  const alt = normalizeWs(ttsText);
  const lc = String(locale ?? '').toLowerCase().replace(/_/g, '-');
  const study = normalizeStudyLang(targetLang || locale);

  if (lc === 'ru' || lc === 'ru-ru' || study === 'ru') {
    return normalizeWs(await prepareRussianTtsText(plain, alt));
  }

  if (ttsAltLooksUsable(plain, alt, study)) return alt;

  const extracted = extractStudyLangForTts(plain, study);
  if (extracted && extracted.length >= 8 && extracted.length <= plain.length + 20) {
    return extracted;
  }

  return plain;
}
