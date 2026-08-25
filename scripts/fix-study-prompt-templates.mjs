#!/usr/bin/env node
/** Fix hardcoded study language names in target prompt templates. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TARGETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '../server/prompts/targets');

for (const study of fs.readdirSync(TARGETS)) {
  if (study === 'en') continue;
  for (const name of ['word-examples.template.txt', 'word-dictionary-system.template.txt']) {
    const fp = path.join(TARGETS, study, name);
    if (!fs.existsSync(fp)) continue;
    let text = fs.readFileSync(fp, 'utf8');
    const before = text;

    text = text.replace(
      /- `headwordEn` and every `text` = \*\*[^*]+\*\* \([^)]+\)\./g,
      '- `headwordEn` and every `text` = **{{STUDY_LANGUAGE}}** ({{STUDY_SCRIPT_NOTE}}).',
    );
    text = text.replace(
      /Never copy the [A-Za-z]+ sentence into `translation`/g,
      'Never copy the {{STUDY_LANGUAGE}} sentence into `translation`',
    );
    text = text.replace(
      /\*\*Critical split \([^)]+\)\*\*/g,
      '**Critical split ({{STUDY_LANGUAGE}} study module)**',
    );
    text = text.replace(
      /Cyrillic or Arabic script in "text" is forbidden when studying [A-Za-z]+/g,
      'Wrong script in "text" is forbidden when studying {{STUDY_LANGUAGE}}',
    );
    text = text.replace(
      /For [A-Za-z]+ study entries omit verbUsage/g,
      'For {{STUDY_LANGUAGE}} study entries omit verbUsage',
    );
    text = text.replace(
      /Do \*\*not\*\* add `verbUsage` for [A-Za-z]+ study entries/g,
      'Do **not** add `verbUsage` for {{STUDY_LANGUAGE}} study entries',
    );

    if (text !== before) {
      fs.writeFileSync(fp, text);
      console.log(`✓ ${study}/${name}`);
    }
  }
}
