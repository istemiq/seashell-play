import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  GroupHeader,
  Box,
  Text,
  Footnote,
  Textarea,
  FormItem,
  Spinner,
  Snackbar,
  Button,
  Cell,
} from '../components/Ui.jsx';

/**
 * Панель «Разговорная практика»:
 * - ввод текста и отправка на `/api/practice/turn`;
 * - опционально голос (Web Speech API: распознавание в браузере);
 * - отображение хода: что сказал пользователь, как поняла модель, правки, реплика бота;
 * - озвучка ответа через speechSynthesis (бесплатно, на устройстве пользователя).
 */
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PracticeLevelPicker } from '../components/PracticeLevelPicker.jsx';
import { PracticeBubble } from '../components/PracticeBubble.jsx';
import { SplitModalSlotContext } from '../context/SplitModalSlotContext.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PracticeEchoText } from '../components/PracticeEchoText.jsx';
import { PracticeTappableText } from '../components/PracticeTappableText.jsx';
import { StreamingPracticeReply } from '../components/StreamingPracticeReply.jsx';
import { StreamingCursor } from '../components/StreamingText.jsx';
import { AdBanner } from '../components/AdBanner.jsx';
import { PracticeDictionaryAddBar } from '../components/PracticeDictionaryAddBar.jsx';
import { usePracticeDictionaryAdd } from '../hooks/usePracticeDictionaryAdd.js';
import * as practiceApi from '../api/practiceApi.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePlatformUser } from '../hooks/usePlatformUser.js';
import { usePracticeVoiceInput } from '../hooks/usePracticeVoiceInput.js';
import { useAutofocusInput } from '../hooks/useAutofocusInput.js';
import { usePremium } from '../hooks/usePremium.js';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { setCustomBackHandler } from '../utils/backNavigation.js';
import { useLearnLocale, isStudyTtsSupported, isStudySttSupported } from '../hooks/useLearnLocale.js';
import { fetchUserLimits } from '../api/userApi.js';
import { runWithAdRetry, isAdUnavailableError } from '../utils/limitsGate.js';
import { practiceUserReplyCount } from '../utils/practiceUserReplyCount.js';
import { discardEmptyPracticeSession } from '../utils/discardEmptyPracticeSession.js';
import { loadSettings } from '../utils/settings.js';
import { ListenTtsButton } from '../components/ListenTtsButton.jsx';
import { PracticeVoiceCell } from '../components/PracticeVoiceCell.jsx';
import { dictMessageForLearn, practiceStudyLangLabel } from '../utils/contentLocale.js';
import { speechLocaleForLearn } from '../utils/studySpeech.js';
import { prefetchStudyTts } from '../utils/tts.js';
import {
  loadFreePracticeSessionId,
  saveFreePracticeSessionId,
} from '../utils/practiceSession.js';
import { usePracticeDialogGate } from '../hooks/usePracticeDialogGate.js';

function turnPickKey(turnIndex, field) {
  return `${turnIndex}:${field}`;
}


