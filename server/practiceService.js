import {
  createPracticeSession,
  getPracticeSession,
  insertPracticeExchange,
  insertPracticeOpeningMessage,
  listPracticeMessages,
  prunePracticeMessages,
  setPracticeSessionPatternSeed,
  setPracticeSessionSummary,
} from './practiceDb.js';
import {
  buildPracticeLlmContext,
  applyClientHistoryFallback,
  practiceRowsToTurns,
} from './practiceContext.js';
import { updatePracticeDialogueSummary } from './practiceSummary.js';
import {
  generatePracticeExpertTurn,
  generatePracticePatternTurn,
  generatePracticeTurn,
  generatePracticeWordTurn,
} from './llmClient.js';
import { isValidExpertIdFormat, resolvePracticeExpert, PRACTICE_EXPERT_START_MARKER } from './practiceExperts.js';
import { normalizeContentLocale } from './promptLocales.js';
import { normalizeTargetLang } from './targetLang.js';
import { getWordWithExamples } from './db.js';

async function resolveSession({
  vkUserId,
  sessionId,
  mode,
  expertId,
  targetWordId,
  contentLocale,
  targetLang,
}) {
  const study = normalizeTargetLang(targetLang ?? 'en');
  if (sessionId) {
    const existing = await getPracticeSession(vkUserId, sessionId);
    if (!existing) {
      const err = new Error('Session not found');
      err.status = 404;
      throw err;
    }
    if (existing.mode !== mode) {
      const err = new Error('Session mode mismatch');
      err.status = 400;
      throw err;
    }
    if (existing.target_lang && normalizeTargetLang(existing.target_lang) !== study) {
      const err = new Error('Session study language mismatch');
      err.status = 400;
      throw err;
    }
    if (mode === 'expert' && expertId && existing.expert_id && existing.expert_id !== expertId) {
      const err = new Error('Expert mismatch for this session');
      err.status = 400;
      throw err;
    }
    if (mode === 'word' && targetWordId && existing.target_word_id != null) {
      const existingWordId = Number(existing.target_word_id);
      const requestedWordId = Number(targetWordId);
      if (
        Number.isFinite(existingWordId) &&
        Number.isFinite(requestedWordId) &&
        existingWordId !== requestedWordId
      ) {
        const err = new Error('Word mismatch for this session');
        err.status = 400;
        throw err;
      }
    }
    return existing;
  }
  if (mode === 'expert' && !isValidExpertIdFormat(expertId)) {
    const err = new Error('Invalid expert role');
    err.status = 400;
    throw err;
  }
  if (mode === 'word' && (!Number.isFinite(targetWordId) || targetWordId <= 0)) {
    const err = new Error('Invalid word id');
    err.status = 400;
    throw err;
  }
  return createPracticeSession({
    vkUserId,
    mode,
    expertId: mode === 'expert' ? expertId : null,
    targetWordId: mode === 'word' ? targetWordId : null,
    contentLocale,
    targetLang: study,
  });
}

async function loadLlmContext(session) {
  const rows = await listPracticeMessages(session.id);
  return buildPracticeLlmContext(rows, session.dialogue_summary);
}

async function persistAfterTurn(session, { isStart, userText, turn }) {
  if (isStart) {
    await insertPracticeOpeningMessage(session.id, { reply: turn.reply, replyTts: turn.replyTts ?? null });
  } else {
    await insertPracticeExchange(session.id, {
      userText,
      echo: turn.echo,
      corrections: turn.corrections,
      reply: turn.reply,
      replyTts: turn.replyTts ?? null,
    });
  }

  const pruned = await prunePracticeMessages(session.id);
  if (pruned.length) {
    const newSummary = await updatePracticeDialogueSummary({
      previousSummary: session.dialogue_summary,
      foldedMessages: pruned,
      mode: session.mode,
      expertId: session.expert_id,
      targetWord: session.target_word_id,
      patternSeed: session.pattern_seed,
      targetLang: session.target_lang,
    });
    await setPracticeSessionSummary(session.id, newSummary);
    session.dialogue_summary = newSummary;
  }
}

export async function runFreePracticeTurn({
  vkUserId,
  userText,
  sessionId,
  contentLocale,
  clientHistory,
  targetLang,
}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeTargetLang(targetLang ?? 'en');
  const session = await resolveSession({
    vkUserId,
    sessionId,
    mode: 'free',
    contentLocale: locale,
    targetLang: study,
  });
  const ctx = applyClientHistoryFallback(
    await loadLlmContext(session),
    clientHistory,
  );

  const turn = await generatePracticeTurn({
    userText,
    dialogueSummary: ctx.summary,
    historyBlock: ctx.historyBlock,
    contentLocale: locale,
    targetLang: study,
  });

  await persistAfterTurn(session, { isStart: false, userText, turn });

  const rows = await listPracticeMessages(session.id);
  return {
    sessionId: session.id,
    echo: turn.echo || userText,
    corrections: turn.corrections,
    reply: turn.reply,
    turns: practiceRowsToTurns(rows),
  };
}

