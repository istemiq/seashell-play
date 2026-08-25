/**
 * Per-study-language keys for pattern practice (all UI locales).
 * Run: node scripts/add-pattern-study-i18n.mjs
 */
import fs from 'fs';
import path from 'path';

const dir = 'src/i18n/messages';

/** @type {{ code: string, suffix: string, enName: string, example: string, ruHint?: string, ruExample?: string }[]} */
const STUDY = [
  { code: 'ru', suffix: 'Ru', enName: 'Russian', example: 'Я всю ночь этим занимаюсь', ruHint: 'Вставьте русское предложение. ИИ кратко объяснит его структуру на вашем языке, покажет параллельные примеры с той же грамматикой и попросит написать своё.', ruExample: 'например: Я всю ночь этим занимаюсь' },
  { code: 'ar', suffix: 'Ar', enName: 'Arabic', example: 'أنا أفعل ذلك طوال الليل' },
  { code: 'es', suffix: 'Es', enName: 'Spanish', example: 'Llevo toda la noche haciéndolo' },
  { code: 'pt', suffix: 'Pt', enName: 'Portuguese', example: 'Estou fazendo isso a noite toda' },
  { code: 'it', suffix: 'It', enName: 'Italian', example: 'Lo faccio tutta la notte' },
  { code: 'el', suffix: 'El', enName: 'Greek', example: 'Το κάνω όλη τη νύχτα' },
  { code: 'fa', suffix: 'Fa', enName: 'Farsi', example: 'تمام شب دارم این کار را می‌کنم' },
  { code: 'da', suffix: 'Da', enName: 'Danish', example: 'Jeg har gjort det hele natten' },
  { code: 'nl', suffix: 'Nl', enName: 'Dutch', example: 'Ik doe het de hele nacht' },
  { code: 'fr', suffix: 'Fr', enName: 'French', example: 'Je fais ça toute la nuit' },
  { code: 'de', suffix: 'De', enName: 'German', example: 'Ich mache das schon die ganze Nacht' },
  { code: 'tr', suffix: 'Tr', enName: 'Turkish', example: 'Bütün gece bunu yapıyorum' },
  { code: 'sv', suffix: 'Sv', enName: 'Swedish', example: 'Jag har hållit på hela natten' },
  { code: 'no', suffix: 'No', enName: 'Norwegian', example: 'Jeg har holdt på hele natten' },
  { code: 'fi', suffix: 'Fi', enName: 'Finnish', example: 'Olen tehnyt sitä koko yön' },
  { code: 'ko', suffix: 'Ko', enName: 'Korean', example: '밤새 그걸 하고 있어요' },
  { code: 'ja', suffix: 'Ja', enName: 'Japanese', example: '一晩中それをやっています' },
  { code: 'zh', suffix: 'Zh', enName: 'Chinese', example: '我整晚都在做这件事' },
  { code: 'uk', suffix: 'Uk', enName: 'Ukrainian', example: 'Я всю ніч цим займаюся' },
  { code: 'pl', suffix: 'Pl', enName: 'Polish', example: 'Robię to całą noc' },
  { code: 'hi', suffix: 'Hi', enName: 'Hindi', example: 'मैं पuri raat se yeh kar raha hoon' },
  { code: 'ur', suffix: 'Ur', enName: 'Urdu', example: 'میں ساری رات سے یہ کر رہا ہوں' },
  { code: 'az', suffix: 'Az', enName: 'Azerbaijani', example: 'Bütün gecə bunu edirəm' },
  { code: 'ug', suffix: 'Ug', enName: 'Uyghur', example: 'مەن پۈتün كەچ بۇنى قىلىۋاتىمەن' },
  { code: 'vi', suffix: 'Vi', enName: 'Vietnamese', example: 'Tôi đã làm việc đó cả đêm' },
  { code: 'cs', suffix: 'Cs', enName: 'Czech', example: 'Dělám to celou noc' },
  { code: 'hu', suffix: 'Hu', enName: 'Hungarian', example: 'Egész éjjel ezt csinálom' },
  { code: 'ro', suffix: 'Ro', enName: 'Romanian', example: 'Fac asta toată noaptea' },
  { code: 'id', suffix: 'Id', enName: 'Indonesian', example: 'Saya sudah melakukannya sepanjang malam' },
  { code: 'he', suffix: 'He', enName: 'Hebrew', example: 'אני עושה את זה כל הלילה' },
  { code: 'ca', suffix: 'Ca', enName: 'Catalan', example: 'Ho faig tota la nit' },
  { code: 'sr', suffix: 'Sr', enName: 'Serbian', example: 'Radim to celu noć' },
];

function enHint(langName) {
  const article = /^[aeiouAEIOU]/.test(langName) ? 'an' : 'a';
  return `Paste ${article} ${langName} sentence. The AI explains its structure in your language, shows parallel examples with the same grammar, and asks you to write your own.`;
}

function enPlaceholder(example) {
  return `e.g. ${example}`;
}

function buildBlock(uiLocale) {
  const lines = [];
  for (const s of STUDY) {
    const hint =
      uiLocale === 'ru' && s.ruHint
        ? s.ruHint
        : enHint(s.enName);
    const placeholder =
      uiLocale === 'ru' && s.ruExample
        ? s.ruExample
        : enPlaceholder(s.example);
    lines.push(`  'practice.patternHint${s.suffix}': ${JSON.stringify(hint)},`);
    lines.push(`  'practice.patternSeedPlaceholder${s.suffix}': ${JSON.stringify(placeholder)},`);
  }
  return lines.join('\n');
}

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.js') || file === 'index.js') continue;
  const uiLocale = file.replace('.js', '');
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, 'utf8');

  if (src.includes('practice.patternHintRu')) {
    console.log('skip', file);
    continue;
  }

  const block = buildBlock(uiLocale);
  src = src.replace(
    /('practice\.patternAnchor':[^\n]+\n)/,
    `$1${block}\n`,
  );

  // Update base en hint/placeholder wording (English study module)
  if (uiLocale === 'ru') {
    src = src.replace(
      /'practice\.patternHint':[^\n]+/,
      `'practice.patternHint': ${JSON.stringify('Вставьте английское предложение. ИИ кратко объяснит его структуру на вашем языке, покажет параллельные примеры с той же грамматикой и попросит написать своё.')}`,
    );
    src = src.replace(
      /'practice\.patternSeedPlaceholder':[^\n]+/,
      `'practice.patternSeedPlaceholder': ${JSON.stringify("например: I've been doing it all night")}`,
    );
  } else {
    src = src.replace(
      /'practice\.patternHint':[^\n]+/,
      `'practice.patternHint': ${JSON.stringify(enHint('English'))}`,
    );
    src = src.replace(
      /'practice\.patternSeedPlaceholder':[^\n]+/,
      `'practice.patternSeedPlaceholder': ${JSON.stringify(enPlaceholder("I've been doing it all night"))}`,
    );
  }

  fs.writeFileSync(p, src);
  console.log('updated', file);
}
