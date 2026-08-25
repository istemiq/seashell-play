#!/usr/bin/env node
/** Scaffold learn modules: vi, cs, hu, ro, id, he, ca, sr */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const LANGS = [
  {
    code: 'vi',
    nativeName: 'Tiếng Việt',
    nameEn: 'Vietnamese',
    nameRu: 'вьетнамский',
    ttsLocale: 'vi-VN',
    accentLabel: 'Vietnamese — Vais1000 (vi-VN)',
    script: 'latin',
    inLanguage: 'In Vietnamese',
    sampleWord: 'nước',
    sampleIpa: '[nɨək˧˦]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Tôi cần một ly nước.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. nước or dictionary',
    wordLabel: 'Word or phrase (VI or your language)',
  },
  {
    code: 'cs',
    nativeName: 'Čeština',
    nameEn: 'Czech',
    nameRu: 'чешский',
    ttsLocale: 'cs-CZ',
    accentLabel: 'Czech — Jirka (cs-CZ)',
    script: 'latin',
    inLanguage: 'In Czech',
    sampleWord: 'voda',
    sampleIpa: '[ˈvoda]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Potřebuji sklenici vody.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. voda or dictionary',
    wordLabel: 'Word or phrase (CS or your language)',
  },
  {
    code: 'hu',
    nativeName: 'Magyar',
    nameEn: 'Hungarian',
    nameRu: 'венгерский',
    ttsLocale: 'hu-HU',
    accentLabel: 'Hungarian — Anna (hu-HU)',
    script: 'latin',
    inLanguage: 'In Hungarian',
    sampleWord: 'víz',
    sampleIpa: '[ˈviːs]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Szükségem van egy pohár vízre.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. víz or dictionary',
    wordLabel: 'Word or phrase (HU or your language)',
  },
  {
    code: 'ro',
    nativeName: 'Română',
    nameEn: 'Romanian',
    nameRu: 'румынский',
    ttsLocale: 'ro-RO',
    accentLabel: 'Romanian — Mihai (ro-RO)',
    script: 'latin',
    inLanguage: 'In Romanian',
    sampleWord: 'apă',
    sampleIpa: '[ˈapə]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Am nevoie de un pahar cu apă.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. apă or dictionary',
    wordLabel: 'Word or phrase (RO or your language)',
  },
  {
    code: 'id',
    nativeName: 'Bahasa Indonesia',
    nameEn: 'Indonesian',
    nameRu: 'индонезийский',
    ttsLocale: 'id-ID',
    accentLabel: 'Indonesian — News TTS (id-ID)',
    script: 'latin',
    inLanguage: 'In Indonesian',
    sampleWord: 'air',
    sampleIpa: '[ˈaɪr]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Saya butuh segelas air.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. air or dictionary',
    wordLabel: 'Word or phrase (ID or your language)',
  },
  {
    code: 'he',
    nativeName: 'עברית',
    nameEn: 'Hebrew',
    nameRu: 'иврит',
    ttsLocale: 'he-IL',
    accentLabel: 'Hebrew — SaSpeech (he-IL)',
    script: 'hebrew',
    rtl: true,
    inLanguage: 'In Hebrew',
    sampleWord: 'מים',
    sampleIpa: '[majim]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'אני צריך כוס מים.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. מים or dictionary',
    wordLabel: 'Word or phrase (HE or your language)',
  },
  {
    code: 'ca',
    nativeName: 'Català',
    nameEn: 'Catalan',
    nameRu: 'каталанский',
    ttsLocale: 'ca-ES',
    accentLabel: 'Catalan — Ona (ca-ES)',
    script: 'latin',
    inLanguage: 'In Catalan',
    sampleWord: 'aigua',
    sampleIpa: '[ˈajɣwə]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Necessito un got d\'aigua.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. aigua or dictionary',
    wordLabel: 'Word or phrase (CA or your language)',
  },
  {
    code: 'sr',
    nativeName: 'Српски',
    nameEn: 'Serbian',
    nameRu: 'сербский',
    ttsLocale: 'sr-RS',
    accentLabel: 'Serbian — Serbski institut (sr-RS)',
    script: 'cyrillic',
    inLanguage: 'In Serbian',
    sampleWord: 'вода',
    sampleIpa: '[ˈvoda]',
    sampleGloss: 'water as a substance; drinking water',
    samplePhrase: 'Треба ми чаша воде.',
    sampleTranslation: 'I need a glass of water. — neutral',
    placeholderWord: 'e.g. вода or dictionary',
    wordLabel: 'Word or phrase (SR or your language)',
  },
];

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function contentLocaleJs(lang) {
  const C = lang.code.toUpperCase();
  return `/**
 * ${C}-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const ${C}_CARD_LOCALE_AUTO_KEY = 'seashell_${lang.code}_card_locale_auto_v1';

export const ${C}_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== '${lang.code}');

export function ${lang.code}NormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === '${lang.code}') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function ${lang.code}DefaultCardLocale() {
  return 'en';
}

export function ${lang.code}CardTranslationLocales() {
  return ${C}_CARD_TRANSLATION_LOCALES;
}

export function ${lang.code}IsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function ${lang.code}ShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === '${lang.code}';
}

export function ${lang.code}ResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === '${lang.code}') {
    if (${lang.code}IsCardLocaleManuallyPinned()) {
      const card = ${lang.code}NormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return ${lang.code}DefaultCardLocale();
  }
  return ui;
}

export function ${lang.code}SkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === '${lang.code}' && ${lang.code}IsCardLocaleManuallyPinned();
}

export function ${lang.code}EnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== '${lang.code}') return;
  if (${lang.code}IsCardLocaleManuallyPinned()) return;
  const expected = ${lang.code}DefaultCardLocale();
  const card = ${lang.code}NormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function ${lang.code}SyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== '${lang.code}') return null;
  if (${lang.code}IsCardLocaleManuallyPinned()) return null;
  return { cardLocale: ${lang.code}DefaultCardLocale(), cardLocalePinned: false };
}

export function ${lang.code}OnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
  const patch = { ttsLocale: '${lang.ttsLocale}' };
  if (${lang.code}IsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === '${lang.code}' ? ${lang.code}DefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function apply${cap(lang.code)}CardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(${C}_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === '${lang.code}' ? ${lang.code}DefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(${C}_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function ${lang.code}DictWordInputLabel(t) {
  return t('dict.wordLabel${cap(lang.code)}');
}

export function ${lang.code}DictMessageForLearn(t, baseKey, params) {
  const key = \`\${baseKey}${cap(lang.code)}\`;
  return params != null ? t(key, params) : t(key);
}

export function ${lang.code}PracticeStudyLangLabel(t) {
  return t('practice.in${lang.nameEn.replace(/ /g, '')}');
}
`;
}

