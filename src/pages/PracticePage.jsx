import { DismissibleHint } from '../components/DismissibleHint.jsx';
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
  Separator,
  Spinner,
  Snackbar,
  Cell,
} from '../components/Ui.jsx';

/**
 * Панель «Разговорная практика»:
 * - ввод текста и отправка на `/api/practice/turn`;
 * - опционально голос (Web Speech API: распознавание в браузере);
 * - отображение хода: что сказал пользователь, как поняла модель, правки, реплика бота;
 * - озвучка ответа через speechSynthesis (бесплатно, на устройстве пользователя).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PracticeEchoText } from '../components/PracticeEchoText.jsx';
import { PracticeTappableText } from '../components/PracticeTappableText.jsx';
import { StreamingPracticeReply } from '../components/StreamingPracticeReply.jsx';
import { StreamingCursor } from '../components/StreamingText.jsx';
import { AdBanner } from '../components/AdBanner.jsx';
import { addWord as addWordToDictionary } from '../api/dictionaryApi.js';
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
import { dictMessageForLearn, practiceStudyLangLabel } from '../utils/contentLocale.js';
import { speechLocaleForLearn } from '../utils/studySpeech.js';
import {
  practiceVoiceCellDisabled,
  practiceVoiceCellLabel,
  voiceUsesTap,
} from '../utils/practiceVoiceUi.js';
import {
  loadFreePracticeSessionId,
  saveFreePracticeSessionId,
} from '../utils/practiceSession.js';
import { usePracticeDialogGate } from '../hooks/usePracticeDialogGate.js';


export function PracticePage() {
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
  const [wordPick, setWordPick] = useState(null);
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

  const startNewDialog = useCallback(() => {
    stopVoice();
    void discardEmptyPracticeSession(sessionId, turns);
    saveFreePracticeSessionId(null);
    setSessionId(null);
    setTurns([]);
    setInput('');
    setWordPick(null);
    setError(null);
    resetDialog();
  }, [stopVoice, sessionId, turns, resetDialog]);

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
      setNotice(msg);
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={6500}>
          {msg}
        </Snackbar>,
      );
    },
    [],
  );

  const selectedTextOr = (fallback) => {
    if (typeof window === 'undefined') return fallback;
    const sel = window.getSelection?.();
    const t = sel ? String(sel.toString() || '').trim() : '';
    return t || fallback;
  };

  const pickWord = useCallback((turnIndex, field, fallback) => {
    if (wordPick?.turnIndex === turnIndex && wordPick?.field === field && wordPick?.word) {
      return wordPick.word;
    }
    return selectedTextOr(fallback);
  }, [wordPick]);

  const selectPracticeWord = useCallback((turnIndex, field, word) => {
    setWordPick((prev) => {
      if (!word) {
        return prev?.turnIndex === turnIndex && prev?.field === field ? null : prev;
      }
      return { turnIndex, field, word };
    });
  }, []);

  const addTurnToDictionary = async (text) => {
    const word = String(text || '').trim().replace(/\s+/g, ' ');
    if (!word || word.length > 200) {
      const msg = tr('errors.dictTooLong');
      setNotice(msg);
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={2500}>
          {msg}
        </Snackbar>,
      );
      return;
    }

    const addOnce = async () => {
      await addWordToDictionary(word);
      const msg = tr('errors.dictAdded', { word });
      setNotice(msg);
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={2200}>
          {msg}
        </Snackbar>,
      );
      const fresh = await fetchUserLimits().catch(() => null);
      if (fresh) setLimits(fresh);
    };

    try {
      await runWithAdRetry({
        type: 'words',
        action: addOnce,
        confirm: () =>
          window.confirm(
            tr('dict.limitAdConfirm') ||
              'Free word limit reached. Watch a short ad to add 2 more words?',
          ),
        onLimitsUpdate: setLimits,
      });
    } catch (e) {
      const msg = isAdUnavailableError(e) ? tr('ads.unavailable') : e.message || tr('errors.dictAddFailed');
      setNotice(msg);
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={3000}>
          {msg}
        </Snackbar>,
      );
    }
  };


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
    navigate('/practice');
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
    <Group>
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
      <PanelHeader before={<PanelHeaderBack onClick={handleBack} />}>
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
            <Group>
              <Cell i18nKey="practice.startDialog" onClick={startChat} />
            </Group>
          )}

          {turns.length > 0 && (
            <Group>
              <Cell i18nKey="practice.newDialog" onClick={startNewDialog} />
            </Group>
          )}

          {showDialogUi && (
          <Group header={<GroupHeader mode="secondary">{tr('practice.dialog')}</GroupHeader>}>
            {turns.length === 0 && (
              <Box className="seashell-inline-action-row">
                <Text style={{ flex: 1 }}>{dictMessageForLearn(tr, 'practice.empty', learnLocale)}</Text>
                <DismissibleHint hintId="practice.empty" className="ss-hint--inline ss-hint--subtle">
                  {tr('practice.emptyHint')}
                </DismissibleHint>
              </Box>
            )}
            {turns.map((turn, i) => (
              <Box key={i} className="ss-practice-turn">
                <Text weight="2">{tr('practice.you')}</Text>
                <PracticeTappableText
                  text={turn.userText}
                  selectedWord={wordPick?.turnIndex === i && wordPick?.field === 'user' ? wordPick.word : null}
                  onSelectWord={(word) => selectPracticeWord(i, 'user', word)}
                />
                <button
                  type="button"
                  className="ss-flat-link ss-mt-sm ss-block"
                  onClick={() => void addTurnToDictionary(pickWord(i, 'user', turn.userText))}
                >
                  {tb('practice.toDictionary')}
                </button>
                <Separator />
                <Text weight="2">{tr('practice.heard')}</Text>
                <PracticeEchoText
                  original={turn.userText}
                  echo={turn.echo}
                  selectedWord={wordPick?.turnIndex === i && wordPick?.field === 'echo' ? wordPick.word : null}
                  onSelectWord={(word) => selectPracticeWord(i, 'echo', word)}
                />
                <button
                  type="button"
                  className="ss-flat-link ss-mt-sm ss-block"
                  onClick={() => void addTurnToDictionary(pickWord(i, 'echo', turn.echo))}
                >
                  {tb('practice.toDictionary')}
                </button>
                {turn.corrections && (
                  <>
                    <Separator />
                    <Text weight="2">{tr('practice.corrections')}</Text>
                    <Text className="ss-mt-xs" dir="auto">{turn.corrections}</Text>
                  </>
                )}
                <Separator />
                <Text weight="2">{tr('practice.partner')}</Text>
                <StreamingPracticeReply
                  text={turn.reply}
                  streamId={`free-${sessionId ?? 'new'}-${i}-${turn.reply}`}
                  selectedWord={wordPick?.turnIndex === i && wordPick?.field === 'reply' ? wordPick.word : null}
                  onSelectWord={(word) => selectPracticeWord(i, 'reply', word)}
                />
                <button
                  type="button"
                  className="ss-flat-link ss-mt-sm ss-block"
                  onClick={() => void addTurnToDictionary(pickWord(i, 'reply', turn.reply))}
                >
                  {tb('practice.toDictionary')}
                </button>
                {studyTtsSupported ? (
                  <ListenTtsButton text={turn.reply} ttsText={turn.replyTts} ttsLocale={learnLocale} className="ss-mt-sm" onError={speakReplyError} />
                ) : null}
              </Box>
            ))}
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
          <Group header={<GroupHeader mode="secondary">{tr('practice.yourReply')}</GroupHeader>}>
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
              <Cell
                disabled={!input.trim() || loading || voiceBusy || !showDialogUi}
                i18nKey="practice.reply"
                onClick={() => {
                  if (!input.trim() || loading || voiceBusy || !showDialogUi) return;
                  void sendText();
                }}
              />
              {studySttSupported ? (
              <Cell
                disabled={practiceVoiceCellDisabled({
                  voiceAvailable,
                  transcribing,
                  listening,
                  voiceBusy,
                  blockStart: loading || !showDialogUi,
                })}
                onClick={voiceUsesTap(voiceMode) ? toggleVoice : undefined}
              >
                {practiceVoiceCellLabel({ tr, tb, transcribing, listening })}
              </Cell>
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