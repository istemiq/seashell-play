/** Mirrors server PRACTICE_EXPERT_CATEGORY_ORDER (fallback if API omits category). */
export const EXPERT_CATEGORY_ORDER = ['humanities', 'sciences', 'health', 'faiths'];

const FALLBACK_CATEGORY_BY_ID = {
  philosopher: 'humanities',
  political_scientist: 'humanities',
  historian: 'humanities',
  economist: 'humanities',
  sociologist: 'humanities',
  lawyer: 'humanities',
  literary_scholar: 'humanities',
  art_historian: 'humanities',
  linguist: 'humanities',
  geographer: 'humanities',
  physicist: 'sciences',
  chemist: 'sciences',
  biologist: 'sciences',
  mathematician: 'sciences',
  astronomer: 'sciences',
  neuroscientist: 'sciences',
  computer_scientist: 'sciences',
  psychologist: 'health',
  physician: 'health',
  buddhist_tradition: 'faiths',
  christian_tradition: 'faiths',
  daoist_tradition: 'faiths',
  confucian_tradition: 'faiths',
  hindu_tradition: 'faiths',
  krishnaite_tradition: 'faiths',
  muslim_tradition: 'faiths',
  jewish_tradition: 'faiths',
  sikh_tradition: 'faiths',
};

export function expertCategory(expert) {
  const fromApi = String(expert?.category ?? '').trim();
  if (EXPERT_CATEGORY_ORDER.includes(fromApi)) return fromApi;
  return FALLBACK_CATEGORY_BY_ID[expert?.id] ?? 'humanities';
}

/** @param {Array<{ id: string, title: string, category?: string }>} experts */
export function groupExpertsByCategory(experts) {
  const buckets = new Map(EXPERT_CATEGORY_ORDER.map((c) => [c, []]));
  for (const e of experts) {
    const cat = expertCategory(e);
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat).push(e);
  }
  return EXPERT_CATEGORY_ORDER.filter((c) => buckets.get(c)?.length).map((category) => ({
    category,
    experts: buckets.get(category),
  }));
}
