import { normalizeContentLocale } from './promptLocales.js';
import { getStudyLangMeta } from './dictionaryStudyLang.js';

/** Фраза/предложение: 2+ слова или знаки вопроса/восклицания. */
export function isPhraseLikeInput(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!s) return false;
  if (/[?!…]/.test(s)) return true;
  return s.split(' ').filter(Boolean).length >= 2;
}

function looksMostlyCyrillicWord(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let latin = 0;
  let cyr = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
  }
  return cyr > 0 && cyr >= latin;
}

function looksMostlyArabicWord(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let latin = 0;
  let arabic = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0600-\u06FF]/.test(ch)) arabic += 1;
  }
  return arabic > 0 && arabic >= latin;
}

function looksMostlyLatinWord(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let latin = 0;
  let cyr = 0;
  for (const ch of t) {
    if (/[A-Za-zÀ-ÿ]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
  }
  return latin > 0 && latin >= cyr;
}

function looksMostlyGreekWord(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let latin = 0;
  let greek = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(ch)) greek += 1;
  }
  return greek > 0 && greek >= latin;
}

function looksMostlyDevanagariWord(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let dev = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\u0900-\u097F]/.test(ch)) dev += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return dev > 0 && dev >= latin;
}

function looksMostlyHebrewWord(s) {
  const t = String(s ?? '').replace(/\s+/g, '');
  let hebrew = 0;
  let latin = 0;
  for (const ch of t) {
    if (/[\u0590-\u05FF]/.test(ch)) hebrew += 1;
    if (/[A-Za-z]/.test(ch)) latin += 1;
  }
  return hebrew > 0 && hebrew >= latin;
}

function studyLangCode(targetLang) {
  const lc = String(targetLang ?? 'en').trim().toLowerCase();
  if (lc === 'ru' || lc.startsWith('ru')) return 'ru';
  if (lc === 'ar' || lc.startsWith('ar')) return 'ar';
  if (lc === 'es' || lc.startsWith('es')) return 'es';
  if (lc === 'pt' || lc.startsWith('pt')) return 'pt';
  if (lc === 'it' || lc.startsWith('it')) return 'it';
  if (lc === 'el' || lc.startsWith('el')) return 'el';
  if (lc === 'fa' || lc.startsWith('fa')) return 'fa';
  if (lc === 'da' || lc.startsWith('da')) return 'da';
  if (lc === 'nl' || lc.startsWith('nl')) return 'nl';
  if (lc === 'fr' || lc.startsWith('fr')) return 'fr';
  if (lc === 'de' || lc.startsWith('de')) return 'de';
  if (lc === 'zh' || lc.startsWith('zh')) return 'zh';
  if (lc === 'ja' || lc.startsWith('ja')) return 'ja';
  if (lc === 'ko' || lc.startsWith('ko')) return 'ko';
  if (lc === 'fi' || lc.startsWith('fi')) return 'fi';
  if (lc === 'no' || lc.startsWith('no')) return 'no';
  if (lc === 'sv' || lc.startsWith('sv')) return 'sv';
  if (lc === 'tr' || lc.startsWith('tr')) return 'tr';
  if (lc === 'uk' || lc.startsWith('uk')) return 'uk';
  if (lc === 'pl' || lc.startsWith('pl')) return 'pl';
  if (lc === 'hi' || lc.startsWith('hi')) return 'hi';
  if (lc === 'ur' || lc.startsWith('ur')) return 'ur';
  if (lc === 'az' || lc.startsWith('az')) return 'az';
  if (lc === 'ug' || lc.startsWith('ug')) return 'ug';
  if (lc === 'vi' || lc.startsWith('vi')) return 'vi';
  if (lc === 'cs' || lc.startsWith('cs')) return 'cs';
  if (lc === 'hu' || lc.startsWith('hu')) return 'hu';
  if (lc === 'ro' || lc.startsWith('ro')) return 'ro';
  if (lc === 'id' || lc.startsWith('id')) return 'id';
  if (lc === 'he' || lc.startsWith('he')) return 'he';
  if (lc === 'ca' || lc.startsWith('ca')) return 'ca';
  if (lc === 'sr' || lc.startsWith('sr')) return 'sr';
  return 'en';
}

