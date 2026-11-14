/**
 * Словарь: список слов, сеты, карточка, генерация/обновление примеров,
 * неправильные глаголы и импорт их в словарь.
 */
import {
  dictionaryGenerationCacheMeta,
  listWords,
  listWordsInSet,
  getWordWithExamples,
  getCachedWordGeneration,
  insertWordWithExamples,
  replaceExamplesForWord,
  deleteWord,
  findWordByLemma,
  saveCachedWordGeneration,
  listSets,
  createSet,
  renameSet,
  deleteSetAndOrphanWords,
  replaceWordSets,
  listRandomQuoteExamples,
} from '../db.js';
import { insertCustomExample } from '../customExamplesDb.js';
import {
  generateWordExamples,
  generateCustomWordExample,
  generateIrregularVerbExamples,
  resolveHeadwordEnQuick,
} from '../llmClient.js';
import {
  assertRefreshAccess,
  assertWordsAccess,
  chargeRefreshCredit,
  chargeWordCredit,
} from '../entitlements.js';
import { assertAllowedUserContent } from '../contentPolicy.js';
import { enqueueLlm } from '../llmQueue.js';
import { resolveLlmProvider } from '../llmProvider.js';
import { normalizeContentLocale } from '../promptLocales.js';
import { resolveTargetLang } from '../targetLang.js';
import {
  isDictionaryGenerationReady,
  wordInputLooksLikeStudyLanguage,
} from '../dictionaryStudyLang.js';
import { isPayloadValidForContentLocale } from '../localeValidation.js';
import { isHeadwordValidForInput } from '../dictionaryInputMode.js';
import {
  appendIrregularVerbExampleBatch,
  getMixedIrregularVerbExamples,
  irregularVerbBatchCount,
} from '../irregularVerbsDb.js';
import { getIrregularVerbById } from '../irregularVerbsManifest.js';
import { buildDictionaryPayloadFromIrregularVerb } from '../irregularVerbDictionaryImport.js';
import {
  getWordsQuotaStatus,
  makeRateLimiter,
  normalizeWord,
  resolveContentLocale,
  respondDatabaseError,
  sendGenerationError,
} from '../routeHelpers.js';

const limitGeneration = makeRateLimiter({
  windowMs: 60_000,
  max: 6,
  keyFn: (req) => `gen:${req.vkUserId}`,
});

function dictionaryCacheHit(requestWord, contentLocale, cached, targetLang = 'en') {
  if (!cached) return false;
  if (!isPayloadValidForContentLocale(contentLocale, cached)) return false;
  if (!isHeadwordValidForInput(requestWord, cached.headwordEn, targetLang)) {
    console.warn(
      `[dict] cache skip: phrase "${requestWord}" stored as single keyword "${cached.headwordEn}"`,
    );
    return false;
  }
  return true;
}

async function generateDictionaryPayload(word, contentLocale, targetLang = 'en') {
  const meta = dictionaryGenerationCacheMeta(contentLocale, targetLang);
  const cached = await getCachedWordGeneration(word, meta);
  if (dictionaryCacheHit(word, contentLocale, cached, targetLang)) {
    return { payload: cached, source: 'cache' };
  }

  return enqueueLlm(async () => {
    const cachedAfterWait = await getCachedWordGeneration(word, meta);
    if (dictionaryCacheHit(word, contentLocale, cachedAfterWait, targetLang)) {
      return { payload: cachedAfterWait, source: 'cache' };
    }

    const generated = await generateWordExamples(word, { contentLocale, targetLang });
    await saveCachedWordGeneration(word, generated, meta);
    if (
      generated.headwordEn &&
      normalizeWord(generated.headwordEn).toLowerCase() !== normalizeWord(word).toLowerCase() &&
      isHeadwordValidForInput(word, generated.headwordEn, targetLang)
    ) {
      await saveCachedWordGeneration(generated.headwordEn, generated, meta);
    }
    return { payload: generated, source: resolveLlmProvider() };
  }, {
    label: `dictionary:${word}:${meta.contentLocale}:${meta.targetLang}`,
  });
}

