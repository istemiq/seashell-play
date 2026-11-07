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

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PracticeLevelPicker } from '../components/PracticeLevelPicker.jsx';
import { SplitModalSlotContext } from '../context/SplitModalSlotContext.js';
import { useNavigate, useParams } from 'react-router-dom';
import { PracticeBubble } from '../components/PracticeBubble.jsx';
import { PracticeEchoText } from '../components/PracticeEchoText.jsx';
import { PracticeTappableText } from '../components/PracticeTappableText.jsx';
import { StreamingPracticeReply } from '../components/StreamingPracticeReply.jsx';
import { StreamingCursor } from '../components/StreamingText.jsx';
import { AdBanner } from '../components/AdBanner.jsx';
import { fetchWord } from '../api/dictionaryApi.js';
import * as practiceApi from '../api/practiceApi.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePlatformUser } from '../hooks/usePlatformUser.js';
import { usePracticeVoiceInput } from '../hooks/usePracticeVoiceInput.js';
import { useAutofocusInput } from '../hooks/useAutofocusInput.js';
import { usePremium } from '../hooks/usePremium.js';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useLearnLocale, isStudyTtsSupported, isStudySttSupported } from '../hooks/useLearnLocale.js';
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
  loadWordPracticeSessionId,
  saveWordPracticeSessionId,
} from '../utils/practiceSession.js';
import { usePracticeDialogGate } from '../hooks/usePracticeDialogGate.js';


