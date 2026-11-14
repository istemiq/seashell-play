/**
 * GET /api/reader/book?gutenbergId=N — прокси до Project Gutenberg cache.
 * Только публичные-домен книги: ID строго числовой, upstream ограничен gutenberg.org.
 * Ответы кэшируются на диск, чтобы не дёргать Gutenberg на каждый запрос.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeRateLimiter } from '../routeHelpers.js';
import { listUserBooks, getUserBookFile, deleteUserBook } from '../userBooks.js';

const CACHE_DIR = path.join(os.tmpdir(), 'seashell-book-cache');
const MAX_BOOK_BYTES = 20 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30000;

/**
 * Издания Викисловаря на kaikki.org: глоссы будут на языке издания.
 * Нет издания → английский ('dictionary').
 */
const KAIKKI_EDITION = {
  ru: 'ruwiktionary',
  de: 'dewiktionary',
  es: 'eswiktionary',
  fr: 'frwiktionary',
  it: 'itwiktionary',
  pt: 'ptwiktionary',
  tr: 'trwiktionary',
  ja: 'jawiktionary',
  zh: 'zhwiktionary',
  ko: 'kowiktionary',
  nl: 'nlwiktionary',
  pl: 'plwiktionary',
  uk: 'ukwiktionary',
};

const MAX_DEFINE_WORD_LEN = 300;

/**
 * Локальные двуязычные словари (FreeDict/WikDict, сконвертированные
 * scripts/import-freedict-dict.mjs → server/dictionaries/<src>-<dst>.json).
 * Покрывают пары, где у локального Викисловаря нет статей (en→ru и т.п.).
 */
const DICT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dictionaries',
);
const bilingualDictCache = new Map();

function loadBilingualDict(src, dst) {
  const key = `${src}-${dst}`;
  if (bilingualDictCache.has(key)) return bilingualDictCache.get(key);
  let dict = null;
  try {
    dict = JSON.parse(fs.readFileSync(path.join(DICT_DIR, `${key}.json`), 'utf8'));
  } catch {
    /* словаря для пары нет */
  }
  bilingualDictCache.set(key, dict);
  return dict;
}

function dictLookup(dict, word) {
  for (const w of wordCandidates(word)) {
    const e = dict[w];
    if (e?.t?.length) return { word: w, pos: e.p || '', translations: e.t };
  }
  return null;
}

const FORMATS = [
  { ext: 'epub', type: 'application/epub+zip' },
  { ext: 'txt', type: 'text/plain; charset=utf-8' },
];

function cacheFile(id, ext) {
  return path.join(CACHE_DIR, `pg${id}.${ext}`);
}

function readCache(id) {
  for (const { ext, type } of FORMATS) {
    const file = cacheFile(id, ext);
    try {
      return { buf: fs.readFileSync(file), type };
    } catch {
      /* no cache */
    }
  }
  return null;
}

function writeCache(id, ext, buf) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile(id, ext), buf);
  } catch (e) {
    console.warn('[reader] cache write failed:', e?.message);
  }
}