/** Для фразового ввода headwordEn тоже должен быть фразой, не одним словарным словом. */
export function isHeadwordValidForInput(userInput, headwordEn, targetLang = 'en') {
  if (!isPhraseLikeInput(userInput)) return true;
  const hw = String(headwordEn ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!hw) return false;
  if (isPhraseLikeInput(hw)) return true;
  if (studyLangCode(targetLang) === 'ru' && looksMostlyCyrillicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ar' && looksMostlyArabicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'es' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'pt' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'it' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'el' && looksMostlyGreekWord(hw)) return true;
  if (studyLangCode(targetLang) === 'fa' && looksMostlyArabicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'da' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'nl' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'fr' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'de' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'fi' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'no' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'sv' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'tr' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'uk' && looksMostlyCyrillicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'pl' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'hi' && looksMostlyDevanagariWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ur' && looksMostlyArabicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'az' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ug' && looksMostlyArabicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'vi' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'cs' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'hu' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ro' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'id' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'he' && looksMostlyHebrewWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ca' && looksMostlyLatinWord(hw)) return true;
  if (studyLangCode(targetLang) === 'sr' && looksMostlyCyrillicWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ko' && looksMostlyHangulWord(hw)) return true;
  if (studyLangCode(targetLang) === 'ja' && looksMostlyJapaneseWord(hw)) return true;
  if (studyLangCode(targetLang) === 'zh' && looksMostlyChineseWord(hw)) return true;
  return false;
}

export function assertHeadwordMatchesInputShape(userInput, headwordEn, targetLang = 'en') {
  if (!isHeadwordValidForInput(userInput, headwordEn, targetLang)) {
    const hw = String(headwordEn ?? '').trim();
    const langLabel =
      studyLangCode(targetLang) === 'ru'
        ? 'Russian'
        : studyLangCode(targetLang) === 'ar'
          ? 'Arabic'
          : studyLangCode(targetLang) === 'es'
            ? 'Spanish'
            : studyLangCode(targetLang) === 'pt'
              ? 'Portuguese'
              : studyLangCode(targetLang) === 'it'
                ? 'Italian'
                : studyLangCode(targetLang) === 'el'
                  ? 'Greek'
                  : studyLangCode(targetLang) === 'fa'
                    ? 'Persian'
                    : studyLangCode(targetLang) === 'da'
                      ? 'Danish'
                      : studyLangCode(targetLang) === 'nl'
                        ? 'Dutch'
                        : studyLangCode(targetLang) === 'fr'
                          ? 'French'
                          : studyLangCode(targetLang) === 'de'
                            ? 'German'
                            : studyLangCode(targetLang) === 'hi'
                              ? 'Hindi'
                              : studyLangCode(targetLang) === 'ur'
                                ? 'Urdu'
                                : studyLangCode(targetLang) === 'az'
                                  ? 'Azerbaijani'
                                  : studyLangCode(targetLang) === 'ug'
                                    ? 'Uyghur'
                            : 'English';
    throw Object.assign(
      new Error(
        `Model reduced phrase input to a single keyword (${hw || '?'}). headwordEn must be a full ${langLabel} translation of the whole entry.`,
      ),
      { status: 422 },
    );
  }
}

export function phraseInputRetryNote(userInput, targetLang = 'en') {
  if (!isPhraseLikeInput(userInput)) return '';
  const sample = String(userInput ?? '').trim();
  if (studyLangCode(targetLang) === 'ru') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Russian translation in Cyrillic ` +
      '(several words when needed). Example: «Go out on a limb» → «пойти на риск» or «рискнуть без гарантий». ' +
      'A single keyword alone is OK only if it is the natural Russian idiom lemma (e.g. «рисковать»).'
    );
  }
  if (studyLangCode(targetLang) === 'ar') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Arabic translation in Arabic script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Arabic lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'es') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Spanish translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Spanish lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'pt') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Portuguese translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Portuguese lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'it') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Italian translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Italian lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'el') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Greek translation in Greek script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Greek lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'fa') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Persian translation in Persian script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Persian lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'da') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Danish translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Danish lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'nl') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural Dutch translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural Dutch lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'fr') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural French translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural French lemma.'
    );
  }
  if (studyLangCode(targetLang) === 'de') {
    return (
      `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural German translation in Latin script ` +
      '(several words when needed). A single keyword alone is OK only if it is the natural German lemma.'
    );
  }
  return (
    `\n\nCRITICAL PHRASE INPUT («${sample}»): headwordEn MUST be the full natural English translation ` +
    '(several words). Examples: «Ben doctorum» → «I am a doctor», «Ben müşterim» → «I am a customer». ' +
    'Returning only one keyword like «doctor» or «customer» is WRONG.'
  );
}

export function getPhraseEntryBanner(userInput, targetLang = 'en') {
  if (!isPhraseLikeInput(userInput)) return '';
  const sample = String(userInput ?? '').trim();
  if (studyLangCode(targetLang) === 'ru') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Russian; headwordEn must be a Russian phrase or idiom lemma in Cyrillic.\n\n`;
  }
  if (studyLangCode(targetLang) === 'ar') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Arabic; headwordEn must be an Arabic phrase or lemma in Arabic script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'es') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Spanish; headwordEn must be a Spanish phrase or lemma in Latin script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'pt') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Portuguese; headwordEn must be a Portuguese phrase or lemma in Latin script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'it') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Italian; headwordEn must be an Italian phrase or lemma in Latin script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'el') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Greek; headwordEn must be a Greek phrase or lemma in Greek script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'fa') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Persian; headwordEn must be a Persian phrase or lemma in Persian script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'da') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Danish; headwordEn must be a Danish phrase or lemma in Latin script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'nl') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural Dutch; headwordEn must be a Dutch phrase or lemma in Latin script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'fr') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural French; headwordEn must be a French phrase or lemma in Latin script.\n\n`;
  }
  if (studyLangCode(targetLang) === 'de') {
    return `**PHRASE ENTRY** («${sample}»): translate the **entire** learner input into natural German; headwordEn must be a German phrase or lemma in Latin script.\n\n`;
  }
  return `**PHRASE ENTRY** («${sample}»): translate/adapt the **entire** learner input; headwordEn must be a multi-word English phrase, not one keyword.\n\n`;
}

function looksMostlyEnglish(s) {
  const t = String(s).replace(/\s+/g, '');
  if (!t) return false;
  let latin = 0;
  let cyr = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    if (/[\u0400-\u04FF]/.test(ch)) cyr += 1;
  }
  return latin > 0 && latin >= cyr;
}

/**
 * Можно ли считать ввод готовой английской леммой без вызова модели (дубликаты, fallback).
 * Фразы и ввод при contentLocale ≠ en всегда требуют перевода/адаптации.
 */
export function wordInputLooksEnglish(word, contentLocale = 'en') {
  if (isPhraseLikeInput(word)) return false;
  const loc = normalizeContentLocale(contentLocale);
  if (loc !== 'en') return false;
  return looksMostlyEnglish(word);
}

const INPUT_MODE_RULES = {
  ru: `**Ввод ученика (слово или фраза — сохраняй смысл целиком)**