export async function runExpertPracticeTurn({
  vkUserId,
  userText,
  expertId,
  sessionId,
  contentLocale,
  targetLang,
}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeTargetLang(targetLang ?? 'en');
  if (!isValidExpertIdFormat(expertId)) {
    const err = new Error('Invalid expert role');
    err.status = 400;
    throw err;
  }

  const expert = await resolvePracticeExpert(expertId, vkUserId);
  if (!expert) {
    const err = new Error('Expert not found');
    err.status = 404;
    throw err;
  }

  const isStart = String(userText).trim() === PRACTICE_EXPERT_START_MARKER;
  const session = await resolveSession({
    vkUserId,
    sessionId,
    mode: 'expert',
    expertId,
    contentLocale: locale,
    targetLang: study,
  });

  if (isStart) {
    const existingRows = await listPracticeMessages(session.id);
    if (existingRows.length > 0) {
      return {
        sessionId: session.id,
        echo: null,
        corrections: null,
        reply: existingRows.at(-1).reply,
        turns: practiceRowsToTurns(existingRows),
      };
    }
  }

  const ctx = await loadLlmContext(session);

  const turn = await generatePracticeExpertTurn({
    userText,
    dialogueSummary: ctx.summary,
    historyBlock: ctx.historyBlock,
    contentLocale: locale,
    expert,
    targetLang: study,
  });

  await persistAfterTurn(session, { isStart, userText, turn });

  const rows = await listPracticeMessages(session.id);
  return {
    sessionId: session.id,
    echo: turn.echo,
    corrections: turn.corrections,
    reply: turn.reply,
    turns: practiceRowsToTurns(rows),
  };
}

export async function runWordPracticeTurn({
  vkUserId,
  userText,
  wordId,
  sessionId,
  contentLocale,
  targetLang,
}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeTargetLang(targetLang ?? 'en');

  const wordIdNum = parseInt(String(wordId), 10);
  if (!Number.isFinite(wordIdNum) || wordIdNum <= 0) {
    const err = new Error('Invalid word id');
    err.status = 400;
    throw err;
  }

  const wordRow = await getWordWithExamples(vkUserId, wordIdNum, study);
  if (!wordRow) {
    const err = new Error('Word not found');
    err.status = 404;
    throw err;
  }

  const isStart = String(userText).trim() === PRACTICE_EXPERT_START_MARKER;
  const session = await resolveSession({
    vkUserId,
    sessionId,
    mode: 'word',
    targetWordId: wordIdNum,
    contentLocale: locale,
    targetLang: study,
  });

  if (isStart) {
    const existingRows = await listPracticeMessages(session.id);
    if (existingRows.length > 0) {
      return {
        sessionId: session.id,
        word: wordRow.word,
        echo: null,
        corrections: null,
        reply: existingRows.at(-1).reply,
        turns: practiceRowsToTurns(existingRows),
      };
    }
  }

  const ctx = await loadLlmContext(session);

  const turn = await generatePracticeWordTurn({
    userText,
    dialogueSummary: ctx.summary,
    historyBlock: ctx.historyBlock,
    contentLocale: locale,
    wordMeta: wordRow,
    targetLang: study,
  });

  await persistAfterTurn(session, { isStart, userText, turn });

  const rows = await listPracticeMessages(session.id);
  return {
    sessionId: session.id,
    word: wordRow.word,
    echo: turn.echo,
    corrections: turn.corrections,
    reply: turn.reply,
    turns: practiceRowsToTurns(rows),
  };
}

export async function runPatternPracticeTurn({
  vkUserId,
  userText,
  sessionId,
  contentLocale,
  targetLang,
}) {
  const locale = normalizeContentLocale(contentLocale);
  const study = normalizeTargetLang(targetLang ?? 'en');

  const raw = String(userText ?? '').trim();
  if (!raw || raw.length > 500) {
    const err = new Error('Invalid text');
    err.status = 400;
    throw err;
  }

  const session = await resolveSession({
    vkUserId,
    sessionId,
    mode: 'pattern',
    contentLocale: locale,
    targetLang: study,
  });

  const existingRows = await listPracticeMessages(session.id);
  const isFirstTurn = existingRows.length === 0;

  let seed = String(session.pattern_seed ?? '').trim();
  if (isFirstTurn) {
    seed = raw;
    if (!session.pattern_seed) {
      await setPracticeSessionPatternSeed(session.id, seed);
      session.pattern_seed = seed;
    }
  } else if (!seed) {
    const err = new Error('Pattern session is missing anchor sentence');
    err.status = 400;
    throw err;
  }

  const ctx = await loadLlmContext(session);

  const turn = await generatePracticePatternTurn({
    userText: raw,
    dialogueSummary: ctx.summary,
    historyBlock: ctx.historyBlock,
    contentLocale: locale,
    patternSeed: seed,
    targetLang: study,
  });

  await persistAfterTurn(session, { isStart: false, userText: raw, turn });

  const rows = await listPracticeMessages(session.id);
  return {
    sessionId: session.id,
    patternSeed: seed,
    echo: turn.echo,
    corrections: turn.corrections,
    reply: turn.reply,
    turns: practiceRowsToTurns(rows),
  };
}

export async function getPracticeSessionBundle(vkUserId, sessionId) {
  const session = await getPracticeSession(vkUserId, sessionId);
  if (!session) return null;
  const rows = await listPracticeMessages(sessionId);
  return {
    session: {
      id: session.id,
      mode: session.mode,
      expertId: session.expert_id,
      targetWordId: session.target_word_id ?? null,
      patternSeed: session.pattern_seed ?? null,
      contentLocale: session.content_locale,
      targetLang: session.target_lang ?? 'en',
      updatedAt: session.updated_at,
    },
    turns: practiceRowsToTurns(rows),
  };
}
