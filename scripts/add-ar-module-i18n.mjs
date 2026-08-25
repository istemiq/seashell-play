#!/usr/bin/env node
/** Add *Ar i18n keys (from *Ru) to all message locale files. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js');

const EN_AR = {
  'lang.hintAr':
    'Learning content (dictionary and practice) stays in Arabic. Menus and hints use the language you choose.',
  'practice.expertDisclaimerAr':
    'This is AI for Arabic practice. Answers may be wrong. For real help, see qualified professionals. You learn language through a role-play expert persona — not professional advice.',
  'practice.expertDisclaimerShortAr':
    'AI Arabic practice, not professional advice. May contain errors — consult specialists for real decisions.',
  'practice.expertPlaceholderAr': 'Reply in Arabic: yes, no, or suggest another topic…',
  'practice.emptyAr':
    'Type in Arabic — your partner will reply, show what was heard, and briefly correct phrasing if needed.',
  'practice.inArabic': 'In Arabic',
  'practice.placeholderAr': 'Type in Arabic…',
  'dict.wordLabelAr': 'Word or phrase (AR or your language)',
  'dict.placeholderWordAr': 'e.g. ماء or dictionary',
  'dict.cardLangHintAr':
    'Examples stay in Arabic; meanings and translations use the language above. After changing it, tap «Refresh examples» on a card.',
  'dict.addHintAr':
    'Type in your language or Arabic — we save a natural Arabic headword. Examples stay in Arabic; translations use the language chosen above.',
  'dict.addHintGroupAr':
    'The word will be added to this group. Examples stay in Arabic; translations use the language chosen above.',
  'dict.myExamplesEmptyAr':
    'Type a sentence in your native language — AI will translate it naturally into Arabic using this word.',
  'dict.wordPracticeHintAr': 'Short dialogue in simple Arabic. Try to use «{word}» when it fits.',
  'dict.wordPracticePlaceholderAr': 'Short answer in Arabic…',
  'errors.customExampleHeadwordAr':
    'Could not build a natural Arabic sentence with this word. Try rephrasing your phrase or use a form closer to the dictionary word.',
};

function ruToArValue(value) {
  return String(value)
    .replace(/Russian/g, 'Arabic')
    .replace(/русск/g, 'арабск')
    .replace(/Russo/g, 'Árabe')
    .replace(/ruso/g, 'árabe')
    .replace(/russo/g, 'árabe')
    .replace(/russo/gi, 'árabe')
    .replace(/Rusça/g, 'Arapça')
    .replace(/російськ/g, 'арабськ')
    .replace(/російськ/g, 'арабськ')
    .replace(/ロシア語/g, 'アラビア語')
    .replace(/러시아어/g, '아랍어')
    .replace(/русск/g, 'арабск')
    .replace(/Russian/g, 'Arabic')
    .replace(/вода/g, 'ماء')
    .replace(/Cyrillic/g, 'Arabic script')
    .replace(/кириллиц/g, 'арабск')
    .replace(/Russian/g, 'Arabic');
}

for (const file of files) {
  const fp = path.join(dir, file);
  let text = fs.readFileSync(fp, 'utf8');
  const isEn = file === 'en.js';
  const additions = [];

  for (const [ruKey] of text.matchAll(/'([^']+Ru)':/g)) {
    const arKey = ruKey.replace(/Ru$/, 'Ar');
    if (text.includes(`'${arKey}':`)) continue;
    const ruMatch = text.match(new RegExp(`'${ruKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*([\\s\\S]*?),\\n`));
    if (!ruMatch) continue;
    let val = ruMatch[1].trim();
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    const arVal = isEn && EN_AR[arKey] ? EN_AR[arKey] : ruToArValue(val.replace(/^'|'$/g, ''));
    additions.push(`  '${arKey}': '${arVal.replace(/'/g, "\\'")}',`);
  }

  if (!text.includes("'practice.inArabic'")) {
    const inAr =
      file === 'en.js'
        ? EN_AR['practice.inArabic']
        : file === 'ru.js'
          ? 'На арабском'
          : file === 'ar.js'
            ? 'بالعربية'
            : ruToArValue('In Russian');
    additions.push(`  'practice.inArabic': '${inAr.replace(/'/g, "\\'")}',`);
  }

  if (additions.length === 0) continue;

  const insertAt = text.lastIndexOf('};');
  text = `${text.slice(0, insertAt)}${additions.join('\n')}\n${text.slice(insertAt)}`;
  fs.writeFileSync(fp, text);
  console.log(`✓ ${file}: +${additions.length} keys`);
}

console.log('Done');
