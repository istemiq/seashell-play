#!/usr/bin/env node
/** One-shot generator for tr/sv/no/fi/ko/ja/zh learn modules. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const LANGS = [
  { code: 'tr', suffix: 'Tr', practiceKey: 'Turkish', name: 'Turkish', nameRu: 'турецкий', tts: 'tr-TR', piper: 'tr_TR-dfki-medium', sample: 'su', latin: true, scriptNoteEn: 'Latin letters for the sentence words', scriptNoteRu: 'латиницей (слова предложения)', accent: 'DFKI (tr-TR)' },
  { code: 'sv', suffix: 'Sv', practiceKey: 'Swedish', name: 'Swedish', nameRu: 'шведский', tts: 'sv-SE', piper: 'sv_SE-nst-medium', sample: 'vatten', latin: true, scriptNoteEn: 'Latin letters for the sentence words', scriptNoteRu: 'латиницей (слова предложения)', accent: 'NST (sv-SE)' },
  { code: 'no', suffix: 'No', practiceKey: 'Norwegian', name: 'Norwegian', nameRu: 'норвежский', tts: 'no-NO', piper: 'no_NO-talesyntese-medium', sample: 'vann', latin: true, scriptNoteEn: 'Latin letters for the sentence words', scriptNoteRu: 'латиницей (слова предложения)', accent: 'Talesyntese (no-NO)' },
  { code: 'fi', suffix: 'Fi', practiceKey: 'Finnish', name: 'Finnish', nameRu: 'финский', tts: 'fi-FI', piper: 'fi_FI-harri-medium', sample: 'vesi', latin: true, scriptNoteEn: 'Latin letters for the sentence words', scriptNoteRu: 'латиницей (слова предложения)', accent: 'Harri (fi-FI)' },
  { code: 'ko', suffix: 'Ko', practiceKey: 'Korean', name: 'Korean', nameRu: 'корейский', tts: 'ko-KR', piper: null, sample: '물', latin: false, scriptNoteEn: 'Hangul for the sentence words', scriptNoteRu: 'хангылом (слова предложения)', accent: null },
  { code: 'ja', suffix: 'Ja', practiceKey: 'Japanese', name: 'Japanese', nameRu: 'японский', tts: 'ja-JP', piper: null, sample: '水', latin: false, scriptNoteEn: 'Japanese script (hiragana/katakana/kanji) for the sentence words', scriptNoteRu: 'японской письменностью (слова предложения)', accent: null },
  { code: 'zh', suffix: 'Zh', practiceKey: 'Chinese', name: 'Chinese', nameRu: 'китайский', tts: 'zh-CN', piper: 'zh_CN-huayan-medium', sample: '水', latin: false, scriptNoteEn: 'Chinese characters (CJK) for the sentence words', scriptNoteRu: 'китайскими иероглифами (слова предложения)', accent: 'Huayan (zh-CN)' },
];

function writeFile(fp, content) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content);
  console.log('wrote', path.relative(root, fp));
}

function contentLocaleJs(l) {
  const U = l.code.toUpperCase();
  const cap = l.suffix;
  const ttsPatch = l.piper
    ? `  const patch = { ttsLocale: '${l.tts}' };`
    : `  const patch = {};`;
  return `/**
 * ${U}-модуль: язык переводов на карточках.
 * Не импортировать из EN/RU-модулей.
 */
import { normalizeUiLocale, UI_LOCALES } from '../../i18n/config.js';
import { loadSettings, updateSettings } from '../../utils/settings.js';

const ${U}_CARD_LOCALE_AUTO_KEY = 'seashell_${l.code}_card_locale_auto_v1';

export const ${U}_CARD_TRANSLATION_LOCALES = UI_LOCALES.filter((l) => l.code !== '${l.code}');

export function ${l.code}NormalizeCardLocale(code) {
  const c = String(code ?? '').trim();
  if (!c || c === '${l.code}') return '';
  return UI_LOCALES.some((l) => l.code === c) ? c : '';
}

export function ${l.code}DefaultCardLocale() {
  return 'en';
}

export function ${l.code}CardTranslationLocales() {
  return ${U}_CARD_TRANSLATION_LOCALES;
}

export function ${l.code}IsCardLocaleManuallyPinned() {
  return loadSettings().cardLocalePinned === true;
}

