#!/usr/bin/env node
/**
 * Проверка переводов кнопок карточки слова и связанных UI-ключей во всех локалях.
 */
import en from '../src/i18n/messages/en.js';
import { messages } from '../src/i18n/messages/index.js';
import { translate } from '../src/i18n/translate.js';
import { UI_LOCALE_CODES } from '../src/i18n/config.js';

const BUTTON_KEYS = [
  'nav.home',
  'nav.dictionary',
  'nav.irregularVerbs',
  'nav.practice',
  'nav.settings',
  'nav.premium',
  'nav.language',
  'nav.readme',
  'nav.back',
  'common.yes',
  'common.cancel',
  'common.delete',
  'common.save',
  'common.close',
  'common.gotIt',
  'dict.addWord',
  'dict.addToGroup',
  'dict.addMyExample',
  'dict.createAndSelect',
  'dict.refreshExamples',
  'dict.refreshExamplesConfirmTitle',
  'dict.refreshExamplesConfirmMsg',
  'dict.refreshPremiumOnly',
  'dict.listen',
  'dict.speakAloud',
  'dict.speakAloudTapStop',
  'dict.speakAloudHeardLabel',
  'dict.speakAloudHeard',
  'practice.listening',
  'practice.transcribing',
  'dict.otherExample',
  'dict.wordPractice',
  'dict.wordPracticeConfirmTitle',
  'dict.wordPracticeConfirmGo',
  'verbs.wordPracticeConfirmMsg',
  'dict.deleteWord',
  'dict.createGroup',
  'dict.rename',
  'dict.delete',
  'dict.watchAd',
  'dict.limitTitle',
  'practice.reply',
  'practice.speak',
  'practice.newDialog',
  'practice.listen',
  'practice.hubFree',
  'practice.hubExpert',
  'practice.toDictionary',
  'verbs.addWord',
  'verbs.addToDictionary',
  'verbs.removeFromMyVerbsShort',
  'verbs.blockTop50',
  'verbs.blockTop100',
  'verbs.blockAdvanced',
];

let failed = false;

for (const loc of UI_LOCALE_CODES) {
  const cat = messages[loc] || {};
  const missing = BUTTON_KEYS.filter((k) => !cat[k] && !en[k]);
  const untranslated = BUTTON_KEYS.filter((k) => loc !== 'en' && cat[k] && cat[k] === en[k]);
  if (missing.length) {
    failed = true;
    console.error(`✗ ${loc}: missing ${missing.join(', ')}`);
  }
  if (untranslated.length) {
    failed = true;
    console.error(`✗ ${loc}: still English → ${untranslated.join(', ')}`);
  }
  for (const k of BUTTON_KEYS) {
    const out = translate(loc, k, { count: 3, word: 'test', language: 'X' });
    if (!out || out === k || out.includes('{')) {
      failed = true;
      console.error(`✗ ${loc} ${k} → ${JSON.stringify(out)}`);
    }
  }
}

if (failed) process.exit(1);
console.log(`✓ button i18n OK: ${BUTTON_KEYS.length} keys × ${UI_LOCALE_CODES.size} locales`);
