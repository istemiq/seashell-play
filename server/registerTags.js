/**
 * Стилистические пометки словарных статей и примеров.
 * Канон в промптах — русские сокращения; на карточке локализуются под язык UI.
 */

/** @typedef {{ id: string, patterns: RegExp[], labels: Record<string, string>, hintRu: string, hintEn: string, hintUk: string }} RegisterTag */

/** @type {RegisterTag[]} */
export const REGISTER_TAGS = [
  {
    id: 'neutral',
    patterns: [/нейтр\.?/gi, /\bneutral\b/gi, /\bneutro\b/gi, /\bnötr\b/gi, /محايد/gi, /خنثی/gi, /중립/gi, /中立/gi],
    labels: {
      ru: 'нейтр.', uk: 'нейтр.', en: 'neutral', es: 'neutro', pt: 'neutro', it: 'neutro', tr: 'nötr',
      ar: 'محايد', fa: 'خنثی', ko: '중립', ja: '中立',
    },
    hintRu: 'бытовая нейтральная речь',
    hintEn: 'everyday neutral speech',
    hintUk: 'побутова нейтральна мова',
  },
  {
    id: 'informal',
    patterns: [/разг\.?/gi, /розм\.?/gi, /\binformal\b/gi, /\bcolloq\.?\b/gi, /\bcoloq\.?\b/gi, /\bargo\b/gi, /عامية/gi, /محاوره‌ای/gi, /구어/gi, /口語/gi],
    labels: {
      ru: 'разг.', uk: 'розм.', en: 'informal', es: 'coloq.', pt: 'informal', it: 'colloq.', tr: 'argo',
      ar: 'عامية', fa: 'محاوره‌ای', ko: '구어', ja: '口語',
    },
    hintRu: 'разговорная, непринуждённая речь',
    hintEn: 'colloquial, casual speech',
    hintUk: 'розмовна, невимушена мова',
  },
  {
    id: 'formal',
    patterns: [/форм\.?/gi, /\bformal\b/gi, /\bformale\b/gi, /\bresmi\b/gi, /رسمي/gi, /رسمی/gi, /격식/gi, /格式/gi],
    labels: {
      ru: 'форм.', uk: 'форм.', en: 'formal', es: 'formal', pt: 'formal', it: 'formale', tr: 'resmi',
      ar: 'رسمي', fa: 'رسمی', ko: '격식', ja: '格式',
    },
    hintRu: 'официальная, деловая, научная, медицинская, юридическая, техническая лексика',
    hintEn: 'official, business, academic, medical, legal, technical',
    hintUk: 'офіційна, ділова, наукова, медична, юридична, технічна лексика',
  },
  {
    id: 'literary',
    patterns: [/книжн\.?/gi, /\bliterary\b/gi, /\bliterario\b/gi, /\bliterário\b/gi, /\bletterario\b/gi, /\bedebi\b/gi],
    labels: {
      ru: 'книжн.', uk: 'книжн.', en: 'literary', es: 'literario', pt: 'literário', it: 'letterario', tr: 'edebi',
      ar: 'أدبي', fa: 'ادبی', ko: '문어', ja: '文語',
    },
    hintRu: 'книжный, возвышенный литературный стиль',
    hintEn: 'bookish, literary style',
    hintUk: 'книжний, піднесений літературний стиль',
  },
  {
    id: 'elevated',
    patterns: [/высок\.?/gi, /висок\.?/gi, /\belevated\b/gi, /\belevado\b/gi, /\belevato\b/gi, /\byüce\b/gi],
    labels: {
      ru: 'высок.', uk: 'висок.', en: 'elevated', es: 'elevado', pt: 'elevado', it: 'elevato', tr: 'yüce',
      ar: 'رسمي مرتفع', fa: 'بلند', ko: '고어체', ja: '高文',
    },
    hintRu: 'высокий, торжественный стиль',
    hintEn: 'elevated, solemn register',
    hintUk: 'високий, урочистий стиль',
  },
  {
    id: 'poetic',
    patterns: [/поэт\.?/gi, /\bpoetic\b/gi, /\bpoético\b/gi, /\bpoetico\b/gi, /\bşiirsel\b/gi],
    labels: {
      ru: 'поэт.', uk: 'поэт.', en: 'poetic', es: 'poético', pt: 'poético', it: 'poetico', tr: 'şiirsel',
      ar: 'شعري', fa: 'شاعرانه', ko: '시적', ja: '詩的',
    },
    hintRu: 'поэтический, образный стиль',
    hintEn: 'poetic, figurative style',
    hintUk: 'поетичний, образний стиль',
  },
  {
    id: 'archaic',
    patterns: [/устар\.?/gi, /застар\.?/gi, /\barchaic\b/gi, /\barcaico\b/gi, /\barcaico\b/gi, /\beski\b/gi, /\bdated\b/gi],
    labels: {
      ru: 'устар.', uk: 'застар.', en: 'archaic', es: 'arcaico', pt: 'arcaico', it: 'arcaico', tr: 'eski',
      ar: 'قديم', fa: 'کهنه', ko: '고어', ja: '古語',
    },
    hintRu: 'устаревшее, архаичное слово или оборот',
    hintEn: 'archaic or dated word/phrase',
    hintUk: 'застаріле, архаїчне слово чи зворот',
  },
  {
    id: 'slang',
    patterns: [/сленг\.?/gi, /\bslang\b/gi, /\bjerga\b/gi, /\bgíria\b/gi, /\bgergo\b/gi],
    labels: {
      ru: 'сленг', uk: 'сленг', en: 'slang', es: 'jerga', pt: 'gíria', it: 'gergo', tr: 'argo',
      ar: 'عامية شباب', fa: 'اصطلاح', ko: '속어', ja: 'スラング',
    },
    hintRu: 'сленг, молодёжная или групповая лексика',
    hintEn: 'slang, youth or in-group vocabulary',
    hintUk: 'сленг, молодіжна або групова лексика',
  },
  {
    id: 'vulgar',
    patterns: [/груб\.?/gi, /\bvulgar\b/gi, /\bgrosero\b/gi, /\bvolgare\b/gi, /\bkaba\b/gi],
    labels: {
      ru: 'груб.', uk: 'груб.', en: 'vulgar', es: 'grosero', pt: 'vulgar', it: 'volgare', tr: 'kaba',
      ar: 'بذيء', fa: 'رکیک', ko: '저속', ja: '下品',
    },
    hintRu: 'грубое, просторечное слово (без мата в примерах)',
    hintEn: 'coarse/vulgar word (no profanity in examples)',
    hintUk: 'грубе, просторечне слово (без лайки в прикладах)',
  },
  {
    id: 'coarse',
    patterns: [/прост\.?/gi, /\bcoarse\b/gi, /\bgrosseiro\b/gi, /\bvolg\.\b/gi],
    labels: {
      ru: 'прост.', uk: 'прост.', en: 'coarse', es: 'vulgar', pt: 'grosseiro', it: 'volg.', tr: 'kaba',
      ar: 'فظ', fa: 'پست', ko: '상스', ja: '俗語',
    },
    hintRu: 'просторечие, низкий разговорный регистр',
    hintEn: 'low colloquial / coarse everyday speech',
    hintUk: 'просторіччя, низький розмовний регістр',
  },
  {
    id: 'jargon',
    patterns: [/проф\.?/gi, /\bjargon\b/gi, /\bjerga prof\.?\b/gi, /\bjargão\b/gi, /\bgergo tecn\.?\b/gi],
    labels: {
      ru: 'проф.', uk: 'проф.', en: 'jargon', es: 'jerga prof.', pt: 'jargão', it: 'gergo tecn.', tr: 'jargon',
      ar: 'مهني', fa: 'فنی', ko: '전문', ja: '専門語',
    },
    hintRu: 'профессиональный жаргон узкой сферы',
    hintEn: 'professional in-group jargon',
    hintUk: 'професійний жаргон вузької сфери',
  },
  {
    id: 'technical',
    patterns: [/спец\.?/gi, /\btechnical\b/gi, /\btécnico\b/gi, /\btecnico\b/gi, /\bteknik\b/gi],
    labels: {
      ru: 'спец.', uk: 'спец.', en: 'technical', es: 'técnico', pt: 'técnico', it: 'tecnico', tr: 'teknik',
      ar: 'تقني', fa: 'فنی', ko: '기술', ja: '専門',
    },
    hintRu: 'узкоспециальная терминология',
    hintEn: 'specialized terminology',
    hintUk: 'вузькоспеціальна термінологія',
  },
  {
    id: 'dialectal',
    patterns: [/диал\.?/gi, /діал\.?/gi, /\bdialectal\b/gi, /\bdialectal\b/gi, /\bdialetal\b/gi, /\bdialettale\b/gi, /\bağız\b/gi],
    labels: {
      ru: 'диал.', uk: 'діал.', en: 'dialectal', es: 'dialectal', pt: 'dialetal', it: 'dialettale', tr: 'ağız',
      ar: 'لهجة', fa: 'گویش', ko: '방언', ja: '方言',
    },
    hintRu: 'диалектное, региональное слово или оборот',
    hintEn: 'dialectal or regional word/phrase',
    hintUk: 'діалектне, регіональне слово чи зворот',
  },
  {
    id: 'euphemistic',
    patterns: [/эвф\.?/gi, /евф\.?/gi, /\beuphemistic\b/gi, /\beufemismo\b/gi, /\beufemismo\b/gi, /\börtmece\b/gi],
    labels: {
      ru: 'эвф.', uk: 'евф.', en: 'euphemistic', es: 'eufemismo', pt: 'eufemismo', it: 'eufemismo', tr: 'örtmece',
      ar: 'تجميل', fa: 'تعارف', ko: '완곡', ja: '婉曲',
    },
    hintRu: 'эвфемизм, смягчённое выражение',
    hintEn: 'euphemistic expression',
    hintUk: 'евфемізм, пом\'якшене висловлювання',
  },
  {
    id: 'ironic',
    patterns: [/ирон\.?/gi, /ірон\.?/gi, /\bironic\b/gi, /\birónico\b/gi, /\bironico\b/gi, /\bironik\b/gi],
    labels: {
      ru: 'ирон.', uk: 'ірон.', en: 'ironic', es: 'irónico', pt: 'irónico', it: 'ironico', tr: 'ironik',
      ar: 'ساخر', fa: 'طعنه‌آمیز', ko: '아이러니', ja: '皮肉',
    },
    hintRu: 'ироническое употребление',
    hintEn: 'ironic usage',
    hintUk: 'іронічне вживання',
  },
  {
    id: 'taboo',
    patterns: [/таб\.?/gi, /\btaboo\b/gi, /\btabú\b/gi, /\btabu\b/gi, /\btabù\b/gi],
    labels: {
      ru: 'таб.', uk: 'таб.', en: 'taboo', es: 'tabú', pt: 'tabu', it: 'tabù', tr: 'tabu',
      ar: 'محظور', fa: 'ممنوع', ko: '금기', ja: 'タブー',
    },
    hintRu: 'табуированная лексика (помечай, но не цитируй в примерах)',
    hintEn: 'taboo lexeme (mark it, do not quote slurs in examples)',
    hintUk: 'табуїзована лексика (позначай, але не цитуй у прикладах)',
  },
];

