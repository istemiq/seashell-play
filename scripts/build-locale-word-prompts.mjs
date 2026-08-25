/**
 * Full per-locale dictionary prompts (same logic as Russian reference).
 * Run: node scripts/build-locale-word-prompts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'server', 'prompts', 'locales');

const SHARED_TAIL = `**Эталон: обычное слово** (не копируй water и фразы — только форму ключей и число {{WORD_EXAMPLE_COUNT}}):

{{FORMAT_SAMPLE}}

**Эталон: неправильный глагол** (не копируй go и фразы — только форму \`verbUsage\` + examples):

{{FORMAT_SAMPLE_VERB}}

Ответ: **только** валидный JSON одного объекта, без markdown и без текста до или после.
`;

const PROMPTS = {
  ru: {
    wordExamples: `Ты помогаешь русскоязычным ученикам английского. Нужен **один** JSON-объект для записи ученика: "{{INPUT}}"

**Язык полей (обязательно, без исключений)**
- \`text\` — **только английское предложение** (слова предложения латиницей). **Нельзя** класть в \`text\` русские предложения или «пример по-русски», даже если "{{INPUT}}" целиком по-русски. Ученик учит **английский**: примеры — английские фразы с \`headwordEn\`.
- \`translation\` — **русский** перевод **той же** английской фразы из \`text\`, плюс хвост пометок как в эталоне.

**Ввод на родном языке**
- Если "{{INPUT}}" по-русски (или кириллицей) — \`headwordEn\` всё равно **нормальная английская лемма** (не транслит ввода). В \`glossRu\` **в начале латиницей** то же слово, что в \`headwordEn\`, затем IPA и русское значение. **Не** начинай \`glossRu\` с русского ввода ученика.

**Задание**
- Ключи: \`headwordEn\`, \`glossRu\`, \`examples\`; для **неправильного английского глагола** ещё \`verbUsage\`.
- В \`examples\` **ровно {{WORD_EXAMPLE_COUNT}}** объектов. В каждом только \`text\` и \`translation\`.
- В конце каждой строки \`translation\` и в \`glossRu\` добавь хвост пометок **как в эталоне**: \` — нейтр.; BrE/AmE\` или \` — разг.; BrE/AmE\`.

**Транскрипция**
- В \`glossRu\` сразу после \`headwordEn\` (перед « — ») — IPA в квадратных скобках: \`water [ˈwɔːtər] — вода…\`.

**Неправильный глагол**
- Если \`headwordEn\` — неправильный глагол — массив \`verbUsage\` из **ровно 3** объектов (\`label\`, \`text\`, \`translation\`). Метки форм: \`наст. (go)\`, \`прош. (went)\`, \`прич. (gone)\`.

Контент: законный учебный тон для РФ, 16+, без экстремизма, ненависти, оскорблений религий, сексуального контента с несовершеннолетними, инструкций по преступлениям и наркотикам; без мата.

${SHARED_TAIL.replace('**Эталон', '**Эталон')}`,
    system: `You output only one valid JSON object when asked. No markdown fences.

Match the FORMAT SAMPLE blocks: same keys (headwordEn, glossRu, examples; verbUsage only for irregular verbs).

STRICT COUNTS: "examples" must contain exactly {{WORD_EXAMPLE_COUNT}} objects.

STRICT LANGUAGE SPLIT:
- Every "text" = English sentence (Latin letters). Cyrillic in "text" is forbidden.
- Every "translation" and the gloss part of "glossRu" after the em dash = **Russian (Cyrillic)**. Latin only for headwordEn, IPA, and tags like BrE/AmE.
- If learner input is Russian/Cyrillic: headwordEn = natural English lemma; glossRu must start with that English word in Latin letters — NOT with the learner's Russian input.

TRANSCRIPTION: glossRu = headwordEn + [IPA] + — + Russian gloss + style tail.`,
  },

  uk: {
    wordExamples: `Ти допомагаєш україномовним учням англійської. Потрібен **один** JSON-об'єкт для запису учня: "{{INPUT}}"

**Мова полів (обов'язково)**
- \`text\` — **лише англійське речення** (латиницею). **Не можна** класти в \`text\` українські речення, навіть якщо "{{INPUT}}" українською. Учень вивчає **англійську**: приклади — англійські фрази з \`headwordEn\`.
- \`translation\` — **український** переклад **того ж** англійського речення з \`text\`, плюс хвіст поміток як у зразку.
- **ЗАБОРОНЕНО** російську в \`translation\` і в значенні \`glossRu\` після тире. Лише **українська**.

**Ввід рідною мовою**
- Якщо "{{INPUT}}" **українською** (кирилицею) — \`headwordEn\` все одно **природна англійська лема** (напр. ввід «словник» → \`headwordEn\`: \`dictionary\`). У \`glossRu\` **на початку латиницею** \`headwordEn\`, потім IPA і **українське** тлумачення. **Не** починай \`glossRu\` з українського вводу учня.

**Завдання**
- Ключі: \`headwordEn\`, \`glossRu\`, \`examples\`; для неправильного дієслова — \`verbUsage\` (3 об'єкти).
- У \`examples\` **рівно {{WORD_EXAMPLE_COUNT}}** об'єктів. Хвіст поміток: \` — нейтр.; BrE/AmE\`, \` — розм.; BrE/AmE\` тощо — **українськими скороченнями**, як у зразку.

**Транскрипція**
- \`glossRu\`: \`dictionary [ˈdɪkʃənri] — словник; книга зі словами…\` — англійська лема, IPA, **українське** значення.

**Неправильне дієслово**
- Мітки: \`теп. (go)\`, \`мин. (went)\`, \`дієпр. (gone)\`.

Контент: законний навчальний тон, 16+, без екстремізму, ненависті, сексуального контенту з неповнолітніми, інструкцій щодо злочинів і наркотиків; без лайки.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**Зразок').replace('Ответ', 'Відповідь')}`,
    system: `You output only one valid JSON object. No markdown.

"examples" = exactly {{WORD_EXAMPLE_COUNT}} objects.

STRICT LANGUAGE:
- "text" = English only (Latin). No Cyrillic in "text".
- "translation" and gloss after em dash in "glossRu" = **Ukrainian (Cyrillic)** only. **Russian is forbidden.**
- Cyrillic learner input (e.g. словник) → headwordEn = English lemma (dictionary); glossRu starts with headwordEn in Latin + IPA + Ukrainian gloss.

Never put the learner's Ukrainian input word at the start of glossRu.`,
  },

  es: {
    wordExamples: `Ayudas a estudiantes hispanohablantes de inglés. Necesitas **un** objeto JSON para: "{{INPUT}}"

**Idioma de los campos**
- \`text\` — **solo oración en inglés** (letras latinas). No pongas español en \`text\`, aunque "{{INPUT}}" esté en español. El alumno aprende **inglés**.
- \`translation\` — traducción al **español** de la misma oración inglesa, más cola de etiquetas como en la muestra.

**Entrada en la lengua materna**
- Si "{{INPUT}}" está en **español** — \`headwordEn\` sigue siendo la **lema inglesa natural** (ej. «diccionario» → \`dictionary\`). \`glossRu\` empieza con \`headwordEn\` en latín + IPA + significado en **español**. No empieces \`glossRu\` con la palabra española del alumno.

**Tarea**
- Claves: \`headwordEn\`, \`glossRu\`, \`examples\`; verbos irregulares: \`verbUsage\` (3 objetos).
- **Exactamente {{WORD_EXAMPLE_COUNT}}** ejemplos. Cola: \` — neutro; BrE/AmE\`, \` — coloq.; BrE/AmE\`.

**Transcripción**: \`water [ˈwɔːtə] — agua…\` en \`glossRu\`.

**Verbo irregular**: etiquetas \`pres. (go)\`, \`pret. (went)\`, \`part. (gone)\`.

Contenido lícito, 16+, sin odio, drogas, instrucciones delictivas; sin groserías.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**Muestra').replace('Ответ', 'Respuesta')}`,
    system: `JSON only. "examples" = {{WORD_EXAMPLE_COUNT}} objects.
"text" = English. "translation" and gloss in glossRu = **Spanish**. No Russian/Cyrillic in translations.
Spanish input → English headwordEn; glossRu starts with English lemma + IPA + Spanish gloss.`,
  },

  pt: {
    wordExamples: `Você ajuda estudantes lusófonos de inglês. Precisa de **um** objeto JSON para: "{{INPUT}}"

**Idioma dos campos**
- \`text\` — **somente frase em inglês**. Não coloque português em \`text\`.
- \`translation\` — tradução em **português** da mesma frase inglesa + etiquetas como na amostra.

**Entrada na língua materna**
- Se "{{INPUT}}" em **português** — \`headwordEn\` = **lema inglesa natural**. \`glossRu\` começa com \`headwordEn\` + IPA + significado em **português**.

**Tarefa**: \`headwordEn\`, \`glossRu\`, \`examples\` ({{WORD_EXAMPLE_COUNT}} itens); \`verbUsage\` se irregular. Etiquetas: \`pres. (go)\`, \`pret. (went)\`, \`part. (gone)\`. Cola: \` — neutro; BrE/AmE\`.

Conteúdo lícito, 16+, sem ódio ou instruções criminosas.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**Amostra').replace('Ответ', 'Resposta')}`,
    system: `JSON only. "text"=English. "translation" and glossRu gloss=**Portuguese**. Portuguese input → English headwordEn.`,
  },

  it: {
    wordExamples: `Aiuti studenti italofoni di inglese. Serve **un** oggetto JSON per: "{{INPUT}}"

**Lingua dei campi**
- \`text\` — **solo frase inglese** (alfabeto latino).
- \`translation\` — traduzione **italiana** della stessa frase + coda stile come nel campione.

**Input nella lingua madre**
- Se "{{INPUT}}" in **italiano** — \`headwordEn\` = lemma **inglese** naturale. \`glossRu\` inizia con \`headwordEn\` + IPA + significato **italiano**.

**Compito**: {{WORD_EXAMPLE_COUNT}} esempi; \`verbUsage\` se irregolare. Etichette: \`pres. (go)\`, \`pass. (went)\`, \`part. (gone)\`.

Contenuto lecito, 16+, senza odio o istruzioni criminali.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**Campione').replace('Ответ', 'Risposta')}`,
    system: `JSON only. "text"=English. Translations and gloss=**Italian**. Italian input → English headwordEn.`,
  },

  tr: {
    wordExamples: `İngilizce öğrenen Türkçe konuşan öğrencilere yardım ediyorsun. "{{INPUT}}" için **tek** bir JSON nesnesi üret.

**Alan dilleri**
- \`text\` — **yalnızca İngilizce cümle** (Latin harfleri). "{{INPUT}}" Türkçe olsa bile \`text\` içine Türkçe koyma. Öğrenci **İngilizce** öğreniyor.
- \`translation\` — aynı İngilizce cümlenin **Türkçe** çevirisi + örnekteki gibi stil etiketi.

**Ana dilde giriş**
- "{{INPUT}}" **Türkçe** ise — \`headwordEn\` yine **doğal İngilizce lemma** (ör. «sözlük» → \`dictionary\`). \`glossRu\` \`headwordEn\` + IPA + **Türkçe** anlamla başlar. \`glossRu\`'yu öğrencinin Türkçe girdisiyle başlatma.

**Görev**
- Anahtarlar: \`headwordEn\`, \`glossRu\`, \`examples\`; düzensiz fiillerde \`verbUsage\` (3 nesne).
- **Tam {{WORD_EXAMPLE_COUNT}}** örnek. Kuyruk: \` — nötr; BrE/AmE\`, \` — günlük; BrE/AmE\`.

**Transkripsiyon**: \`water [ˈwɔːtə] — su…\` şeklinde \`glossRu\`.

**Düzensiz fiil**: etiketler \`şimd. (go)\`, \`geçmiş (went)\`, \`part. (gone)\`.

Yasal eğitim tonu, 16+, nefret veya suç talimatı yok.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**Örnek').replace('Ответ', 'Çıktı')}`,
    system: `JSON only. "examples" = {{WORD_EXAMPLE_COUNT}} objects.
"text" = English. "translation" and gloss in glossRu = **Turkish**. Turkish input → English headwordEn.`,
  },

  en: {
    wordExamples: `You help English-speaking learners of English. Produce **one** JSON object for: "{{INPUT}}"

**Field languages**
- \`text\` — **English sentence only** (Latin letters).
- \`translation\` — **English** gloss/paraphrase of the same sentence (learner's L1 is English) + style tail as in the sample.

**Native-language input**
- If "{{INPUT}}" is not English — \`headwordEn\` = natural **English lemma**. \`glossRu\` starts with \`headwordEn\` + IPA + **English** definition.

**Task**: {{WORD_EXAMPLE_COUNT}} examples; \`verbUsage\` for irregular verbs. Labels: \`pres. (go)\`, \`past (went)\`, \`pp. (gone)\`. Tail: \` — neutral; BrE/AmE\`.

Lawful educational tone, 16+, no hate or crime instructions.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**Sample').replace('Ответ', 'Output')}`,
    system: `JSON only. "text" and learner-facing gloss/translation = **English**. headwordEn = English lemma.`,
  },

  ar: {
    wordExamples: `تساعد متعلمي الإنجليزية الناطقين بالعربية. أنشئ **كائن JSON واحد** للمدخل: "{{INPUT}}"

**لغة الحقول**
- \`text\` — **جملة إنجليزية فقط** (حروف لاتينية).
- \`translation\` — ترجمة **عربية** لنفس الجملة + ذيل الوسم كما في العينة.

**إدخال باللغة الأم**
- إذا كان "{{INPUT}}" **بالعربية** — \`headwordEn\` = **اللفظ الإنجليزي الطبيعي**. يبدأ \`glossRu\` بـ \`headwordEn\` + IPA + المعنى **بالعربية**.

**المهمة**: {{WORD_EXAMPLE_COUNT}} أمثلة؛ \`verbUsage\` للأفعال الشاذة.

محتوى تعليمي مشروع، 16+.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**عينة').replace('Ответ', 'الإخراج')}`,
    system: `JSON only. "text"=English. "translation" and gloss in glossRu = **Arabic**. Arabic input → English headwordEn.`,
  },

  fa: {
    wordExamples: `به زبان‌آموزان انگلیسی فارسی‌زبان کمک می‌کنید. **یک** شیء JSON برای: "{{INPUT}}"

**زبان فیلدها**
- \`text\` — **فقط جمله انگلیسی**.
- \`translation\` — ترجمه **فارسی** همان جمله + برچسب سبک.

**ورودی به زبان مادری**
- اگر "{{INPUT}}" **فارسی** است — \`headwordEn\` = **لفظ انگلیسی طبیعی**. \`glossRu\` با \`headwordEn\` + IPA + معنی **فارسی** شروع شود.

**وظیفه**: {{WORD_EXAMPLE_COUNT}} مثال؛ \`verbUsage\` برای فعل بی‌قاعده.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**نمونه').replace('Ответ', 'خروجی')}`,
    system: `JSON only. "text"=English. Translations and gloss = **Persian**. Persian input → English headwordEn.`,
  },

  ko: {
    wordExamples: `한국어 사용자 영어 학습자를 돕습니다. "{{INPUT}}"에 대한 **JSON 객체 하나**를 만드세요.

**필드 언어**
- \`text\` — **영어 문장만** (라틴 문자).
- \`translation\` — 같은 영어 문장의 **한국어** 번역 + 샘플과 같은 스타일 꼬리표.

**모국어 입력**
- "{{INPUT}}"이 **한국어**여도 \`headwordEn\` = **자연스러운 영어 표제어**. \`glossRu\`는 \`headwordEn\` + IPA + **한국어** 뜻으로 시작.

**과제**: 예문 {{WORD_EXAMPLE_COUNT}}개; 불규칙 동사는 \`verbUsage\` 3개.

${SHARED_TAIL.replace(/\*\*Эталон/g, '**샘플').replace('Ответ', '출력')}`,
    system: `JSON only. "text"=English. "translation" and gloss = **Korean**. Korean input → English headwordEn.`,
  },

  ja: {
    wordExamples: `日本語話者の英語学習者を助けます。「{{INPUT}}」の **JSON オブジェクト 1 つ**を出力してください。

**フィールドの言語**
- \`text\` — **英語の文のみ**（ラテン文字）。
- \`translation\` — 同じ英文の **日本語** 訳 + サンプルと同じスタイル尾辞。

**母語での入力**
- 「{{INPUT}}」が **日本語** でも \`headwordEn\` = **自然な英語の見出し語**。 \`glossRu\` は \`headwordEn\` + IPA + **日本語**の意味で始める。

**課題**: 例文 {{WORD_EXAMPLE_COUNT}} 件；不規則動詞は \`verbUsage\` 3 件。

${SHARED_TAIL.replace(/\*\*Эталон/g, '**サンプル').replace('Ответ', '出力')}`,
    system: `JSON only. "text"=English. "translation" and gloss = **Japanese**. Japanese input → English headwordEn.`,
  },
};

for (const [locale, { wordExamples, system }] of Object.entries(PROMPTS)) {
  const dir = path.join(OUT, locale);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'word-examples.txt'), `${wordExamples}\n`, 'utf8');
  fs.writeFileSync(path.join(dir, 'word-dictionary-system.txt'), `${system}\n`, 'utf8');
  console.log(`wrote ${locale}`);
}