async function handleRefreshExamples(req, res) {
  const accessMode = await assertRefreshAccess(req, res);
  if (!accessMode) return;
  const idFromParam =
    req.params?.id != null && req.params.id !== '' ? parseInt(req.params.id, 10) : NaN;
  const idFromBody =
    req.body?.wordId != null || req.body?.id != null
      ? parseInt(String(req.body.wordId ?? req.body.id), 10)
      : NaN;
  const id =
    Number.isFinite(idFromParam) && idFromParam > 0 ? idFromParam : idFromBody;
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid word id' });
  }
  const targetLang = resolveTargetLang(req);
  try {
    const row = await getWordWithExamples(req.vkUserId, id, targetLang);
    if (!row) {
      return res.status(404).json({ error: 'Not found' });
    }
    const pol = assertAllowedUserContent(row.word);
    if (!pol.ok) return res.status(400).json({ error: pol.error });
    if (!isDictionaryGenerationReady(targetLang)) {
      return res.status(501).json({
        error: 'Dictionary generation for this language is not available yet',
        code: 'TARGET_LANG_NOT_READY',
      });
    }
    const contentLocale = resolveContentLocale(req);
    const previousTexts = (row.examples || [])
      .filter((ex) => !ex.is_custom)
      .map((ex) => ex.text)
      .filter(Boolean);
    const generated = await enqueueLlm(
      () => generateWordExamples(row.word, { contentLocale, targetLang, avoidExamples: previousTexts }),
      {
      label: `dictionary-refresh:${row.word}`,
    },
    );
    await saveCachedWordGeneration(
      row.word,
      generated,
      dictionaryGenerationCacheMeta(contentLocale, targetLang),
      { variant: `refresh:${Date.now()}` },
    );
    const saved = await replaceExamplesForWord(req.vkUserId, id, generated, contentLocale);
    if (accessMode === 'credits') {
      await chargeRefreshCredit(req.vkUserId);
    }
    res.json(saved);
  } catch (e) {
    console.error(e);
    sendGenerationError(res, req, e);
  }
}

async function irregularVerbExamplesPayload(verbId, contentLocale) {
  const mixed = await getMixedIrregularVerbExamples(verbId, contentLocale);
  const batchCount = await irregularVerbBatchCount(verbId, contentLocale);
  return {
    ...mixed,
    batchCount,
    verbId: parseInt(String(verbId), 10),
    contentLocale: normalizeContentLocale(contentLocale),
  };
}

async function irregularVerbDictionaryImport(verbId, contentLocale) {
  const id = parseInt(String(verbId), 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw Object.assign(new Error('Invalid verb id'), { status: 400 });
  }
  const verb = getIrregularVerbById(id);
  if (!verb) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }
  const mixed = await getMixedIrregularVerbExamples(id, contentLocale);
  if (mixed.needsGeneration || !Array.isArray(mixed.examples) || mixed.examples.length === 0) {
    throw Object.assign(new Error('Generate irregular verb examples first'), { status: 409 });
  }
  const payload = buildDictionaryPayloadFromIrregularVerb(verb, mixed, contentLocale);
  if (!payload.examples.length) {
    throw Object.assign(new Error('Generate irregular verb examples first'), { status: 409 });
  }
  return { verb, payload };
}

/**
 * Блэклист негативных тем для цитат на главной. Покрывает англ. текст примера
 * и рус. перевод — остальные локали полагаются на тон-заметку в промпте генерации.
 */
