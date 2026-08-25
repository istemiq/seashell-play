import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/content');

// Canonical irregular forms (infinitive -> [past_simple, past_participle])
const CANON = {
  be: ['was/were', 'been'],
  bespeak: ['bespoke', 'bespoken'],
  cleave: ['cleft/cleaved/cleft', 'cleft/cleaved/cleft'], // dual
  dream: ['dreamt/dreamed', 'dreamt/dreamed'],
  dwell: ['dwelt/dwelled', 'dwelt/dwelled'],
  lean: ['leant/leaned', 'leant/leaned'],
  learn: ['learnt/learned', 'learnt/learned'],
  smell: ['smelt/smelled', 'smelt/smelled'],
  spell: ['spelt/spelled', 'spelt/spelled'],
  spill: ['spilt/spilled', 'spilt/spilled'],
  spoil: ['spoilt/spoiled', 'spoilt/spoiled'],
  strew: ['strewed', 'strewn/strewed'],
  stride: ['strode', 'stridden/strid'],
  weep: ['wept', 'wept'],
  wince: null, // regular: winced/winced
};

function altForms(s) {
  return String(s)
    .split('/')
    .flatMap((x) => x.split(','))
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function formsMatch(expected, actual) {
  if (!expected) return { ok: false, reason: 'should_be_regular' };
  const exp = altForms(expected);
  const act = altForms(actual);
  return { ok: act.some((a) => exp.includes(a)), exp, act };
}

const files = {
  top50: 'irregularVerbsTop50.json',
  top100: 'irregularVerbsTop100.json',
  advanced: 'irregularVerbsAdvanced.json',
};

const byId = new Map();
const byInf = new Map();
const issues = [];

for (const [label, file] of Object.entries(files)) {
  const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  for (const v of data) {
    v._source = `${label}:${file}`;
    if (byId.has(v.id)) {
      issues.push({ severity: 'info', type: 'dup_id_in_merged_source', id: v.id, sources: [byId.get(v.id)._source, v._source] });
    }
    byId.set(v.id, v);

    const key = v.infinitive.toLowerCase();
    if (!byInf.has(key)) byInf.set(key, []);
    byInf.get(key).push(v);
  }
}

// Only audit unique ids from production files (exclude duplicate batch file)
const entries = [...byId.values()].sort((a, b) => a.id - b.id);

for (const v of entries) {
  const inf = v.infinitive.toLowerCase();

  // Canonical cross-check
  if (CANON[inf] === null) {
    issues.push({
      severity: 'error',
      type: 'regular_verb_in_list',
      id: v.id,
      infinitive: v.infinitive,
      note: `${v.infinitive} is regular (e.g. winced/winced), should not be irregular`,
      ps: v.past_simple,
      pp: v.past_participle,
    });
  } else if (CANON[inf]) {
    const psCheck = formsMatch(CANON[inf][0], v.past_simple);
    const ppCheck = formsMatch(CANON[inf][1], v.past_participle);
    if (!psCheck.ok || !ppCheck.ok) {
      issues.push({
        severity: 'error',
        type: 'wrong_canonical_form',
        id: v.id,
        infinitive: v.infinitive,
        expected: CANON[inf],
        actual: [v.past_simple, v.past_participle],
      });
    }
  }

  // weap typo
  if (inf === 'weap') {
    issues.push({
      severity: 'error',
      type: 'typo_infinitive',
      id: v.id,
      infinitive: v.infinitive,
      should_be: 'weep',
      forms_ok_for_weep: v.past_simple === 'wept' && v.past_participle === 'wept',
    });
  }

  // Examples must use declared forms (allow was/were split)
  for (const ex of v.examples ?? []) {
    const en = ex.en.toLowerCase();
    const expectedForms =
      ex.form === 'past_simple' ? altForms(v.past_simple) : altForms(v.past_participle);
    const hit = expectedForms.some((w) => en.includes(w));
    if (!hit) {
      issues.push({
        severity: 'error',
        type: 'example_form_mismatch',
        id: v.id,
        infinitive: v.infinitive,
        exampleForm: ex.form,
        expected: ex.form === 'past_simple' ? v.past_simple : v.past_participle,
        sentence: ex.en,
      });
    }
  }

  // Infinitive looks like past form of another verb
  if (['chose', 'bespoke', 'forgot', 'wrote'].includes(inf)) {
    issues.push({
      severity: 'error',
      type: 'infinitive_is_past_form',
      id: v.id,
      infinitive: v.infinitive,
    });
  }

  // Draft notes left in translation
  if (/замена|синоним|уже известное|\*[^*]+\*/i.test(v.translation)) {
    issues.push({
      severity: 'warn',
      type: 'draft_note_in_translation',
      id: v.id,
      infinitive: v.infinitive,
      translation: v.translation,
    });
  }

  // Pattern sanity (ABB = ps === pp, AAA = all equal)
  if (v.pattern === 'ABB' && v.past_simple !== v.past_participle) {
    // Some sources label ABC verbs as ABB incorrectly
    const bothMatchInf = v.past_simple === v.infinitive && v.past_participle === v.infinitive;
    if (!bothMatchInf) {
      issues.push({
        severity: 'warn',
        type: 'pattern_mismatch',
        id: v.id,
        infinitive: v.infinitive,
        pattern: v.pattern,
        ps: v.past_simple,
        pp: v.past_participle,
        note: 'marked ABB but past forms differ',
      });
    }
  }
}

// Duplicate infinitives across unique ids
for (const [inf, list] of byInf.entries()) {
  const uniqueIds = [...new Set(list.map((v) => v.id))];
  if (uniqueIds.length > 1) {
    issues.push({
      severity: 'warn',
      type: 'duplicate_infinitive',
      infinitive: inf,
      ids: uniqueIds,
    });
  }
}

// ID gaps
const ids = entries.map((v) => v.id).sort((a, b) => a - b);
for (let i = 1; i < ids.length; i++) {
  if (ids[i] - ids[i - 1] > 1) {
    issues.push({ severity: 'info', type: 'id_gap', from: ids[i - 1], to: ids[i] });
  }
}

// Suspicious English forms (not in examples and look invented)
const suspiciousWords = ['wanced', 'weap', 'beseeched', 'girded'];
for (const v of entries) {
  for (const w of suspiciousWords) {
    if ([v.infinitive, v.past_simple, v.past_participle].some((f) => String(f).toLowerCase().includes(w))) {
      if (w === 'wanced' || w === 'weap') {
        // already covered
      } else {
        issues.push({ severity: 'info', type: 'flagged_form', id: v.id, infinitive: v.infinitive, word: w });
      }
    }
  }
}

const errors = issues.filter((i) => i.severity === 'error');
const warns = issues.filter((i) => i.severity === 'warn');
const infos = issues.filter((i) => i.severity === 'info');

console.log(`Entries (unique ids): ${entries.length}`);
console.log(`Errors: ${errors.length}, Warnings: ${warns.length}, Info: ${infos.length}\n`);

console.log('=== ERRORS ===');
for (const i of errors) console.log(JSON.stringify(i));

console.log('\n=== WARNINGS ===');
for (const i of warns) console.log(JSON.stringify(i));

console.log('\n=== INFO (duplicates from batch file excluded in entries count) ===');
for (const i of infos.filter((x) => x.type !== 'dup_id_in_merged_source')) console.log(JSON.stringify(i));
