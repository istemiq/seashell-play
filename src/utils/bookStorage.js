/**
 * Хранилище книг пользователя в IndexedDB (на устройстве).
 * Храним: {id, name, kind:'epub'|'text', data?:ArrayBuffer, text?:string, addedAt}
 */
const DB_NAME = 'seashell-reader';
const STORE = 'books';
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const out = fn(store);
        t.oncomplete = () => resolve(out?.result ?? null);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

/** @returns {Promise<Array<{id:string,name:string,kind:string,size:number,addedAt:number}>>} */
export async function listBooks() {
  const rows = await tx('readonly', (s) => s.getAll());
  return (rows || [])
    .map((b) => ({
      id: b.id,
      name: b.name,
      kind: b.kind,
      size: b.kind === 'epub' ? (b.data?.byteLength ?? 0) : (b.text?.length ?? 0),
      addedAt: b.addedAt,
    }))
    .sort((a, b) => b.addedAt - a.addedAt);
}

export async function getBook(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Сохраняет книгу. Пропускает дубликат по имени+размеру. */
export async function saveBook(book) {
  const existing = await listBooks();
  const size = book.kind === 'epub' ? (book.data?.byteLength ?? 0) : (book.text?.length ?? 0);
  if (existing.some((b) => b.name === book.name && b.size === size)) {
    return null;
  }
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tx('readwrite', (s) =>
    s.put({
      id,
      name: book.name,
      kind: book.kind,
      data: book.kind === 'epub' ? book.data : undefined,
      text: book.kind === 'text' ? book.text : undefined,
      addedAt: Date.now(),
    }),
  );
  return id;
}

export async function deleteBook(id) {
  await tx('readwrite', (s) => s.delete(id));
}
