/**
 * Разговорная практика: ходы диалога через LLM, сессии, пользовательские эксперты.
 */
import {
  getPracticeSessionBundle,
  runExpertPracticeTurn,
  runFreePracticeTurn,
  runPatternPracticeTurn,
  runWordPracticeTurn,
} from '../practiceService.js';
import { listPracticeSessions, deletePracticeSession } from '../practiceDb.js';
import {
  listUserPracticeExperts,
  resolveExpertDisplayTitle,
  createUserPracticeExpert,
  updateUserPracticeExpert,
  deleteUserPracticeExpert,
  parseUserExpertId,
} from '../userPracticeExperts.js';
import { isValidExpertIdFormat, PRACTICE_EXPERT_START_MARKER } from '../practiceExperts.js';
import { assertPracticeAccess, chargePracticeCredit } from '../entitlements.js';
import { assertAllowedUserContent } from '../contentPolicy.js';
import { enqueueLlm } from '../llmQueue.js';
import { resolveTargetLang } from '../targetLang.js';
import {
  getPracticeQuotaStatus,
  makeRateLimiter,
  mapPracticeSessionRow,
  normalizeWord,
  resolveContentLocale,
  resolvePracticeLevel,
  resolveUiLocale,
  respondDatabaseError,
  sendGenerationError,
} from '../routeHelpers.js';

const limitPractice = makeRateLimiter({
  windowMs: 60_000,
  max: 10,
  keyFn: (req) => `practice:${req.vkUserId}`,
});