- Не своди фразу к одному ключевому слову.
- **Одно слово** (напр. «словарь», «doktor») — \`headwordEn\` = естественная английская **лемма** (напр. \`dictionary\`, \`doctor\`).
- **Фраза или предложение** (2+ слова, напр. «Я врач», «Ben doctorum») — \`headwordEn\` = **полный естественный английский перевод всей записи** (напр. \`I am a doctor\`), **не** одно слово \`doctor\`. Примеры в \`text\` учат эту английскую фразу (или её естественные грамматические формы).
- В \`glossRu\`: латиницей \`headwordEn\`, IPA, затем **русское** толкование; можно кратко указать исходный ввод в скобках. **Не** начинай \`glossRu\` с русского ввода без английского \`headwordEn\`.`,

  uk: `**Ввід учня (слово або фраза — зберігай сенс цілком)**
- Не зводь фразу до одного ключового слова.
- **Одне слово** — \`headwordEn\` = природна англійська **лема**.
- **Фраза або речення** (2+ слова) — \`headwordEn\` = **повний природний англійський переклад усього вводу**, не одне ключове слово. Приклади в \`text\` вчиють цю англійську фразу.
- У \`glossRu\`: \`headwordEn\` + IPA + **українське** тлумачення; можна вказати вихідний ввід у дужках.`,

  tr: `**Öğrenci girdisi (kelime veya ifade — anlamı bütün olarak koru)**
- İfadeyi tek anahtar kelimeye indirgeme.
- **Tek kelime** (ör. «sözlük», «doktor») — \`headwordEn\` = doğal İngilizce **lemma** (ör. \`dictionary\`, \`doctor\`).
- **İfade veya cümle** (2+ kelime, ör. «Ben doctorum», «Ben bir doktorum») — \`headwordEn\` = **tüm girdinin doğal İngilizce çevirisi** (ör. \`I am a doctor\`), **\`doctor\` gibi tek kelime değil**. \`text\` örnekleri bu İngilizce ifadeyi öğretmeli.
- \`glossRu\`: \`headwordEn\` + IPA + **Türkçe** anlam; öğrencinin girdisini parantezde belirtebilirsin. \`glossRu\`'yu yalnızca Türkçe girdiyle başlatma.`,

  es: `**Entrada del alumno (palabra o frase — conserva el sentido completo)**
- No reduzcas una frase a una sola palabra clave.
- **Una palabra** — \`headwordEn\` = **lema** inglesa natural.
- **Frase u oración** (2+ palabras, ej. «Soy médico») — \`headwordEn\` = **traducción inglesa natural de toda la entrada** (ej. \`I am a doctor\`), no solo \`doctor\`. Los \`text\` enseñan esa frase en inglés.
- \`glossRu\`: \`headwordEn\` + IPA + significado en **español**; puedes citar la entrada original entre paréntesis.`,

  pt: `**Entrada do aluno (palavra ou frase — preserve o sentido inteiro)**
- Não reduza uma frase a uma única palavra-chave.
- **Uma palavra** — \`headwordEn\` = **lema** inglesa natural.
- **Frase ou oração** (2+ palavras) — \`headwordEn\` = **tradução inglesa natural de toda a entrada**, não uma só palavra. Os \`text\` ensinam essa frase em inglês.
- \`glossRu\`: \`headwordEn\` + IPA + significado em **português**.`,

  it: `**Input dell'allievo (parola o frase — mantieni il senso intero)**
- Non ridurre una frase a una sola parola chiave.
- **Una parola** — \`headwordEn\` = **lemma** inglese naturale.
- **Frase o periodo** (2+ parole) — \`headwordEn\` = **traduzione inglese naturale dell'intero input**, non una sola parola. I \`text\` insegnano quella frase in inglese.
- \`glossRu\`: \`headwordEn\` + IPA + significato in **italiano**.`,

  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural English **lemma** (or the word itself if already English).
