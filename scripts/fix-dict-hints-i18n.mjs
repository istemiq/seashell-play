/**
 * Fix dict hints that still mention Russian in non-ru locales.
 * Run: node scripts/fix-dict-hints-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'messages');

const PATCHES = {
  en: {
    'dict.wordLabel': 'Word or phrase (EN or your language)',
    'dict.placeholderWord': 'e.g. matter or dictionary',
    'dict.addHint':
      'You can type in English or your language — we save a natural English equivalent. We fetch examples and translations in English with style notes and BrE/AmE tags. "Another example" cycles cards.',
    'dict.addHintGroup':
      'The word will be added to this group. You can type in English or your language — we save a natural English equivalent, examples, and translations in English with style notes (neutral, informal, BrE, etc.).',
  },
  es: {
    'dict.wordLabel': 'Palabra o frase (EN o ES)',
    'dict.placeholderWord': 'p. ej. matter o diccionario',
    'dict.addHint':
      'Puedes escribir en español o en inglés — guardamos el equivalente natural en inglés. Buscamos ejemplos y traducciones al español con notas de estilo y BrE/AmE. «Otro ejemplo» cambia las tarjetas.',
    'dict.addHintGroup':
      'La palabra se añadirá a este grupo. Puedes escribir en español — guardamos el equivalente en inglés, ejemplos y traducciones al español con notas de estilo (neutro, informal, BrE, etc.).',
  },
  pt: {
    'dict.wordLabel': 'Palavra ou frase (EN ou PT)',
    'dict.placeholderWord': 'ex.: matter ou dicionário',
    'dict.addHint':
      'Você pode digitar em português ou em inglês — salvamos o equivalente natural em inglês. Buscamos exemplos e traduções em português com notas de estilo e BrE/AmE. «Outro exemplo» alterna as cartas.',
    'dict.addHintGroup':
      'A palavra será adicionada a este grupo. Você pode digitar em português — salvamos o equivalente em inglês, exemplos e traduções em português com notas de estilo (neutro, informal, BrE, etc.).',
  },
  it: {
    'dict.wordLabel': 'Parola o frase (EN o IT)',
    'dict.placeholderWord': 'es. matter o dizionario',
    'dict.addHint':
      "Puoi scrivere in italiano o in inglese — salviamo l'equivalente naturale in inglese. Troviamo esempi e traduzioni in italiano con note di stile e BrE/AmE. «Altro esempio» cambia le schede.",
    'dict.addHintGroup':
      "La parola sarà aggiunta a questo gruppo. Puoi scrivere in italiano — salviamo l'equivalente in inglese, esempi e traduzioni in italiano con note di stile (neutro, informale, BrE, ecc.).",
  },
  uk: {
    'dict.wordLabel': 'Слово або фраза (EN або UA)',
    'dict.placeholderWord': 'наприклад: matter або словник',
    'dict.addHint':
      'Можна ввести українською — у словник запишемо природний англійський еквівалент. Підберемо приклади й переклади українською з помітками стилю та BrE/AmE. «Інший приклад» перемикає картки.',
    'dict.addHintGroup':
      'Слово додасться до цієї групи. Можна ввести українською — у словник запишемо природний англійський еквівалент, приклади й переклади українською з помітками стилю (нейтр., розг., BrE тощо).',
  },
  ar: {
    'dict.wordLabel': 'كلمة أو عبارة (EN أو AR)',
    'dict.placeholderWord': 'مثال: matter أو قاموس',
    'dict.addHint':
      'يمكنك الكتابة بالعربية أو الإنجليزية — نحفظ المكافئ الطبيعي بالإنجليزية. نجلب أمثلة وترجمات بالعربية مع ملاحظات الأسلوب وBrE/AmE. «مثال آخر» يبدّل البطاقات.',
    'dict.addHintGroup':
      'ستُضاف الكلمة إلى هذه المجموعة. يمكنك الكتابة بالعربية — نحفظ المكافئ بالإنجليزية والأمثلة والترجمات بالعربية مع ملاحظات الأسلوب (محايد، عامي، BrE، إلخ).',
  },
  fa: {
    'dict.wordLabel': 'واژه یا عبارت (EN یا FA)',
    'dict.placeholderWord': 'مثلاً matter یا فرهنگ',
    'dict.addHint':
      'می‌توانید فارسی یا انگلیسی بنویسید — معادل طبیعی انگلیسی ذخیره می‌شود. مثال‌ها و ترجمه‌ها به فارسی با یادداشت سبک و BrE/AmE می‌آید. «مثال دیگر» کارت‌ها را عوض می‌کند.',
    'dict.addHintGroup':
      'واژه به این گروه افزوده می‌شود. می‌توانید فارسی بنویسید — معادل انگلیسی، مثال‌ها و ترجمه‌های فارسی با یادداشت سبک (خنثی، عامیانه، BrE و غیره) ذخیره می‌شود.',
  },
  ko: {
    'dict.wordLabel': '단어 또는 구문 (EN 또는 KO)',
    'dict.placeholderWord': '예: matter 또는 사전',
    'dict.addHint':
      '한국어나 영어로 입력할 수 있습니다 — 자연스러운 영어 표현을 저장합니다. 한국어 예문과 번역에 스타일·BrE/AmE 표기를 붙입니다. «다른 예문»으로 카드를 바꿉니다.',
    'dict.addHintGroup':
      '이 그룹에 단어가 추가됩니다. 한국어로 입력해도 됩니다 — 영어 표현·한국어 예문·번역과 스타일 표기(중립, 구어, BrE 등)를 저장합니다.',
  },
  ja: {
    'dict.wordLabel': '単語またはフレーズ (EN または JA)',
    'dict.placeholderWord': '例: matter または 辞書',
    'dict.addHint':
      '日本語または英語で入力できます — 自然な英語表現を保存します。日本語の例文と訳にスタイル表記と BrE/AmE を付けます。「別の例文」でカードを切り替えます。',
    'dict.addHintGroup':
      'このグループに単語が追加されます。日本語入力時は英語表現・日本語の例文・訳とスタイル表記（中立、口語、BrE など）を保存します。',
  },
};

for (const [locale, patches] of Object.entries(PATCHES)) {
  const file = path.join(dir, `${locale}.js`);
  let src = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(patches)) {
    const re = new RegExp(`('${key}':\\s*")([^"]*)(")`, 'm');
    const re2 = new RegExp(`('${key}':\\s*)'([^']*)(')`, 'm');
    if (re.test(src)) {
      src = src.replace(re, `$1${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}$3`);
    } else if (re2.test(src)) {
      src = src.replace(re2, `$1'${value.replace(/'/g, "\\'")}'`);
    } else {
      console.warn(`skip ${locale} ${key}`);
    }
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log(`patched ${locale}.js`);
}