const QUOTE_NEGATIVE_RE = new RegExp(
  '\\b(death|die[ds]?|dying|dead|kill(?:ed|ing|s)?|murder|wars?|hate[ds]?|hatred|sad(?:ly|ness)?|' +
    'cry|cried|crying|tears?|pain(?:ful|s)?|sick(?:ness)?|illness|disease|fever|fail(?:ed|s|ure)?|' +
    'fear(?:ed|ful|s)?|afraid|angry|anger|stupid|dumb|ugly|alone|lonely|nightmare|blood(?:y)?|' +
    'wound(?:ed|s)?|poison(?:ous)?|crime|criminal|guns?|weapon|suffer(?:ed|ing|s)?|grief|' +
    'funeral|graves?|bur(?:y|ied)|mourn|cruel|evil|hell|depress(?:ed|ion|ing)?|anxiety|anxious|' +
    'stress(?:ed|ful)?|worr(?:y|ied|ies)|terrible|horrible|awful|disaster|accident|crash(?:ed)?|' +
    'injur(?:y|ed|ies)|hurts?|hurt(?:ing)?|vomit|cancer|virus|plague|poverty|debts?|prison|jail|' +
    'arrest(?:ed)?|punish(?:ed|ment)?|guilty|shame(?:ful)?|embarrass(?:ed|ing)?|regret(?:ted|s)?|' +
    'defeat(?:ed)?|enem(?:y|ies)|attack(?:ed|s)?|bombs?|shoot|shot|corpse|suicide|addict(?:ed|ion)?|' +
    'drunk|alcohol|cigarette|smok(?:e|ing)|divorce|betray(?:ed|al)?|liar|lied|lying|cheat(?:ed|ing|s)?|' +
    'steal|stole|stolen|thie(?:f|ves)|rage|furious|scream(?:ed|ing)?|destroy(?:ed)?|ruin(?:ed|s)?|' +
    'broken|breakup|floods?|danger(?:ous)?|trap(?:ped)?|victim|abuse(?:d)?|toxic|rot(?:ten)?|' +
    'mold|garbage|boring|bored|annoying|worst|worse)\\b',
  'i',
);

const QUOTE_NEGATIVE_RU_RE =
  /(смерт|умира|умерл|убий|войн|ненави|груст|печал|сл[её]з|плачу?т|болезн|страх|боял|одинок|кошмар|кров|ранен|рана|яд|преступ|оружи|страда|похорон|могил|жесток|депресс|тревог|ужас|катастроф|авари|рак\b|бедн|тюрьм|арест|наказ|виноват|стыд|позор|поражен|враг|атак|бомб|труп|наркот|алкогол|пьян|сигарет|развод|предал|лж[её]т|вор(?:уют|овал|ы)?|краж|гнев|кричи|руин|пожар|наводнен|голод|угроз|опасн|ловушк|жертв|грязн|мусор|скучн|гадк|дурак|тупиц|несчаст)/i;

function isNegativeQuote(text) {
  const s = String(text ?? '');
  if (!s) return false;
  return QUOTE_NEGATIVE_RE.test(s) || QUOTE_NEGATIVE_RU_RE.test(s);
}

/** Обрезает хвост пометок регистра « — … » / «(…)» в конце перевода. */
function stripRegisterTail(translation) {
  let out = String(translation ?? '');
  out = out.replace(/\s*—\s*(?:formal|informal|lit\.|fig\.|coll\.|slang|разг\.|устар\.|книжн\.|офиц\.|перен\.|букв\.)[^—]*$/iu, '');
  out = out.replace(/\s*(?:\([^)]*\)\s*)+$/, '');
  return out.trim();
}

