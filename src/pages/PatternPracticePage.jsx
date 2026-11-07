import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  GroupHeader,
  Box,
  Text,
  Footnote,
  Input,
  Textarea,
  FormItem,
  Separator,
  Spinner,
  Snackbar,
  Cell,
  Button,
} from '../components/Ui.jsx';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PracticeLevelPicker } from '../components/PracticeLevelPicker.jsx';
import { SplitModalSlotContext } from '../context/SplitModalSlotContext.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PracticeBubble } from '../components/PracticeBubble.jsx';
import { PracticeEchoText } from '../components/PracticeEchoText.jsx';
import { PracticeTappableText } from '../components/PracticeTappableText.jsx';
import { StreamingPracticeReply } from '../components/StreamingPracticeReply.jsx';
import { StreamingCursor } from '../components/StreamingText.jsx';
import { AdBanner } from '../components/AdBanner.jsx';
import * as practiceApi from '../api/practiceApi.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePlatformUser } from '../hooks/usePlatformUser.js';
import { usePracticeVoiceInput } from '../hooks/usePracticeVoiceInput.js';
import { useAutofocusInput } from '../hooks/useAutofocusInput.js';
import { usePremium } from '../hooks/usePremium.js';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { setCustomBackHandler } from '../utils/backNavigation.js';
import {
  isStudySttSupported,
  isStudyTtsSupported,
  useLearnLocale,
} from '../hooks/useLearnLocale.js';
import { dictMessageForLearn, practiceStudyLangLabel } from '../utils/contentLocale.js';
import { speechLocaleForLearn } from '../utils/studySpeech.js';
import { prefetchStudyTts } from '../utils/tts.js';
import { fetchUserLimits } from '../api/userApi.js';
import { runWithAdRetry, isAdUnavailableError } from '../utils/limitsGate.js';
import { practiceUserReplyCount } from '../utils/practiceUserReplyCount.js';
import { discardEmptyPracticeSession } from '../utils/discardEmptyPracticeSession.js';
import { ListenTtsButton } from '../components/ListenTtsButton.jsx';
import { PracticeVoiceCell } from '../components/PracticeVoiceCell.jsx';
import {
  loadPatternHistoryCache,
  savePatternHistoryCache,
  upsertPatternHistoryCache,
  removePatternHistoryCache,
  patternHistoryTitle,
} from '../utils/practicePatternHistory.js';
import { loadSettings } from '../utils/settings.js';
import { getStudyModuleCode } from '../modules/learnModuleSwitch.js';
import {
  loadPatternPracticeSessionId,
  savePatternPracticeSessionId,
} from '../utils/practiceSession.js';
import { usePracticeDialogGate } from '../hooks/usePracticeDialogGate.js';

function cachePatternSession(learnLocale, session) {
  if (!session?.id) return;
  upsertPatternHistoryCache(learnLocale, {
    id: session.id,
    mode: 'pattern',
    patternSeed: session.patternSeed ?? null,
    targetLang: session.targetLang ?? learnLocale,
    updatedAt: session.updatedAt ?? Date.now(),
    createdAt: session.createdAt ?? null,
    userTurnCount: session.userTurnCount ?? null,
    lastPreview: session.lastPreview ?? null,
  });
}