async function fetchBook(id) {
  for (const { ext, type } of FORMATS) {
    const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.${ext}`;
    let r;
    try {
      r = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'follow',
        headers: { 'User-Agent': 'Seashell-Reader/1.0 (language-learning app)' },
      });
    } catch (e) {
      console.error('[reader] upstream fetch failed:', e?.message);
      return null;
    }
    if (r.status === 404) continue;
    if (!r.ok) {
      console.error('[reader] upstream', r.status, url);
      continue;
    }
    const len = Number(r.headers.get('content-length') ?? 0);
    if (len > MAX_BOOK_BYTES) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BOOK_BYTES) return null;
    if (!buf.length) continue;
    return { buf, type, ext };
  }
  return null;
}

function defineCacheFile(word, src, dst) {
  const key = crypto.createHash('sha1').update(`${dst}|${src}|${word}`).digest('hex');
  return path.join(CACHE_DIR, 'define', `${key}.json`);
}

/**
 * Google Translate (неофициальный gtx-эндпоинт, тот же что у веб-клиента).
 * Переводит словоформы сразу («spelled», «counsellors») и отдаёт
 * основной перевод + альтернативы по частям речи (dt=bd).
 * @returns {Promise<{main: string, alternatives: string[]}|null>}
 */
async function googleTranslate(word, src, dst) {
  const tl = GOOGLE_TL[dst] ?? 'en';
  const sl = GOOGLE_SL[src] ?? src ?? 'auto';
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&dt=bd&q=${encodeURIComponent(word)}`;
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Seashell-Reader/1.0 (language-learning app)' },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const main = (Array.isArray(data?.[0]) ? data[0] : [])
      .map((seg) => String(seg?.[0] ?? ''))
      .join('')
      .trim();
    const alternatives = [];
    for (const block of Array.isArray(data?.[1]) ? data[1] : []) {
      for (const tr of Array.isArray(block?.[1]) ? block[1] : []) {
        const s = String(tr ?? '').trim();
        if (s && s.toLowerCase() !== main.toLowerCase() && !alternatives.includes(s)) {
          alternatives.push(s);
        }
        if (alternatives.length >= 6) break;
      }
      if (alternatives.length >= 6) break;
    }
    if (!main) return null;
    return { main, alternatives };
  } catch {
    return null;
  }
}

/**
 * MyMemory (translated.net) — фолбэк, когда с серверного IP
 * Google Translate недоступен (Google банит датацентровые адреса).
 * Бесплатный анонимный лимит ~5k запросов/день на IP.
 */
async function myMemoryTranslate(text, src, dst) {
  const tl = GOOGLE_TL[dst] ?? 'en';
  const sl = GOOGLE_SL[src] ?? src ?? 'en';
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`;
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Seashell-Reader/1.0 (language-learning app)' },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const main = String(data?.responseData?.translatedText ?? '').trim();
    if (!main || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(main)) return null;
    const alternatives = [];
    for (const m of Array.isArray(data?.matches) ? data.matches : []) {
      const s = String(m?.translation ?? '').trim();
      if (s && s.toLowerCase() !== main.toLowerCase() && !alternatives.includes(s)) {
        alternatives.push(s);
      }
      if (alternatives.length >= 4) break;
    }
    return { main, alternatives };
  } catch {
    return null;
  }
}

/** Наши коды UI-локалей → целевой язык Google Translate. */
const GOOGLE_TL = {
  ru: 'ru', en: 'en', de: 'de', es: 'es', fr: 'fr', it: 'it',
  pt: 'pt', tr: 'tr', ja: 'ja', zh: 'zh-CN', ko: 'ko', nl: 'nl', pl: 'pl',
  ar: 'ar', fa: 'fa', uk: 'uk',
};

/** Коды языка книги → sl (Google понимает и наши локали; иначе auto). */
const GOOGLE_SL = { zh: 'zh-CN' };

function kaikkiUrl(edition, word) {
  const c1 = word.slice(0, 1);
  const c2 = word.slice(0, 2);
  return (
    `https://kaikki.org/${edition}/All%20languages%20combined` +
    `/meaning/${encodeURIComponent(c1)}/${encodeURIComponent(c2)}/${encodeURIComponent(word)}.jsonl`
  );
}

function wordCandidates(word) {
  const out = [word];
  const lower = word.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  if (lower !== word) out.push(lower);
  if (capitalized !== word && capitalized !== lower) out.push(capitalized);
  return out;
}

/** Одна строка JSONL → компактная запись для попапа. */
function entryToResult(e) {
  const senses = Array.isArray(e?.senses) ? e.senses : [];
  const glosses = [];
  const examples = [];
  for (const s of senses) {
    for (const g of s.glosses || []) {
      const gClean = String(g).trim();
      if (gClean && glosses.length < 8) glosses.push(gClean);
    }
    if (examples.length < 2) {
      const ex = (s.examples || []).find((x) => x?.text);
      if (ex) {
        examples.push({
          text: String(ex.text).slice(0, 300),
          translation: ex.translation || ex.english || null,
        });
      }
    }
  }
  if (!glosses.length) return null;
  const ipa = (e.sounds || []).find((s) => s?.ipa)?.ipa || null;
  return {
    lang: e.lang || e.lang_code || '',
    langCode: e.lang_code || '',
    pos: e.pos || '',
    ipa,
    glosses,
    examples,
  };
}