export function ${l.code}ShowCardTranslationLocalePicker() {
  return normalizeUiLocale(loadSettings().uiLocale) === '${l.code}';
}

export function ${l.code}ResolveContentLocaleForApi() {
  const { uiLocale, cardLocale } = loadSettings();
  const ui = normalizeUiLocale(uiLocale);
  if (ui === '${l.code}') {
    if (${l.code}IsCardLocaleManuallyPinned()) {
      const card = ${l.code}NormalizeCardLocale(cardLocale);
      if (card) return card;
    }
    return ${l.code}DefaultCardLocale();
  }
  return ui;
}

export function ${l.code}SkipAutoRefreshForPinnedCardLocale() {
  return normalizeUiLocale(loadSettings().uiLocale) === '${l.code}' && ${l.code}IsCardLocaleManuallyPinned();
}

export function ${l.code}EnsureCardLocaleCoherent() {
  const s = loadSettings();
  if (normalizeUiLocale(s.uiLocale) !== '${l.code}') return;
  if (${l.code}IsCardLocaleManuallyPinned()) return;
  const expected = ${l.code}DefaultCardLocale();
  const card = ${l.code}NormalizeCardLocale(s.cardLocale);
  if (card !== expected) {
    updateSettings({ cardLocale: expected, cardLocalePinned: false });
  }
}

export function ${l.code}SyncCardLocaleWithUi(uiLocale) {
  const ui = normalizeUiLocale(uiLocale);
  if (ui !== '${l.code}') return null;
  if (${l.code}IsCardLocaleManuallyPinned()) return null;
  return { cardLocale: ${l.code}DefaultCardLocale(), cardLocalePinned: false };
}

export function ${l.code}OnLearnModuleEnter() {
  const ui = normalizeUiLocale(loadSettings().uiLocale);
${ttsPatch}
  if (${l.code}IsCardLocaleManuallyPinned()) return patch;
  return {
    ...patch,
    cardLocale: ui === '${l.code}' ? ${l.code}DefaultCardLocale() : ui,
    cardLocalePinned: false,
  };
}

export function apply${cap}CardLocaleStorageMigration(merged, saveSettingsFn) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(${U}_CARD_LOCALE_AUTO_KEY)) return;
  const ui = normalizeUiLocale(merged.uiLocale);
  merged.cardLocale = ui === '${l.code}' ? ${l.code}DefaultCardLocale() : ui;
  merged.cardLocalePinned = false;
  window.localStorage.setItem(${U}_CARD_LOCALE_AUTO_KEY, '1');
  saveSettingsFn(merged);
}

export function ${l.code}DictWordInputLabel(t) {
  return t('dict.wordLabel${cap}');
}

export function ${l.code}DictMessageForLearn(t, baseKey, params) {
  const key = \`\${baseKey}${cap}\`;
  return params != null ? t(key, params) : t(key);
}

export function ${l.code}PracticeStudyLangLabel(t) {
  return t('practice.in${l.practiceKey}');
}
`;
}

function pickerJsx(l) {
  const cap = l.suffix;
  const lc = l.code;
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
  ${lc}CardTranslationLocales,
  ${lc}DefaultCardLocale,
  ${lc}EnsureCardLocaleCoherent,
  ${lc}NormalizeCardLocale,
  ${lc}ResolveContentLocaleForApi,
} from '../modules/${lc}/${lc}ContentLocale.js';
import { updateSettings } from '../utils/settings.js';

