/** Inject practice level i18n keys into all UI locale message files. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../src/i18n/messages');

const BLOCKS = {
  en: `
  'practice.level.title': 'Practice level',
  'practice.level.subtitle': 'Bot adapts vocabulary and sentence complexity',
  'practice.level.beginner': 'Beginner',
  'practice.level.beginnerHint': 'A1 — very short replies, simple words',
  'practice.level.elementary': 'Elementary',
  'practice.level.elementaryHint': 'A2 — short sentences, everyday topics',
  'practice.level.intermediate': 'Intermediate',
  'practice.level.intermediateHint': 'B1 — natural chat (default)',
  'practice.level.upper': 'Upper intermediate',
  'practice.level.upperHint': 'B2 — richer vocabulary, longer replies',
  'practice.level.advanced': 'Advanced',
  'practice.level.advancedHint': 'C1 — articulate, near-native complexity',
`,
  ru: `
  'practice.level.title': 'Уровень практики',
  'practice.level.subtitle': 'Бот подстраивает слова и сложность фраз',
  'practice.level.beginner': 'Начальный',
  'practice.level.beginnerHint': 'A1 — очень короткие ответы, простые слова',
  'practice.level.elementary': 'Элементарный',
  'practice.level.elementaryHint': 'A2 — короткие фразы, бытовые темы',
  'practice.level.intermediate': 'Средний',
  'practice.level.intermediateHint': 'B1 — обычный разговор (по умолчанию)',
  'practice.level.upper': 'Выше среднего',
  'practice.level.upperHint': 'B2 — богаче лексика, длиннее ответы',
  'practice.level.advanced': 'Продвинутый',
  'practice.level.advancedHint': 'C1 — почти носитель, сложные формулировки',
`,
  ar: `
  'practice.level.title': 'مستوى الممارسة',
  'practice.level.subtitle': 'يتكيف البوت مع المفردات وطول الجمل',
  'practice.level.beginner': 'مبتدئ',
  'practice.level.beginnerHint': 'A1 — ردود قصيرة جداً وكلمات بسيطة',
  'practice.level.elementary': 'ابتدائي',
  'practice.level.elementaryHint': 'A2 — جمل قصيرة ومواضيع يومية',
  'practice.level.intermediate': 'متوسط',
  'practice.level.intermediateHint': 'B1 — محادثة طبيعية (افتراضي)',
  'practice.level.upper': 'فوق المتوسط',
  'practice.level.upperHint': 'B2 — مفردات أغنى وردود أطول',
  'practice.level.advanced': 'متقدم',
  'practice.level.advancedHint': 'C1 — تقريباً مثل الناطقين الأصليين',
`,
  es: `
  'practice.level.title': 'Nivel de práctica',
  'practice.level.subtitle': 'El bot adapta vocabulario y complejidad',
  'practice.level.beginner': 'Principiante',
  'practice.level.beginnerHint': 'A1 — respuestas muy cortas, palabras simples',
  'practice.level.elementary': 'Elemental',
  'practice.level.elementaryHint': 'A2 — frases cortas, temas cotidianos',
  'practice.level.intermediate': 'Intermedio',
  'practice.level.intermediateHint': 'B1 — chat natural (predeterminado)',
  'practice.level.upper': 'Intermedio alto',
  'practice.level.upperHint': 'B2 — vocabulario más rico, respuestas más largas',
  'practice.level.advanced': 'Avanzado',
  'practice.level.advancedHint': 'C1 — casi nivel nativo',
`,
  pt: `
  'practice.level.title': 'Nível de prática',
  'practice.level.subtitle': 'O bot adapta vocabulário e complexidade',
  'practice.level.beginner': 'Iniciante',
  'practice.level.beginnerHint': 'A1 — respostas bem curtas, palavras simples',
  'practice.level.elementary': 'Elementar',
  'practice.level.elementaryHint': 'A2 — frases curtas, temas do dia a dia',
  'practice.level.intermediate': 'Intermediário',
  'practice.level.intermediateHint': 'B1 — conversa natural (padrão)',
  'practice.level.upper': 'Intermediário superior',
  'practice.level.upperHint': 'B2 — vocabulário mais rico, respostas maiores',
  'practice.level.advanced': 'Avançado',
  'practice.level.advancedHint': 'C1 — quase nível nativo',
`,
  fa: `
  'practice.level.title': 'سطح تمرین',
  'practice.level.subtitle': 'ربات واژگان و پیچیدگی جملات را تنظیم می‌کند',
  'practice.level.beginner': 'مبتدی',
  'practice.level.beginnerHint': 'A1 — پاسخ‌های خیلی کوتاه، واژگان ساده',
  'practice.level.elementary': 'ابتدایی',
  'practice.level.elementaryHint': 'A2 — جملات کوتاه، موضوعات روزمره',
  'practice.level.intermediate': 'متوسط',
  'practice.level.intermediateHint': 'B1 — گفت‌وگوی طبیعی (پیش‌فرض)',
  'practice.level.upper': 'بالاتر از متوسط',
  'practice.level.upperHint': 'B2 — واژگان غنی‌تر، پاسخ‌های بلندتر',
  'practice.level.advanced': 'پیشرفته',
  'practice.level.advancedHint': 'C1 — نزدیک به سطح بومی',
`,
  uk: `
  'practice.level.title': 'Рівень практики',
  'practice.level.subtitle': 'Бот підлаштовує слова та складність фраз',
  'practice.level.beginner': 'Початковий',
  'practice.level.beginnerHint': 'A1 — дуже короткі відповіді, прості слова',
  'practice.level.elementary': 'Елементарний',
  'practice.level.elementaryHint': 'A2 — короткі речення, побутові теми',
  'practice.level.intermediate': 'Середній',
  'practice.level.intermediateHint': 'B1 — звичайна розмова (за замовч.)',
  'practice.level.upper': 'Вище середнього',
  'practice.level.upperHint': 'B2 — багатша лексика, довші відповіді',
  'practice.level.advanced': 'Просунутий',
  'practice.level.advancedHint': 'C1 — майже рівень носія',
`,
  ko: `
  'practice.level.title': '연습 수준',
  'practice.level.subtitle': '봇이 어휘와 문장 난이도를 맞춥니다',
  'practice.level.beginner': '초급',
  'practice.level.beginnerHint': 'A1 — 매우 짧은 답변, 쉬운 단어',
  'practice.level.elementary': '기초',
  'practice.level.elementaryHint': 'A2 — 짧은 문장, 일상 주제',
  'practice.level.intermediate': '중급',
  'practice.level.intermediateHint': 'B1 — 자연스러운 대화 (기본)',
  'practice.level.upper': '중상급',
  'practice.level.upperHint': 'B2 — 풍부한 어휘, 더 긴 답변',
  'practice.level.advanced': '고급',
  'practice.level.advancedHint': 'C1 — 거의 원어민 수준',
`,
  ja: `
  'practice.level.title': '練習レベル',
  'practice.level.subtitle': 'ボットが語彙と文の難易度を調整します',
  'practice.level.beginner': '初級',
  'practice.level.beginnerHint': 'A1 — とても短い返答、簡単な語',
  'practice.level.elementary': '基礎',
  'practice.level.elementaryHint': 'A2 — 短い文、日常の話題',
  'practice.level.intermediate': '中級',
  'practice.level.intermediateHint': 'B1 — 自然な会話（既定）',
  'practice.level.upper': '中上級',
  'practice.level.upperHint': 'B2 — 語彙が豊か、返答も長め',
  'practice.level.advanced': '上級',
  'practice.level.advancedHint': 'C1 — ほぼネイティブに近い',
`,
  it: `
  'practice.level.title': 'Livello di pratica',
  'practice.level.subtitle': 'Il bot adatta vocabolario e complessità',
  'practice.level.beginner': 'Principiante',
  'practice.level.beginnerHint': 'A1 — risposte brevissime, parole semplici',
  'practice.level.elementary': 'Elementare',
  'practice.level.elementaryHint': 'A2 — frasi corte, argomenti quotidiani',
  'practice.level.intermediate': 'Intermedio',
  'practice.level.intermediateHint': 'B1 — chat naturale (predefinito)',
  'practice.level.upper': 'Intermedio superiore',
  'practice.level.upperHint': 'B2 — vocabolario più ricco, risposte più lunghe',
  'practice.level.advanced': 'Avanzato',
  'practice.level.advancedHint': 'C1 — quasi livello nativo',
`,
  tr: `
  'practice.level.title': 'Pratik seviyesi',
  'practice.level.subtitle': 'Bot kelime ve cümle zorluğunu ayarlar',
  'practice.level.beginner': 'Başlangıç',
  'practice.level.beginnerHint': 'A1 — çok kısa yanıtlar, basit kelimeler',
  'practice.level.elementary': 'Temel',
  'practice.level.elementaryHint': 'A2 — kısa cümleler, günlük konular',
  'practice.level.intermediate': 'Orta',
  'practice.level.intermediateHint': 'B1 — doğal sohbet (varsayılan)',
  'practice.level.upper': 'Orta üstü',
  'practice.level.upperHint': 'B2 — daha zengin kelime, daha uzun yanıtlar',
  'practice.level.advanced': 'İleri',
  'practice.level.advancedHint': 'C1 — neredeyse ana dil seviyesi',
`,
};

for (const [code, block] of Object.entries(BLOCKS)) {
  const file = path.join(messagesDir, `${code}.js`);
  if (!fs.existsSync(file)) {
    console.warn('skip', file);
    continue;
  }
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes("'practice.level.title'")) {
    console.log('already', code);
    continue;
  }
  const anchor = "'practice.hubFree':";
  const idx = src.indexOf(anchor);
  if (idx === -1) {
    console.warn('no anchor', code);
    continue;
  }
  const lineEnd = src.indexOf('\n', idx);
  src = `${src.slice(0, lineEnd + 1)}${block}${src.slice(lineEnd + 1)}`;
  fs.writeFileSync(file, src);
  console.log('patched', code);
}
