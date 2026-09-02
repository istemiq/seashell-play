/** Inject practice dictionary-add UX i18n keys into all UI locale message files. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../src/i18n/messages');

const BLOCKS = {
  en: `
  'practice.tapWordHint': 'Tap any word in the dialogue, then tap the button below to save it to your dictionary.',
  'practice.addWordAction': 'Add "{word}" to dictionary',
  'practice.addingWord': 'Adding "{word}"…',
  'practice.wordAdded': '"{word}" added to dictionary',
`,
  ru: `
  'practice.tapWordHint': 'Нажмите на слово в диалоге, затем на кнопку ниже — оно сохранится в словарь.',
  'practice.addWordAction': 'Добавить «{word}» в словарь',
  'practice.addingWord': 'Добавляем «{word}»…',
  'practice.wordAdded': '«{word}» добавлено в словарь',
`,
  ar: `
  'practice.tapWordHint': 'اضغط على أي كلمة في الحوار، ثم على الزر بالأسفل لحفظها في القاموس.',
  'practice.addWordAction': 'إضافة «{word}» إلى القاموس',
  'practice.addingWord': 'جارٍ إضافة «{word}»…',
  'practice.wordAdded': 'تمت إضافة «{word}» إلى القاموس',
`,
  es: `
  'practice.tapWordHint': 'Toca una palabra del diálogo y luego el botón de abajo para guardarla en el diccionario.',
  'practice.addWordAction': 'Añadir «{word}» al diccionario',
  'practice.addingWord': 'Añadiendo «{word}»…',
  'practice.wordAdded': '«{word}» añadida al diccionario',
`,
  pt: `
  'practice.tapWordHint': 'Toque numa palavra do diálogo e depois no botão abaixo para salvá-la no dicionário.',
  'practice.addWordAction': 'Adicionar «{word}» ao dicionário',
  'practice.addingWord': 'Adicionando «{word}»…',
  'practice.wordAdded': '«{word}» adicionada ao dicionário',
`,
  fa: `
  'practice.tapWordHint': 'روی هر واژه در گفت‌وگو بزنید، سپس دکمهٔ پایین را برای ذخیره در واژه‌نامه بزنید.',
  'practice.addWordAction': 'افزودن «{word}» به واژه‌نامه',
  'practice.addingWord': 'در حال افزودن «{word}»…',
  'practice.wordAdded': '«{word}» به واژه‌نامه اضافه شد',
`,
  uk: `
  'practice.tapWordHint': 'Натисніть слово в діалозі, потім кнопку нижче — воно збережеться у словник.',
  'practice.addWordAction': 'Додати «{word}» до словника',
  'practice.addingWord': 'Додаємо «{word}»…',
  'practice.wordAdded': '«{word}» додано до словника',
`,
  ko: `
  'practice.tapWordHint': '대화에서 단어를 탭한 뒤 아래 버튼을 눌러 사전에 저장하세요.',
  'practice.addWordAction': '«{word}» 사전에 추가',
  'practice.addingWord': '«{word}» 추가 중…',
  'practice.wordAdded': '«{word}» 사전에 추가됨',
`,
  ja: `
  'practice.tapWordHint': '会話の単語をタップし、下のボタンで辞書に保存します。',
  'practice.addWordAction': '「{word}」を辞書に追加',
  'practice.addingWord': '「{word}」を追加中…',
  'practice.wordAdded': '「{word}」を辞書に追加しました',
`,
  it: `
  'practice.tapWordHint': 'Tocca una parola nel dialogo, poi il pulsante sotto per salvarla nel dizionario.',
  'practice.addWordAction': 'Aggiungi «{word}» al dizionario',
  'practice.addingWord': 'Aggiunta di «{word}»…',
  'practice.wordAdded': '«{word}» aggiunta al dizionario',
`,
  tr: `
  'practice.tapWordHint': 'Diyalogdaki bir kelimeye dokunun, ardından sözlüğe kaydetmek için alttaki düğmeye basın.',
  'practice.addWordAction': '«{word}» sözlüğe ekle',
  'practice.addingWord': '«{word}» ekleniyor…',
  'practice.wordAdded': '«{word}» sözlüğe eklendi',
`,
};

const EMPTY_HINT = {
  en: "Tap a word in the dialogue, then tap the button below to save it to your dictionary.",
  ru: 'Нажмите на слово в диалоге, затем на кнопку ниже — оно сохранится в словарь.',
  ar: 'اضغط على كلمة في الحوار، ثم على الزر بالأسفل لحفظها.',
  es: 'Toca una palabra del diálogo y luego el botón de abajo para guardarla.',
  pt: 'Toque numa palavra do diálogo e depois no botão abaixo para salvá-la.',
  fa: 'روی واژه در گفت‌وگو بزنید، سپس دکمهٔ پایین را بزنید.',
  uk: 'Натисніть слово в діалозі, потім кнопку нижче.',
  ko: '대화에서 단어를 탭한 뒤 아래 버튼을 누르세요.',
  ja: '会話の単語をタップし、下のボタンで保存します。',
  it: 'Tocca una parola nel dialogo, poi il pulsante sotto.',
  tr: 'Diyalogdaki kelimeye dokunun, ardından alttaki düğmeye basın.',
};

for (const [code, block] of Object.entries(BLOCKS)) {
  const file = path.join(messagesDir, `${code}.js`);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes("'practice.tapWordHint'")) {
    const anchor = "'practice.toDictionary':";
    const idx = src.indexOf(anchor);
    if (idx !== -1) {
      const lineEnd = src.indexOf('\n', idx);
      src = `${src.slice(0, lineEnd + 1)}${block}${src.slice(lineEnd + 1)}`;
    }
  }
  if (EMPTY_HINT[code]) {
    src = src.replace(
      /'practice\.emptyHint': '[^']*',/,
      `'practice.emptyHint': '${EMPTY_HINT[code].replace(/'/g, "\\'")}',`,
    );
  }
  fs.writeFileSync(file, src);
  console.log('patched', code);
}
