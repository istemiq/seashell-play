/**
 * Generates word-dictionary-format-sample*.json for every content locale.
 * Run: node scripts/build-prompt-locale-samples.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'server', 'prompts', 'locales');

const EN_TEXTS = [
  'I need a glass of water.',
  'Is the water hot enough for tea?',
  'We walked along the water.',
  'The water was cut off all morning.',
  'Can I get some water, please?',
  "Got any water? I'm gasping here.",
  'The municipality shall ensure uninterrupted supply of potable water.',
  'They tested the water for safety.',
  'Save water when you brush your teeth.',
  'Fresh water is important for health.',
];

const GO_TEXTS = [
  "Let's go before it rains.",
  'Where did you go last weekend?',
  'The milk has gone bad.',
  'Time goes quickly.',
  'We need to go now.',
  'She went quiet when he arrived.',
  "He's gone to pick up the kids.",
  "How's it going?",
  "Don't go there alone at night.",
  'Everything went well, thanks.',
];

const LOCALES = {
  ru: {
    waterGloss: 'water [ˈwɔːtə] — вода как вещество; питьевая вода; нейтр.; BrE/AmE',
    waterTr: [
      'Мне нужен стакан воды. — нейтр.; BrE/AmE',
      'Вода достаточно горячая для чая? — нейтр.; BrE/AmE',
      'Мы шли вдоль воды. — нейтр.; BrE/AmE',
      'Воду отключили на всё утро. — нейтр.; BrE/AmE',
      'Можно немного воды, пожалуйста? — нейтр.; BrE/AmE',
      'Не найдётся водички? Умираю от жажды. — разг.; BrE/AmE',
      'Муниципалитет обязан обеспечить бесперебойное снабжение населения питьевой водой. — форм.; BrE/AmE',
      'Они проверили воду на безопасность. — нейтр.; BrE/AmE',
      'Экономь воду, когда чистишь зубы. — разг.; BrE/AmE',
      'Пресная вода важна для здоровья. — нейтр.; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — идти, ехать; отправляться; нейтр.; BrE/AmE',
    verbLabels: ['наст. (go)', 'прош. (went)', 'прич. (gone)'],
    verbTr: [
      'Я езжу на работу на автобусе. — нейтр.; BrE/AmE',
      'Вчера она рано ушла домой. — нейтр.; BrE/AmE',
      'Он уехал за границу на месяц. — нейтр.; BrE/AmE',
    ],
    goTr: [
      'Пойдём, пока не пошёл дождь. — разг.; BrE/AmE',
      'Куда ты ходил в прошлые выходные? — нейтр.; BrE/AmE',
      'Молоко испортилось. — разг.; BrE/AmE',
      'Время летит быстро. — нейтр.; BrE/AmE',
      'Нам нужно идти сейчас. — нейтр.; BrE/AmE',
      'Она замолчала, когда он пришёл. — нейтр.; BrE/AmE',
      'Он поехал за детьми. — нейтр.; BrE/AmE',
      'Как дела? — разг.; BrE/AmE',
      'Не ходи туда один ночью. — нейтр.; BrE/AmE',
      'Всё прошло хорошо, спасибо. — нейтр.; BrE/AmE',
    ],
  },
  en: {
    waterGloss: 'water [ˈwɔːtə] — water as a substance; drinking water; neutral; BrE/AmE',
    waterTr: EN_TEXTS.map((t, i) => {
      const notes = ['neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'informal', 'formal', 'neutral', 'informal', 'neutral'];
      const styles = ['нейтр.', 'нейтр.', 'нейтр.', 'нейтр.', 'нейтр.', 'разг.', 'форм.', 'нейтр.', 'разг.', 'нейтр.'];
      const map = [
        'I need a glass of water.',
        'Is the water hot enough for tea?',
        'We walked along the water.',
        'The water was cut off all morning.',
        'Can I get some water, please?',
        "Got any water? I'm parched.",
        'The municipality shall ensure uninterrupted supply of potable water.',
        'They tested the water for safety.',
        'Save water when you brush your teeth.',
        'Fresh water is important for health.',
      ];
      return `${map[i]} — ${styles[i]}; BrE/AmE`;
    }),
    goGloss: 'go [ɡəʊ] — to move, travel; to leave; neutral; BrE/AmE',
    verbLabels: ['pres. (go)', 'past (went)', 'pp. (gone)'],
    verbTr: [
      'I go to work by bus. — neutral; BrE/AmE',
      'She went home early yesterday. — neutral; BrE/AmE',
      'He has gone abroad for a month. — neutral; BrE/AmE',
    ],
    goTr: [
      "Let's go before it rains. — informal; BrE/AmE",
      'Where did you go last weekend? — neutral; BrE/AmE',
      'The milk has gone bad. — informal; BrE/AmE',
      'Time goes quickly. — neutral; BrE/AmE',
      'We need to go now. — neutral; BrE/AmE',
      'She went quiet when he arrived. — neutral; BrE/AmE',
      "He's gone to pick up the kids. — neutral; BrE/AmE",
      "How's it going? — informal; BrE/AmE",
      "Don't go there alone at night. — neutral; BrE/AmE",
      'Everything went well, thanks. — neutral; BrE/AmE',
    ],
  },
  es: {
    waterGloss: 'water [ˈwɔːtə] — agua como sustancia; agua potable; neutro; BrE/AmE',
    waterTr: [
      'Necesito un vaso de agua. — neutro; BrE/AmE',
      '¿El agua está lo bastante caliente para el té? — neutro; BrE/AmE',
      'Caminamos junto al agua. — neutro; BrE/AmE',
      'Cortaron el agua toda la mañana. — neutro; BrE/AmE',
      '¿Me das un poco de agua, por favor? — neutro; BrE/AmE',
      '¿Tienes agua? Me muero de sed. — coloq.; BrE/AmE',
      'El municipio garantizará el suministro ininterrumpido de agua potable. — formal; BrE/AmE',
      'Probaron el agua por seguridad. — neutro; BrE/AmE',
      'Ahorra agua al cepillarte los dientes. — coloq.; BrE/AmE',
      'El agua dulce es importante para la salud. — neutro; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — ir, desplazarse; marcharse; neutro; BrE/AmE',
    verbLabels: ['pres. (go)', 'pret. (went)', 'part. (gone)'],
    verbTr: [
      'Voy al trabajo en autobús. — neutro; BrE/AmE',
      'Ayer se fue a casa temprano. — neutro; BrE/AmE',
      'Se ha ido al extranjero un mes. — neutro; BrE/AmE',
    ],
    goTr: [
      'Vámonos antes de que llueva. — coloq.; BrE/AmE',
      '¿Adónde fuiste el fin de semana pasado? — neutro; BrE/AmE',
      'La leche se ha echado a perder. — coloq.; BrE/AmE',
      'El tiempo pasa rápido. — neutro; BrE/AmE',
      'Tenemos que irnos ya. — neutro; BrE/AmE',
      'Se quedó callada cuando él llegó. — neutro; BrE/AmE',
      'Ha ido a recoger a los niños. — neutro; BrE/AmE',
      '¿Qué tal? — coloq.; BrE/AmE',
      'No vayas allí solo de noche. — neutro; BrE/AmE',
      'Todo salió bien, gracias. — neutro; BrE/AmE',
    ],
  },
  pt: {
    waterGloss: 'water [ˈwɔːtə] — água como substância; água potável; neutro; BrE/AmE',
    waterTr: [
      'Preciso de um copo de água. — neutro; BrE/AmE',
      'A água está quente o suficiente para o chá? — neutro; BrE/AmE',
      'Caminhamos à beira da água. — neutro; BrE/AmE',
      'Cortaram a água a manhã toda. — neutro; BrE/AmE',
      'Posso pegar um pouco de água, por favor? — neutro; BrE/AmE',
      'Tem água? Estou morrendo de sede. — informal; BrE/AmE',
      'O município garantirá o fornecimento ininterrupto de água potável. — formal; BrE/AmE',
      'Testaram a água por segurança. — neutro; BrE/AmE',
      'Economize água ao escovar os dentes. — informal; BrE/AmE',
      'Água doce é importante para a saúde. — neutro; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — ir, deslocar-se; partir; neutro; BrE/AmE',
    verbLabels: ['pres. (go)', 'pret. (went)', 'part. (gone)'],
    verbTr: [
      'Vou ao trabalho de ônibus. — neutro; BrE/AmE',
      'Ela foi para casa cedo ontem. — neutro; BrE/AmE',
      'Ele foi para o exterior por um mês. — neutro; BrE/AmE',
    ],
    goTr: [
      'Vamos antes que chova. — informal; BrE/AmE',
      'Onde você foi no fim de semana passado? — neutro; BrE/AmE',
      'O leite estragou. — informal; BrE/AmE',
      'O tempo passa rápido. — neutro; BrE/AmE',
      'Precisamos ir agora. — neutro; BrE/AmE',
      'Ela ficou quieta quando ele chegou. — neutro; BrE/AmE',
      'Ele foi buscar as crianças. — neutro; BrE/AmE',
      'Como vai? — informal; BrE/AmE',
      'Não vá lá sozinho à noite. — neutro; BrE/AmE',
      'Tudo correu bem, obrigado. — neutro; BrE/AmE',
    ],
  },
  it: {
    waterGloss: "water [ˈwɔːtə] — acqua come sostanza; acqua potabile; neutro; BrE/AmE",
    waterTr: [
      'Mi serve un bicchiere d\'acqua. — neutro; BrE/AmE',
      'L\'acqua è abbastanza calda per il tè? — neutro; BrE/AmE',
      'Abbiamo camminato lungo l\'acqua. — neutro; BrE/AmE',
      'Hanno chiuso l\'acqua per tutta la mattina. — neutro; BrE/AmE',
      'Posso avere un po\' d\'acqua, per favore? — neutro; BrE/AmE',
      'Hai dell\'acqua? Sto morendo di sete. — colloq.; BrE/AmE',
      'Il comune garantirà la fornitura ininterrotta di acqua potabile. — formale; BrE/AmE',
      'Hanno testato l\'acqua per sicurezza. — neutro; BrE/AmE',
      'Risparmia acqua quando ti lavi i denti. — colloq.; BrE/AmE',
      'L\'acqua dolce è importante per la salute. — neutro; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — andare, spostarsi; partire; neutro; BrE/AmE',
    verbLabels: ['pres. (go)', 'pass. (went)', 'part. (gone)'],
    verbTr: [
      'Vado al lavoro in autobus. — neutro; BrE/AmE',
      'Ieri è tornata a casa presto. — neutro; BrE/AmE',
      'È andato all\'estero per un mese. — neutro; BrE/AmE',
    ],
    goTr: [
      'Andiamo prima che piova. — colloq.; BrE/AmE',
      'Dove sei andato lo scorso weekend? — neutro; BrE/AmE',
      'Il latte è andato a male. — colloq.; BrE/AmE',
      'Il tempo vola. — neutro; BrE/AmE',
      'Dobbiamo andare adesso. — neutro; BrE/AmE',
      'È diventata silenziosa quando è arrivato. — neutro; BrE/AmE',
      'È andato a prendere i bambini. — neutro; BrE/AmE',
      'Come va? — colloq.; BrE/AmE',
      'Non andare lì da solo di notte. — neutro; BrE/AmE',
      'È andato tutto bene, grazie. — neutro; BrE/AmE',
    ],
  },
  uk: {
    waterGloss: 'water [ˈwɔːtə] — вода як речовина; питна вода; нейтр.; BrE/AmE',
    waterTr: [
      'Мені потрібен склянка води. — нейтр.; BrE/AmE',
      'Вода достатньо гаряча для чаю? — нейтр.; BrE/AmE',
      'Ми йшли вздовж води. — нейтр.; BrE/AmE',
      'Воду вимкнули на все ранок. — нейтр.; BrE/AmE',
      'Можна трохи води, будь ласка? — нейтр.; BrE/AmE',
      'Немає водички? Помираю від спраги. — розм.; BrE/AmE',
      'Муніципалітет зобов\'язаний забезпечити безперебійне постачання питної води. — офіц.; BrE/AmE',
      'Вони перевірили воду на безпеку. — нейтр.; BrE/AmE',
      'Економ воду, коли чистиш зуби. — розм.; BrE/AmE',
      'Прісна вода важлива для здоров\'я. — нейтр.; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — йти, їхати; вирушати; нейтр.; BrE/AmE',
    verbLabels: ['теп. (go)', 'мин. (went)', 'дієпр. (gone)'],
    verbTr: [
      'Я їжджу на роботу автобусом. — нейтр.; BrE/AmE',
      'Учора вона рано пішла додому. — нейтр.; BrE/AmE',
      'Він поїхав за кордон на місяць. — нейтр.; BrE/AmE',
    ],
    goTr: [
      'Підемо, поки не пішов дощ. — розм.; BrE/AmE',
      'Куди ти ходив минулого вихідного? — нейтр.; BrE/AmE',
      'Молоко зіпсувалося. — розм.; BrE/AmE',
      'Час летить швидко. — нейтр.; BrE/AmE',
      'Нам треба йти зараз. — нейтр.; BrE/AmE',
      'Вона замовкла, коли він прийшов. — нейтр.; BrE/AmE',
      'Він поїхав за дітьми. — нейтр.; BrE/AmE',
      'Як справи? — розм.; BrE/AmE',
      'Не ходи туди сам вночі. — нейтр.; BrE/AmE',
      'Усе пройшло добре, дякую. — нейтр.; BrE/AmE',
    ],
  },
  ar: {
    waterGloss: 'water [ˈwɔːtə] — الماء كمادة؛ ماء الشرب؛ محايد؛ BrE/AmE',
    waterTr: [
      'أحتاج كوبًا من الماء. — محايد؛ BrE/AmE',
      'هل الماء ساخن بما يكفي للشاي؟ — محايد؛ BrE/AmE',
      'مشينا على طول الماء. — محايد؛ BrE/AmE',
      'انقطع الماء طوال الصباح. — محايد؛ BrE/AmE',
      'هل يمكنني الحصول على بعض الماء من فضلك؟ — محايد؛ BrE/AmE',
      'هل عندك ماء؟ أنا عطشان جدًا. — عامي؛ BrE/AmE',
      'يجب على البلدية ضمان إمداد مستمر بمياه الشرب. — رسمي؛ BrE/AmE',
      'اختبروا الماء من أجل السلامة. — محايد؛ BrE/AmE',
      'وفّر الماء عند تنظيف أسنانك. — عامي؛ BrE/AmE',
      'الماء العذب مهم للصحة. — محايد؛ BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — يذهب، ينتقل؛ يغادر؛ محايد؛ BrE/AmE',
    verbLabels: ['مضارع (go)', 'ماضٍ (went)', 'تصريف ثالث (gone)'],
    verbTr: [
      'أذهب إلى العمل بالحافلة. — محايد؛ BrE/AmE',
      'ذهبت إلى المنزل مبكرًا أمس. — محايد؛ BrE/AmE',
      'ذهب إلى الخارج لمدة شهر. — محايد؛ BrE/AmE',
    ],
    goTr: [
      'لنذهب قبل أن تمطر. — عامي؛ BrE/AmE',
      'إلى أين ذهبت في عطلة نهاية الأسبوع الماضية؟ — محايد؛ BrE/AmE',
      'فسد الحليب. — عامي؛ BrE/AmE',
      'الوقت يمر بسرعة. — محايد؛ BrE/AmE',
      'علينا أن نذهب الآن. — محايد؛ BrE/AmE',
      'صمتت عندما وصل. — محايد؛ BrE/AmE',
      'ذهب ليأخذ الأطفال. — محايد؛ BrE/AmE',
      'كيف الحال؟ — عامي؛ BrE/AmE',
      'لا تذهب هناك وحيدًا في الليل. — محايد؛ BrE/AmE',
      'سار كل شيء على ما يرام، شكرًا. — محايد؛ BrE/AmE',
    ],
  },
  fa: {
    waterGloss: 'water [ˈwɔːtə] — آب به‌عنوان ماده؛ آب آشامیدنی؛ خنثی؛ BrE/AmE',
    waterTr: [
      'یک لیوان آب می‌خواهم. — خنثی؛ BrE/AmE',
      'آب برای چای به اندازه کافی داغ است؟ — خنثی؛ BrE/AmE',
      'در کنار آب راه رفتیم. — خنثی؛ BrE/AmE',
      'آب تمام صبح قطع بود. — خنثی؛ BrE/AmE',
      'می‌توانم کمی آب بگیرم، لطفاً؟ — خنثی؛ BrE/AmE',
      'آب داری؟ دارم از تشنگی می‌میرم. — محاوره‌ای؛ BrE/AmE',
      'شهرداری باید تأمین بی‌وقفه آب آشامیدنی را تضمین کند. — رسمی؛ BrE/AmE',
      'آب را از نظر ایمنی آزمایش کردند. — خنثی؛ BrE/AmE',
      'وقتی دندان می‌زنی آب را صرفه‌جویی کن. — محاوره‌ای؛ BrE/AmE',
      'آب شیرین برای سلامت مهم است. — خنثی؛ BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — رفتن، حرکت کردن؛ ترک کردن؛ خنثی؛ BrE/AmE',
    verbLabels: ['حال (go)', 'گذشته (went)', 'گذشته نقلی (gone)'],
    verbTr: [
      'با اتوبوس سر کار می‌روم. — خنثی؛ BrE/AmE',
      'دیروز زود به خانه رفت. — خنثی؛ BrE/AmE',
      'او یک ماه به خارج رفته است. — خنثی؛ BrE/AmE',
    ],
    goTr: [
      'برویم قبل از باران. — محاوره‌ای؛ BrE/AmE',
      'آخر هفته گذشته کجا رفتی؟ — خنثی؛ BrE/AmE',
      'شیر فاسد شده است. — محاوره‌ای؛ BrE/AmE',
      'زمان سریع می‌گذرد. — خنثی؛ BrE/AmE',
      'باید الان برویم. — خنثی؛ BrE/AmE',
      'وقتی او رسید ساکت شد. — خنثی؛ BrE/AmE',
      'رفته بچه‌ها را بردارد. — خنثی؛ BrE/AmE',
      'حالت چطور است؟ — محاوره‌ای؛ BrE/AmE',
      'شب تنها آنجا نرو. — خنثی؛ BrE/AmE',
      'همه چیز خوب پیش رفت، ممنون. — خنثی؛ BrE/AmE',
    ],
  },
  ko: {
    waterGloss: 'water [ˈwɔːtə] — 물질로서의 물; 식수; 중립; BrE/AmE',
    waterTr: [
      '물 한 잔이 필요해요. — 중립; BrE/AmE',
      '차 마시기에 물이 충분히 뜨거운가요? — 중립; BrE/AmE',
      '우리는 물가를 따라 걸었어요. — 중립; BrE/AmE',
      '아침 내내 물 공급이 끊겼어요. — 중립; BrE/AmE',
      '물 좀 주실 수 있나요? — 중립; BrE/AmE',
      '물 있어요? 목 말라 죽겠어요. — 구어; BrE/AmE',
      '지자체는 식수의 끊김 없는 공급을 보장해야 한다. — 격식; BrE/AmE',
      '그들은 안전을 위해 물을 검사했어요. — 중립; BrE/AmE',
      '양치할 때 물을 아껴 쓰세요. — 구어; BrE/AmE',
      '담수는 건강에 중요해요. — 중립; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — 가다, 이동하다; 떠나다; 중립; BrE/AmE',
    verbLabels: ['현재 (go)', '과거 (went)', '과거분사 (gone)'],
    verbTr: [
      '나는 버스로 출근해요. — 중립; BrE/AmE',
      '그녀는 어제 일찍 집에 갔어요. — 중립; BrE/AmE',
      '그는 한 달 동안 해외에 갔어요. — 중립; BrE/AmE',
    ],
    goTr: [
      '비 오기 전에 가자. — 구어; BrE/AmE',
      '지난 주말에 어디 갔어요? — 중립; BrE/AmE',
      '우유가 상했어요. — 구어; BrE/AmE',
      '시간이 빨리 가요. — 중립; BrE/AmE',
      '지금 가야 해요. — 중립; BrE/AmE',
      '그가 도착하자 그녀는 조용해졌어요. — 중립; BrE/AmE',
      '그는 아이들을 데리러 갔어요. — 중립; BrE/AmE',
      '잘 지내요? — 구어; BrE/AmE',
      '밤에 혼자 거기 가지 마세요. — 중립; BrE/AmE',
      '모든 게 잘 됐어요, 고마워요. — 중립; BrE/AmE',
    ],
  },
  ja: {
    waterGloss: 'water [ˈwɔːtə] — 物質としての水；飲料水；中立；BrE/AmE',
    waterTr: [
      '水を一杯ください。 — 中立；BrE/AmE',
      'お茶にするにはお湯は十分熱いですか。 — 中立；BrE/AmE',
      '私たちは水辺を歩きました。 — 中立；BrE/AmE',
      '午前中ずっと断水でした。 — 中立；BrE/AmE',
      'お水をいただけますか。 — 中立；BrE/AmE',
      '水ある？喉が渇いて死にそう。 — 口語；BrE/AmE',
      '自治体は飲料水の安定供給を確保しなければならない。 — 格式；BrE/AmE',
      '安全のため水を検査しました。 — 中立；BrE/AmE',
      '歯を磨くときは水を節約してください。 — 口語；BrE/AmE',
      '淡水は健康に大切です。 — 中立；BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — 行く、移動する；出発する；中立；BrE/AmE',
    verbLabels: ['現在 (go)', '過去 (went)', '過去分詞 (gone)'],
    verbTr: [
      '私はバスで仕事に行きます。 — 中立；BrE/AmE',
      '彼女は昨日早く帰りました。 — 中立；BrE/AmE',
      '彼は1か月間海外に行きました。 — 中立；BrE/AmE',
    ],
    goTr: [
      '雨が降る前に行こう。 — 口語；BrE/AmE',
      '先週末はどこに行きましたか。 — 中立；BrE/AmE',
      '牛乳が腐りました。 — 口語；BrE/AmE',
      '時間は早く過ぎます。 — 中立；BrE/AmE',
      'もう行かなければ。 — 中立；BrE/AmE',
      '彼が来ると彼女は黙りました。 — 中立；BrE/AmE',
      '彼は子どもを迎えに行きました。 — 中立；BrE/AmE',
      '調子はどう？ — 口語；BrE/AmE',
      '夜に一人でそこへ行かないで。 — 中立；BrE/AmE',
      'すべてうまくいきました、ありがとう。 — 中立；BrE/AmE',
    ],
  },
  tr: {
    waterGloss: 'water [ˈwɔːtə] — madde olarak su; içme suyu; nötr; BrE/AmE',
    waterTr: [
      'Bir bardak suya ihtiyacım var. — nötr; BrE/AmE',
      'Çay için su yeterince sıcak mı? — nötr; BrE/AmE',
      'Su boyunca yürüdük. — nötr; BrE/AmE',
      'Sabah boyunca su kesildi. — nötr; BrE/AmE',
      'Biraz su alabilir miyim, lütfen? — nötr; BrE/AmE',
      'Su var mı? Susuzluktan ölüyorum. — günlük; BrE/AmE',
      'Belediye kesintisiz içme suyu teminini sağlayacaktır. — resmi; BrE/AmE',
      'Güvenlik için suyu test ettiler. — nötr; BrE/AmE',
      'Dişlerini fırçalarken suyu tasarruflu kullan. — günlük; BrE/AmE',
      'Tatlı su sağlık için önemlidir. — nötr; BrE/AmE',
    ],
    goGloss: 'go [ɡəʊ] — gitmek, hareket etmek; ayrılmak; nötr; BrE/AmE',
    verbLabels: ['şimd. (go)', 'geçmiş (went)', 'part. (gone)'],
    verbTr: [
      'İşe otobüsle gidiyorum. — nötr; BrE/AmE',
      'Dün erken eve gitti. — nötr; BrE/AmE',
      'Bir ay yurt dışına gitti. — nötr; BrE/AmE',
    ],
    goTr: [
      'Yağmur yağmadan gidelim. — günlük; BrE/AmE',
      'Geçen hafta sonu nereye gittin? — nötr; BrE/AmE',
      'Süt bozuldu. — günlük; BrE/AmE',
      'Zaman hızlı geçiyor. — nötr; BrE/AmE',
      'Şimdi gitmemiz lazım. — nötr; BrE/AmE',
      'O geldiğinde suskunlaştı. — nötr; BrE/AmE',
      'Çocukları almaya gitti. — nötr; BrE/AmE',
      'Nasıl gidiyor? — günlük; BrE/AmE',
      'Gece yalnız oraya gitme. — nötr; BrE/AmE',
      'Her şey iyi gitti, teşekkürler. — nötr; BrE/AmE',
    ],
  },
};

function buildWater(locale) {
  const d = LOCALES[locale];
  return {
    headwordEn: 'water',
    glossRu: d.waterGloss,
    examples: EN_TEXTS.map((text, i) => ({ text, translation: d.waterTr[i] })),
  };
}

function buildGo(locale) {
  const d = LOCALES[locale];
  return {
    headwordEn: 'go',
    glossRu: d.goGloss,
    verbUsage: [
      { label: d.verbLabels[0], text: 'I go to work by bus.', translation: d.verbTr[0] },
      { label: d.verbLabels[1], text: 'She went home early yesterday.', translation: d.verbTr[1] },
      { label: d.verbLabels[2], text: 'He has gone abroad for a month.', translation: d.verbTr[2] },
    ],
    examples: GO_TEXTS.map((text, i) => ({ text, translation: d.goTr[i] })),
  };
}

for (const locale of Object.keys(LOCALES)) {
  const dir = path.join(OUT, locale);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'word-dictionary-format-sample.json'),
    `${JSON.stringify(buildWater(locale), null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(dir, 'word-dictionary-format-sample-verb.json'),
    `${JSON.stringify(buildGo(locale), null, 2)}\n`,
    'utf8',
  );
  console.log(`wrote ${locale}`);
}