export function registerPracticeRoutes(app) {
  app.post('/api/practice/turn', limitPractice, async (req, res) => {
    let accessMode;
    try {
      const quota = await getPracticeQuotaStatus(req.vkUserId);
      accessMode = await assertPracticeAccess(req, res, quota);
      if (!accessMode) return;
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to check limits' });
    }

    const userText = normalizeWord(req.body?.userText ?? req.body?.text ?? '');
    if (!userText || userText.length > 4000) {
      return res.status(400).json({ error: 'Invalid text' });
    }
    const pol = assertAllowedUserContent(userText);
    if (!pol.ok) return res.status(400).json({ error: pol.error });
    const sessionIdRaw = req.body?.sessionId;
    const sessionId =
      sessionIdRaw != null && String(sessionIdRaw).trim() !== ''
        ? parseInt(String(sessionIdRaw), 10)
        : null;
    const contentLocale = resolveContentLocale(req);
    const targetLang = resolveTargetLang(req);
    const practiceLevel = resolvePracticeLevel(req);
    const clientHistory = Array.isArray(req.body?.history) ? req.body.history : null;
    try {
      const out = await enqueueLlm(
        () =>
          runFreePracticeTurn({
            vkUserId: req.vkUserId,
            userText,
            sessionId: Number.isFinite(sessionId) ? sessionId : null,
            contentLocale,
            clientHistory,
            targetLang,
            practiceLevel,
          }),
        {
          label: `practice:${req.vkUserId}`,
        },
      );
      if (accessMode === 'credits') {
        await chargePracticeCredit(req.vkUserId);
      }
      res.json({
        sessionId: out.sessionId,
        echo: out.echo,
        corrections: out.corrections,
        reply: out.reply,
        turns: out.turns,
      });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.get('/api/practice/sessions', async (req, res) => {
    try {
      const modeRaw = String(req.query?.mode ?? '').trim();
      const mode =
        modeRaw === 'free' || modeRaw === 'expert' || modeRaw === 'word' || modeRaw === 'pattern'
          ? modeRaw
          : undefined;
      const uiLocale = resolveUiLocale(req);
      const sessions = await listPracticeSessions(req.vkUserId, { mode });
      const mapped = await Promise.all(
        sessions.map(async (row) => ({
          ...mapPracticeSessionRow(row),
          expertTitle: row.expert_id
            ? await resolveExpertDisplayTitle(row.expert_id, req.vkUserId, uiLocale)
            : null,
        })),
      );
      res.json({ sessions: mapped });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.get('/api/practice/sessions/:id', async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session id' });
    }
    try {
      const bundle = await getPracticeSessionBundle(req.vkUserId, id);
      if (!bundle) return res.status(404).json({ error: 'Session not found' });
      if (bundle.session?.expertId) {
        bundle.session.expertTitle = await resolveExpertDisplayTitle(
          bundle.session.expertId,
          req.vkUserId,
          resolveUiLocale(req),
        );
      }
      res.json(bundle);
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.delete('/api/practice/sessions/:id', async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid session id' });
    }
    try {
      const ok = await deletePracticeSession(req.vkUserId, id);
      if (!ok) return res.status(404).json({ error: 'Session not found' });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.get('/api/practice/experts', async (req, res) => {
    try {
      const experts = await listUserPracticeExperts(req.vkUserId);
      res.json({ experts });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.post('/api/practice/experts', async (req, res) => {
    try {
      const expert = await createUserPracticeExpert(req.vkUserId, req.body ?? {});
      res.status(201).json({ expert });
    } catch (e) {
      console.error(e);
      if (e.status === 400) return res.status(400).json({ error: e.message });
      respondDatabaseError(res, e);
    }
  });

  app.patch('/api/practice/experts/:id', async (req, res) => {
    const raw = String(req.params.id ?? '').trim();
    const expertId = raw.startsWith('u') ? raw : `u${raw}`;
    if (!parseUserExpertId(expertId)) {
      return res.status(400).json({ error: 'Invalid expert id' });
    }
    try {
      const expert = await updateUserPracticeExpert(req.vkUserId, expertId, req.body ?? {});
      res.json({ expert });
    } catch (e) {
      console.error(e);
      if (e.status === 404) return res.status(404).json({ error: e.message });
      if (e.status === 400) return res.status(400).json({ error: e.message });
      respondDatabaseError(res, e);
    }
  });

  app.delete('/api/practice/experts/:id', async (req, res) => {
    const raw = String(req.params.id ?? '').trim();
    const expertId = raw.startsWith('u') ? raw : `u${raw}`;
    if (!parseUserExpertId(expertId)) {
      return res.status(400).json({ error: 'Invalid expert id' });
    }
    try {
      const ok = await deleteUserPracticeExpert(req.vkUserId, expertId);
      if (!ok) return res.status(404).json({ error: 'Expert not found' });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      respondDatabaseError(res, e);
    }
  });

  app.post('/api/practice/expert/turn', limitPractice, async (req, res) => {
    const rawText = String(req.body?.userText ?? req.body?.text ?? '').trim();
    const isStart = rawText === PRACTICE_EXPERT_START_MARKER;

    let accessMode = 'bypass';
    if (!isStart) {
      try {
        const quota = await getPracticeQuotaStatus(req.vkUserId);
        accessMode = await assertPracticeAccess(req, res, quota);
        if (!accessMode) return;
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to check limits' });
      }
    }

    const contentLocale = resolveContentLocale(req);
    const targetLang = resolveTargetLang(req);
    const practiceLevel = resolvePracticeLevel(req);
    const expertId = String(req.body?.expertId ?? req.body?.expertRole ?? '').trim();
    if (!isValidExpertIdFormat(expertId)) {
      return res.status(400).json({ error: 'Invalid expert role' });
    }
    if (!isStart && (!rawText || rawText.length > 4000)) {
      return res.status(400).json({ error: 'Invalid text' });
    }
    if (!isStart) {
      const pol = assertAllowedUserContent(rawText);
      if (!pol.ok) return res.status(400).json({ error: pol.error });
    }
    const userText = isStart ? PRACTICE_EXPERT_START_MARKER : rawText;
    const sessionIdRaw = req.body?.sessionId;
    const sessionId =
      sessionIdRaw != null && String(sessionIdRaw).trim() !== ''
        ? parseInt(String(sessionIdRaw), 10)
        : null;
    try {
      const out = await enqueueLlm(
        () =>
          runExpertPracticeTurn({
            vkUserId: req.vkUserId,
            userText,
            expertId,
            sessionId: Number.isFinite(sessionId) ? sessionId : null,
            contentLocale,
            targetLang,
            practiceLevel,
          }),
        {
          label: `practice-expert:${expertId}:${req.vkUserId}`,
        },
      );
      if (!isStart && accessMode === 'credits') {
        await chargePracticeCredit(req.vkUserId);
      }
      res.json({
        sessionId: out.sessionId,
        echo: out.echo,
        corrections: out.corrections,
        reply: out.reply,
        turns: out.turns,
      });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.post('/api/practice/word/turn', limitPractice, async (req, res) => {
    const contentLocale = resolveContentLocale(req);
    const targetLang = resolveTargetLang(req);
    const practiceLevel = resolvePracticeLevel(req);

    const rawText = String(req.body?.userText ?? req.body?.text ?? '').trim();
    const isStart = rawText === PRACTICE_EXPERT_START_MARKER;

    let accessMode = 'bypass';
    if (!isStart) {
      try {
        const quota = await getPracticeQuotaStatus(req.vkUserId);
        accessMode = await assertPracticeAccess(req, res, quota);
        if (!accessMode) return;
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to check limits' });
      }
    }

    const wordId = parseInt(String(req.body?.wordId ?? ''), 10);
    if (!Number.isFinite(wordId) || wordId <= 0) {
      return res.status(400).json({ error: 'Invalid word id' });
    }
    if (!isStart && (!rawText || rawText.length > 4000)) {
      return res.status(400).json({ error: 'Invalid text' });
    }
    if (!isStart) {
      const pol = assertAllowedUserContent(rawText);
      if (!pol.ok) return res.status(400).json({ error: pol.error });
    }

    const userText = isStart ? PRACTICE_EXPERT_START_MARKER : rawText;
    const sessionIdRaw = req.body?.sessionId;
    const sessionId =
      sessionIdRaw != null && String(sessionIdRaw).trim() !== ''
        ? parseInt(String(sessionIdRaw), 10)
        : null;

    try {
      const out = await enqueueLlm(
        () =>
          runWordPracticeTurn({
            vkUserId: req.vkUserId,
            userText,
            wordId,
            sessionId: Number.isFinite(sessionId) ? sessionId : null,
            contentLocale,
            targetLang,
            practiceLevel,
          }),
        {
          label: `practice-word:${wordId}:${req.vkUserId}`,
        },
      );
      if (!isStart && accessMode === 'credits') {
        await chargePracticeCredit(req.vkUserId);
      }
      res.json({
        sessionId: out.sessionId,
        word: out.word,
        echo: out.echo,
        corrections: out.corrections,
        reply: out.reply,
        turns: out.turns,
      });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });

  app.post('/api/practice/pattern/turn', limitPractice, async (req, res) => {
    const contentLocale = resolveContentLocale(req);
    const targetLang = resolveTargetLang(req);
    const practiceLevel = resolvePracticeLevel(req);

    const rawText = String(req.body?.userText ?? req.body?.text ?? '').trim();
    const sessionIdRaw = req.body?.sessionId;
    const sessionId =
      sessionIdRaw != null && String(sessionIdRaw).trim() !== ''
        ? parseInt(String(sessionIdRaw), 10)
        : null;

    const isSeedTurn = !Number.isFinite(sessionId) || sessionId <= 0;

    let accessMode = 'bypass';
    if (!isSeedTurn) {
      try {
        const quota = await getPracticeQuotaStatus(req.vkUserId);
        accessMode = await assertPracticeAccess(req, res, quota);
        if (!accessMode) return;
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to check limits' });
      }
    }

    if (!rawText || rawText.length > 500) {
      return res.status(400).json({ error: 'Invalid text' });
    }
    const pol = assertAllowedUserContent(rawText);
    if (!pol.ok) return res.status(400).json({ error: pol.error });

    try {
      const out = await enqueueLlm(
        () =>
          runPatternPracticeTurn({
            vkUserId: req.vkUserId,
            userText: rawText,
            sessionId: Number.isFinite(sessionId) ? sessionId : null,
            contentLocale,
            targetLang,
            practiceLevel,
          }),
        {
          label: `practice-pattern:${req.vkUserId}`,
        },
      );
      if (!isSeedTurn && accessMode === 'credits') {
        await chargePracticeCredit(req.vkUserId);
      }
      res.json({
        sessionId: out.sessionId,
        patternSeed: out.patternSeed,
        echo: out.echo,
        corrections: out.corrections,
        reply: out.reply,
        turns: out.turns,
      });
    } catch (e) {
      console.error(e);
      sendGenerationError(res, req, e);
    }
  });
}
