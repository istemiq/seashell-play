#!/usr/bin/env node
/** Audit prompt templates and format samples for locale/language mismatches. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = path.join(ROOT, 'server/prompts/targets');
const CONTENT_LOCALES = ['ru', 'en', 'ar', 'es', 'pt', 'fa', 'uk', 'ko', 'ja', 'it', 'tr'];

const STUDY_NAMES = {
  pl: 'Polish', de: 'German', it: 'Italian', es: 'Spanish', fr: 'French',
  vi: 'Vietnamese', fi: 'Finnish', ja: 'Japanese', zh: 'Chinese', ko: 'Korean',
  tr: 'Turkish', ar: 'Arabic', fa: 'Persian', el: 'Greek', da: 'Danish',
  nl: 'Dutch', pt: 'Portuguese', ro: 'Romanian', cs: 'Czech', hu: 'Hungarian',
  id: 'Indonesian', he: 'Hebrew', ca: 'Catalan', sr: 'Serbian', hi: 'Hindi',
  ur: 'Urdu', az: 'Azerbaijani', ug: 'Uyghur', uk: 'Ukrainian', ru: 'Russian',
};

function latinRatio(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  if (!t) return 0;
  let lat = 0;
  let total = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) lat += 1;
    if (/[A-Za-z\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(ch)) {
      total += 1;
    }
  }
  return total ? lat / total : 0;
}

function auditSampleJson(fp, contentLocale) {
  const issues = [];
  let j;
  try {
    j = JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (e) {
    return [`parse error: ${e.message}`];
  }
  const glossTail = String(j.glossRu ?? '').split('—').pop() ?? '';
  if (contentLocale === 'ru' && latinRatio(glossTail) > 0.35) {
    issues.push(`glossRu tail mostly Latin: ${glossTail.trim().slice(0, 50)}`);
  }
  if (contentLocale === 'en' && /[\u0400-\u04FF]/.test(glossTail) && latinRatio(glossTail) < 0.2) {
    issues.push('glossRu tail Cyrillic in en sample');
  }
  for (const [i, ex] of (j.examples ?? []).entries()) {
    const tr = String(ex.translation ?? '');
    if (contentLocale === 'ru' && latinRatio(tr) > 0.4) {
      issues.push(`ex[${i}] translation mostly Latin: ${tr.slice(0, 60)}`);
    }
    if (contentLocale === 'uk' && latinRatio(tr) > 0.4) {
      issues.push(`ex[${i}] translation mostly Latin (expected uk): ${tr.slice(0, 60)}`);
    }
    if (contentLocale === 'ar' && !/[\u0600-\u06FF]/.test(tr) && latinRatio(tr) > 0.5) {
      issues.push(`ex[${i}] translation mostly Latin (expected ar): ${tr.slice(0, 60)}`);
    }
  }
  return issues;
}

const templateIssues = [];
const sampleIssues = [];
const missingSamples = [];

for (const study of fs.readdirSync(TARGETS)) {
  if (study === 'en') continue;
  const expected = STUDY_NAMES[study];
  for (const f of fs.readdirSync(path.join(TARGETS, study)).filter((x) => x.endsWith('.template.txt'))) {
    const text = fs.readFileSync(path.join(TARGETS, study, f), 'utf8');
    for (const [code, name] of Object.entries(STUDY_NAMES)) {
      if (code === study) continue;
      if (text.includes('{{STUDY_LANGUAGE}}')) continue;
      if (text.includes(`**${name}**`) || text.includes(`for ${name} study`)) {
        templateIssues.push(`${study}/${f}: mentions wrong language "${name}" (expected ${expected ?? study})`);
      }
    }
    if (expected && text.includes('= **Italian**') && study !== 'it') {
      templateIssues.push(`${study}/${f}: hardcoded Italian in critical split`);
    }
    if (expected && text.includes('= **Polish**') && study !== 'pl') {
      templateIssues.push(`${study}/${f}: hardcoded Polish in critical split`);
    }
    if (f === 'word-custom-example.template.txt') continue;
    if (!text.includes('{{TRANSLATION_LANGUAGE}}')) {
      templateIssues.push(`${study}/${f}: missing {{TRANSLATION_LANGUAGE}} placeholder`);
    }
    if (!text.includes('{{STUDY_LANGUAGE}}')) {
      templateIssues.push(`${study}/${f}: missing {{STUDY_LANGUAGE}} placeholder`);
    }
  }

  for (const loc of CONTENT_LOCALES) {
    const fp = path.join(TARGETS, study, 'locales', loc, 'word-dictionary-format-sample.json');
    if (!fs.existsSync(fp)) {
      missingSamples.push(`${study}/${loc}`);
      continue;
    }
    const issues = auditSampleJson(fp, loc);
    if (issues.length) sampleIssues.push({ path: `${study}/locales/${loc}`, issues });
  }
}

console.log('=== Template issues:', templateIssues.length);
for (const x of templateIssues.slice(0, 50)) console.log(' ', x);
if (templateIssues.length > 50) console.log(`  ... +${templateIssues.length - 50} more`);

console.log('\n=== Sample locale issues:', sampleIssues.length);
for (const x of sampleIssues.slice(0, 40)) {
  console.log(`  ${x.path}:`);
  for (const i of x.issues.slice(0, 3)) console.log('   -', i);
}

console.log('\n=== Missing format samples:', missingSamples.length);
console.log('  first 15:', missingSamples.slice(0, 15).join(', '));

const failed = templateIssues.length + sampleIssues.length + missingSamples.length;
process.exit(failed > 0 ? 1 : 0);