- **Phrase or sentence** (2+ words, e.g. \`I am a doctor\`) — \`headwordEn\` = **natural English equivalent of the whole entry** (normalize grammar if needed), not one extracted keyword. \`text\` examples must teach that English phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** definition/gloss.`,

  ar: `**مدخل المتعلم (كلمة أو عبارة — احفظ المعنى كاملاً)**
- لا تُختزل العبارة إلى كلمة مفتاحية واحدة.
- **كلمة واحدة** — \`headwordEn\` = **لفظ إنجليزي** طبيعي (lemma).
- **عبارة أو جملة** (كلمتان فأكثر) — \`headwordEn\` = **الترجمة الإنجليزية الطبيعية للمدخل كاملاً**، وليس كلمة واحدة مستخرجة. أمثلة \`text\` تعلّم هذه العبارة الإنجليزية.
- \`glossRu\`: \`headwordEn\` + IPA + المعنى **بالعربية**.`,

  fa: `**ورودی زبان‌آموز (کلمه یا عبارت — معنای کامل را حفظ کن)**
- عبارت را به یک کلمه کلیدی کاهش نده.
- **یک کلمه** — \`headwordEn\` = **لفظ انگلیسی** طبیعی.
- **عبارت یا جمله** (۲+ کلمه) — \`headwordEn\` = **ترجمهٔ طبیعی انگلیسی کل ورودی**، نه یک کلمه. مثال‌های \`text\` همان عبارت انگلیسی را آموزش می‌دهند.
- \`glossRu\`: \`headwordEn\` + IPA + معنی **فارسی**.`,

  ja: `**学習者の入力（単語またはフレーズ — 意味全体を保持）**
- フレーズを1語のキーワードに落とさない。
- **単語1つ** — \`headwordEn\` = 自然な英語の**見出し語（lemma）**。
- **フレーズ・文**（2語以上）— \`headwordEn\` = **入力全体の自然な英語訳**（例：「私は医者です」→ \`I am a doctor\`）。\`doctor\` だけにしない。\`text\` はその英語フレーズを教える。
- \`glossRu\`: \`headwordEn\` + IPA + **日本語**の意味。`,

  ko: `**학습자 입력(단어 또는 구문 — 의미 전체 유지)**
- 구문을 하나의 키워드로 축소하지 말 것.
- **단어 하나** — \`headwordEn\` = 자연스러운 영어 **표제어**.
- **구문·문장**(2단어 이상) — \`headwordEn\` = **입력 전체의 자연스러운 영어 번역**, 한 단어로 추출 금지. \`text\` 예문은 그 영어 구문을 가르침.
- \`glossRu\`: \`headwordEn\` + IPA + **한국어** 뜻.`,
};

function buildGenericStudyInputModeRules(studyCode, contentLocaleCode) {
  const study = getStudyLangMeta(studyCode);
  const name = study.nameEn;
  const scriptHint = study.studyScriptNoteEn.replace(/ for the sentence words$/i, '');
  const byLocale = {
    en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural ${name} **lemma** (${scriptHint}).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural ${name} translation of the entire entry**, not one keyword. \`text\` examples teach that ${name} phrase.
- \`glossRu\`: \`headwordEn\` + IPA/transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,
    ru: `**Ввод ученика** — \`headwordEn\` = естественная **${study.nameRu}** лемма или полный перевод фразы; \`glossRu\` на русском.`,
  };
  return byLocale[contentLocaleCode] ?? byLocale.en;
}

