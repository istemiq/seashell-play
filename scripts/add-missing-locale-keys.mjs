// One-off: fills the 29 keys that exist in en/ru but were missing in the
// other 9 UI locale files (they silently fell back to English).
// Run once: node scripts/add-missing-locale-keys.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'messages');

const T = {
  'nav.reader': { ar: 'القارئ', es: 'Lector', fa: 'کتاب‌خوان', it: 'Lettore', ja: 'リーダー', ko: '리더', pt: 'Leitor', tr: 'Okuyucu', uk: 'Читач' },
  'app.pressBackAgainToExit': {
    ar: 'اضغط رجوعًا مرة أخرى للخروج',
    es: 'Pulsa atrás de nuevo para salir',
    fa: 'برای خروج دوباره دکمهٔ بازگشت را بزنید',
    it: 'Premi di nuovo indietro per uscire',
    ja: 'もう一度「戻る」を押すと終了します',
    ko: '종료하려면 뒤로 버튼을 한 번 더 누르세요',
    pt: 'Pressione voltar novamente para sair',
    tr: 'Çıkmak için tekrar geri basın',
    uk: 'Натисніть «назад» ще раз, щоб вийти',
  },
  'common.retry': { ar: 'حاول مرة أخرى', es: 'Inténtalo de nuevo', fa: 'دوباره تلاش کنید', it: 'Riprova', ja: '再試行', ko: '다시 시도', pt: 'Tentar novamente', tr: 'Tekrar dene', uk: 'Спробувати ще раз' },
  'onboarding.title': { ar: 'مرحبًا', es: 'Bienvenido', fa: 'خوش آمدید', it: 'Benvenuto', ja: 'ようこそ', ko: '환영합니다', pt: 'Boas-vindas', tr: 'Hoş geldin', uk: 'Ласкаво просимо' },
  'onboarding.prompt': {
    ar: 'اختر اسمًا يظهر في التطبيق. لا نشاركه خارج Seashell.',
    es: 'Elige un nombre para mostrar en la app. No lo compartimos fuera de Seashell.',
    fa: 'نامی برای نمایش در برنامه انتخاب کنید. آن را خارج از Seashell به اشتراک نمی‌گذاریم.',
    it: "Scegli un nome da mostrare nell'app. Non lo condividiamo fuori da Seashell.",
    ja: 'アプリで表示する名前を選んでください。Seashell の外には共有されません。',
    ko: '앱에 표시할 이름을 선택하세요. Seashell 밖에서는 공유되지 않습니다.',
    pt: 'Escolha um nome para mostrar no app. Não o compartilhamos fora do Seashell.',
    tr: 'Uygulamada gösterilecek bir ad seçin. Seashell dışında paylaşılmaz.',
    uk: "Оберіть ім'я, яке показуватиметься в застосунку. Ми не передаємо його за межі Seashell.",
  },
  'onboarding.nameLabel': { ar: 'اسمك', es: 'Tu nombre', fa: 'نام شما', it: 'Il tuo nome', ja: 'あなたの名前', ko: '이름', pt: 'Seu nome', tr: 'Adınız', uk: "Ваше ім'я" },
  'onboarding.namePlaceholder': {
    ar: 'بماذا نناديك؟', es: '¿Cómo te llamamos?', fa: 'چگونه صدایتان کنیم؟', it: 'Come ti chiamiamo?',
    ja: 'どうお呼びしましょうか？', ko: '어떻게 불러드릴까요?', pt: 'Como devemos te chamar?', tr: 'Size nasıl hitap edelim?', uk: 'Як до вас звертатись?',
  },
  'onboarding.continue': { ar: 'متابعة', es: 'Continuar', fa: 'ادامه', it: 'Continua', ja: '続ける', ko: '계속', pt: 'Continuar', tr: 'Devam', uk: 'Продовжити' },
  'onboarding.nameRequired': { ar: 'يُرجى إدخال اسم', es: 'Introduce un nombre, por favor', fa: 'لطفاً نامی وارد کنید', it: 'Inserisci un nome', ja: '名前を入力してください', ko: '이름을 입력해 주세요', pt: 'Insira um nome, por favor', tr: 'Lütfen bir ad girin', uk: "Будь ласка, введіть ім'я" },
  'errors.saveFailed': { ar: 'تعذّر الحفظ', es: 'No se pudo guardar', fa: 'ذخیره نشد', it: 'Impossibile salvare', ja: '保存できませんでした', ko: '저장할 수 없습니다', pt: 'Não foi possível salvar', tr: 'Kaydedilemedi', uk: 'Не вдалося зберегти' },
  'practice.patternHintBa': {
    ar: 'ألصق جملة باشكيرية. يشرح الذكاء الاصطناعي بنيتها بلغتك، ويعرض أمثلة موازية بنفس القواعد، ويطلب منك كتابة جملتك.',
    es: 'Pega una frase en baskir. La IA explica su estructura en tu idioma, muestra ejemplos paralelos con la misma gramática y te pide escribir la tuya.',
    fa: 'یک جملهٔ باشقیری جای‌گذاری کنید. هوش مصنوعی ساختار آن را به زبان شما توضیح می‌دهد، مثال‌های موازی با همان دستور زبان نشان می‌دهد و از شما می‌خواهد جملهٔ خودتان را بنویسید.',
    it: "Incolla una frase in baskir. L'IA ne spiega la struttura nella tua lingua, mostra esempi paralleli con la stessa grammatica e ti chiede di scriverne una tua.",
    ja: 'バシキール語の文を貼り付けてください。AI があなたの言語で構造を説明し、同じ文法の並行例を示し、自分の文を書くよう促します。',
    ko: '바시키르어 문장을 붙여넣으세요. AI가 선택한 언어로 구조를 설명하고, 같은 문법의 병렬 예문을 보여주며, 직접 문장을 써보라고 합니다.',
    pt: 'Cole uma frase em baxkir. A IA explica a estrutura no seu idioma, mostra exemplos paralelos com a mesma gramática e pede para você escrever a sua.',
    tr: 'Başkurtça bir cümle yapıştırın. Yapay zekâ yapısını sizin dilinizde açıklar, aynı gramerle paralel örnekler gösterir ve kendi cümlenizi yazmanızı ister.',
    uk: 'Вставте речення башкирською. ШІ пояснить його будову вашою мовою, покаже паралельні приклади з тією ж граматикою й попросить написати власне.',
  },
  'practice.patternSeedPlaceholderBa': {
    ar: 'مثال: Min ber stakan hыu käräk', es: 'p. ej. Min ber stakan hыu käräk', fa: 'مثلاً Min ber stakan hыu käräk',
    it: 'es. Min ber stakan hыu käräk', ja: '例: Min ber stakan hыu käräk', ko: '예: Min ber stakan hыu käräk',
    pt: 'ex.: Min ber stakan hыu käräk', tr: 'örn. Min ber stakan hыu käräk', uk: 'напр. Min ber stakan hыu käräk',
  },
  'settings.accentBa': {
    ar: 'الباشكيرية — espeak-ng على الخادم (ba)، TTS الجهاز في Play',
    es: 'Baskir — espeak-ng en el servidor (ba), TTS del dispositivo en Play',
    fa: 'باشقیری — espeak-ng روی سرور (ba)، TTS دستگاه در Play',
    it: 'Baskir — espeak-ng sul server (ba), TTS del dispositivo in Play',
    ja: 'バシキール語 — サーバー上の espeak-ng (ba)、Play では端末の TTS',
    ko: '바시키르어 — 서버의 espeak-ng (ba), Play에서는 기기 TTS',
    pt: 'Baxkir — espeak-ng no servidor (ba), TTS do dispositivo no Play',
    tr: 'Başkurtça — sunucuda espeak-ng (ba), Play’de cihaz TTS’i',
    uk: 'Башкирська — espeak-ng на сервері (ba), TTS пристрою в Play',
  },
  'lang.hintBa': {
    ar: 'يظل محتوى التعلم (القاموس والتدريب) بالباشكيرية. القوائم والتلميحات باللغة التي تختارها.',
    es: 'El contenido de aprendizaje (diccionario y práctica) permanece en baskir. Los menús y las pistas usan el idioma que elijas.',
    fa: 'محتوای آموزشی (واژه‌نامه و تمرین) به باشقیری می‌ماند. منوها و راهنماها به زبانی هستند که انتخاب می‌کنید.',
    it: 'I contenuti di studio (dizionario ed esercizi) restano in baskir. Menu e suggerimenti usano la lingua che scegli.',
    ja: '学習コンテンツ（辞書と練習）はバシキール語のままです。メニューとヒントには選択した言語が使われます。',
    ko: '학습 콘텐츠(사전과 연습)는 바시키르어로 유지됩니다. 메뉴와 힌트는 선택한 언어로 표시됩니다.',
    pt: 'O conteúdo de estudo (dicionário e prática) permanece em baxkir. Menus e dicas usam o idioma que você escolher.',
    tr: 'Öğrenme içeriği (sözlük ve pratik) Başkurtça kalır. Menüler ve ipuçları seçtiğiniz dili kullanır.',
    uk: 'Навчальний контент (словник і практика) залишається башкирською. Меню та підказки — мовою, яку ви оберете.',
  },
  'practice.expertDisclaimerBa': {
    ar: 'هذا ذكاء اصطناعي لممارسة الباشكيرية. قد تكون الإجابات خاطئة. للمساعدة الحقيقية راجع مختصين مؤهلين. أنت تتعلم اللغة عبر شخصية خبير تمثيلية — وليست نصيحة مهنية.',
    es: 'Esto es IA para practicar baskir. Las respuestas pueden ser erróneas. Para ayuda real, consulta a profesionales cualificados. Aprendes el idioma con un experto de ficción, no con asesoramiento profesional.',
    fa: 'این هوش مصنوعی برای تمرین باشقیری است. پاسخ‌ها ممکن است نادرست باشند. برای کمک واقعی به متخصصان واجد شرایط مراجعه کنید. شما زبان را از طریق شخصیت کارشناس نمایشی می‌آموزید — نه مشاورهٔ حرفه‌ای.',
    it: "Questa è un'IA per esercitarsi in baskir. Le risposte possono essere sbagliate. Per aiuto reale rivolgiti a professionisti qualificati. Impari la lingua con un esperto di finzione, non con una consulenza professionale.",
    ja: 'これはバシキール語練習用のAIです。回答は誤りの可能性があります。実際の支援が必要な場合は専門家に相談してください。ロールプレイの専門家ペルソナを通じて言語を学びます — 専門的助言ではありません。',
    ko: '바시키르어 연습용 AI입니다. 답변이 틀릴 수 있습니다. 실제 도움이 필요하면 전문가와 상담하세요. 롤플레이 전문가 페르소나로 언어를 배우는 것이지 전문적인 조언이 아닙니다.',
    pt: 'Isto é IA para praticar baxkir. As respostas podem estar erradas. Para ajuda real, consulte profissionais qualificados. Você aprende o idioma com um especialista de ficção — não é aconselhamento profissional.',
    tr: 'Bu, Başkurtça pratiği için bir yapay zekâdır. Yanıtlar hatalı olabilir. Gerçek yardım için uzmanlara danışın. Rol yapan bir uzman kişiliğiyle dil öğrenirsiniz — profesyonel tavsiye değildir.',
    uk: 'Це ШІ для практики башкирської. Відповіді можуть бути помилковими. За реальною допомогою звертайтеся до фахівців. Ви вчите мову через рольового персонажа-експерта — це не професійна порада.',
  },
  'practice.expertDisclaimerShortBa': {
    ar: 'تدريب باشكيري بالذكاء الاصطناعي، وليس نصيحة مهنية. قد يحتوي على أخطاء — استشر المختصين للقرارات الحقيقية.',
    es: 'Práctica de baskir con IA, no asesoramiento profesional. Puede contener errores — consulta a especialistas para decisiones reales.',
    fa: 'تمرین باشقیری با هوش مصنوعی، نه مشاورهٔ حرفه‌ای. ممکن است خطا داشته باشد — برای تصمیم‌های واقعی با متخصصان مشورت کنید.',
    it: 'Pratica di baskir con IA, non consulenza professionale. Può contenere errori — consulta specialisti per decisioni reali.',
    ja: 'バシキール語のAI練習であり、専門的助言ではありません。誤りを含む可能性があります — 実際の判断は専門家にご相談ください。',
    ko: '바시키르어 AI 연습이며 전문적 조언이 아닙니다. 오류가 있을 수 있으니 실제 결정은 전문가와 상담하세요.',
    pt: 'Prática de baxkir com IA, não aconselhamento profissional. Pode conter erros — consulte especialistas para decisões reais.',
    tr: 'Başkurtça yapay zekâ pratiği, profesyonel tavsiye değildir. Hata içerebilir — gerçek kararlar için uzmanlara danışın.',
    uk: 'Практика башкирської зі ШІ, не професійна порада. Може містити помилки — для реальних рішень радьтеся зі спеціалістами.',
  },
  'practice.expertPlaceholderBa': {
    ar: 'أجب بالباشكيرية: نعم، لا، أو اقترح موضوعًا آخر…',
    es: 'Responde en baskir: sí, no o sugiere otro tema…',
    fa: 'به باشقیری پاسخ دهید: بله، نه، یا موضوع دیگری پیشنهاد کنید…',
    it: 'Rispondi in baskir: sì, no o proponi un altro argomento…',
    ja: 'バシキール語で返答: はい、いいえ、または別の話題を提案…',
    ko: '바시키르어로 답하세요: 예, 아니요, 또는 다른 주제 제안…',
    pt: 'Responda em baxkir: sim, não ou sugira outro tema…',
    tr: 'Başkurtça yanıtlayın: evet, hayır veya başka bir konu önerin…',
    uk: 'Відповідайте башкирською: так, ні або запропонуйте іншу тему…',
  },
  'practice.emptyBa': {
    ar: 'اكتب بالباشكيرية — سيرد شريكك، ويعرض ما سمعه، ويصحح الصياغة بإيجاز عند الحاجة.',
    es: 'Escribe en baskir — tu compañero responderá, mostrará lo que oyó y corregirá brevemente la frase si hace falta.',
    fa: 'به باشقیری بنویسید — طرف مقابل پاسخ می‌دهد، آنچه شنیده را نشان می‌دهد و در صورت نیاز صورت‌بندی را به‌اختصار اصلاح می‌کند.',
    it: 'Scrivi in baskir — il partner risponderà, mostrerà cosa ha sentito e correggerà brevemente la frase se serve.',
    ja: 'バシキール語で入力 — 相手が返答し、聞き取った内容を表示し、必要に応じて表現を簡潔に修正します。',
    ko: '바시키르어로 입력하세요 — 상대가 답하고, 들은 내용을 보여주며, 필요하면 표현을 간단히 고쳐줍니다.',
    pt: 'Digite em baxkir — seu parceiro responderá, mostrará o que ouviu e corrigirá brevemente a frase se necessário.',
    tr: 'Başkurtça yazın — partneriniz yanıtlar, duyduğunu gösterir ve gerekirse ifadeyi kısaca düzeltir.',
    uk: 'Пишіть башкирською — співрозмовник відповість, покаже, що почув, і за потреби коротко виправить формулювання.',
  },
  'practice.placeholderBa': {
    ar: 'اكتب بالباشكيرية…', es: 'Escribe en baskir…', fa: 'به باشقیری بنویسید…', it: 'Scrivi in baskir…',
    ja: 'バシキール語で入力…', ko: '바시키르어로 입력…', pt: 'Digite em baxkir…', tr: 'Başkurtça yazın…', uk: 'Пишіть башкирською…',
  },
  'errors.customExampleHeadwordBa': {
    ar: 'تعذّر بناء جملة باشكيرية طبيعية بهذه الكلمة. أعد صياغة عبارتك أو استخدم شكلًا أقرب إلى كلمة القاموس.',
    es: 'No se pudo construir una frase natural en baskir con esta palabra. Reformula tu frase o usa una forma más cercana a la palabra del diccionario.',
    fa: 'نمی‌توان جملهٔ باشقیری طبیعی با این واژه ساخت. عبارت خود را بازنویسی کنید یا صورتی نزدیک‌تر به واژهٔ فرهنگ‌لغت به کار ببرید.',
    it: 'Impossibile costruire una frase naturale in baskir con questa parola. Riformula la frase o usa una forma più vicina alla voce del dizionario.',
    ja: 'この単語で自然なバシキール語の文を作れませんでした。言い換えるか、辞書の見出し語に近い形を使ってください。',
    ko: '이 단어로 자연스러운 바시키르어 문장을 만들 수 없습니다. 표현을 바꾸거나 사전 표제어에 가까운 형태를 사용하세요.',
    pt: 'Não foi possível criar uma frase natural em baxkir com esta palavra. Reformule a frase ou use uma forma mais próxima da palavra do dicionário.',
    tr: 'Bu kelimeyle doğal bir Başkurtça cümle kurulamadı. İfadenizi yeniden yazın veya sözlükteki kelimeye daha yakın bir biçim kullanın.',
    uk: 'Не вдалося скласти природне речення башкирською з цим словом. Перефразуйте фразу або використайте форму, ближчу до словникового слова.',
  },
  'dict.wordLabelBa': {
    ar: 'كلمة أو عبارة (بالباشكيرية أو بلغتك)', es: 'Palabra o frase (en baskir o en tu idioma)', fa: 'واژه یا عبارت (باشقیری یا زبان شما)',
    it: 'Parola o frase (in baskir o nella tua lingua)', ja: '単語またはフレーズ（バシキール語またはあなたの言語）', ko: '단어 또는 구 (바시키르어 또는 선택한 언어)',
    pt: 'Palavra ou frase (em baxkir ou no seu idioma)', tr: 'Kelime veya ifade (Başkurtça veya kendi dilinizde)', uk: 'Слово або фраза (башкирською або вашою мовою)',
  },
  'dict.placeholderWordBa': {
    ar: 'مثال: hыu أو قاموس', es: 'p. ej. hыu o diccionario', fa: 'مثلاً hыu یا واژه‌نامه',
    it: 'es. hыu o dizionario', ja: '例: hыu または dictionary', ko: '예: hыu 또는 dictionary',
    pt: 'ex.: hыu ou dicionário', tr: 'örn. hыu veya sözlük', uk: 'напр. hыu або словник',
  },
  'dict.cardLangHintBa': {
    ar: 'تبقى الأمثلة بالباشكيرية؛ المعاني والترجمات باللغة أعلاه. بعد تغييرها، انقر «تحديث الأمثلة» على البطاقة.',
    es: 'Los ejemplos permanecen en baskir; los significados y traducciones usan el idioma de arriba. Tras cambiarlo, toca «Actualizar ejemplos» en la tarjeta.',
    fa: 'مثال‌ها به باشقیری می‌مانند؛ معانی و ترجمه‌ها به زبان بالا هستند. پس از تغییر آن، روی «تازه‌سازی مثال‌ها» در کارت بزنید.',
    it: 'Gli esempi restano in baskir; significati e traduzioni usano la lingua sopra. Dopo averla cambiata, tocca «Aggiorna esempi» sulla scheda.',
    ja: '例文はバシキール語のままです。意味と翻訳には上の言語が使われます。変更後はカードの «例文を更新» をタップしてください。',
    ko: '예문은 바시키르어로 유지되고, 뜻과 번역은 위에서 선택한 언어를 사용합니다. 변경 후 카드의 «예문 새로고침»을 누르세요.',
    pt: 'Os exemplos permanecem em baxkir; significados e traduções usam o idioma acima. Após alterá-lo, toque em «Atualizar exemplos» no cartão.',
    tr: 'Örnekler Başkurtça kalır; anlamlar ve çeviriler yukarıdaki dili kullanır. Değiştirdikten sonra kartta «Örnekleri yenile»ye dokunun.',
    uk: 'Приклади залишаються башкирською; значення та переклади — мовою вище. Після її зміни торкніться «Оновити приклади» на картці.',
  },
  'dict.addHintBa': {
    ar: 'اكتب بلغتك أو بالباشكيرية — نحفظ كلمة باشكيرية طبيعية. الأمثلة بالباشكيرية؛ الترجمات باللغة المختارة أعلاه.',
    es: 'Escribe en tu idioma o en baskir — guardamos un lema natural en baskir. Los ejemplos quedan en baskir; las traducciones usan el idioma elegido arriba.',
    fa: 'به زبان خودتان یا به باشقیری بنویسید — ما یک واژهٔ اصلی طبیعی به باشقیری ذخیره می‌کنیم. مثال‌ها به باشقیری می‌مانند؛ ترجمه‌ها به زبان انتخاب‌شدهٔ بالا هستند.',
    it: 'Scrivi nella tua lingua o in baskir — salviamo una voce naturale in baskir. Gli esempi restano in baskir; le traduzioni usano la lingua scelta sopra.',
    ja: 'あなたの言語またはバシキール語で入力 — 自然なバシキール語の見出し語を保存します。例文はバシキール語のまま、翻訳には上で選んだ言語を使います。',
    ko: '당신의 언어나 바시키르어로 입력하세요 — 자연스러운 바시키르어 표제어를 저장합니다. 예문은 바시키르어로, 번역은 위에서 선택한 언어로 표시됩니다.',
    pt: 'Digite no seu idioma ou em baxkir — salvamos um verbete natural em baxkir. Os exemplos ficam em baxkir; as traduções usam o idioma escolhido acima.',
    tr: 'Kendi dilinizde veya Başkurtça yazın — doğal bir Başkurtça sözlük maddesi kaydederiz. Örnekler Başkurtça kalır; çeviriler yukarıda seçilen dili kullanır.',
    uk: 'Пишіть вашою мовою або башкирською — ми збережемо природне башкирське словникове слово. Приклади — башкирською; переклади — мовою, обраною вище.',
  },
  'dict.addHintGroupBa': {
    ar: 'ستُضاف الكلمة إلى هذه المجموعة. الأمثلة بالباشكيرية؛ الترجمات باللغة المختارة أعلاه.',
    es: 'La palabra se añadirá a este grupo. Los ejemplos quedan en baskir; las traducciones usan el idioma elegido arriba.',
    fa: 'این واژه به این گروه اضافه می‌شود. مثال‌ها به باشقیری می‌مانند؛ ترجمه‌ها به زبان انتخاب‌شدهٔ بالا هستند.',
    it: 'La parola sarà aggiunta a questo gruppo. Gli esempi restano in baskir; le traduzioni usano la lingua scelta sopra.',
    ja: 'この単語はこのグループに追加されます。例文はバシキール語のまま、翻訳には上で選んだ言語を使います。',
    ko: '이 단어가 이 그룹에 추가됩니다. 예문은 바시키르어로, 번역은 위에서 선택한 언어로 표시됩니다.',
    pt: 'A palavra será adicionada a este grupo. Os exemplos ficam em baxkir; as traduções usam o idioma escolhido acima.',
    tr: 'Kelime bu gruba eklenecek. Örnekler Başkurtça kalır; çeviriler yukarıda seçilen dili kullanır.',
    uk: 'Слово буде додано до цієї групи. Приклади — башкирською; переклади — мовою, обраною вище.',
  },
  'dict.myExamplesEmptyBa': {
    ar: 'اكتب جملة بلغتك الأم — سيترجمها الذكاء الاصطناعي إلى الباشكيرية طبيعيًا مستخدمًا هذه الكلمة.',
    es: 'Escribe una frase en tu idioma — la IA la traducirá al baskir de forma natural usando esta palabra.',
    fa: 'جمله‌ای به زبان مادری‌تان بنویسید — هوش مصنوعی آن را با استفاده از این واژه به‌طور طبیعی به باشقیری ترجمه می‌کند.',
    it: "Scrivi una frase nella tua lingua — l'IA la tradurrà naturalmente in baskir usando questa parola.",
    ja: '母語で文を入力 — AI がこの単語を使って自然なバシキール語に翻訳します。',
    ko: '모국어로 문장을 입력하세요 — AI가 이 단어를 사용해 자연스러운 바시키르어로 번역합니다.',
    pt: 'Digite uma frase no seu idioma — a IA a traduzirá naturalmente para baxkir usando esta palavra.',
    tr: 'Ana dilinizde bir cümle yazın — yapay zekâ bu kelimeyi kullanarak onu doğal şekilde Başkurtçaya çevirir.',
    uk: 'Напишіть речення рідною мовою — ШІ природно перекладе його башкирською з цим словом.',
  },
  'dict.wordPracticeHintBa': {
    ar: 'حوار قصير بالباشكيرية البسيطة. حاول استخدام «{word}» عندما يناسب.',
    es: 'Diálogo corto en baskir sencillo. Intenta usar «{word}» cuando encaje.',
    fa: 'گفت‌وگوی کوتاه به باشقیری ساده. سعی کنید «{word}» را جایی که می‌گنجد به کار ببرید.',
    it: 'Breve dialogo in baskir semplice. Prova a usare «{word}» quando ci sta.',
    ja: '簡単なバシキール語での短い対話。合う場面で «{word}» を使ってみてください。',
    ko: '쉬운 바시키르어로 짧은 대화. 어울리면 «{word}»를 사용해 보세요.',
    pt: 'Diálogo curto em baxkir simples. Tente usar «{word}» quando couber.',
    tr: 'Basit Başkurtça kısa diyalog. Uygun olduğunda «{word}» kullanmaya çalışın.',
    uk: 'Короткий діалог простою башкирською. Намагайтеся вжити «{word}», де це доречно.',
  },
  'dict.wordPracticePlaceholderBa': {
    ar: 'إجابة قصيرة بالباشكيرية…', es: 'Respuesta corta en baskir…', fa: 'پاسخ کوتاه به باشقیری…', it: 'Risposta breve in baskir…',
    ja: 'バシキール語で短い返答…', ko: '바시키르어로 짧게 답하기…', pt: 'Resposta curta em baxkir…', tr: 'Başkurtça kısa yanıt…', uk: 'Коротка відповідь башкирською…',
  },
  'practice.inBashkir': {
    ar: 'بالباشكيرية', es: 'En baskir', fa: 'به باشقیری', it: 'In baskir', ja: 'バシキール語で',
    ko: '바시키르어로', pt: 'Em baxkir', tr: 'Başkurtça', uk: 'Башкирською',
  },
};

function esc(s) {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

for (const loc of ['ar', 'es', 'fa', 'it', 'ja', 'ko', 'pt', 'tr', 'uk']) {
  const file = path.join(DIR, `${loc}.js`);
  const src = fs.readFileSync(file, 'utf8');
  const additions = Object.entries(T)
    .filter(([k]) => !src.includes(`'${k}':`))
    .map(([k]) => `  '${k}': ${esc(T[k][loc])},`);
  if (!additions.length) { console.log(loc, '— nothing to add'); continue; }
  const idx = src.lastIndexOf('};');
  const out = src.slice(0, idx) + additions.join('\n') + '\n};\n';
  fs.writeFileSync(file, out);
  console.log(loc, '+', additions.length, 'keys');
}