function pickerJsx(lang) {
  const C = cap(lang.code);
  return `import { useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { DismissibleHint } from './DismissibleHint.jsx';
import { CheckIcon } from './CheckIcon.jsx';
import {
  Cell,
  Group,
  GroupHeader,
  ModalDismissButton,
  Text,
} from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import {
  ${lang.code}CardTranslationLocales,
  ${lang.code}DefaultCardLocale,
  ${lang.code}EnsureCardLocaleCoherent,
  ${lang.code}NormalizeCardLocale,
  ${lang.code}ResolveContentLocaleForApi,
} from '../modules/${lang.code}/${lang.code}ContentLocale.js';
import { updateSettings } from '../utils/settings.js';

/** Picker языка переводов — только ${C}-модуль. */
export function ${C}CardTranslationLocalePicker({
  modalMount,
  onLocaleChange,
  hideHint = false,
}) {
  const { t } = useI18n();
  const locales = useMemo(() => ${lang.code}CardTranslationLocales(), []);
  const readEffectiveCode = useCallback(() => ${lang.code}ResolveContentLocaleForApi(), []);
  const [cardLocale, setCardLocale] = useState(readEffectiveCode);
  const [open, setOpen] = useState(false);

  const effectiveCode = cardLocale || ${lang.code}DefaultCardLocale();
  const selectedName = useMemo(
    () => locales.find((l) => l.code === effectiveCode)?.nativeName ?? '',
    [effectiveCode, locales],
  );

  useEffect(() => {
    ${lang.code}EnsureCardLocaleCoherent();
    setCardLocale(readEffectiveCode());
  }, [readEffectiveCode]);

  useEffect(() => {
    const onSettings = () => setCardLocale(readEffectiveCode());
    window.addEventListener('seashell-settings-changed', onSettings);
    return () => window.removeEventListener('seashell-settings-changed', onSettings);
  }, [readEffectiveCode]);

  const setCardTranslationLocale = useCallback(
    (code) => {
      const next = ${lang.code}NormalizeCardLocale(code);
      if (!next) return;
      updateSettings({ cardLocale: next, cardLocalePinned: true });
      setCardLocale(next);
      setOpen(false);
      onLocaleChange?.(next);
    },
    [onLocaleChange],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const sheet =
    modalMount != null && open
      ? createPortal(
          <div className="seashell-card-lang-shell seashell-crt">
            <button
              type="button"
              className="seashell-card-lang-shell__backdrop"
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
            />
            <div
              className="seashell-card-lang-shell__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="seashell-card-lang-title"
            >
              <div className="seashell-card-lang-shell__head">
                <ModalDismissButton onClick={() => setOpen(false)} />
                <Text weight="2" id="seashell-card-lang-title" className="seashell-card-lang-shell__title">
                  {t('dict.cardLangQuestion')}
                </Text>
              </div>
              <div className="seashell-card-lang-shell__list" role="listbox" aria-label={t('dict.cardLangQuestion')}>
                {locales.map((item) => {
                  const selected = effectiveCode === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={[
                        'ss-card-lang-option',
                        selected ? 'ss-card-lang-option--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setCardTranslationLocale(item.code)}
                    >
                      <span className="ss-native-name" lang={item.code}>
                        {item.nativeName}
                      </span>
                      {selected ? <CheckIcon className="ss-locale-check" size={18} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          modalMount,
        )
      : null;

  return (
    <>
      {sheet}
      <Group header={<GroupHeader mode="secondary">{t('dict.cardLangQuestion')}</GroupHeader>}>
        <Cell
          chevron
          onClick={() => setOpen(true)}
          after={
            !hideHint ? (
              <DismissibleHint hintId="dict.cardLang" className="ss-hint--inline ss-hint--subtle">
                {t('dict.cardLangHint${cap(lang.code)}')}
              </DismissibleHint>
            ) : null
          }
        >
          <span className="ss-native-name" lang={effectiveCode}>
            {selectedName}
          </span>
        </Cell>
      </Group>
    </>
  );
}
`;
}