export function getInputModeRules(contentLocale, targetLang = 'en') {
  const code = normalizeContentLocale(contentLocale);
  const study = String(targetLang ?? 'en').trim().toLowerCase();
  if (study === 'ru') {
    return INPUT_MODE_RULES_RU_TARGET[code] ?? INPUT_MODE_RULES_RU_TARGET.en;
  }
  if (study === 'ar') {
    return INPUT_MODE_RULES_AR_TARGET[code] ?? INPUT_MODE_RULES_AR_TARGET.en;
  }
  if (study === 'es') {
    return INPUT_MODE_RULES_ES_TARGET[code] ?? INPUT_MODE_RULES_ES_TARGET.en;
  }
  if (study === 'pt') {
    return INPUT_MODE_RULES_PT_TARGET[code] ?? INPUT_MODE_RULES_PT_TARGET.en;
  }
  if (study === 'it') {
    return INPUT_MODE_RULES_IT_TARGET[code] ?? INPUT_MODE_RULES_IT_TARGET.en;
  }
  if (study === 'el') {
    return INPUT_MODE_RULES_EL_TARGET[code] ?? INPUT_MODE_RULES_EL_TARGET.en;
  }
  if (study === 'fa') {
    return INPUT_MODE_RULES_FA_TARGET[code] ?? INPUT_MODE_RULES_FA_TARGET.en;
  }
  if (study === 'da') {
    return INPUT_MODE_RULES_DA_TARGET[code] ?? INPUT_MODE_RULES_DA_TARGET.en;
  }
  if (study === 'nl') {
    return INPUT_MODE_RULES_NL_TARGET[code] ?? INPUT_MODE_RULES_NL_TARGET.en;
  }
  if (study === 'fr') {
    return INPUT_MODE_RULES_FR_TARGET[code] ?? INPUT_MODE_RULES_FR_TARGET.en;
  }
  if (study === 'de') {
    return INPUT_MODE_RULES_DE_TARGET[code] ?? INPUT_MODE_RULES_DE_TARGET.en;
  }
  if (study === 'zh') {
    return INPUT_MODE_RULES_ZH_TARGET[code] ?? INPUT_MODE_RULES_ZH_TARGET.en;
  }
  if (study === 'ja') {
    return INPUT_MODE_RULES_JA_TARGET[code] ?? INPUT_MODE_RULES_JA_TARGET.en;
  }
  if (study === 'ko') {
    return INPUT_MODE_RULES_KO_TARGET[code] ?? INPUT_MODE_RULES_KO_TARGET.en;
  }
  if (study === 'fi') {
    return INPUT_MODE_RULES_FI_TARGET[code] ?? INPUT_MODE_RULES_FI_TARGET.en;
  }
  if (study === 'no') {
    return INPUT_MODE_RULES_NO_TARGET[code] ?? INPUT_MODE_RULES_NO_TARGET.en;
  }
  if (study === 'sv') {
    return INPUT_MODE_RULES_SV_TARGET[code] ?? INPUT_MODE_RULES_SV_TARGET.en;
  }
  if (study === 'tr') {
    return INPUT_MODE_RULES_TR_TARGET[code] ?? INPUT_MODE_RULES_TR_TARGET.en;
  }
  if (study === 'uk') {
    return INPUT_MODE_RULES_UK_TARGET[code] ?? INPUT_MODE_RULES_UK_TARGET.en;
  }
  if (study === 'pl') {
    return INPUT_MODE_RULES_PL_TARGET[code] ?? INPUT_MODE_RULES_PL_TARGET.en;
  }
  if (study === 'hi') {
    return INPUT_MODE_RULES_HI_TARGET[code] ?? INPUT_MODE_RULES_HI_TARGET.en;
  }
  if (study === 'ur') {
    return INPUT_MODE_RULES_UR_TARGET[code] ?? INPUT_MODE_RULES_UR_TARGET.en;
  }
  if (study === 'az') {
    return INPUT_MODE_RULES_AZ_TARGET[code] ?? INPUT_MODE_RULES_AZ_TARGET.en;
  }
  if (study === 'ug') {
    return INPUT_MODE_RULES_UG_TARGET[code] ?? INPUT_MODE_RULES_UG_TARGET.en;
  }
  if (study === 'vi' || study === 'cs' || study === 'hu' || study === 'ro' || study === 'id' || study === 'ca' || study === 'sr') {
    return buildGenericStudyInputModeRules(study, code);
  }
  if (study === 'he') {
    return INPUT_MODE_RULES_HE_TARGET[code] ?? INPUT_MODE_RULES_HE_TARGET.en;
  }
  return INPUT_MODE_RULES[code] ?? INPUT_MODE_RULES.en;
}