export function PatternPracticePage() {
  const splitModalMount = useContext(SplitModalSlotContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('session');
  const { t: tr, tb } = useI18n();
  const learnLocale = useLearnLocale();
  const studyTtsSupported = isStudyTtsSupported(learnLocale);
  const studySttSupported = isStudySttSupported(learnLocale);
  const { error: userError, ready: vkReady } = usePlatformUser();

  const [patternSeed, setPatternSeed] = useState('');
  const [seedDraft, setSeedDraft] = useState('');
  const [turns, setTurns] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState(() => loadPatternHistoryCache(learnLocale));
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const restoredRef = useRef(false);
  const restoreGenRef = useRef(0);

  const { premium } = usePremium();
  const [, setLimits] = useState(null);
  const userReplyCount = practiceUserReplyCount(turns);
  const inDialog = turns.length > 0;
  const { idle: dialogIdle, showDialogUi, startDialog, resetDialog } = usePracticeDialogGate(turns.length, {
    booting,
  });
  const showStartButton = dialogIdle && !loading;

  useEffect(() => {
    if (vkReady && !premium) {
      fetchUserLimits().then(setLimits).catch(console.error);
    }
  }, [vkReady, premium]);

  useEffect(() => {
    if (userError) setError(userError);
  }, [userError]);

  useEffect(() => {
    setHistorySessions(loadPatternHistoryCache(learnLocale));
  }, [learnLocale]);

  const submitSeed = useCallback(
    async (raw) => {
      const sentence = String(raw).trim();
      if (!sentence || loading) return;

      setLoading(true);
      setError(null);
      setSeedDraft('');

      const sendSeed = async () => {
        const data = await practiceApi.postPatternPracticeTurn({
          userText: sentence,
          sessionId: null,
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          savePatternPracticeSessionId(learnLocale, data.sessionId);
          cachePatternSession(learnLocale, {
            id: data.sessionId,
            patternSeed: data.patternSeed ?? sentence,
            targetLang: learnLocale,
            updatedAt: Date.now(),
            userTurnCount: 1,
            lastPreview: data.reply ?? null,
          });
        }
        if (data.patternSeed) setPatternSeed(data.patternSeed);
        if (Array.isArray(data.turns)) {
          setTurns(data.turns);
        } else {
          setTurns([
            {
              opening: false,
              userText: sentence,
              echo: data.echo,
              corrections: data.corrections || null,
              reply: data.reply,
            },
          ]);
        }
        const fresh = await fetchUserLimits().catch(() => null);
        if (fresh) setLimits(fresh);
      };

      try {
        await sendSeed();
      } catch (e) {
        setError(e.message || tr('errors.sendFailed'));
        setSeedDraft(sentence);
      } finally {
        setLoading(false);
        setBooting(false);
      }
    },
    [loading, tr, learnLocale],
  );

  const restoreSession = useCallback(
    async (savedId, cancelledRef) => {
      if (!savedId) return false;
      const startedGen = restoreGenRef.current;
      try {
        const data = await practiceApi.fetchPracticeSession(savedId);
        if (
          cancelledRef?.current ||
          restoreGenRef.current !== startedGen ||
          data?.session?.mode !== 'pattern' ||
          getStudyModuleCode(data.session.targetLang) !== getStudyModuleCode(learnLocale) ||
          !Array.isArray(data.turns) ||
          data.turns.length === 0
        ) {
          if (restoreGenRef.current === startedGen) {
            savePatternPracticeSessionId(learnLocale, null);
          }
          return false;
        }
        setSessionId(savedId);
        setTurns(data.turns);
        if (data.session.patternSeed) setPatternSeed(data.session.patternSeed);
        savePatternPracticeSessionId(learnLocale, savedId);
        cachePatternSession(learnLocale, {
          id: savedId,
          patternSeed: data.session.patternSeed,
          targetLang: data.session.targetLang,
          updatedAt: data.session.updatedAt,
          userTurnCount: data.turns.filter((t) => !t.opening).length,
          lastPreview: data.turns[data.turns.length - 1]?.reply ?? null,
        });
        return true;
      } catch {
        if (restoreGenRef.current === startedGen) {
          savePatternPracticeSessionId(learnLocale, null);
        }
        return false;
      }
    },
    [learnLocale],
  );

  useEffect(() => {
    if (!vkReady) return;
    restoredRef.current = false;
    restoreGenRef.current += 1;

    const cancelled = { current: false };
    void (async () => {
      setBooting(true);
      const parsedQuery = querySessionId ? parseInt(querySessionId, 10) : null;
      const savedId =
        Number.isFinite(parsedQuery) && parsedQuery > 0
          ? parsedQuery
          : loadPatternPracticeSessionId(learnLocale);
      if (savedId) {
        const ok = await restoreSession(savedId, cancelled);
        if (!cancelled.current && ok) {
          restoredRef.current = true;
          setBooting(false);
          return;
        }
      }
      if (!cancelled.current) {
        restoredRef.current = true;
        setBooting(false);
      }
    })();

    return () => {
      cancelled.current = true;
      restoreGenRef.current += 1;
    };
  }, [vkReady, learnLocale, querySessionId, restoreSession]);

  const submitUserText = useCallback(
    async (raw) => {
      const userText = String(raw).trim();
      if (!userText || loading || !sessionId) return;

      setLoading(true);
      setError(null);
      setInput('');

      const sendTurn = async () => {
        const data = await practiceApi.postPatternPracticeTurn({
          userText,
          sessionId,
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          savePatternPracticeSessionId(learnLocale, data.sessionId);
          const turnCount = Array.isArray(data.turns)
            ? data.turns.filter((t) => !t.opening).length
            : undefined;
          cachePatternSession(learnLocale, {
            id: data.sessionId,
            patternSeed: data.patternSeed ?? patternSeed,
            targetLang: learnLocale,
            updatedAt: Date.now(),
            userTurnCount: turnCount,
            lastPreview: data.reply ?? null,
          });
        }
        if (data.patternSeed) setPatternSeed(data.patternSeed);
        if (Array.isArray(data.turns)) {
          setTurns(data.turns);
        } else {
          setTurns((prev) => [
            ...prev,
            { opening: false, userText, echo: data.echo, corrections: data.corrections || null, reply: data.reply },
          ]);
        }
        const fresh = await fetchUserLimits().catch(() => null);
        if (fresh) setLimits(fresh);
      };

      try {
        const result = await runWithAdRetry({
          type: 'practice',
          action: sendTurn,
          confirm: () => window.confirm(tr('practice.limitAdConfirm')),
          onLimitsUpdate: setLimits,
        });
        if (result === null) setInput(userText);
      } catch (e) {
        setError(isAdUnavailableError(e) ? tr('ads.unavailable') : e.message || tr('errors.sendFailed'));
        setInput(userText);
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId, tr, learnLocale, patternSeed],
  );

  const sendText = useCallback(() => {
    void submitUserText(input);
  }, [input, submitUserText]);

  const {
    voiceMode,
    voiceAvailable,
    voiceBusy,
    transcribing,
    listening,
    voiceError,
    toggleVoice,
    stopVoice,
    onVoicePointerDown,
    onVoicePointerUp,
    onVoicePointerCancel,
    onVoiceTouchStart,
    onVoiceTouchEnd,
  } = usePracticeVoiceInput({
    onTranscript: (text) => void submitUserText(text),
    blockStart: loading || booting || !inDialog || !studySttSupported,
    speechLang: speechLocaleForLearn(learnLocale),
    t: tr,
  });

  const dialogInputReady = vkReady && !booting && inDialog && !loading && !voiceBusy;
  const replyInputRef = useAutofocusInput(dialogInputReady, [
    vkReady,
    booting,
    inDialog,
    loading,
    voiceBusy,
    sessionId,
  ]);

  const handleReplyKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      if (!input.trim() || loading || booting || voiceBusy || !inDialog) return;
      void submitUserText(input);
    },
    [input, loading, booting, voiceBusy, inDialog, submitUserText],
  );

  useEffect(() => {
    if (voiceError) setError(voiceError);
  }, [voiceError]);

  useEffect(() => {
    if (loading || !studyTtsSupported || !turns.length) return;
    const last = turns[turns.length - 1];
    if (!last?.reply) return;
    prefetchStudyTts(last.reply, learnLocale, { ttsText: last.replyTts });
  }, [turns, loading, learnLocale, studyTtsSupported]);

  const startNewDialog = useCallback(() => {
    restoreGenRef.current += 1;
    stopVoice();
    void discardEmptyPracticeSession(sessionId, turns);
    savePatternPracticeSessionId(learnLocale, null);
    setSessionId(null);
    setTurns([]);
    setPatternSeed('');
    setSeedDraft('');
    setInput('');
    setBooting(false);
    setError(null);
    resetDialog();
    if (querySessionId) navigate('/practice/pattern', { replace: true });
  }, [stopVoice, sessionId, turns, learnLocale, querySessionId, navigate, resetDialog]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    const cached = loadPatternHistoryCache(learnLocale);
    if (cached.length) setHistorySessions(cached);
    try {
      const data = await practiceApi.fetchPracticeSessionsList('pattern');
      const study = getStudyModuleCode(learnLocale);
      const sessions = Array.isArray(data?.sessions)
        ? data.sessions.filter((s) => getStudyModuleCode(s.targetLang) === study).slice(0, 10)
        : [];
      setHistorySessions(sessions);
      savePatternHistoryCache(learnLocale, sessions);
    } catch (e) {
      console.error(e);
      if (!cached.length) {
        setHistorySessions([]);
        setHistoryError(e?.message || tr('errors.generic'));
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [learnLocale, tr]);

  const openHistory = useCallback(() => {
    setShowHistory(true);
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!showHistory) return undefined;
    const onPop = () => setShowHistory(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showHistory]);

  const removeHistorySession = useCallback(
    async (targetId, e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      try {
        await practiceApi.deletePracticeSession(targetId);
        setHistorySessions((prev) => prev.filter((s) => s.id !== targetId));
        removePatternHistoryCache(learnLocale, targetId);
        if (sessionId === targetId) {
          savePatternPracticeSessionId(learnLocale, null);
          setSessionId(null);
          setTurns([]);
          setPatternSeed('');
          resetDialog();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [learnLocale, sessionId, resetDialog],
  );

  const openHistorySession = useCallback(
    async (targetId) => {
      restoreGenRef.current += 1;
      setShowHistory(false);
      setBooting(true);
      setError(null);
      const ok = await restoreSession(targetId, { current: false });
      if (!ok) {
        setError(tr('errors.generic'));
        setBooting(false);
        return;
      }
      savePatternPracticeSessionId(learnLocale, targetId);
      setBooting(false);
      navigate(`/practice/pattern?session=${targetId}`, { replace: true });
    },
    [learnLocale, navigate, restoreSession, tr],
  );

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(Number(ts));
    const { locale } = loadSettings();
    return d.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleBack = useCallback(() => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    void discardEmptyPracticeSession(sessionId, turns);
    savePatternPracticeSessionId(learnLocale, null);
    navigate('/');
  }, [showHistory, navigate, sessionId, turns, learnLocale]);

  useEscapeBack(handleBack);

  useEffect(() => {
    setCustomBackHandler(handleBack);
    return () => setCustomBackHandler(null);
  }, [handleBack]);

  const speakReplyError = useCallback((msg) => {
    setSnackbar(
      <Snackbar onClose={() => setSnackbar(null)} duration={6500}>
        {msg}
      </Snackbar>,
    );
  }, []);

  const patternSegments = (
    <Group>
      <div className="seashell-segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!showHistory}
          className={`seashell-segmented__item${!showHistory ? ' is-active' : ''}`}
          onClick={() => setShowHistory(false)}
        >
          {tr('practice.patternTitle')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showHistory}
          className={`seashell-segmented__item${showHistory ? ' is-active' : ''}`}
          onClick={openHistory}
        >
          {tb('practice.history')}
        </button>
      </div>
    </Group>
  );

  return (
    <Panel>
      <PanelHeader
        before={<PanelHeaderBack onClick={handleBack} />}
        after={
          <div className="ss-panel-header__tools">
            <PracticeLevelPicker modalMount={splitModalMount} />
          </div>
        }
      >
        {tr('practice.patternTitle')}
      </PanelHeader>

      {patternSegments}

      {showHistory ? (
        <Group>
          {historyLoading ? (
            <Box className="ss-center-load">
              <Spinner />
            </Box>
          ) : historyError ? (
            <Box className="ss-vpad-cell">
              <Footnote style={{ textAlign: 'center', color: 'var(--ss-color-text-negative, #e64646)' }}>
                {historyError}
              </Footnote>
            </Box>
          ) : historySessions.length === 0 ? (
            <Box className="ss-vpad-cell">
              <Footnote style={{ textAlign: 'center' }}>{tr('practice.historyEmpty')}</Footnote>
            </Box>
          ) : (
            historySessions.map((s) => (
              <Cell
                key={s.id}
                chevron
                subtitle={formatDate(s.updatedAt)}
                onClick={() => void openHistorySession(s.id)}
                after={
                  <button
                    type="button"
                    className="ss-flat-link seashell-dict-delete-btn"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => void removeHistorySession(s.id, e)}
                  >
                    {tb('dict.delete')}
                  </button>
                }
              >
                <span dir="auto">{patternHistoryTitle(s.patternSeed)}</span>
              </Cell>
            ))
          )}
        </Group>
      ) : (
        <>
      {snackbar}

      {error && (
        <Group>
          <Box>
            <Text>{error}</Text>
          </Box>
        </Group>
      )}

      {!vkReady && !error && (
        <Box className="ss-center-load">
          <Spinner size="l" />
        </Box>
      )}

      {vkReady && (
        <>
          {patternSeed ? (
            <Group>
              <Box>
                <Footnote>{tr('practice.patternAnchor', { sentence: patternSeed })}</Footnote>
              </Box>
            </Group>
          ) : null}

          {showStartButton && (
            <Group>
              <Cell
                i18nKey="practice.startDialog"
                onClick={() => {
                  startDialog();
                  setError(null);
                }}
              />
            </Group>
          )}

          {booting && !inDialog && (
            <Box className="ss-center-load">
              <Spinner />
            </Box>
          )}

          {showDialogUi && !inDialog && !booting && (
            <Group header={<GroupHeader mode="secondary">{tr('practice.patternSeedLabel')}</GroupHeader>}>
              <FormItem>
                <Input
                  ltr
                  value={seedDraft}
                  onChange={(e) => setSeedDraft(e.target.value)}
                  placeholder={dictMessageForLearn(tr, 'practice.patternSeedPlaceholder', learnLocale)}
                  disabled={loading}
                  enterKeyHint="done"
                  autoComplete="off"
                />
              </FormItem>
              <FormItem>
                <Button
                  stretched
                  mode="primary"
                  disabled={!seedDraft.trim() || loading}
                  loading={loading}
                  onClick={() => void submitSeed(seedDraft)}
                >
                  {tr('practice.patternAnalyze')}
                </Button>
              </FormItem>
            </Group>
          )}

          {inDialog && (
            <>
              <Group className="ss-practice-action">
                <Cell i18nKey="practice.newDialog" onClick={startNewDialog} />
              </Group>

              <Group className="ss-practice-chat" header={<GroupHeader mode="secondary">{tr('practice.dialog')}</GroupHeader>}>
                {turns.map((turn, i) => (
                  <Box key={i} className="ss-practice-turn">
                    <PracticeBubble variant="user">
                    <Text weight="2" className="ss-practice-bubble__label">{tr('practice.you')}</Text>
                    <PracticeTappableText text={turn.userText} />
                    </PracticeBubble>
                    <PracticeBubble variant="meta">
                    <Text weight="2" className="ss-practice-bubble__label">{tr('practice.heard')}</Text>
                    <PracticeEchoText original={turn.userText} echo={turn.echo} />
                    {turn.corrections ? (
                      <>
                        <Text weight="2" className="ss-practice-bubble__label ss-mt-sm">{tr('practice.corrections')}</Text>
                        <Text className="ss-mt-xs" dir="auto">
                          {turn.corrections}
                        </Text>
                      </>
                    ) : null}
                    </PracticeBubble>
                    <PracticeBubble variant="partner">
                    <Text weight="2" className="ss-practice-bubble__label">{tr('practice.partner')}</Text>
                    <StreamingPracticeReply
                      text={turn.reply}
                      streamId={`pattern-${sessionId ?? 'new'}-${i}-${turn.reply}`}
                    />
                    {studyTtsSupported ? (
                      <ListenTtsButton
                        text={turn.reply}
                        ttsText={turn.replyTts}
                        ttsLocale={learnLocale}
                        stretched
                        className="ss-mt-sm"
                        onError={speakReplyError}
                      />
                    ) : null}
                    </PracticeBubble>
                  </Box>
                ))}
                {loading && (
                  <Box className="ss-practice-compose">
                    <StreamingCursor />
                  </Box>
                )}
              </Group>

              <Group className="ss-practice-compose-bar" header={<GroupHeader mode="secondary">{tr('practice.yourReply')}</GroupHeader>}>
                <FormItem top={practiceStudyLangLabel(tr, learnLocale)}>
                  <Textarea
                    ref={replyInputRef}
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    className="ss-textarea ss-textarea--ltr ss-textarea--compact"
                    disabled={loading || voiceBusy}
                    enterKeyHint="send"
                  />
                </FormItem>
                <FormItem>
                  <Cell disabled={!input.trim() || loading || voiceBusy} onClick={sendText}>
                    {tr('practice.reply')}
                  </Cell>
                  {studySttSupported ? (
                    <PracticeVoiceCell
                      tr={tr}
                      tb={tb}
                      voiceMode={voiceMode}
                      voiceAvailable={voiceAvailable}
                      transcribing={transcribing}
                      listening={listening}
                      voiceBusy={voiceBusy}
                      blockStart={loading || booting || !inDialog}
                      toggleVoice={toggleVoice}
                      onVoicePointerDown={onVoicePointerDown}
                      onVoicePointerUp={onVoicePointerUp}
                      onVoicePointerCancel={onVoicePointerCancel}
                      onVoiceTouchStart={onVoiceTouchStart}
                      onVoiceTouchEnd={onVoiceTouchEnd}
                    />
                  ) : null}
                </FormItem>
              </Group>

              <AdBanner refreshKey={userReplyCount} enabled />
            </>
          )}
        </>
      )}
        </>
      )}
    </Panel>
  );
}
