/**
 * GET /api/reader/book?gutenbergId=N — прокси до Project Gutenberg cache.
 * Только публичные-домен книги: ID строго числовой, upstream ограничен gutenberg.org.
 * Ответы кэшируются на диск, чтобы не дёргать Gutenberg на каждый запрос.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { makeRateLimiter } from '../routeHelpers.js';

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
};

const MAX_DEFINE_WORD_LEN = 60;

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

function defineCacheFile(word, src, edition) {
  const key = crypto.createHash('sha1').update(`${edition}|${src}|${word}`).digest('hex');
  return path.join(CACHE_DIR, 'define', `${key}.json`);
}

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

    const cacheFile = defineCacheFile(word, src, edition);
    try {
      const cached = fs.readFileSync(cacheFile, 'utf8');
      return res.json(JSON.parse(cached));
    } catch {
      /* no cache */
    }

    const found = await resolveDefine(word, src, edition);
    const payload = {
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
    return res.json(payload);
  });
}
