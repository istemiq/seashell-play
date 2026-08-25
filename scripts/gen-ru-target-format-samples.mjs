/**
 * Generates word-dictionary-format-sample.json for every UI locale under
 * server/prompts/targets/ru/locales/{code}/ — Russian study language, L1 gloss/translations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../server/prompts/targets/ru/locales');

const RU_TEXTS = [
  'Мне нужен стакан воды.',
  'Вода достаточно горячая для чая?',
  'Мы шли вдоль воды.',
  'Воду отключили на всё утро.',
  'Можно немного воды, пожалуйста?',
  'Есть водичка? Умираю от жажды.',
  'Муниципалитет обязан обеспечить бесперебойное снабжение питьевой водой.',
  'Они проверили воду на безопасность.',
  'Экономь воду, когда чистишь зубы.',
  'Пресная вода важна для здоровья.',
];

/** @type {Record<string, { gloss: string, tr: string[] }>} */
const LOCALES = {
  en: {
    gloss: 'вода [vɐˈda] — water as a substance; drinking water; neutral',
    tr: [
      'I need a glass of water. — neutral',
      'Is the water hot enough for tea? — neutral',
      'We walked along the water. — neutral',
      'The water was cut off all morning. — neutral',
      'Can I get some water, please? — neutral',
      "Got any water? I'm parched. — informal",
      'The municipality shall ensure uninterrupted supply of potable water. — formal',
      'They tested the water for safety. — neutral',
      'Save water when you brush your teeth. — informal',
      'Fresh water is important for health. — neutral',
    ],
  },
  ru: {
    gloss: 'вода [vɐˈda] — вода как вещество; питьевая вода; нейтр.',
    tr: [
      'Мне нужен стакан воды. — нейтр.',
      'Вода достаточно горячая для чая? — нейтр.',
      'Мы шли вдоль воды. — нейтр.',
      'Воду отключили на всё утро. — нейтр.',
      'Можно немного воды, пожалуйста? — нейтр.',
      'Есть водичка? Умираю от жажды. — разг.',
      'Муниципалитет обязан обеспечить бесперебойное снабжение питьевой водой. — форм.',
      'Они проверили воду на безопасность. — нейтр.',
      'Экономь воду, когда чистишь зубы. — разг.',
      'Пресная вода важна для здоровья. — нейтр.',
    ],
  },
  pt: {
    gloss: 'вода [vɐˈda] — água como substância; água potável; neutro',
    tr: [
      'Preciso de um copo de água. — neutro',
      'A água está quente o suficiente para chá? — neutro',
      'Caminhámos ao longo da água. — neutro',
      'Cortaram a água durante toda a manhã. — neutro',
      'Posso beber um pouco de água, por favor? — neutro',
      'Tem água? Estou a morrer de sede. — informal',
      'O município deve garantir o fornecimento ininterrupto de água potável. — formal',
      'Eles testaram a água quanto à segurança. — neutro',
      'Poupa água quando escovas os dentes. — informal',
      'A água doce é importante para a saúde. — neutro',
    ],
  },
  es: {
    gloss: 'вода [vɐˈda] — agua como sustancia; agua potable; neutro',
    tr: [
      'Necesito un vaso de agua. — neutro',
      '¿El agua está lo bastante caliente para el té? — neutro',
      'Caminamos junto al agua. — neutro',
      'Cortaron el agua toda la mañana. — neutro',
      '¿Me das un poco de agua, por favor? — neutro',
      '¿Hay agüita? Me muero de sed. — informal',
      'El municipio debe garantizar el suministro ininterrumpido de agua potable. — formal',
      'Comprobaron la seguridad del agua. — neutro',
      'Ahorra agua cuando te laves los dientes. — informal',
      'El agua dulce es importante para la salud. — neutro',
    ],
  },
  it: {
    gloss: 'вода [vɐˈda] — acqua come sostanza; acqua potabile; neutro',
    tr: [
      "Ho bisogno di un bicchiere d'acqua. — neutro",
      "L'acqua è abbastanza calda per il tè? — neutro",
      "Abbiamo camminato lungo l'acqua. — neutro",
      "Hanno interrotto l'acqua per tutta la mattina. — neutro",
      'Posso avere un po\' d\'acqua, per favore? — neutro',
      "C'è un po' d'acqua? Sto morendo di sete. — informale",
      'Il comune deve garantire la fornitura ininterrotta di acqua potabile. — formale',
      "Hanno testato l'acqua per la sicurezza. — neutro",
      'Risparmia acqua quando ti lavi i denti. — informale',
      "L'acqua dolce è importante per la salute. — neutro",
    ],
  },
  tr: {
    gloss: 'вода [vɐˈda] — madde olarak su; içme suyu; nötr',
    tr: [
      'Bir bardak suya ihtiyacım var. — nötr',
      'Su çay için yeterince sıcak mı? — nötr',
      'Suyun kenarında yürüdük. — nötr',
      'Sabah boyunca su kesildi. — nötr',
      'Biraz su alabilir miyim, lütfen? — nötr',
      'Su var mı? Susuzluktan ölüyorum. — informal',
      'Belediye kesintisiz içme suyu teminini sağlamalıdır. — resmi',
      'Suyu güvenlik açısından test ettiler. — nötr',
      'Dişlerini fırçalarken su tasarrufu yap. — informal',
      'Tatlı su sağlık için önemlidir. — nötr',
    ],
  },
  uk: {
    gloss: 'вода [vɐˈda] — вода як речовина; питна вода; нейтр.',
    tr: [
      'Мені потрібен склянку води. — нейтр.',
      'Вода достатньо гаряча для чаю? — нейтр.',
      'Ми йшли вздовж води. — нейтр.',
      'Воду вимкнули на все ранок. — нейтр.',
      'Можна трохи води, будь ласка? — нейтр.',
      'Є водичка? Помираю від спраги. — розм.',
      'Муніципалітет зобов’язаний забезпечити безперебійне постачання питної води. — офіц.',
      'Вони перевірили воду на безпеку. — нейтр.',
      'Економ воду, коли чистиш зуби. — розм.',
      'Прісна вода важлива для здоров’я. — нейтр.',
    ],
  },
  ar: {
    gloss: 'вода [vɐˈda] — الماء كمادة؛ ماء للشرب؛ محايد',
    tr: [
      'أحتاج إلى كوب من الماء. — محايد',
      'هل الماء ساخن بما يكفي للشاي؟ — محايد',
      'سرنا على طول الماء. — محايد',
      'قطعوا الماء طوال الصباح. — محايد',
      'هل يمكنني بعض الماء، من فضلك؟ — محايد',
      'هل يوجد ماء؟ أموت من العطش. — غير رسمي',
      'يجب على البلدية ضمان إمدادات مستمرة من مياه الشرب. — رسمي',
      'اختبروا الماء من أجل السلامة. — محايد',
      'وفّر الماء عندما تنظف أسنانك. — غير رسمي',
      'الماء العذب مهم للصحة. — محايد',
    ],
  },
  fa: {
    gloss: 'вода [vɐˈda] — آب به‌عنوان ماده؛ آب آشامیدنی؛ خنثی',
    tr: [
      'به یک لیوان آب نیاز دارم. — خنثی',
      'آیا آب برای چای به اندازه کافی گرم است؟ — خنثی',
      'کنار آب راه رفتیم. — خنثی',
      'آب تمام صبح قطع بود. — خنثی',
      'می‌توانم کمی آب بگیرم، لطفاً؟ — خنثی',
      'آبی هست؟ از تشنگی دارم می‌میرم. — غیررسمی',
      'شهرداری باید تأمین بی‌وقفه آب آشامیدنی را تضمین کند. — رسمی',
      'آب را از نظر ایمنی آزمایش کردند. — خنثی',
      'وقتی دندان‌هایت را می‌شیوی آب صرفه‌جویی کن. — غیررسمی',
      'آب شیرین برای سلامتی مهم است. — خنثی',
    ],
  },
  ko: {
    gloss: 'вода [vɐˈda] — 물질로서의 물; 식수; 중립',
    tr: [
      '물 한 잔이 필요해요. — 중립',
      '물이 차 마시기에 충분히 뜨거운가요? — 중립',
      '우리는 물가를 따라 걸었어요. — 중립',
      '아침 내내 수돗물이 끊겼어요. — 중립',
      '물 좀 주실 수 있나요? — 중립',
      '물 있어요? 목 말라 죽겠어요. — 비격식',
      '지자체는 끊김 없는 식수 공급을 보장해야 합니다. — 격식',
      '그들은 물의 안전성을 검사했어요. — 중립',
      '양치할 때 물을 아껴 쓰세요. — 비격식',
      '민물은 건강에 중요해요. — 중립',
    ],
  },
  ja: {
    gloss: 'вода [vɐˈda] — 物質としての水；飲料水；中立',
    tr: [
      'コップ一杯の水が必要です。 — 中立',
      'お茶にするにはお湯は十分熱いですか。 — 中立',
      '水辺に沿って歩きました。 — 中立',
      '午前中ずっと断水でした。 — 中立',
      '水を少しいただけますか。 — 中立',
      '水ある？喉がカラカラだ。 — カジュアル',
      '市は途切れない飲料水の供給を確保しなければならない。 — フォーマル',
      '彼らは水の安全性を検査した。 — 中立',
      '歯を磨くときは水を節約しなさい。 — カジュアル',
      '淡水は健康にとって重要だ。 — 中立',
    ],
  },
};

for (const [code, { gloss, tr }] of Object.entries(LOCALES)) {
  if (tr.length !== RU_TEXTS.length) {
    throw new Error(`${code}: expected ${RU_TEXTS.length} translations, got ${tr.length}`);
  }
  const payload = {
    headwordEn: 'вода',
    glossRu: gloss,
    examples: RU_TEXTS.map((text, i) => ({ text, translation: tr[i] })),
  };
  const dir = path.join(OUT, code);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'word-dictionary-format-sample.json');
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('wrote', file);
}