const HINT_KEY = {
  ru: 'hintRu',
  uk: 'hintUk',
  en: 'hintEn',
};

/** Короткая подпись пометки для локали карточки. */
export function registerTagLabel(tagId, locale) {
  const loc = String(locale ?? 'ru').trim().toLowerCase() || 'ru';
  const tag = REGISTER_TAGS.find((t) => t.id === tagId);
  if (!tag) return '';
  return tag.labels[loc] ?? tag.labels.en ?? '';
}

/** Правила замены пометок при отображении карточки. */
export function buildLocalizationRules(locale) {
  const loc = String(locale ?? 'ru').trim().toLowerCase() || 'ru';
  if (loc === 'ru' || loc === 'uk') {
    return REGISTER_TAGS.flatMap((tag) =>
      tag.patterns.map((pattern) => [pattern, tag.labels[loc] ?? tag.labels.ru]),
    );
  }
  return REGISTER_TAGS.flatMap((tag) =>
    tag.patterns.map((pattern) => [pattern, tag.labels[loc] ?? tag.labels.en]),
  );
}

/** Примеры хвоста для промпта. */
export function registerTailExamples(locale) {
  const loc = String(locale ?? 'ru').trim().toLowerCase() || 'ru';
  const n = registerTagLabel('neutral', loc);
  const i = registerTagLabel('informal', loc);
  const f = registerTagLabel('formal', loc);
  const l = registerTagLabel('literary', loc);
  return `\` — ${n}; BrE/AmE\`, \` — ${i}; BrE/AmE\`, \` — ${f}; BrE/AmE\`, \` — ${l}; BrE/AmE\``;
}

