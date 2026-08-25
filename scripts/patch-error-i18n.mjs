import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../src/i18n/messages');

const enBlock = `
  'errors.networkUnavailable':
    "Can't reach the server. Check your internet and open the app again.",
  'errors.serverUnavailable': 'Server temporarily unavailable. Try again in a minute.',
  'errors.serverBadResponse': 'Unexpected server response. Try again later.',
  'errors.authInitData': "Couldn't verify your Telegram session. Close and reopen the mini app.",
  'errors.httpGeneric': 'Request failed. Please try again.',
  'errors.wordAlreadyExists': '«{word}» is already in your dictionary',
  'errors.wordAlreadyExistsLang': '«{word}» is already in your dictionary ({language})',
  'errors.wordAlreadyExistsShort': 'This word is already in your dictionary',
  'errors.wrongLocaleJaKo':
    "Couldn't generate Japanese/Korean translations. Try again or change card language above.",
  'errors.wrongLocaleGeneric':
    "Couldn't generate translations in the selected language. Try again or change card language above.",`;

const ukBlock = `
  'errors.networkUnavailable':
    'Немає зв\\'язку з сервером. Перевірте інтернет і відкрийте застосунок знову.',
  'errors.serverUnavailable': 'Сервер тимчасово недоступний. Спробуйте через хвилину.',
  'errors.serverBadResponse': 'Сервер відповів неочікувано. Спробуйте пізніше.',
  'errors.authInitData':
    'Не вдалося перевірити сесію Telegram. Закрийте і відкрийте міні-застосунок знову.',
  'errors.httpGeneric': 'Запит не виконано. Спробуйте ще раз.',
  'errors.wordAlreadyExists': 'Слово «{word}» уже є в словнику',
  'errors.wordAlreadyExistsLang': 'Слово «{word}» уже є в словнику ({language})',
  'errors.wordAlreadyExistsShort': 'Це слово вже є в словнику',
  'errors.wrongLocaleJaKo':
    'Не вдалося отримати переклад японською або корейською. Спробуйте ще раз або змініть мову карток.',
  'errors.wrongLocaleGeneric':
    'Не вдалося отримати переклад обраною мовою. Спробуйте ще раз або змініть мову карток.',`;

const trBlock = `
  'errors.networkUnavailable':
    'Sunucuya bağlanılamıyor. İnterneti kontrol edin ve uygulamayı yeniden açın.',
  'errors.serverUnavailable': 'Sunucu geçici olarak kullanılamıyor. Bir dakika sonra tekrar deneyin.',
  'errors.serverBadResponse': 'Sunucu beklenmedik yanıt verdi. Daha sonra tekrar deneyin.',
  'errors.authInitData':
    'Telegram oturumu doğrulanamadı. Mini uygulamayı kapatıp yeniden açın.',
  'errors.httpGeneric': 'İstek başarısız. Lütfen tekrar deneyin.',
  'errors.wordAlreadyExists': '«{word}» zaten sözlüğünüzde',
  'errors.wordAlreadyExistsLang': '«{word}» zaten sözlüğünüzde ({language})',
  'errors.wordAlreadyExistsShort': 'Bu kelime zaten sözlüğünüzde',
  'errors.wrongLocaleJaKo':
    'Japonca/Korece çeviri oluşturulamadı. Tekrar deneyin veya kart dilini değiştirin.',
  'errors.wrongLocaleGeneric':
    'Seçilen dilde çeviri oluşturulamadı. Tekrar deneyin veya kart dilini değiştirin.',`;

const blocks = {
  ar: enBlock,
  es: enBlock,
  pt: enBlock,
  fa: enBlock,
  ko: enBlock,
  ja: enBlock,
  it: enBlock,
  uk: ukBlock,
  tr: trBlock,
};

for (const [loc, block] of Object.entries(blocks)) {
  const f = path.join(dir, `${loc}.js`);
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('errors.networkUnavailable')) {
    console.log('skip', loc);
    continue;
  }
  s = s.replace(/(\s+'errors\.deleteFailed':[^\n]+,)/, `$1${block}`);
  s = s.replace(
    /'errors\.ttsUnavailable':[^\n]+,/,
    `'errors.ttsUnavailable': 'Text-to-speech unavailable. Check your internet and TTS settings.',`,
  );
  fs.writeFileSync(f, s);
  console.log('patched', loc);
}