const INPUT_MODE_RULES_RU_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Russian **lemma** in Cyrillic (e.g. \`вода\`, \`доктор\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Russian translation of the entire entry** in Cyrillic, not one keyword. \`text\` examples teach that Russian phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  ru: `**Ввод ученика (слово или фраза — сохраняй смысл целиком)**
- Не своди фразу к одному ключевому слову.
- **Одно слово** — \`headwordEn\` = естественная русская **лемма** (кириллица).
- **Фраза или предложение** (2+ слова) — \`headwordEn\` = **полный естественный русский перевод всей записи**, не одно слово. Примеры в \`text\` учат эту русскую фразу.
- \`glossRu\`: \`headwordEn\` + IPA + **русское** толкование.`,

  uk: `**Ввід учня** — \`headwordEn\` = природна **русська** лема (кирилиця) або повний переклад фрази; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Rusça **lemma** (Kiril) veya tüm ifadenin çevirisi; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** rusa natural (cirílico) o traducción completa; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** russa natural (cirílico); \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** russa naturale (cirillico); \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ روسي** طبيعي (Кириллица); \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ روسی** طبیعی (سیریلیک); \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なロシア語の**見出し語**（キリル文字）; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 러시아어 **표제어**(키릴); \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_AR_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Arabic **lemma** in Arabic script (e.g. \`ماء\`, \`كتاب\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Arabic translation of the entire entry** in Arabic script, not one keyword. \`text\` examples teach that Arabic phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  ar: `**مدخل المتعلم (كلمة أو عبارة — احفظ المعنى كاملاً)**
- لا تُختزل العبارة إلى كلمة مفتاحية واحدة.
- **كلمة واحدة** — \`headwordEn\` = **lemma** عربية طبيعية.
- **عبارة أو جملة** (كلمتان فأكثر) — \`headwordEn\` = **ترجمة عربية طبيعية للمدخل كاملاً**.
- \`glossRu\`: \`headwordEn\` + نقل صوتي + المعنى **بالعربية**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **арабская** лемма (арабская вязь) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **арабська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Arapça **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** árabe natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** árabe natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** araba naturale; \`glossRu\` in italiano.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ عربی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なアラビア語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 아랍어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_ES_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Spanish **lemma** in Latin script (e.g. \`agua\`, \`libro\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Spanish translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Spanish phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  es: `**Entrada del alumno (palabra o frase — conserva el sentido completo)**
- No reduzcas una frase a una sola palabra clave.
- **Una palabra** — \`headwordEn\` = **lema** español natural.
- **Frase u oración** (2+ palabras) — \`headwordEn\` = **traducción española natural de toda la entrada**.
- \`glossRu\`: \`headwordEn\` + IPA + significado en **español**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **испанская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **іспанська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal İspanyolca **lemma**; \`glossRu\` Türkçe.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** espanhol natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** spagnolo naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ إسباني** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ اسپانیایی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なスペイン語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 스페인어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_PT_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Portuguese **lemma** in Latin script (e.g. \`água\`, \`livro\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Portuguese translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Portuguese phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  pt: `**Entrada do aluno (palavra ou frase — preserve o sentido inteiro)**
- Não reduza uma frase a uma única palavra-chave.
- **Uma palavra** — \`headwordEn\` = **lema** português natural.
- **Frase ou oração** (2+ palavras) — \`headwordEn\` = **tradução portuguesa natural de toda a entrada**.
- \`glossRu\`: \`headwordEn\` + IPA + significado em **português**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **португальская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **португальська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Portekizce **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** portugués natural; \`glossRu\` en español.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** portoghese naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ برتغالي** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ پرتغالی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なポルトガル語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 포르투갈어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_IT_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Italian **lemma** in Latin script (e.g. \`acqua\`, \`libro\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Italian translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Italian phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  it: `**Input dell'allievo (parola o frase — mantieni il senso intero)**
- Non ridurre una frase a una sola parola chiave.
- **Una parola** — \`headwordEn\` = **lemma** italiano naturale.
- **Frase o periodo** (2+ parole) — \`headwordEn\` = **traduzione italiana naturale di tutto l'input**.
- \`glossRu\`: \`headwordEn\` + IPA + significato in **italiano**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **итальянская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **італійська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal İtalyanca **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** italiano natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** italiano natural; \`glossRu\` em português.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ إيطالي** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ ایتالیایی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なイタリア語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 이탈리아어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_EL_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Greek **lemma** in Greek script (e.g. \`νερό\`, \`βιβλίο\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Greek translation of the entire entry** in Greek script, not one keyword. \`text\` examples teach that Greek phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  el: `**Είσοδος μαθητή (λέξη ή φράση — διατήρησε ολόκληρη την έννοια)**
- Μην μειώνεις μια φράση σε μία λέξη-κλειδί.
- **Μία λέξη** — \`headwordEn\` = φυσικό ελληνικό **lemma**.
- **Φράση ή πρόταση** (2+ λέξεις) — \`headwordEn\` = **πλήρης φυσική ελληνική μετάφραση ολόκληρης της εισόδου**.
- \`glossRu\`: \`headwordEn\` + μεταγραφή + σημασία **στα ελληνικά**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **греческая** лемма (греческий алфавит) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **грецька** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Yunanca **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** griego natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** grego natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** greco naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ يوناني** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ یونانی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なギリシャ語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 그리스어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_FA_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Persian **lemma** in Persian script (e.g. \`آب\`, \`کتاب\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Persian translation of the entire entry** in Persian script, not one keyword. \`text\` examples teach that Persian phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  fa: `**ورودی زبان‌آموز (کلمه یا عبارت — معنای کامل را حفظ کن)**
- عبارت را به یک کلمه کلیدی کاهش نده.
- **یک کلمه** — \`headwordEn\` = **lemma** فارسی طبیعی.
- **عبارت یا جمله** (۲+ کلمه) — \`headwordEn\` = **ترجمهٔ فارسی طبیعی کل ورودی**.
- \`glossRu\`: \`headwordEn\` + آوانگاری + معنی **فارسی**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **персидская** лемма (персидская вязь) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **перська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Farsça **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** persa natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** persa natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** persiano naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ فارسي** طبيعي; \`glossRu\` بالعربية.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なペルシア語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 페르시아어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_DA_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Danish **lemma** in Latin script (e.g. \`vand\`, \`bog\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Danish translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Danish phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  da: `**Elevinput (ord eller sætning — bevar hele betydningen)**
- Reducer ikke en sætning til ét nøgleord.
- **Et ord** — \`headwordEn\` = naturligt dansk **lemma**.
- **Sætning** (2+ ord) — \`headwordEn\` = **fuld naturlig dansk oversættelse af hele indtastningen**.
- \`glossRu\`: \`headwordEn\` + IPA + betydning på **dansk**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **датская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **данська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Danca **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** danés natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** dinamarquês natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** danese naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ دنماركي** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ دانمارکی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なデンマーク語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 덴마크어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_NL_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Dutch **lemma** in Latin script (e.g. \`water\`, \`boek\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Dutch translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Dutch phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  nl: `**Leerlinginvoer (woord of zin — behoud de volledige betekenis)**
- Reduceer een zin niet tot één sleutelwoord.
- **Eén woord** — \`headwordEn\` = natuurlijk Nederlands **lemma**.
- **Zin** (2+ woorden) — \`headwordEn\` = **volledige natuurlijke Nederlandse vertaling van de hele invoer**.
- \`glossRu\`: \`headwordEn\` + IPA + betekenis in het **Nederlands**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **нидерландская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **нідерландська** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Felemenkçe **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** neerlandés natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** neerlandês natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** olandese naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ هولندي** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ هلندی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なオランダ語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 네덜란드어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_FR_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural French **lemma** in Latin script (e.g. \`eau\`, \`livre\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural French translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that French phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  fr: `**Entrée de l'apprenant (mot ou phrase — conservez le sens entier)**
- Ne réduisez pas une phrase à un seul mot-clé.
- **Un mot** — \`headwordEn\` = **lemme** français naturel.
- **Phrase ou phrase** (2+ mots) — \`headwordEn\` = **traduction française naturelle de toute l'entrée**.
- \`glossRu\`: \`headwordEn\` + IPA + sens en **français**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **французская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **французька** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Fransızca **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** francés natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** francês natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** francese naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ فرنسي** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ فرانسوی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なフランス語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 프랑스어 **표제어**; \`glossRu\` 한국어.`,
};

