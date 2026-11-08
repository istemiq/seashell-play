#!/usr/bin/env node
/**
 * Разовая настройка профиля бота через Bot API:
 * имя, описания, команды, кнопка-меню чата (открывает Mini App).
 * Запуск на VPS: cd /root/seashell-server-new && node scripts/setup-bot-profile.mjs
 */
import '../load-env.js';

const token = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
const appUrl = String(process.env.TELEGRAM_MINIAPP_URL ?? 'https://front.sishel.ru').trim();

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

async function call(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(method, '→', data.ok ? 'OK' : `FAIL: ${data.description}`);
  return data.ok;
}

await call('setMyName', { name: 'Seashell' });

await call('setMyDescription', {
  description:
    '🐚 Слова запоминаются в контексте, а не списками. Seashell собирает их из живых текстов и возвращает в практику.\n\n' +
    '📖 Читалка: EPUB, FB2, TXT и др. — тап по слову даёт перевод\n' +
    '📚 Открытая библиотека классики + свои книги (пришли файл сюда)\n' +
    '📝 Словарь с переводом и примерами\n' +
    '🏋️ Практика сохранённых слов\n\n' +
    'Learn a language by reading what you love. Send a book file — it appears in your library.',
});

await call('setMyShortDescription', {
  short_description:
    '🐚 Учи язык, читая то, что нравится. Пришли книгу — она появится в библиотеке.',
});

await call('setMyCommands', {
  commands: [
    { command: 'app', description: 'Открыть приложение' },
    { command: 'books', description: 'Как добавить книгу' },
    { command: 'help', description: 'Помощь' },
  ],
});

// Кнопка-меню в чате с ботом → открывает Mini App.
await call('setChatMenuButton', {
  menu_button: { type: 'web_app', text: '📖 Seashell', web_app: { url: appUrl } },
});

console.log('done');