export function WordPracticePage() {
  const splitModalMount = useContext(SplitModalSlotContext);
  const navigate = useNavigate();
  const { wordId: wordIdParam } = useParams();
  const wordId = parseInt(String(wordIdParam ?? ''), 10);
  const { t: tr, tb } = useI18n();
  const learnLocale = useLearnLocale();
  const studyTtsSupported = isStudyTtsSupported(learnLocale);
  const studySttSupported = isStudySttSupported(learnLocale);
  const { error: userError, ready: vkReady } = usePlatformUser();

  const [wordLabel, setWordLabel] = useState('');
  const [turns, setTurns] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const loadedRef = useRef(null);

  const { premium } = usePremium();
  const [, setLimits] = useState(null);
  const userReplyCount = practiceUserReplyCount(turns);
  const { idle: dialogIdle, showDialogUi, startDialog, resetDialog } = usePracticeDialogGate(turns.length, {
    booting,
  });
  const showStartButton = dialogIdle && !loading;
  const showSessionBootSpinner = booting || (loading && turns.length === 0 && !showDialogUi);

  useEffect(() => {
    if (vkReady && !premium) {
      fetchUserLimits().then(setLimits).catch(console.error);
    }
  }, [vkReady, premium]);

  useEffect(() => {
    if (userError) setError(userError);
  }, [userError]);

  const requestOpening = useCallback(async (id, existingSessionId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceApi.postWordPracticeTurn({
        wordId: id,
        userText: practiceApi.PRACTICE_EXPERT_START,
        sessionId: existingSessionId,
      });
      if (data.sessionId) {
        setSessionId(data.sessionId);
        saveWordPracticeSessionId(id, data.sessionId);
      }
      if (data.word) setWordLabel(data.word);
      if (Array.isArray(data.turns)) {
        setTurns(data.turns);
      } else {
        setTurns([{ opening: true, userText: null, echo: null, corrections: null, reply: data.reply }]);
      }
    } catch (e) {
      setError(e.message || tr('errors.sendFailed'));
      loadedRef.current = null;
    } finally {
      setLoading(false);
      setBooting(false);
    }
  }, [tr]);

  useEffect(() => {
    if (!vkReady || !Number.isFinite(wordId) || wordId <= 0) return;
    if (loadedRef.current === wordId) return;
    loadedRef.current = wordId;

    let cancelled = false;
    void (async () => {
      setBooting(true);
      setTurns([]);
      setSessionId(null);
      setError(null);
      try {
        const wordRow = await fetchWord(wordId);
        if (cancelled) return;
        if (wordRow?.word) setWordLabel(wordRow.word);
      } catch {
        // label optional
      }

      const savedId = loadWordPracticeSessionId(wordId);
      if (savedId) {
        try {
          const data = await practiceApi.fetchPracticeSession(savedId);
          if (
            !cancelled &&
            data?.session?.mode === 'word' &&
            Number(data.session.targetWordId) === wordId &&
            Array.isArray(data.turns)
          ) {
            setSessionId(savedId);
            setTurns(data.turns);
            setBooting(false);
            return;
          }
          saveWordPracticeSessionId(wordId, null);
        } catch {
          saveWordPracticeSessionId(wordId, null);
        }
      }
      if (!cancelled) setBooting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [wordId, vkReady, requestOpening]);

  const submitUserText = useCallback(
    async (raw) => {
      const userText = String(raw).trim();
      if (!userText || loading || !Number.isFinite(wordId)) return;

      setLoading(true);
      setError(null);
      setInput('');

      const sendTurn = async () => {
        const data = await practiceApi.postWordPracticeTurn({
          wordId,
          userText,
          sessionId,
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          saveWordPracticeSessionId(wordId, data.sessionId);
        }
        if (data.word) setWordLabel(data.word);
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
          confirm: () =>
            window.confirm(tr('practice.limitAdConfirm')),
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
    [loading, wordId, sessionId, tr],
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
    blockStart: loading || booting || turns.length === 0 || !studySttSupported,
    speechLang: speechLocaleForLearn(learnLocale),
    t: tr,
  });

  const dialogInputReady = vkReady && !booting && turns.length > 0 && !loading && !voiceBusy;
  const replyInputRef = useAutofocusInput(dialogInputReady, [
    vkReady,
    booting,
    turns.length,
    loading,
    voiceBusy,
    wordId,
    sessionId,
  ]);

  const handleReplyKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      if (!input.trim() || loading || booting || voiceBusy || turns.length === 0) return;
      void submitUserText(input);
    },
    [input, loading, booting, voiceBusy, turns.length, submitUserText],
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

  const startWordDialog = useCallback(() => {
    if (!Number.isFinite(wordId) || loading || booting) return;
    startDialog();
    void requestOpening(wordId, null);
  }, [wordId, loading, booting, requestOpening, startDialog]);

  const startNewDialog = useCallback(() => {
    if (!Number.isFinite(wordId)) return;
    stopVoice();
    void discardEmptyPracticeSession(sessionId, turns);
    loadedRef.current = null;
    saveWordPracticeSessionId(wordId, null);
    setSessionId(null);
    setTurns([]);
    setInput('');
    resetDialog();
  }, [wordId, resetDialog, stopVoice, sessionId, turns]);

  const speakReplyError = useCallback(
    (msg) => {
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={6500}>
          {msg}
        </Snackbar>,
      );
    },
    [],
  );

  const handleBack = useCallback(() => {
    void discardEmptyPracticeSession(sessionId, turns);
    if (Number.isFinite(wordId)) saveWordPracticeSessionId(wordId, null);
    navigate('/dictionary');
  }, [navigate, sessionId, turns, wordId]);

  useEscapeBack(handleBack);

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
        {tr('dict.wordPracticeTitle', { word: wordLabel || '…' })}
      </PanelHeader>

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
          {showSessionBootSpinner && (
            <Box className="ss-center-load">
              <Spinner />
            </Box>
          )}

          {showStartButton && (
            <Group className="ss-practice-action">
              <Cell i18nKey="practice.startDialog" onClick={() => void startWordDialog()} />
            </Group>
          )}

          {!booting && turns.length > 0 && (
            <Group className="ss-practice-action">
              <Cell i18nKey="practice.newDialog" onClick={startNewDialog} />
            </Group>
          )}

          {!booting && showDialogUi && (turns.length > 0 || loading) && (
          <Group className="ss-practice-chat" header={<GroupHeader mode="secondary">{tr('practice.dialog')}</GroupHeader>}>
            {turns.map((turn, i) => (
                <Box key={i} className="ss-practice-turn">
                  {!turn.opening && (
                    <>
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
                    </>
                  )}
                  <PracticeBubble variant="partner">
                  <Text weight="2" className="ss-practice-bubble__label">{tr('practice.partner')}</Text>
                  <StreamingPracticeReply
                    text={turn.reply}
                    streamId={`word-${wordId}-${sessionId ?? 'new'}-${i}-${turn.reply}`}
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
              <Box
                className={turns.length ? 'ss-practice-compose' : 'ss-practice-compose ss-practice-compose--empty'}
              >
                {turns.length ? <StreamingCursor /> : <Spinner />}
              </Box>
            )}
          </Group>
          )}

          {!booting && turns.length > 0 && (
          <Group className="ss-practice-compose-bar" header={<GroupHeader mode="secondary">{tr('practice.yourReply')}</GroupHeader>}>
            <FormItem top={practiceStudyLangLabel(tr, learnLocale)}>
              <Textarea
                ref={replyInputRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                className="ss-textarea ss-textarea--ltr"
                disabled={loading || voiceBusy || booting || turns.length === 0}
                enterKeyHint="send"
              />
            </FormItem>
            <FormItem>
              <Cell
                disabled={!input.trim() || loading || booting || turns.length === 0 || voiceBusy}
                onClick={() => {
                  if (!input.trim() || loading || booting || turns.length === 0 || voiceBusy) return;
                  void sendText();
                }}
              >
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
                blockStart={loading || booting || turns.length === 0}
                toggleVoice={toggleVoice}
                onVoicePointerDown={onVoicePointerDown}
                onVoicePointerUp={onVoicePointerUp}
                onVoicePointerCancel={onVoicePointerCancel}
                onVoiceTouchStart={onVoiceTouchStart}
                onVoiceTouchEnd={onVoiceTouchEnd}
              />
              ) : null}
              {studySttSupported && !voiceAvailable && <Footnote>{tr('errors.voiceBrowserUnavailable')}</Footnote>}
            </FormItem>
          </Group>
          )}

          <AdBanner refreshKey={userReplyCount} refreshEvery={3} enabled={userReplyCount > 0} />
        </>
      )}
    </Panel>
  );
}
