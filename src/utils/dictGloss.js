/** Split dictionary gloss into study-language headword line and card-locale translation. */
export function splitDictGlossLine(gloss) {
  const raw = String(gloss ?? '').trim();
  if (!raw) return { study: '', translation: '' };

  const dash = raw.match(/^(.+?)\s+[—–-]\s+(.+)$/);
  if (dash?.[1]?.trim()) {
    return { study: dash[1].trim(), translation: dash[2].trim() };
  }

  return { study: raw, translation: '' };
}