/** Picker языка переводов — только ${lc.toUpperCase()}-модуль. */
export function ${cap}CardTranslationLocalePicker({
  modalMount,
  onLocaleChange,
  hideHint = false,
}) {
  const { t } = useI18n();
  const locales = useMemo(() => ${lc}CardTranslationLocales(), []);
  const readEffectiveCode = useCallback(() => ${lc}ResolveContentLocaleForApi(), []);
  const [cardLocale, setCardLocale] = useState(readEffectiveCode);
  const [open, setOpen] = useState(false);

  const effectiveCode = cardLocale || ${lc}DefaultCardLocale();
  const selectedName = useMemo(
    () => locales.find((l) => l.code === effectiveCode)?.nativeName ?? '',
    [effectiveCode, locales],
  );

  useEffect(() => {
    ${lc}EnsureCardLocaleCoherent();
    setCardLocale(readEffectiveCode());
  }, [readEffectiveCode]);

  useEffect(() => {
    const onSettings = () => setCardLocale(readEffectiveCode());
    window.addEventListener('seashell-settings-changed', onSettings);
    return () => window.removeEventListener('seashell-settings-changed', onSettings);
  }, [readEffectiveCode]);

  const setCardTranslationLocale = useCallback(
    (code) => {
      const next = ${lc}NormalizeCardLocale(code);
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
                {t('dict.cardLangHint${cap}')}
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

function dictSampleJson(l) {
  if (l.latin) {
    const ex = l.code === 'tr'
      ? [
          ['Bir bardak su istiyorum.', 'I want a glass of water. — neutral'],
          ['Su çok soğuk.', 'The water is very cold. — neutral'],
          ['Suyu kaynatıyor musun?', 'Are you boiling the water? — neutral'],
        ]
      : l.code === 'sv'
        ? [
            ['Jag behöver ett glas vatten.', 'I need a glass of water. — neutral'],
            ['Vattnet är kallt.', 'The water is cold. — neutral'],
            ['Har du vatten?', 'Do you have water? — neutral'],
          ]
        : l.code === 'no'
          ? [
              ['Jeg trenger et glass vann.', 'I need a glass of water. — neutral'],
              ['Vannet er kaldt.', 'The water is cold. — neutral'],
              ['Har du vann?', 'Do you have water? — neutral'],
            ]
          : [
              ['Tarvitsen lasillisen vettä.', 'I need a glass of water. — neutral'],
              ['Vesi on kylmää.', 'The water is cold. — neutral'],
              ['Onko sinulla vettä?', 'Do you have water? — neutral'],
            ];
    const examples = [];
    for (let i = 0; i < 10; i += 1) {
      const [text, translation] = ex[i % ex.length];
      examples.push({ text, translation });
    }
    return JSON.stringify({
      headwordEn: l.sample,
      glossRu: `${l.sample} [sample] — water as a substance; drinking water; neutral`,
      examples,
    }, null, 2);
  }
  const cjkEx =
    l.code === 'ko'
      ? [
          ['물 한 잔 주세요.', 'Please give me a glass of water. — neutral'],
          ['물이 차갑네요.', 'The water is cold. — neutral'],
          ['물 좀 있어?', 'Got any water? — informal'],
        ]
      : l.code === 'ja'
        ? [
            ['水を一杯ください。', 'Please give me a glass of water. — neutral'],
            ['水が冷たいです。', 'The water is cold. — neutral'],
            ['水はありますか。', 'Do you have water? — neutral'],
          ]
        : [
            ['请给我一杯水。', 'Please give me a glass of water. — neutral'],
            ['水很冷。', 'The water is cold. — neutral'],
            ['有水吗？', 'Do you have water? — neutral'],
          ];
  const examples = [];
  for (let i = 0; i < 10; i += 1) {
    const [text, translation] = cjkEx[i % cjkEx.length];
    examples.push({ text, translation });
  }
  return JSON.stringify({
    headwordEn: l.sample,
    glossRu: `${l.sample} — water as a substance; drinking water; neutral`,
    examples,
  }, null, 2);
}

function wordExamplesTemplate(l) {
  const scriptLine = l.latin
    ? `- \`headwordEn\` and every \`text\` = **${l.name}** (Latin script${l.code === 'tr' ? ' with Turkish orthography' : ''}).`
    : `- \`headwordEn\` and every \`text\` = **${l.name}** (${l.scriptNoteEn.split(' for')[0]}).`;
  const ipaLine = l.latin
    ? `- In \`glossRu\`, immediately after \`headwordEn\` (before « — »), add IPA in square brackets: \`${l.sample} [sample] — …\`.`
    : `- In \`glossRu\`, \`headwordEn\` followed by « — » and the gloss in {{TRANSLATION_LANGUAGE}}.`;
  return `You help {{LEARNER_AUDIENCE}}. Produce **one** JSON object for: "{{INPUT}}"

**Field languages (mandatory)**
- \`text\` — **only a {{STUDY_LANGUAGE}} sentence** ({{STUDY_SCRIPT_NOTE}}). Do NOT put {{TRANSLATION_LANGUAGE}} sentences in \`text\`. The learner studies **{{STUDY_LANGUAGE}}**: examples are {{STUDY_LANGUAGE}} phrases with \`headwordEn\`.
- \`translation\` — **{{TRANSLATION_LANGUAGE}}** translation of the same {{STUDY_LANGUAGE}} sentence from \`text\`, plus the style tail as in the sample.

{{INPUT_MODE_RULES}}

**Task**
- Keys: \`headwordEn\`, \`glossRu\`, \`examples\`. Do **not** add \`verbUsage\` for ${l.name} study entries.
- In \`examples\` exactly **{{WORD_EXAMPLE_COUNT}}** objects. Each has only \`text\` and \`translation\`.
- At the end of each \`translation\` and in \`glossRu\` add the style tail **as in the sample**: {{REGISTER_TAIL_EXAMPLES}}.
{{REGISTER_TAGS_GUIDE}}

**Transcription**
${ipaLine}

{{LEGAL_CONTENT_NOTE}}

**Critical split (${l.name} study module)**
${scriptLine}
- \`translation\` and the gloss part after « — » = **{{TRANSLATION_LANGUAGE}}** only ({{TRANSLATION_SCRIPT_NOTE}}). Never copy the ${l.name} sentence into \`translation\`.

**Sample: common word** (do not copy ${l.sample} or its phrases — only key shape and {{WORD_EXAMPLE_COUNT}} examples):

{{FORMAT_SAMPLE}}

Output: **only** valid JSON for one object, no markdown, no text before or after.
`;
}

function wordDictionarySystemTemplate(l) {
  const forbidden = l.latin
    ? 'Cyrillic or Arabic script in "text" is forbidden when studying ' + l.name + '.'
    : 'Latin-only or wrong-script sentences in "text" are forbidden when studying ' + l.name + '.';
  return `You output only one valid JSON object when asked. No markdown fences.

Match the FORMAT SAMPLE blocks: same keys (headwordEn, glossRu, examples).

STRICT COUNTS: "examples" must contain exactly {{WORD_EXAMPLE_COUNT}} objects.

STRICT LANGUAGE SPLIT:
- Every "text" = {{STUDY_LANGUAGE}} sentence ({{STUDY_SCRIPT_NOTE}}). ${forbidden}
- Every "translation" and the gloss part of "glossRu" after the em dash = **{{TRANSLATION_LANGUAGE}}** ({{TRANSLATION_SCRIPT_NOTE}}).
- If learner input is not in the study language: headwordEn = natural {{STUDY_LANGUAGE}} lemma for a single word, or full {{STUDY_LANGUAGE}} translation for a phrase (2+ words); glossRu must start with that {{STUDY_LANGUAGE}} headword — NOT with the learner's input alone in another script.

TRANSCRIPTION: glossRu = headwordEn + ${l.latin ? '[IPA] + ' : ''}— + {{TRANSLATION_LANGUAGE}} gloss + style tail.

INPUT SHAPE: **single word** → {{STUDY_LANGUAGE}} lemma; **phrase/sentence** (2+ words) → full natural {{STUDY_LANGUAGE}} translation of the entire learner entry — never reduce a phrase to one keyword.

For ${l.name} study entries omit verbUsage (or use []).
`;
}

for (const l of LANGS) {
  writeFile(path.join(root, `src/modules/${l.code}/${l.code}ContentLocale.js`), contentLocaleJs(l));
  writeFile(path.join(root, `src/components/${l.suffix}CardTranslationLocalePicker.jsx`), pickerJsx(l));
  const promptDir = path.join(root, `server/prompts/targets/${l.code}`);
  writeFile(path.join(promptDir, 'word-examples.template.txt'), wordExamplesTemplate(l));
  writeFile(path.join(promptDir, 'word-dictionary-system.template.txt'), wordDictionarySystemTemplate(l));
  writeFile(
    path.join(promptDir, 'word-custom-example.template.txt'),
    fs.readFileSync(path.join(root, 'server/prompts/targets/de/word-custom-example.template.txt'), 'utf8'),
  );
  writeFile(path.join(promptDir, 'locales/en/word-dictionary-format-sample.json'), dictSampleJson(l));
}

console.log('done');