function formatSampleJson(lang) {
  const examples = Array.from({ length: 10 }, (_, i) => {
    if (i === 0) {
      return { text: lang.samplePhrase, translation: lang.sampleTranslation };
    }
    return {
      text: `${lang.samplePhrase} (${i + 1})`,
      translation: `${lang.sampleTranslation.replace(' — neutral', '')} — neutral`,
    };
  });
  return JSON.stringify(
    {
      headwordEn: lang.sampleWord,
      glossRu: `${lang.sampleWord} ${lang.sampleIpa} — ${lang.sampleGloss}; neutral`,
      examples,
    },
    null,
    2,
  );
}

function promptFromPl(plText, lang) {
  return plText
    .replace(/Polish/g, lang.nameEn)
    .replace(/polish/g, lang.nameEn.toLowerCase())
    .replace(/woda/g, lang.sampleWord)
    .replace(/\[ˈvɔda\]/g, lang.sampleIpa)
    .replace(/Potrzebuję szklanki wody\./g, lang.samplePhrase)
    .replace(/Latin script with Polish orthography/g, scriptNoteForPrompt(lang))
    .replace(/Latin script/g, scriptNoteShort(lang));
}

function scriptNoteForPrompt(lang) {
  if (lang.script === 'cyrillic') return 'Cyrillic script with Serbian orthography';
  if (lang.script === 'hebrew') return 'Hebrew script';
  return 'Latin script';
}

function scriptNoteShort(lang) {
  if (lang.script === 'cyrillic') return 'Cyrillic script';
  if (lang.script === 'hebrew') return 'Hebrew script';
  return 'Latin script';
}

function studyScriptNoteEn(lang) {
  if (lang.script === 'cyrillic') return 'Cyrillic for the sentence words';
  if (lang.script === 'hebrew') return 'Hebrew script for the sentence words';
  return 'Latin letters for the sentence words';
}

function studyScriptNoteRu(lang) {
  if (lang.script === 'cyrillic') return 'кириллицей (слова предложения)';
  if (lang.script === 'hebrew') return 'ивритом (слова предложения)';
  return 'латиницей (слова предложения)';
}