/** Блок правил для user-промпта словаря. */
export function buildRegisterTagsGuide(locale) {
  const loc = String(locale ?? 'ru').trim().toLowerCase() || 'ru';
  const hintKey = HINT_KEY[loc] ?? 'hintEn';
  const lines = REGISTER_TAGS.map((tag) => {
    const abbr = tag.labels[loc === 'uk' ? 'uk' : loc] ?? tag.labels.ru;
    const hint = tag[hintKey] ?? tag.hintEn;
    return `  - \`${abbr}\` — ${hint}`;
  });

  const intro =
    loc === 'uk'
      ? `- **Позначки стилю (не став «нейтр.» за замовчуванням):**`
      : loc === 'en'
        ? `- **Style tags (do not default to neutral):**`
        : loc === 'es'
          ? `- **Etiquetas de registro (no uses «neutro» por defecto):**`
          : `- **Пометки стиля (не ставь «нейтр.» по умолчанию):**`;

  const usage =
    loc === 'uk'
      ? `- У \`glossRu\` — типовий стиль **слова**; у кожному \`translation\` — стиль **цієї фрази**. Можна 1–2 пометки через «; » (напр. \` — форм.; спец.; BrE/AmE\`). BrE/AmE — за потреби.`
      : loc === 'en'
        ? `- In \`glossRu\`, tag the word's typical style; in each \`translation\`, tag that sentence. Use 1–2 tags separated by «; » (e.g. \` — formal; technical; BrE/AmE\`). Add BrE/AmE when pronunciation/spelling differs.`
        : loc === 'es'
          ? `- En \`glossRu\`, marca el estilo típico de la palabra; en cada \`translation\`, el de la frase. 1–2 etiquetas con «; » (p. ej. \` — formal; técnico; BrE/AmE\`).`
          : `- В \`glossRu\` укажи **типичный стиль слова**; в каждом \`translation\` — стиль **этой фразы**. Можно 1–2 пометки через «; » (напр. \` — форм.; спец.; BrE/AmE\`). BrE/AmE — при заметном различии произношения/орфографии.`;

  return `${intro}\n${lines.join('\n')}\n${usage}`;
}