async function fetchKaikkiJsonl(url) {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'Seashell-Reader/1.0 (language-learning app)' },
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/** form_of в сырой записи wiktextract: senses[].form_of[0].word = лемма. */
function entryFormOf(entry) {
  for (const s of entry?.senses || []) {
    const w = s?.form_of?.[0]?.word;
    if (w) return { lemma: String(w), form: String((s.glosses || [])[0] || '') };
  }
  return null;
}

/**
 * Поиск слова в kaikki-издании. Возвращает {word, entries, formOf} или null.
 * src (lang_code) фильтрует записи; без него отдаём все языки.
 */
async function lookupKaikki(word, src, edition) {
  for (const candidate of wordCandidates(word)) {
    const raw = await fetchKaikkiJsonl(kaikkiUrl(edition, candidate));
    if (!raw) continue;
    const all = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    if (!all.length) continue;

    const matching = src ? all.filter((e) => e.lang_code === src) : all;
    const picked = matching.length ? matching : all;
    const entries = picked.map(entryToResult).filter(Boolean).slice(0, 4);
    const formOf = entryFormOf(picked[0]);
    if (!entries.length && !formOf) continue;
    return { word: candidate, entries, formOf, edition };
  }
  return null;
}

/**
 * Полный резолв слова: прямой lookup → form-of → лемма,
 * с фолбэком на английское издание (enwikt — самое полное,
 * у локальных изданий часто нет страниц для словоформ).
 */
async function resolveDefine(word, src, edition) {
  const fb = edition === 'dictionary' ? null : 'dictionary';

  let hit = await lookupKaikki(word, src, edition);
  if (hit?.formOf?.lemma && hit.formOf.lemma !== hit.word) {
    const lemma =
      (await lookupKaikki(hit.formOf.lemma, src, edition)) ||
      (fb && (await lookupKaikki(hit.formOf.lemma, src, fb)));
    if (lemma?.entries?.length) {
      return { word: hit.word, lemma: lemma.word, form: hit.formOf.form, entries: lemma.entries };
    }
  }
  if (hit?.entries?.length) return { word: hit.word, entries: hit.entries };

  if (fb) {
    hit = await lookupKaikki(word, src, fb);
    if (hit?.formOf?.lemma && hit.formOf.lemma !== hit.word) {
      const lemma =
        (await lookupKaikki(hit.formOf.lemma, src, edition)) ||
        (await lookupKaikki(hit.formOf.lemma, src, fb));
      if (lemma?.entries?.length) {
        return { word: hit.word, lemma: lemma.word, form: hit.formOf.form, entries: lemma.entries };
      }
    }
    if (hit?.entries?.length) return { word: hit.word, entries: hit.entries };
  }
  return null;
}