function i18nKeys(lang) {
  const S = cap(lang.code);
  const langName = lang.nameEn;
  return {
    [`settings.accent${S}`]: lang.accentLabel,
    [`lang.hint${S}`]: `Learning content (dictionary and practice) stays in ${langName}. Menus and hints use the language you choose.`,
    [`practice.expertDisclaimer${S}`]: `This is AI for ${langName} practice. Answers may be wrong. For real help, see qualified professionals. You learn language through a role-play expert persona — not professional advice.`,
    [`practice.expertDisclaimerShort${S}`]: `AI ${langName} practice, not professional advice. May contain errors — consult specialists for real decisions.`,
    [`practice.expertPlaceholder${S}`]: `Reply in ${langName}: yes, no, or suggest another topic…`,
    [`practice.empty${S}`]: `Type in ${langName} — your partner will reply, show what was heard, and briefly correct phrasing if needed.`,
    [`practice.placeholder${S}`]: `Type in ${langName}…`,
    [`errors.customExampleHeadword${S}`]: `Could not build a natural ${langName} sentence with this word. Try rephrasing your phrase or use a form closer to the dictionary word.`,
    [`dict.wordLabel${S}`]: lang.wordLabel,
    [`dict.placeholderWord${S}`]: lang.placeholderWord,
    [`dict.cardLangHint${S}`]: `Examples stay in ${langName}; meanings and translations use the language above. After changing it, tap «Refresh examples» on a card.`,
    [`dict.addHint${S}`]: `Type in your language or ${langName} — we save a natural ${langName} headword. Examples stay in ${langName}; translations use the language chosen above.`,
    [`dict.addHintGroup${S}`]: `The word will be added to this group. Examples stay in ${langName}; translations use the language chosen above.`,
    [`dict.myExamplesEmpty${S}`]: `Type a sentence in your native language — AI will translate it naturally into ${langName} using this word.`,
    [`dict.wordPracticeHint${S}`]: `Short dialogue in simple ${langName}. Try to use «{word}» when it fits.`,
    [`dict.wordPracticePlaceholder${S}`]: `Short answer in ${langName}…`,
    [`practice.in${langName.replace(/ /g, '')}`]: lang.inLanguage,
  };
}

// Generate files
const plPromptDir = path.join(ROOT, 'server/prompts/targets/pl');
for (const lang of LANGS) {
  const modDir = path.join(ROOT, `src/modules/${lang.code}`);
  fs.mkdirSync(modDir, { recursive: true });
  fs.writeFileSync(path.join(modDir, `${lang.code}ContentLocale.js`), contentLocaleJs(lang));
  fs.writeFileSync(path.join(ROOT, `src/components/${cap(lang.code)}CardTranslationLocalePicker.jsx`), pickerJsx(lang));

  const tgtDir = path.join(ROOT, `server/prompts/targets/${lang.code}`);
  fs.mkdirSync(path.join(tgtDir, 'locales/en'), { recursive: true });
  for (const f of fs.readdirSync(plPromptDir)) {
    if (f === 'locales') continue;
    const src = fs.readFileSync(path.join(plPromptDir, f), 'utf8');
    fs.writeFileSync(path.join(tgtDir, f), promptFromPl(src, lang));
  }
  fs.writeFileSync(
    path.join(tgtDir, 'locales/en/word-dictionary-format-sample.json'),
    formatSampleJson(lang),
  );
  console.log(`✓ module ${lang.code}`);
}

// Append i18n to en.js
const enPath = path.join(ROOT, 'src/i18n/messages/en.js');
let enText = fs.readFileSync(enPath, 'utf8');
const allKeys = {};
for (const lang of LANGS) Object.assign(allKeys, i18nKeys(lang));
allKeys['settings.accentZhTw'] = 'Chinese — device voice (zh-TW, Traditional)';
allKeys['settings.accentZhCn'] = 'Chinese — Huayan (zh-CN, Mandarin)';

const additions = [];
for (const [key, val] of Object.entries(allKeys)) {
  if (enText.includes(`'${key}':`)) continue;
  const escaped = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  additions.push(`  '${key}': '${escaped}',`);
}
if (additions.length) {
  const insertAt = enText.lastIndexOf('};');
  enText = `${enText.slice(0, insertAt)}${additions.join('\n')}\n${enText.slice(insertAt)}`;
  fs.writeFileSync(enPath, enText);
  console.log(`✓ en.js +${additions.length} keys`);
}

// Export meta for patch script
fs.writeFileSync(
  path.join(ROOT, 'scripts/.scaffold-lang-meta.json'),
  JSON.stringify(
    LANGS.map((l) => ({
      ...l,
      studyScriptNoteEn: studyScriptNoteEn(l),
      studyScriptNoteRu: studyScriptNoteRu(l),
    })),
    null,
    2,
  ),
);
console.log('done scaffold');