const INPUT_MODE_RULES_DE_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural German **lemma** in Latin script (e.g. \`Wasser\`, \`Buch\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural German translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that German phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  de: `**Lernereingabe (Wort oder Phrase — volle Bedeutung bewahren)**
- Reduzieren Sie eine Phrase nicht auf ein einziges Schlüsselwort.
- **Ein Wort** — \`headwordEn\` = natürliches deutsches **Lemma**.
- **Phrase oder Satz** (2+ Wörter) — \`headwordEn\` = **vollständige natürliche deutsche Übersetzung der gesamten Eingabe**.
- \`glossRu\`: \`headwordEn\` + IPA + Bedeutung auf **Deutsch**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **немецкая** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
  uk: `**Ввід учня** — \`headwordEn\` = природна **німецька** лема; \`glossRu\` українською.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Almanca **lemma**; \`glossRu\` Türkçe.`,
  es: `**Entrada del alumno** — \`headwordEn\` = **lema** alemán natural; \`glossRu\` en español.`,
  pt: `**Entrada do aluno** — \`headwordEn\` = **lema** alemão natural; \`glossRu\` em português.`,
  it: `**Input dell'allievo** — \`headwordEn\` = **lemma** tedesco naturale; \`glossRu\` in italiano.`,
  ar: `**مدخل المتعلم** — \`headwordEn\` = **لفظ ألماني** طبيعي; \`glossRu\` بالعربية.`,
  fa: `**ورودی زبان‌آموز** — \`headwordEn\` = **لفظ آلمانی** طبیعی; \`glossRu\` فارسی.`,
  ja: `**学習者の入力** — \`headwordEn\` = 自然なドイツ語の**見出し語**; \`glossRu\` 日本語.`,
  ko: `**학습자 입력** — \`headwordEn\` = 자연스러운 독일어 **표제어**; \`glossRu\` 한국어.`,
};


const INPUT_MODE_RULES_TR_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Turkish **lemma** in Latin script (e.g. \`su\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Turkish translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Turkish phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  tr: `**Learner entry** — \`headwordEn\` = natural Turkish **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Turkish** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};


const INPUT_MODE_RULES_SV_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Swedish **lemma** in Latin script (e.g. \`vatten\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Swedish translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Swedish phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  sv: `**Learner entry** — \`headwordEn\` = natural Swedish **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Swedish** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};


const INPUT_MODE_RULES_NO_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Norwegian **lemma** in Latin script (e.g. \`vann\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Norwegian translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Norwegian phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  no: `**Learner entry** — \`headwordEn\` = natural Norwegian **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Norwegian** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};


const INPUT_MODE_RULES_FI_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Finnish **lemma** in Latin script (e.g. \`vesi\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Finnish translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Finnish phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  fi: `**Learner entry** — \`headwordEn\` = natural Finnish **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Finnish** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};


const INPUT_MODE_RULES_KO_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Korean **lemma** in Hangul (e.g. \`물\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Korean translation of the entire entry** in Hangul, not one keyword. \`text\` examples teach that Korean phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  ko: `**Learner entry** — \`headwordEn\` = natural Korean **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Korean** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};


const INPUT_MODE_RULES_JA_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Japanese **lemma** in Japanese script (e.g. \`水\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Japanese translation of the entire entry** in Japanese script, not one keyword. \`text\` examples teach that Japanese phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  ja: `**Learner entry** — \`headwordEn\` = natural Japanese **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Japanese** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};


const INPUT_MODE_RULES_ZH_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Chinese **lemma** in Chinese characters (e.g. \`水\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Chinese translation of the entire entry** in Chinese characters, not one keyword. \`text\` examples teach that Chinese phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  zh: `**Learner entry** — \`headwordEn\` = natural Chinese **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **Chinese** лемма или полный перевод фразы; \`glossRu\` на русском.`,
};