export function PracticePage() {
  const splitModalMount = useContext(SplitModalSlotContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('session');
  const { t: tr, tb } = useI18n();
  const learnLocale = useLearnLocale();
  const studyTtsSupported = isStudyTtsSupported(learnLocale);
  const studySttSupported = isStudySttSupported(learnLocale);
  const { userId, error: userError, ready: vkReady } = usePlatformUser();
  const [turns, setTurns] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const { premium } = usePremium();
  const [limits, setLimits] = useState(null);
  const userReplyCount = practiceUserReplyCount(turns);
  const { idle: dialogIdle, showDialogUi, startDialog, resetDialog } = usePracticeDialogGate(turns.length, {
    booting: restoring,
  });
  const showStartButton = dialogIdle && !loading;

  const showDictNotice = useCallback((msg, duration = 2500) => {
    setNotice(msg);
    setSnackbar(
      <Snackbar onClose={() => setSnackbar(null)} duration={duration}>
        {msg}
      </Snackbar>,
    );
  }, []);

  const { selectWord, pickWord, clearWordPick, getBlockState, addTextToDictionary } = usePracticeDictionaryAdd({
    tr,
    onLimitsUpdate: setLimits,
    onSuccess: (word) => showDictNotice(tr('errors.dictAdded', { word }), 2200),
    onError: (msg) => showDictNotice(msg, 3000),
  });

  useEffect(() => {
    if (vkReady && !premium) {
      fetchUserLimits().then(setLimits).catch(console.error);
    }
  }, [vkReady, premium]);

  useEffect(() => {
    if (userError) setError(userError);
  }, [userError]);

  useEffect(() => {
    if (!vkReady) return;
    let cancelled = false;
    void (async () => {
      setRestoring(true);
      const savedId = querySessionId ? parseInt(querySessionId, 10) : loadFreePracticeSessionId();
      if (!savedId) {
        if (!cancelled) setRestoring(false);
        return;
      }
      try {
        const data = await practiceApi.fetchPracticeSession(savedId);
        if (cancelled) return;
        if (data?.session?.mode === 'free' && Array.isArray(data.turns)) {
          setSessionId(savedId);
          setTurns(data.turns);
        } else {
          saveFreePracticeSessionId(null);
        }
      } catch {
        if (!cancelled) saveFreePracticeSessionId(null);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vkReady, querySessionId]);

  const startChat = useCallback(() => {
    startDialog();
    setError(null);
  }, [startDialog]);


  const submitUserText = useCallback(
    async (raw) => {
      const userText = String(raw).trim();
      if (!userText || loading) return;

      setLoading(true);
      setError(null);
      setInput('');

      const sendTurn = async () => {
        const data = await practiceApi.postPracticeTurn({
          userText,
          sessionId,
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          saveFreePracticeSessionId(data.sessionId);
        }
        if (Array.isArray(data.turns)) {
          setTurns(data.turns);
        } else {
          setTurns((prev) => [
            ...prev,
            {
              opening: false,
              userText,
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
        const result = await runWithAdRetry({
          type: 'practice',
          action: sendTurn,
          confirm: () =>
            window.confirm(
              tr('practice.limitAdConfirm') ||
                'Daily practice limit reached. Watch a short ad to get 3 more replies?',
            ),
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
    [loading, sessionId, tr],
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
    blockStart: loading || !showDialogUi || !studySttSupported,
    speechLang: speechLocaleForLearn(learnLocale),
    t: tr,
  });

  const dialogInputReady = vkReady && !restoring && !showHistory && showDialogUi && !loading && !voiceBusy;
  const replyInputRef = useAutofocusInput(dialogInputReady, [
    vkReady,
    restoring,
    showHistory,
    showDialogUi,
    loading,
    voiceBusy,
    sessionId,
  ]);

  const handleReplyKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      if (!input.trim() || loading || voiceBusy || !showDialogUi) return;
      void submitUserText(input);
    },
    [input, loading, voiceBusy, showDialogUi, submitUserText],
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

  // Новый ход → доскроллить чат до последнего ответа (не трогаем при чтении истории).
  const lastTurnCountRef = useRef(0);
  useEffect(() => {
    const prev = lastTurnCountRef.current;
    lastTurnCountRef.current = turns.length;
    if (!turns.length || turns.length === prev) return;
    const panel = document.querySelector('.ss-panel');
    panel?.scrollTo?.({ top: panel.scrollHeight, behavior: 'smooth' });
  }, [turns.length]);

  const startNewDialog = useCallback(() => {
    stopVoice();
    void discardEmptyPracticeSession(sessionId, turns);
    saveFreePracticeSessionId(null);
    setSessionId(null);
    setTurns([]);
    setInput('');
    clearWordPick();
    setError(null);
    resetDialog();
  }, [stopVoice, sessionId, turns, resetDialog, clearWordPick]);

  const removeHistorySession = useCallback(
    async (targetId, e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      try {
        await practiceApi.deletePracticeSession(targetId);
        setHistorySessions((prev) => prev.filter((s) => s.id !== targetId));
        if (sessionId === targetId) {
          saveFreePracticeSessionId(null);
          setSessionId(null);
          setTurns([]);
          resetDialog();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [sessionId, resetDialog],
  );

  const speakReplyError = useCallback(
    (msg) => {
      showDictNotice(msg, 6500);
    },
    [showDictNotice],
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await practiceApi.fetchPracticeSessionsList('free');
      if (Array.isArray(data?.sessions)) {
        setHistorySessions(data.sessions.slice(0, 10));
      } else {
        setHistorySessions([]);
      }
    } catch (e) {
      console.error(e);
      setHistorySessions([]);
      setHistoryError(e?.message || tr('errors.generic'));
    } finally {
      setHistoryLoading(false);
    }
  }, [tr]);

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

  const handleBack = useCallback(() => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    void discardEmptyPracticeSession(sessionId, turns);
    saveFreePracticeSessionId(null);
    navigate('/');
  }, [showHistory, navigate, sessionId, turns]);

  useEscapeBack(handleBack);

  useEffect(() => {
    setCustomBackHandler(handleBack);
    return () => setCustomBackHandler(null);
  }, [handleBack]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(Number(ts));
    const { locale } = loadSettings();
    return d.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const practiceSegments = (
    <Group className="ss-practice-tabs">
      <div className="seashell-segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!showHistory}
          className={`seashell-segmented__item${!showHistory ? ' is-active' : ''}`}
          onClick={() => setShowHistory(false)}
        >
          {tb('practice.hubFree')}
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
        after={<PracticeLevelPicker modalMount={splitModalMount} />}
      >
        {tr('practice.hubFree')}
      </PanelHeader>

      {practiceSegments}

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
                onClick={() => {
                  setShowHistory(false);
                  navigate(`/practice/chat?session=${s.id}`);
                }}
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
                {tr('practice.hubFree')}
              </Cell>
            ))
          )}
        </Group>
      ) : (
        <>
      {snackbar}

      {notice && (
        <Group>
          <Footnote>{notice}</Footnote>
        </Group>
      )}

      {!vkReady && !error && (
        <Box className="ss-center-load">
          <Spinner size="l" />
        </Box>
      )}

      {vkReady && restoring && (
        <Box className="ss-center-load">
          <Spinner />
        </Box>
      )}

      {error && (
        <Group>
          <Box>
            <Text>{error}</Text>
          </Box>
        </Group>
      )}

      {vkReady && !restoring && (
        <>
          {showStartButton && (
            <Group className="ss-practice-action">
              <Cell i18nKey="practice.startDialog" onClick={startChat} />
            </Group>
          )}

          {turns.length > 0 && (
            <Group className="ss-practice-action">
              <Cell i18nKey="practice.newDialog" onClick={startNewDialog} />
            </Group>
          )}

          {showDialogUi && (
          <Group className="ss-practice-chat" header={<GroupHeader mode="secondary">{tr('practice.dialog')}</GroupHeader>}>

            {turns.length === 0 && (
              <Box className="seashell-inline-action-row">
                <Text style={{ flex: 1 }}>{dictMessageForLearn(tr, 'practice.empty', learnLocale)}</Text>

              </Box>
            )}
            {turns.map((turn, i) => {
              const userKey = turnPickKey(i, 'user');
              const echoKey = turnPickKey(i, 'echo');
              const replyKey = turnPickKey(i, 'reply');
              const userBlock = getBlockState(userKey);
              const echoBlock = getBlockState(echoKey);
              const replyBlock = getBlockState(replyKey);

              return (
              <Box key={i} className="ss-practice-turn">
                <PracticeBubble variant="user">
                <Text weight="2" className="ss-practice-bubble__label">{tr('practice.you')}</Text>
                <PracticeTappableText
                  text={turn.userText}
                  selectedWord={userBlock.selectedWord}
                  loadingWord={userBlock.loading ? userBlock.loadingWord : null}
                  addedWord={userBlock.addedWord}
                  onSelectWord={(word) => selectWord(userKey, word)}
                />
                <PracticeDictionaryAddBar
                  selectedWord={userBlock.selectedWord}
                  loading={userBlock.loading}
                  addedWord={userBlock.addedWord}
                  onAdd={() => void addTextToDictionary(pickWord(userKey, turn.userText), userKey)}
                  showTapHint={i === 0}
                />
                </PracticeBubble>
                <PracticeBubble variant="meta">
                <Text weight="2" className="ss-practice-bubble__label">{tr('practice.heard')}</Text>
                <PracticeEchoText
                  original={turn.userText}
                  echo={turn.echo}
                  selectedWord={echoBlock.selectedWord}
                  loadingWord={echoBlock.loading ? echoBlock.loadingWord : null}
                  addedWord={echoBlock.addedWord}
                  onSelectWord={(word) => selectWord(echoKey, word)}
                />
                <PracticeDictionaryAddBar
                  selectedWord={echoBlock.selectedWord}
                  loading={echoBlock.loading}
                  addedWord={echoBlock.addedWord}
                  onAdd={() => void addTextToDictionary(pickWord(echoKey, turn.echo), echoKey)}
                />
                {turn.corrections ? (
                  <>
                    <Text weight="2" className="ss-practice-bubble__label ss-mt-sm">{tr('practice.corrections')}</Text>
                    <Text className="ss-mt-xs" dir="auto">{turn.corrections}</Text>
                  </>
                ) : null}
                </PracticeBubble>
                <PracticeBubble variant="partner">
                <Text weight="2" className="ss-practice-bubble__label">{tr('practice.partner')}</Text>
                <StreamingPracticeReply
                  text={turn.reply}
                  streamId={`free-${sessionId ?? 'new'}-${i}-${turn.reply}`}
                  enabled={i === turns.length - 1}
                  selectedWord={replyBlock.selectedWord}
                  loadingWord={replyBlock.loading ? replyBlock.loadingWord : null}
                  addedWord={replyBlock.addedWord}
                  onSelectWord={(word) => selectWord(replyKey, word)}
                />
                <PracticeDictionaryAddBar
                  selectedWord={replyBlock.selectedWord}
                  loading={replyBlock.loading}
                  addedWord={replyBlock.addedWord}
                  onAdd={() => void addTextToDictionary(pickWord(replyKey, turn.reply), replyKey)}
                />
                {studyTtsSupported ? (
                  <ListenTtsButton text={turn.reply} ttsText={turn.replyTts} ttsLocale={learnLocale} className="ss-mt-sm" onError={speakReplyError} />
                ) : null}
                </PracticeBubble>
              </Box>
            );
            })}
            {loading && (
              <Box
                className={turns.length ? 'ss-practice-compose' : 'ss-practice-compose ss-practice-compose--empty'}
              >
                {turns.length ? <StreamingCursor /> : <Spinner />}
              </Box>
            )}
          </Group>
          )}

          {showDialogUi && (
          <Group className="ss-practice-compose-bar" header={<GroupHeader mode="secondary">{tr('practice.yourReply')}</GroupHeader>}>
            <FormItem top={practiceStudyLangLabel(tr, learnLocale)}>
              <Textarea
                ref={replyInputRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                className="ss-textarea ss-textarea--ltr"
                disabled={loading || voiceBusy}
                enterKeyHint="send"
              />
            </FormItem>
            <FormItem>
              <Button
                stretched
                mode="primary"
                disabled={!input.trim() || loading || voiceBusy || !showDialogUi}
                onClick={() => {
                  if (!input.trim() || loading || voiceBusy || !showDialogUi) return;
                  void sendText();
                }}
              >
                {tr('practice.reply')}
              </Button>
              {studySttSupported ? (
              <PracticeVoiceCell
                tr={tr}
                tb={tb}
                voiceMode={voiceMode}
                voiceAvailable={voiceAvailable}
                transcribing={transcribing}
                listening={listening}
                voiceBusy={voiceBusy}
                blockStart={loading || !showDialogUi}
                toggleVoice={toggleVoice}
                onVoicePointerDown={onVoicePointerDown}
                onVoicePointerUp={onVoicePointerUp}
                onVoicePointerCancel={onVoicePointerCancel}
                onVoiceTouchStart={onVoiceTouchStart}
                onVoiceTouchEnd={onVoiceTouchEnd}
              />
              ) : null}
              {studySttSupported && !voiceAvailable && (
                <Footnote>{tr('errors.voiceBrowserUnavailable')}</Footnote>
              )}
            </FormItem>
          </Group>
          )}

          <AdBanner refreshKey={userReplyCount} refreshEvery={3} enabled={userReplyCount > 0} />
        </>
      )}
        </>
      )}
    </Panel>
  );
}