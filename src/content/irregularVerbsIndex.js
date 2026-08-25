import top50 from './irregularVerbsTop50.json';
import top100 from './irregularVerbsTop100.json';
import advanced from './irregularVerbsAdvanced.json';

/** @typedef {{ id: number, block: string, pattern: string, infinitive: string, past_simple: string, past_participle: string, translation: string, transcription: string }} IrregularVerb */

/** @type {IrregularVerb[]} */
export const ALL_IRREGULAR_VERBS = [...top50, ...top100, ...advanced];

export const IRREGULAR_VERB_BLOCK_KEYS = ['top_50', 'top_100', 'advanced'];

/** @param {string} block */
export function verbsByBlock(block) {
  return ALL_IRREGULAR_VERBS.filter((v) => v.block === block);
}

/** @param {number} id */
export function getVerbById(id) {
  return ALL_IRREGULAR_VERBS.find((v) => v.id === id) ?? null;
}

/**
 * @param {string | null | undefined} block
 * @param {string} query
 */
export function searchVerbs(block, query) {
  const list = block ? verbsByBlock(block) : ALL_IRREGULAR_VERBS;
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (v) =>
      v.infinitive.toLowerCase().includes(q) ||
      v.translation.toLowerCase().includes(q) ||
      v.past_simple.toLowerCase().includes(q) ||
      v.past_participle.toLowerCase().includes(q),
  );
}

/** @param {string} block */
export function blockVerbCount(block) {
  return verbsByBlock(block).length;
}

/** @param {number[]} ids */
export function verbsByIds(ids) {
  const set = new Set(ids);
  return ALL_IRREGULAR_VERBS.filter((v) => set.has(v.id));
}
