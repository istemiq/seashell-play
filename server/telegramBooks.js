/**
 * Интерфейс бота: приём книг документами (Desktop-обход file input в Mini App),
 * приветствие, команды и ответы на любые сообщения.
 */
import { sendTelegramMessage } from './telegramNotify.js';
import { saveUserBook, bookExtOk, MAX_BOOK_BYTES } from './userBooks.js';
import { parseLinkStartParam, completeLinkCode } from './telegramLinkAuth.js';
import { upsertTgUserProfile } from './platformUsersDb.js';

const botToken = () => String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
const APP_URL = () =>
  String(process.env.TELEGRAM_MINIAPP_URL ?? 'https://front.sishel.ru').trim();

const FORMATS_RU = 'EPUB, FB2, TXT, MD, HTML, SRT, CSV, JSON';

const openAppKeyboard = () => ({
  inline_keyboard: [[{ text: '📖 Открыть Seashell', web_app: { url: APP_URL() } }]],
});

async function reply(chatId, text, opts = {}) {
  try {
    await sendTelegramMessage({ token: botToken(), chatId, text, ...opts });
  } catch (e) {
    console.error('[bot] reply failed', e?.message);
  }
}

const WELCOME = `🐚 Seashell

Слова запоминаются в контексте, а не списками. Seashell помогает собирать их из живых текстов — как ракушки с моря — и возвращать в практику.

Что внутри:
📖 Читалка — EPUB, FB2, TXT и другие форматы; тап по слову → перевод
📚 Открытая библиотека классики + свои книги: пришли файл прямо сюда, в этот чат
📝 Словарь — карточки с переводом и примерами
🏋️ Практика — сохранённые слова возвращаются в упражнениях

Learn a language by reading what you love. Send me a book file — it appears in Reader → My books.`;

const HINT = `Пришли мне файл книги документом — она появится в «Моих книгах». Форматы: ${FORMATS_RU}.

Оттуда — в читалку: тап по слову → перевод, сохранение в словарь.`;

async function handleDocument(msg, chatId, userId) {
  const doc = msg.document;
  const name = String(doc.file_name ?? 'book').slice(0, 200);

  if (!bookExtOk(name)) {
    await reply(chatId, `Это не похоже на книгу 🙂 Поддерживаются: ${FORMATS_RU}.`);
    return { handled: true, kind: 'book_bad_ext' };
  }
  if ((doc.file_size ?? 0) > MAX_BOOK_BYTES) {
    await reply(chatId, 'Файл слишком большой (максимум 20 МБ). / File too large (max 20 MB).');
    return { handled: true, kind: 'book_too_large' };
  }

  try {
    const f = await fetch(`https://api.telegram.org/bot${botToken()}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: doc.file_id }),
    });
    const fd = await f.json();
    const filePath = fd?.result?.file_path;
    if (!fd?.ok || !filePath) throw new Error(fd?.description || 'getFile failed');

    const dl = await fetch(`https://api.telegram.org/file/bot${botToken()}/${filePath}`);
    if (!dl.ok) throw new Error(`download HTTP ${dl.status}`);
    const buffer = Buffer.from(await dl.arrayBuffer());

    const { entry, duplicate } = saveUserBook(userId, { name, buffer });
    await reply(
      chatId,
      duplicate
        ? `«${entry.name}» уже есть в «Моих книгах».`
        : `📚 «${entry.name}» сохранена.\nОткрой Читалку → «Мои книги».\n\nSaved — Reader → My books.`,
      { replyMarkup: openAppKeyboard() },
    );
    return { handled: true, kind: 'book_saved', duplicate };
  } catch (e) {
    console.error('[bot] document handling failed', e?.message);
    await reply(chatId, 'Не удалось сохранить файл. Попробуй ещё раз. / Failed to save the file, try again.');
    return { handled: true, kind: 'book_failed' };
  }
}

/**
 * Обрабатывает message-апдейты, которые не забрал биллинг.
 * @returns {Promise<{handled: boolean, kind?: string}>}
 */
export async function handleTelegramMessageUpdate(update) {
  const msg = update?.message;
  if (!msg || msg.successful_payment) return { handled: false };

  const chatId = msg.chat?.id ?? msg.from?.id;
  const userId = msg.from?.id;
  if (!chatId || !userId) return { handled: false };

  // Каждое сообщение боту освежает имя/username — профиль в Play-приложении не протухает.
  void upsertTgUserProfile(msg.from).catch((e) =>
    console.warn('[bot] tg profile upsert failed', e?.message),
  );

  if (msg.document) {
    return handleDocument(msg, chatId, userId);
  }

  const text = String(msg.text ?? '').trim();
  const cmd = text.split(/\s|@/)[0]?.toLowerCase();

  // Deep-link из Play-приложения: /start play_<code> — подтверждение входа.
  const linkCode = cmd === '/start' ? parseLinkStartParam(text) : null;
  if (linkCode) {
    const linked = completeLinkCode(linkCode, userId);
    await reply(
      chatId,
      linked
        ? '✅ Вход в Seashell Play подтверждён — возвращайся в приложение.\n\nSigned in — back to the app.'
        : 'Эта ссылка входа устарела — запроси новую в приложении.\n\nLogin link expired — request a new one in the app.',
    );
    return { handled: true, kind: linked ? 'play_link' : 'play_link_expired' };
  }

  if (cmd === '/start' || cmd === '/app' || cmd === '/help') {
    await reply(chatId, WELCOME, { replyMarkup: openAppKeyboard() });
    return { handled: true, kind: 'welcome' };
  }
  if (cmd === '/books') {
    await reply(chatId, HINT);
    return { handled: true, kind: 'books_hint' };
  }
  if (text || msg.photo || msg.video || msg.audio || msg.voice || msg.sticker) {
    await reply(chatId, HINT, { replyMarkup: openAppKeyboard() });
    return { handled: true, kind: 'fallback_hint' };
  }
  return { handled: false };
}
