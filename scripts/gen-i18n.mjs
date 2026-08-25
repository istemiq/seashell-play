import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../src/i18n/messages');

/** @type {Record<string, Record<string, string>>} */
const catalogs = {
  en: {
    'nav.home': 'Home',
    'nav.dictionary': 'Dictionary',
    'nav.practice': 'Conversation practice',
    'nav.settings': 'Settings',
    'nav.language': 'Language',
    'nav.readme': 'Help',
    'nav.back': 'Back',
    'common.yes': 'Yes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.close': 'Close',
    'home.profile': 'Profile',
    'home.sections': 'Sections',
    'home.tagline1': 'Learn by doing.',
    'home.tagline2': 'Grow your vocabulary.',
    'home.tagline3': 'Keep practicing.',
    'home.tagline4': 'Speak up.',
    'boot.userInit': 'User «{name}» … initialized',
    'boot.userWait': 'User … waiting for profile',
    'boot.uiReady': 'Interface … ready',
    'boot.stateReady': 'Status: ready',
    'settings.title': 'Settings',
    'settings.interface': 'Interface',
    'settings.theme': 'Theme',
    'settings.themeTelegram': 'Match Telegram',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.tts': 'Text-to-speech',
    'settings.ttsEnable': 'Enable TTS',
    'settings.accent': 'Accent',
    'settings.accentUs': 'American (en-US)',
    'settings.accentGb': 'British (en-GB)',
    'settings.ttsRate': 'Speech rate: {rate}',
    'lang.title': 'Language',
    'lang.section': 'App interface',
    'lang.hint':
      'Learning content (dictionary and practice) stays in English. Menus and hints use the language you choose.',
    'practice.title': 'Conversation practice',
    'practice.dialog': 'Dialogue',
    'practice.empty':
      'Type or speak in English — your partner will reply, show what was heard, and briefly correct phrasing if needed.',
    'practice.emptyHint':
      'Tap a word in the dialogue, then "Add to dictionary" to save the word or phrase.',
    'practice.you': 'You',
    'practice.heard': 'As heard',
    'practice.corrections': 'Corrections',
    'practice.partner': 'Partner',
    'practice.toDictionary': 'Add to dictionary',
    'practice.listen': 'Listen to reply',
    'practice.yourReply': 'Your message',
    'practice.inEnglish': 'In English',
    'practice.reply': 'Reply',
    'practice.speak': 'Speak',
    'practice.listening': 'Listening…',
    'errors.sendFailed': 'Could not send',
    'errors.speechFailed': 'Could not recognize speech. Try again or type your message.',
    'errors.voiceUnavailable': 'Voice input unavailable',
    'errors.voiceBrowserUnavailable':
      'Voice input is not available in this browser — use the keyboard.',
    'errors.ttsUnavailable': 'Text-to-speech unavailable',
    'errors.dictTooLong': 'Too long for the dictionary (200 character limit).',
    'errors.dictAdded': 'Added to dictionary: {word}',
    'errors.dictAddFailed': 'Could not add to dictionary',
    'errors.loadFailed': 'Load error',
    'errors.loadGroupsFailed': 'Could not load groups',
    'errors.generic': 'Error',
    'errors.addFailed': 'Could not add',
    'errors.refreshFailed': 'Could not refresh examples',
    'errors.userTelegram':
      'Could not load your Telegram profile. Close and reopen the mini app.',
    'errors.createSetFailed': 'Could not create group',
    'errors.renameFailed': 'Could not rename',
    'errors.deleteSetFailed': 'Could not delete group',
    'errors.saveSetsFailed': 'Could not save groups',
    'errors.deleteFailed': 'Delete error',
    'dict.title': 'Dictionary',
    'dict.group': 'Group',
    'dict.groups': 'Groups',
    'dict.myGroups': 'My groups',
    'dict.groupsHint':
      'A group is a sub-dictionary. For example: "Kitchen", "Business". Inside a group you only see its words.',
    'dict.newGroup': 'New group',
    'dict.placeholderGroup': 'e.g. Kitchen',
    'dict.createGroup': 'Create group',
    'dict.createAndSelect': 'Create and select',
    'dict.rename': 'Rename',
    'dict.delete': 'Delete',
    'dict.openGroup': 'Open group',
    'dict.noGroups': 'No groups yet — create one above.',
    'dict.noGroupsModal': 'No groups yet — create one below or in "My groups".',
    'dict.newWord': 'New word',
    'dict.newWordInGroup': 'New word in group',
    'dict.wordLabel': 'Word or phrase (EN or RU)',
    'dict.placeholderWord': 'e.g. matter or I do not care',
    'dict.addWord': 'Add word',
    'dict.addHint':
      'You can type in Russian — we save a natural English equivalent. We fetch examples and translations with style notes and BrE/AmE tags. "Another example" cycles cards.',
    'dict.addHintGroup':
      'The word will be added to this group. You can type in Russian — we save a natural English equivalent, examples, and translations with style notes (neutral, informal, BrE, etc.).',
    'dict.myWords': 'My words',
    'dict.wordsInGroup': 'Words in group',
    'dict.emptyWords': 'Empty for now — add your first word above.',
    'dict.emptyWordsHint':
      'If words existed on another server, they are not in this API database; add them again or restore a PostgreSQL dump on hosting.',
    'dict.examplesCount': 'Examples: {count}',
    'dict.addToGroup': 'Add to group',
    'dict.wordSetsTitle': 'Add to group',
    'dict.meaning': 'Word meaning',
    'dict.noMeaning':
      'This may not be a word or is a rare neologism — no meaning shown. Tap "Refresh examples" to try again.',
    'dict.verbForms': 'Three verb forms',
    'dict.formN': 'Form {n}',
    'dict.exampleN': 'Example {n}',
    'dict.of': 'of',
    'dict.noTranslation': 'No translation for this card.',
    'dict.noExample':
      'Could not show an example. Tap "Refresh examples" or delete the word and add it again.',
    'dict.refreshExamples': 'Refresh examples',
    'dict.listen': 'Listen',
    'dict.otherExample': 'Another example',
    'dict.deleteWord': 'Delete word',
    'dict.deleteWordTitle': 'Delete word?',
    'dict.deleteWordMsg': 'The word and all examples will be deleted permanently.',
    'dict.deleteGroupTitle': 'Delete group?',
    'dict.deleteGroupMsg':
      'The group will be deleted. Words left without any group will also be removed.',
    'dict.renamePrompt': 'New group name',
    'dict.glossNoteLegacy': 'Extra note on head meaning (legacy card): {text}',
    'dict.exampleNoteLegacy': 'Note (legacy card): {text}',
    'readme.title': 'Help',
    'readme.what': 'What is this app',
    'readme.whatBody':
      'Seashell is a Telegram mini app for learning English: a personal dictionary with meanings and examples, plus live dialogue practice with brief feedback on your phrases. Internet and Telegram sign-in are required (your account owns saved words).',
    'readme.general': 'General',
    'readme.generalBody':
      'Open sections from the home page (Dictionary, Conversation practice, Settings, and this Help). If you see "seashell…" or a network/server message while loading — wait, check your connection, or try later.',
    'readme.dict': 'Dictionary',
    'readme.dictBody':
      'Word list, groups, add and delete words, word card with translation and examples, assign words to groups.',
    'readme.practice': 'Conversation practice',
    'readme.practiceBody':
      'Type a phrase in English — you get a partner reply, an "as heard" block, and short corrections when needed. Voice input works if your device supports it.',
    'readme.settings': 'Settings',
    'readme.settingsBody': 'Text-to-speech (TTS) options stored on your device.',
    'readme.legal': 'Legal',
    'readme.legalBody': 'Privacy policy opens inside the app.',
    'readme.privacyBtn': 'Privacy policy',
    'privacy.title': 'Privacy policy',
    'privacy.ruOnlyNote': 'The full legal privacy policy text is available in Russian.',
  },
};

// Additional locales: copy structure from en with translated strings
// (abbreviated in script — full translations below in separate write for each)

function serialize(obj) {
  const lines = Object.entries(obj).map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`);
  return `export default {\n${lines.join('\n')}\n};\n`;
}

for (const [code, catalog] of Object.entries(catalogs)) {
  fs.writeFileSync(path.join(outDir, `${code}.js`), serialize(catalog));
  console.log('wrote', code, Object.keys(catalog).length);
}