export function registerReaderRoutes(app) {
  const limit = makeRateLimiter({
    windowMs: 60_000,
    max: 20,
    keyFn: (req) => `reader:${req.vkUserId ?? req.ip ?? 'anon'}`,
  });

  app.get('/api/reader/book', limit, async (req, res) => {
    const id = Number.parseInt(String(req.query.gutenbergId ?? ''), 10);
    if (!Number.isInteger(id) || id < 1 || id > 99_999_999) {
      return res.status(400).json({ error: 'Invalid book id' });
    }

    const cached = readCache(id);
    if (cached) {
      res.setHeader('Content-Type', cached.type);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buf);
    }

    const fetched = await fetchBook(id);
    if (!fetched) return res.status(404).json({ error: 'Book not found' });
    writeCache(id, fetched.ext, fetched.buf);
    res.setHeader('Content-Type', fetched.type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(fetched.buf);
  });

  /**
   * GET /api/reader/define?word=&src=&dst=
   * Поиск слова в Викисловаре через kaikki.org (CC BY-SA).
   * src — язык книги (lang_code), dst — язык глоссов (издание Викисловаря, UI locale).
   * Без src возвращаем записи всех языков, с src — фильтруем, иначе отдаём все.
   */
  const defineLimit = makeRateLimiter({
    windowMs: 60_000,
    max: 60,
    keyFn: (req) => `define:${req.vkUserId ?? req.ip ?? 'anon'}`,
  });

  app.get('/api/reader/define', defineLimit, async (req, res) => {
    const word = String(req.query.word ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!word || word.length > MAX_DEFINE_WORD_LEN) {
      return res.status(400).json({ error: 'Invalid word' });
    }
    const src = String(req.query.src ?? '').trim().toLowerCase();
    const dst = String(req.query.dst ?? '').trim().toLowerCase();
    const edition = KAIKKI_EDITION[dst] || 'dictionary';
    // Фразы (phrasal verbs, предложения) идут только в переводчик — в Викисловаре их нет.
    const isPhrase = /\s/.test(word);

    // В кэше — только вики-данные (entries). Переводы запрашиваем всегда
    // свежие: иначе единичный сбой Google навсегда отрезал бы перевод.
    let payload = null;
    const cacheFile = defineCacheFile(word, src, dst);
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      payload = {
        word: cached.word ?? word,
        lemma: cached.lemma ?? null,
        form: cached.form ?? null,
        src: src || null,
        dst: edition,
        entries: cached.entries ?? [],
      };
    } catch {
      /* no cache */
    }

    if (!payload) {
      const found = isPhrase ? null : await resolveDefine(word, src, edition);
      payload = {
        word: found?.word ?? word,
        lemma: found?.lemma ?? null,
        form: found?.form ?? null,
        src: src || null,
        dst: edition,
        entries: found?.entries ?? [],
      };
      try {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify(payload));
      } catch {
        /* cache write failed */
      }
    }

    // 1) Google Translate → 2) MyMemory (фолбэк, если Google банит IP сервера).
    const gt =
      (await googleTranslate(word, src || null, dst)) ||
      (await myMemoryTranslate(word, src || null, dst));
    const translations = [];
    if (gt) {
      translations.push(gt.main, ...gt.alternatives);
      payload.translationsSource = 'google';
    }

    // 3) Локальный двуязычный словарь (en-ru и др.) — дополняем, только для слов.
    const dict = src && !isPhrase ? loadBilingualDict(src, dst) : null;
    if (dict) {
      const hitDict = dictLookup(dict, payload.word) ||
        (payload.lemma ? dictLookup(dict, payload.lemma) : null);
      if (hitDict) {
        payload.dictPos = hitDict.pos;
        for (const tr of hitDict.translations) {
          if (tr && !translations.some((x) => x.toLowerCase() === tr.toLowerCase())) {
            translations.push(tr);
          }
        }
      }
    }
    if (translations.length) payload.translations = translations.slice(0, 8);

    return res.json(payload);
  });

  // --- Мои книги: файлы, присланные боту (Desktop-обход для file input) ---
  const myBooksLimit = makeRateLimiter({
    windowMs: 60_000,
    max: 60,
    keyFn: (req) => `mybooks:${req.vkUserId ?? req.ip ?? 'anon'}`,
  });

  app.get('/api/reader/my-books', myBooksLimit, (req, res) => {
    res.json({ books: listUserBooks(req.vkUserId) });
  });

  app.get('/api/reader/my-books/:id', myBooksLimit, (req, res) => {
    const hit = getUserBookFile(req.vkUserId, req.params.id);
    if (!hit) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(hit.entry.name)}`,
    );
    return res.sendFile(hit.file);
  });

  app.delete('/api/reader/my-books/:id', myBooksLimit, (req, res) => {
    const ok = deleteUserBook(req.vkUserId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  });
}