export function registerDictionaryRoutes(app) {
  // --- Цитаты для главной: случайные сгенерированные примеры, только без негатива ---
  app.get('/api/dictionary/quotes', async (req, res) => {
    try {
      const targetLang = resolveTargetLang(req);
      const rows = await listRandomQuoteExamples(req.vkUserId, targetLang, 80);
      const quotes = [];
      const seen = new Set();
      for (const row of rows) {
        const text = String(row.text ?? '').trim();
        // Короткие цитаты: длинные не влезают в шапку и обрезаются клэмпом.
        if (!text || text.length > 110) continue;
        const translation = stripRegisterTail(String(row.translation ?? '').trim());
        if (translation.length > 120) continue;
        if (isNegativeQuote(text) || isNegativeQuote(translation)) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        quotes.push({ text, translation, word: String(row.word ?? '').trim() });
        if (quotes.length >= 8) break;
      }
      res.json({ quotes });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  // --- Словарь: список, карточка, добавление, удаление, обновление примеров ---
  app.get('/api/words', async (req, res) => {
    try {
      const targetLang = resolveTargetLang(req);
      const setIdRaw = req.query?.setId;
      const setId = setIdRaw != null && setIdRaw !== '' ? parseInt(String(setIdRaw), 10) : NaN;
      const rows =
        Number.isFinite(setId) && setId > 0
          ? await listWordsInSet(req.vkUserId, setId, targetLang)
          : await listWords(req.vkUserId, targetLang);
      res.json({ words: rows, targetLang });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  // --- Сеты слов ---
  app.get('/api/sets', async (req, res) => {
    try {
      const targetLang = resolveTargetLang(req);
      const rows = await listSets(req.vkUserId, targetLang);
      res.json({ sets: rows, targetLang });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.post('/api/sets', async (req, res) => {
    const name = String(req.body?.name ?? '').trim().replace(/\s+/g, ' ');
    if (!name || name.length > 80) {
      return res.status(400).json({ error: 'Invalid name' });
    }
    const pol = assertAllowedUserContent(name);
    if (!pol.ok) return res.status(400).json({ error: pol.error });
    const targetLang = resolveTargetLang(req);
    try {
      const created = await createSet(req.vkUserId, name, targetLang);
      res.status(201).json(created);
    } catch (e) {
      console.error(e);
      // unique violation
      if (String(e?.code) === '23505') {
        return res.status(409).json({ error: 'Set already exists' });
      }
      respondDatabaseError(res, e);
    }
  });

  app.patch('/api/sets/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const name = String(req.body?.name ?? '').trim().replace(/\s+/g, ' ');
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
    if (!name || name.length > 80) return res.status(400).json({ error: 'Invalid name' });
    const pol = assertAllowedUserContent(name);
    if (!pol.ok) return res.status(400).json({ error: pol.error });
    const targetLang = resolveTargetLang(req);
    try {
      const updated = await renameSet(req.vkUserId, id, name, targetLang);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (e) {
      console.error(e);
      if (String(e?.code) === '23505') {
        return res.status(409).json({ error: 'Set already exists' });
      }
      respondDatabaseError(res, e);
    }
  });

  app.delete('/api/sets/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
    const targetLang = resolveTargetLang(req);
    try {
      const r = await deleteSetAndOrphanWords(req.vkUserId, id, targetLang);
      if (!r.deleted) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true, removedWordIds: r.removedWordIds });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.get('/api/words/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const targetLang = resolveTargetLang(req);
      const row = await getWordWithExamples(req.vkUserId, id, targetLang);
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(row);
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.put('/api/words/:id/sets', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Invalid word id' });
    const setIds = Array.isArray(req.body?.setIds) ? req.body.setIds : [];
    const targetLang = resolveTargetLang(req);
    try {
      const row = await getWordWithExamples(req.vkUserId, id, targetLang);
      if (!row) return res.status(404).json({ error: 'Not found' });
      const out = await replaceWordSets(req.vkUserId, id, setIds);
      if (!out) return res.status(404).json({ error: 'Not found' });
      res.json({ setIds: out });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  /** Два URL: короткий — для совместимости; длинный — как в REST. */
  app.post('/api/refresh-examples', limitGeneration, handleRefreshExamples);
  app.post('/api/words/:id/refresh-examples', limitGeneration, handleRefreshExamples);

  app.post('/api/words/:id/custom-examples', limitGeneration, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid word id' });
    }
    const nativeText = String(req.body?.nativeText ?? req.body?.text ?? '').trim();
    if (!nativeText || nativeText.length > 2000) {
      return res.status(400).json({ error: 'Invalid native text' });
    }
    const pol = assertAllowedUserContent(nativeText);
    if (!pol.ok) return res.status(400).json({ error: pol.error });

    let accessMode;
    try {
      const quota = await getWordsQuotaStatus(req.vkUserId);
      accessMode = await assertWordsAccess(req, res, quota);
      if (!accessMode) return;
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to check limits' });
    }

    try {
      const targetLang = resolveTargetLang(req);
      const row = await getWordWithExamples(req.vkUserId, id, targetLang);
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (!isDictionaryGenerationReady(targetLang)) {
        return res.status(501).json({
          error: 'Dictionary generation for this language is not available yet',
          code: 'TARGET_LANG_NOT_READY',
        });
      }
      const contentLocale = resolveContentLocale(req);
      const generated = await enqueueLlm(
        () => generateCustomWordExample(row.word, nativeText, { contentLocale, targetLang }),
        { label: `dictionary-custom:${row.word}` },
      );
      await insertCustomExample(req.vkUserId, id, generated);
      const saved = await getWordWithExamples(req.vkUserId, id, targetLang);
      if (!saved) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (accessMode === 'credits') {
        await chargeWordCredit(req.vkUserId);
      }
      res.status(201).json(saved);
    } catch (e) {
      if (e?.code === 'CUSTOM_EXAMPLE_LIMIT') {
        return res.status(429).json({ error: 'Custom example limit reached' });
      }
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.get('/api/irregular-verbs/:id/examples', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid verb id' });
    }
    const verb = getIrregularVerbById(id);
    if (!verb) return res.status(404).json({ error: 'Not found' });
    const contentLocale = resolveContentLocale(req);
    try {
      res.json(await irregularVerbExamplesPayload(id, contentLocale));
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.post('/api/irregular-verbs/:id/examples/generate', limitGeneration, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid verb id' });
    }
    const verb = getIrregularVerbById(id);
    if (!verb) return res.status(404).json({ error: 'Not found' });
    const contentLocale = resolveContentLocale(req);
    try {
      const mixed = await getMixedIrregularVerbExamples(id, contentLocale);
      if (!mixed.needsGeneration) {
        return res.json({ ...(await irregularVerbExamplesPayload(id, contentLocale)), source: 'cache' });
      }

      let accessMode;
      try {
        const quota = await getWordsQuotaStatus(req.vkUserId);
        accessMode = await assertWordsAccess(req, res, quota);
        if (!accessMode) return;
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to check limits' });
      }

      const generated = await enqueueLlm(
        () => generateIrregularVerbExamples(verb, { contentLocale }),
        { label: `irregular-verb:${id}:${normalizeContentLocale(contentLocale)}` },
      );
      await appendIrregularVerbExampleBatch(id, contentLocale, generated.examples);
      if (accessMode === 'credits') {
        await chargeWordCredit(req.vkUserId);
      }
      res.json({ ...(await irregularVerbExamplesPayload(id, contentLocale)), source: resolveLlmProvider() });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.post('/api/irregular-verbs/:id/examples/refresh', limitGeneration, async (req, res) => {
    const accessMode = await assertRefreshAccess(req, res);
    if (!accessMode) return;
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid verb id' });
    }
    const verb = getIrregularVerbById(id);
    if (!verb) return res.status(404).json({ error: 'Not found' });
    const contentLocale = resolveContentLocale(req);
    try {
      const generated = await enqueueLlm(
        () => generateIrregularVerbExamples(verb, { contentLocale }),
        { label: `irregular-verb-refresh:${id}:${normalizeContentLocale(contentLocale)}` },
      );
      await appendIrregularVerbExampleBatch(id, contentLocale, generated.examples);
      if (accessMode === 'credits') {
        await chargeRefreshCredit(req.vkUserId);
      }
      res.json({ ...(await irregularVerbExamplesPayload(id, contentLocale)), source: resolveLlmProvider() });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.post('/api/words', limitGeneration, async (req, res) => {
    let accessMode;
    try {
      const quota = await getWordsQuotaStatus(req.vkUserId);
      accessMode = await assertWordsAccess(req, res, quota);
      if (!accessMode) return;
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to check limits' });
    }

    const word = normalizeWord(req.body?.word);
    const irregularVerbId = parseInt(String(req.body?.irregularVerbId ?? ''), 10);
    const importFromIrregularVerb = Number.isFinite(irregularVerbId) && irregularVerbId > 0;

    if (!importFromIrregularVerb && (!word || word.length > 200)) {
      return res.status(400).json({ error: 'Invalid word' });
    }
    if (!importFromIrregularVerb) {
      const pol = assertAllowedUserContent(word);
      if (!pol.ok) return res.status(400).json({ error: pol.error });
    }

    try {
      const targetLang = resolveTargetLang(req);
      const contentLocale = resolveContentLocale(req);

      if (!isDictionaryGenerationReady(targetLang)) {
        return res.status(501).json({
          error: 'Dictionary generation for this language is not available yet',
          code: 'TARGET_LANG_NOT_READY',
        });
      }

      if (importFromIrregularVerb) {
        let importData;
        try {
          importData = await irregularVerbDictionaryImport(irregularVerbId, contentLocale);
        } catch (e) {
          const status = e?.status ?? 500;
          if (status !== 500) {
            return res.status(status).json({ error: e.message || 'Import failed' });
          }
          throw e;
        }
        const { verb, payload } = importData;
        const lemma = normalizeWord(verb.infinitive);
        if (word && normalizeWord(word) !== lemma) {
          return res.status(400).json({ error: 'Word mismatch' });
        }
        if (!lemma || lemma.length > 200) {
          return res.status(400).json({ error: 'Invalid word' });
        }
        const polLemma = assertAllowedUserContent(lemma);
        if (!polLemma.ok) return res.status(400).json({ error: polLemma.error });

        if (await findWordByLemma(req.vkUserId, lemma, contentLocale, targetLang)) {
          return res.status(409).json({ error: 'Word already exists', existingWord: lemma, contentLocale, targetLang });
        }

        console.log(
          `[dict] import irregularVerbId=${irregularVerbId} lemma="${lemma}" contentLocale=${contentLocale} targetLang=${targetLang}`,
        );
        const saved = await insertWordWithExamples(req.vkUserId, lemma, payload, contentLocale, targetLang);
        if (accessMode === 'credits') {
          await chargeWordCredit(req.vkUserId);
        }
        return res.status(201).json({ ...saved, generationSource: 'irregular-verb-cache' });
      }

      if (await findWordByLemma(req.vkUserId, word, contentLocale, targetLang)) {
        return res.status(409).json({ error: 'Word already exists', existingWord: word, contentLocale, targetLang });
      }

      if (importFromIrregularVerb && targetLang !== 'en') {
        return res.status(400).json({ error: 'Irregular verbs import is English module only' });
      }

      if (!wordInputLooksLikeStudyLanguage(word, contentLocale, targetLang)) {
        const previewLemma = normalizeWord(
          await enqueueLlm(() => resolveHeadwordEnQuick(word, contentLocale, targetLang), {
            label: `headword-preview:${word}`,
          }),
        );
        if (previewLemma) {
          const existing = await findWordByLemma(req.vkUserId, previewLemma, contentLocale, targetLang);
          if (existing) {
            return res.status(409).json({
              error: 'Word already exists',
              existingWord: previewLemma,
              contentLocale,
              targetLang,
            });
          }
        }
      }

      console.log(
        `[dict] add word="${word}" contentLocale=${contentLocale} targetLang=${targetLang} hdr=${req.headers['x-content-locale'] ?? '-'} body=${req.body?.contentLocale ?? '-'}`,
      );
      const { payload: generated, source } = await generateDictionaryPayload(word, contentLocale, targetLang);
      const lemma = normalizeWord(generated.headwordEn);
      if (!lemma || lemma.length > 200) {
        return res.status(400).json({ error: 'Invalid word' });
      }
      const polLemma = assertAllowedUserContent(lemma);
      if (!polLemma.ok) return res.status(400).json({ error: polLemma.error });

      if (await findWordByLemma(req.vkUserId, lemma, contentLocale, targetLang)) {
        return res.status(409).json({ error: 'Word already exists', existingWord: lemma, contentLocale, targetLang });
      }

      const { headwordEn: _drop, ...payload } = generated;
      const saved = await insertWordWithExamples(req.vkUserId, lemma, payload, contentLocale, targetLang);
      if (accessMode === 'credits') {
        await chargeWordCredit(req.vkUserId);
      }
      res.status(201).json({ ...saved, generationSource: source });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.delete('/api/words/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const targetLang = resolveTargetLang(req);
      const row = await getWordWithExamples(req.vkUserId, id, targetLang);
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      const ok = await deleteWord(req.vkUserId, id);
      if (!ok) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.status(204).send();
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });
}