const INPUT_MODE_RULES_UK_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Ukrainian **lemma** in Cyrillic (e.g. \`вода\`, \`лікар\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Ukrainian translation of the entire entry** in Cyrillic, not one keyword. \`text\` examples teach that Ukrainian phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  uk: `**Ввід учня (слово або фраза — зберігай сенс цілком)**
- Не зводь фразу до одного ключового слова.
- **Одне слово** — \`headwordEn\` = природна українська **лема** (кирилиця).
- **Фраза або речення** (2+ слова) — \`headwordEn\` = **повний природний український переклад усього запису**, не одне слово. Приклади в \`text\` вчать цієї української фрази.
- \`glossRu\`: \`headwordEn\` + IPA + **українське** тлумачення.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **украинская** лемма (кириллица) или полный перевод фразы; \`glossRu\` на русском.`,
  tr: `**Öğrenci girdisi** — \`headwordEn\` = doğal Ukraynaca **lemma** (Kiril); \`glossRu\` Türkçe.`,
};

const INPUT_MODE_RULES_PL_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Polish **lemma** in Latin script (e.g. \`woda\`, \`książka\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Polish translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Polish phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  pl: `**Wpis ucznia (słowo lub fraza — zachowaj pełne znaczenie)**
- Nie redukuj frazy do jednego słowa kluczowego.
- **Jedno słowo** — \`headwordEn\` = naturalna polska **lemma**.
- **Fraza lub zdanie** (2+ słowa) — \`headwordEn\` = **pełne naturalne polskie tłumaczenie całego wpisu**.
- \`glossRu\`: \`headwordEn\` + IPA + znaczenie po **polsku**.`,

  ru: `**Ввод ученика** — \`headwordEn\` = естественная **польская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
};

const INPUT_MODE_RULES_HI_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Hindi **lemma** in Devanagari script (e.g. \`पानी\`, \`किताब\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Hindi translation of the entire entry** in Devanagari script, not one keyword. \`text\` examples teach that Hindi phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  hi: `**Learner entry** — \`headwordEn\` = natural Hindi **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **хинди** лемма (деванагари) или полный перевод фразы; \`glossRu\` на русском.`,
};

const INPUT_MODE_RULES_HE_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Hebrew **lemma** in Hebrew script (e.g. \`מים\`, \`ספר\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Hebrew translation of the entire entry** in Hebrew script, not one keyword. \`text\` examples teach that Hebrew phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  he: `**Learner entry** — \`headwordEn\` = natural Hebrew **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **иврит** лемма (иврит) или полный перевод фразы; \`glossRu\` на русском.`,
};

const INPUT_MODE_RULES_UR_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Urdu **lemma** in Arabic script (e.g. \`پانی\`, \`کتاب\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Urdu translation of the entire entry** in Arabic script, not one keyword. \`text\` examples teach that Urdu phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  ur: `**Learner entry** — \`headwordEn\` = natural Urdu **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **урду** лемма (арабская вязь) или полный перевод фразы; \`glossRu\` на русском.`,
};

const INPUT_MODE_RULES_AZ_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Azerbaijani **lemma** in Latin script (e.g. \`su\`, \`kitab\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Azerbaijani translation of the entire entry** in Latin script, not one keyword. \`text\` examples teach that Azerbaijani phrase.
- \`glossRu\`: \`headwordEn\` + IPA + **English** gloss/definition; you may note the original learner input in parentheses.`,

  az: `**Learner entry** — \`headwordEn\` = natural Azerbaijani **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **азербайджанская** лемма (латиница) или полный перевод фразы; \`glossRu\` на русском.`,
};

const INPUT_MODE_RULES_UG_TARGET = {
  en: `**Learner entry (word or phrase — keep the full meaning)**
- Do not reduce a phrase to a single keyword.
- **Single word** — \`headwordEn\` = natural Uyghur **lemma** in Uyghur Arabic script (e.g. \`سۇ\`, \`كىتاب\`).
- **Phrase or sentence** (2+ words) — \`headwordEn\` = **full natural Uyghur translation of the entire entry** in Uyghur Arabic script, not one keyword. \`text\` examples teach that Uyghur phrase.
- \`glossRu\`: \`headwordEn\` + transliteration + **English** gloss/definition; you may note the original learner input in parentheses.`,

  ug: `**Learner entry** — \`headwordEn\` = natural Uyghur **lemma** or full phrase translation; \`glossRu\` in learner L1.`,
  ru: `**Ввод ученика** — \`headwordEn\` = естественная **уйгурская** лемма (арабская вязь) или полный перевод фразы; \`glossRu\` на русском.`,
};

export function headwordQuickResolveSystemPrompt(isPhrase) {
  if (isPhrase) {
    return (
      'Output only valid JSON: {"headwordEn":"..."} — natural English translation of the ENTIRE learner ' +
      'phrase/sentence. Preserve full meaning. Do NOT reduce to a single dictionary keyword. No markdown.'
    );
  }
  return (
    'Output only valid JSON: {"headwordEn":"..."} — natural English dictionary lemma for the single-word ' +
    'learner input. No markdown.'
  );
}
