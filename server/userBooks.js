/**
 * Хранилище книг пользователя, присланных боту (Desktop-обходной путь:
 * в Telegram Desktop file input в Mini App не работает).
 * Файлы: data/user-books/<userId>/<bookId>, манифест index.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'data', 'user-books');
const MAX_BOOKS_PER_USER = 30;
export const MAX_BOOK_BYTES = 20 * 1024 * 1024;

export const SUPPORTED_BOOK_EXT = new Set([
  'epub', 'fb2', 'txt', 'md', 'markdown', 'html', 'htm',
  'srt', 'csv', 'json', 'xml', 'rtf', 'log', 'ass', 'vtt',
]);

const userDir = (userId) => path.join(ROOT, String(userId));
const manifestPath = (userId) => path.join(userDir(userId), 'index.json');

function readManifest(userId) {
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath(userId), 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeManifest(userId, list) {
  fs.mkdirSync(userDir(userId), { recursive: true });
  fs.writeFileSync(manifestPath(userId), JSON.stringify(list));
}

export function bookExtOk(name) {
  const ext = String(name ?? '').split('.').pop()?.toLowerCase() ?? '';
  return SUPPORTED_BOOK_EXT.has(ext);
}

export function listUserBooks(userId) {
  return readManifest(userId)
    .filter((b) => b?.id && b?.name)
    .map((b) => ({ id: b.id, name: b.name, size: b.size ?? 0, addedAt: b.addedAt ?? 0 }));
}

/**
 * @returns {{entry: object, duplicate: boolean}}
 */
export function saveUserBook(userId, { name, buffer }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('empty_book');
  if (buffer.length > MAX_BOOK_BYTES) throw new Error('book_too_large');

  const list = readManifest(userId);
  const dup = list.find((b) => b.name === name && b.size === buffer.length);
  if (dup) return { entry: dup, duplicate: true };

  if (list.length >= MAX_BOOKS_PER_USER) throw new Error('book_limit');

  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  fs.mkdirSync(userDir(userId), { recursive: true });
  fs.writeFileSync(path.join(userDir(userId), id), buffer);

  const entry = { id, name, size: buffer.length, addedAt: Date.now() };
  writeManifest(userId, [entry, ...list]);
  return { entry, duplicate: false };
}

export function getUserBookFile(userId, id) {
  const safeId = String(id ?? '');
  if (!/^[a-z0-9-]+$/i.test(safeId)) return null;
  const entry = readManifest(userId).find((b) => b.id === safeId);
  if (!entry) return null;
  const file = path.join(userDir(userId), safeId);
  if (!fs.existsSync(file)) return null;
  return { file, entry };
}

export function deleteUserBook(userId, id) {
  const list = readManifest(userId);
  const entry = list.find((b) => b.id === id);
  if (!entry) return false;
  writeManifest(
    userId,
    list.filter((b) => b.id !== id),
  );
  try {
    fs.unlinkSync(path.join(userDir(userId), entry.id));
  } catch {
    /* file may already be gone */
  }
  return true;
}
