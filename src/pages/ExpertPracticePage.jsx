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
  Input,
  Separator,
  Spinner,
  Snackbar,
  Cell,
} from '../components/Ui.jsx';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PracticeLevelPicker } from '../components/PracticeLevelPicker.jsx';
import { SplitModalSlotContext } from '../context/SplitModalSlotContext.js';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PracticeEchoText } from '../components/PracticeEchoText.jsx';
import { PracticeTappableText } from '../components/PracticeTappableText.jsx';
import { StreamingPracticeReply } from '../components/StreamingPracticeReply.jsx';
import { StreamingCursor } from '../components/StreamingText.jsx';
import { AdBanner } from '../components/AdBanner.jsx';
import { PracticeBubble } from '../components/PracticeBubble.jsx';
import { PracticeDictionaryAddBar } from '../components/PracticeDictionaryAddBar.jsx';
import { usePracticeDictionaryAdd } from '../hooks/usePracticeDictionaryAdd.js';
import * as practiceApi from '../api/practiceApi.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePlatformUser } from '../hooks/usePlatformUser.js';
import { usePracticeVoiceInput } from '../hooks/usePracticeVoiceInput.js';
import { useAutofocusInput } from '../hooks/useAutofocusInput.js';
import { usePremium } from '../hooks/usePremium.js';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
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
  loadExpertPracticeSessionId,
  saveExpertPracticeSessionId,
} from '../utils/practiceSession.js';
import { setCustomBackHandler } from '../utils/backNavigation.js';
import { usePracticeDialogGate } from '../hooks/usePracticeDialogGate.js';

function turnPickKey(turnIndex, field) {
  return `${turnIndex}:${field}`;
}


export function ExpertPracticePage() {
  const splitModalMount = useContext(SplitModalSlotContext);
  const navigate = useNavigate();
  const { expertId: routeExpertId } = useParams();
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('session');
  const expertId = routeExpertId ?? null;
  const { t: tr, tb } = useI18n();
  const learnLocale = useLearnLocale();
  const studyTtsSupported = isStudyTtsSupported(learnLocale);
  const studySttSupported = isStudySttSupported(learnLocale);
  const { error: userError, ready: vkReady } = usePlatformUser();

  const [experts, setExperts] = useState([]);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [turns, setTurns] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hubTab, setHubTab] = useState('history');
  const [historySessions, setHistorySessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [chatExpertTitle, setChatExpertTitle] = useState('');
  const [editorMode, setEditorMode] = useState(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorForm, setEditorForm] = useState({ who: '', sampleTopics: '' });
  const loadedSessionKeyRef = useRef(null);

  const { premium } = usePremium();
  const [limits, setLimits] = useState(null);
  const userReplyCount = practiceUserReplyCount(turns);
  const { idle: dialogIdle, showDialogUi, startDialog, resetDialog } = usePracticeDialogGate(turns.length);
  const showStartButton = dialogIdle && !loading;
  const showSessionBootSpinner = loading && turns.length === 0 && !showDialogUi;

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

  const expertTitle = useMemo(() => {
    const e = experts.find((x) => x.id === expertId);
    if (e?.title) return e.title;
    if (chatExpertTitle) return chatExpertTitle;
    return expertId ?? '';
  }, [experts, expertId, chatExpertTitle]);
  const inChat = Boolean(expertId);
  const inEditor = Boolean(editorMode);

  const reloadExperts = useCallback(async () => {
    const data = await practiceApi.fetchPracticeExperts();
    setExperts(Array.isArray(data?.experts) ? data.experts : []);
  }, []);

  useEffect(() => {
    if (userError) setError(userError);
  }, [userError]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setExpertsLoading(true);
      try {
        await reloadExperts();
      } catch (e) {
        if (!cancelled) setError(e.message || tr('errors.loadFailed'));
      } finally {
        if (!cancelled) setExpertsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tr, reloadExperts]);

  const requestOpening = useCallback(
    async (id, existingSessionId = null) => {
      setLoading(true);
      setError(null);
      try {
        const data = await practiceApi.postExpertPracticeTurn({
          expertId: id,
          userText: practiceApi.PRACTICE_EXPERT_START,
          sessionId: existingSessionId,
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          saveExpertPracticeSessionId(id, data.sessionId);
        }
        if (Array.isArray(data.turns)) {
          setTurns(data.turns);
        } else {
          setTurns([{ opening: true, userText: null, echo: null, corrections: null, reply: data.reply }]);
        }
      } catch (e) {
        setError(e.message || tr('errors.sendFailed'));
        loadedSessionKeyRef.current = null;
        navigate('/practice/expert', { replace: true });
      } finally {
        setLoading(false);
      }
    },
    [tr, navigate],
  );

  useEffect(() => {
    if (!expertId) {
      loadedSessionKeyRef.current = null;
      setChatExpertTitle('');
      return;
    }
    if (!vkReady) return;

    const savedIdRaw = querySessionId ? parseInt(querySessionId, 10) : loadExpertPracticeSessionId(expertId);
    const savedId = Number.isFinite(savedIdRaw) && savedIdRaw > 0 ? savedIdRaw : null;
    const sessionKey = `${expertId}:${savedId ?? 'new'}`;
    if (loadedSessionKeyRef.current === sessionKey) return;
    loadedSessionKeyRef.current = sessionKey;

    let cancelled = false;
    void (async () => {
      setTurns([]);
      setSessionId(null);
      setInput('');
      clearWordPick();
      setLoading(true);
      setError(null);
      if (savedId) {
        try {
          const data = await practiceApi.fetchPracticeSession(savedId);
          if (
            !cancelled &&
            data?.session?.mode === 'expert' &&
            data.session.expertId === expertId &&
            Array.isArray(data.turns)
          ) {
            setSessionId(savedId);
            saveExpertPracticeSessionId(expertId, savedId);
            setTurns(data.turns);
            if (data.session.expertTitle) setChatExpertTitle(data.session.expertTitle);
            setLoading(false);
            return;
          }
          saveExpertPracticeSessionId(expertId, null);
        } catch {
          saveExpertPracticeSessionId(expertId, null);
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [expertId, vkReady, navigate, querySessionId, clearWordPick]);

  const pickExpert = useCallback(
    (id) => {
      setEditorMode(null);
      navigate(`/practice/expert/${id}`);
    },
    [navigate],
  );

  const openCreateExpert = useCallback(() => {
    setEditorMode('create');
    setEditorForm({ who: '', sampleTopics: '' });
  }, []);

  const openEditExpert = useCallback(
    (e) => {
      setEditorMode('edit');
      setEditorForm({
        id: e.id,
        who: (e.title || e.roleTitle || '').trim(),
        sampleTopics: e.sampleTopics ?? '',
      });
    },
    [],
  );

  const closeEditor = useCallback(() => {
    setEditorMode(null);
    setEditorForm({ who: '', sampleTopics: '' });
  }, []);

  const saveExpert = useCallback(async () => {
    const who = editorForm.who.trim();
    const sampleTopics = editorForm.sampleTopics.trim();
    if (!who || !sampleTopics) {
      setError(tr('practice.expertFormIncomplete'));
      return;
    }
    const payload = { title: who, roleTitle: who, sampleTopics };
    setEditorSaving(true);
    setError(null);
    try {
      if (editorMode === 'edit' && editorForm.id) {
        await practiceApi.updatePracticeExpert(editorForm.id, payload);
      } else {
        await practiceApi.createPracticeExpert(payload);
      }
      await reloadExperts();
      closeEditor();
    } catch (e) {
      setError(e.message || tr('errors.addFailed'));
    } finally {
      setEditorSaving(false);
    }
  }, [editorForm, editorMode, tr, reloadExperts, closeEditor]);

  const removeExpert = useCallback(async () => {
    if (!editorForm.id) return;
    if (!window.confirm(tr('practice.expertDeleteConfirm'))) return;
    setEditorSaving(true);
    setError(null);
    try {
      await practiceApi.deletePracticeExpert(editorForm.id);
      await reloadExperts();
      closeEditor();
    } catch (e) {
      setError(e.message || tr('errors.deleteFailed'));
    } finally {
      setEditorSaving(false);
    }
  }, [editorForm.id, tr, reloadExperts, closeEditor]);

  const submitUserText = useCallback(
    async (raw) => {
      const userText = String(raw).trim();
      if (!userText || loading || !expertId) return;

      setLoading(true);
      setError(null);
      setInput('');

      const sendTurn = async () => {
        const data = await practiceApi.postExpertPracticeTurn({
          expertId,
          userText,
          sessionId,
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          saveExpertPracticeSessionId(expertId, data.sessionId);
        }
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
    [loading, expertId, sessionId, tr],
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
    blockStart: loading || !expertId || turns.length === 0 || !studySttSupported,
    speechLang: speechLocaleForLearn(learnLocale),
    t: tr,
  });

  const dialogInputReady =
    inChat && !showHistory && turns.length > 0 && !loading && !voiceBusy && vkReady;
  const replyInputRef = useAutofocusInput(dialogInputReady, [
    inChat,
    showHistory,
    turns.length,
    loading,
    voiceBusy,
    vkReady,
    expertId,
    sessionId,
  ]);

  const handleReplyKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      if (!input.trim() || loading || voiceBusy || turns.length === 0) return;
      void submitUserText(input);
    },
    [input, loading, voiceBusy, turns.length, submitUserText],
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

  const startExpertDialog = useCallback(() => {
    if (!expertId || loading) return;
    startDialog();
    void requestOpening(expertId, null);
  }, [expertId, loading, requestOpening, startDialog]);

  const startNewExpertDialog = useCallback(() => {
    if (!expertId) return;
    stopVoice();
    void discardEmptyPracticeSession(sessionId, turns);
    loadedSessionKeyRef.current = null;
    saveExpertPracticeSessionId(expertId, null);
    setSessionId(null);
    setTurns([]);
    setInput('');
    clearWordPick();
    resetDialog();
  }, [expertId, resetDialog, stopVoice, sessionId, turns, clearWordPick]);

  const removeHistorySession = useCallback(
    async (targetId, e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      try {
        await practiceApi.deletePracticeSession(targetId);
        setHistorySessions((prev) => prev.filter((s) => s.id !== targetId));
        if (expertId && sessionId === targetId) {
          saveExpertPracticeSessionId(expertId, null);
          setSessionId(null);
          setTurns([]);
          loadedSessionKeyRef.current = null;
          resetDialog();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [expertId, sessionId, resetDialog],
  );

  const speakReplyError = useCallback(
    (msg) => {
      showDictNotice(msg, 6500);
    },
    [showDictNotice],
  );

  const backFromChat = useCallback(() => {
    void discardEmptyPracticeSession(sessionId, turns);
    if (expertId) saveExpertPracticeSessionId(expertId, null);
    setHubTab('history');
    navigate('/');
  }, [navigate, sessionId, turns, expertId]);

  const handleBack = useCallback(() => {
    if (inEditor) {
      closeEditor();
      return;
    }
    if (inChat && showHistory) {
      setShowHistory(false);
      return;
    }
    if (inChat) {
      backFromChat();
    } else if (hubTab === 'new') {
      setHubTab('history');
    } else {
      navigate('/practice');
    }
  }, [inEditor, showHistory, inChat, hubTab, navigate, backFromChat, closeEditor]);

  useEscapeBack(handleBack);

  useEffect(() => {
    setCustomBackHandler(handleBack);
    return () => setCustomBackHandler(null);
  }, [handleBack]);

  const loadAllHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await practiceApi.fetchPracticeSessionsList('expert');
      setHistorySessions(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch (e) {
      setHistoryError(e.message || tr('errors.loadFailed'));
    } finally {
      setHistoryLoading(false);
    }
  }, [tr]);

  const loadExpertHistory = useCallback(async () => {
    if (!expertId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await practiceApi.fetchPracticeSessionsList('expert');
      if (Array.isArray(data?.sessions)) {
        setHistorySessions(data.sessions.filter((s) => s.expertId === expertId).slice(0, 10));
      }
    } catch (e) {
      setHistoryError(e.message || tr('errors.loadFailed'));
    } finally {
      setHistoryLoading(false);
    }
  }, [expertId, tr]);

  const openHistory = useCallback(() => {
    setShowHistory(true);
    void loadExpertHistory();
  }, [loadExpertHistory]);

  useEffect(() => {
    if (!vkReady || inChat || inEditor || hubTab !== 'history') return;
    void loadAllHistory();
  }, [vkReady, inChat, inEditor, hubTab, loadAllHistory]);

  useEffect(() => {
    if (!showHistory) return undefined;
    const onPop = () => setShowHistory(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showHistory]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(Number(ts));
    const { locale } = loadSettings();
    return d.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const expertHubSegments = !inChat && !inEditor ? (
    <Group>
      <div className="seashell-segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={hubTab === 'history'}
          className={`seashell-segmented__item${hubTab === 'history' ? ' is-active' : ''}`}
          onClick={() => setHubTab('history')}
        >
          {tb('practice.history')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={hubTab === 'new'}
          className={`seashell-segmented__item${hubTab === 'new' ? ' is-active' : ''}`}
          onClick={() => setHubTab('new')}
        >
          {tb('practice.dialog')}
        </button>
      </div>
    </Group>
  ) : null;

  const expertChatSegments = inChat ? (
    <Group>
      <div className="seashell-segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!showHistory}
          className={`seashell-segmented__item${!showHistory ? ' is-active' : ''}`}
          onClick={() => setShowHistory(false)}
        >
          {tb('practice.dialog')}
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
  ) : null;

  return (
    <Panel>
      <PanelHeader
        before={
          <PanelHeaderBack onClick={handleBack} />
        }
        after={
          <div className="ss-panel-header__tools">
            <PracticeLevelPicker modalMount={splitModalMount} />
          </div>
        }
      >
        <span dir="auto">
          {inEditor
            ? editorMode === 'edit'
              ? tr('practice.expertEdit')
              : tr('practice.expertCreate')
            : inChat
              ? tr('practice.expertChatTitle', { role: expertTitle })
              : tr('practice.expertPickTitle')}
        </span>
      </PanelHeader>

      {expertHubSegments}
      {expertChatSegments}

      {!inChat && !inEditor && hubTab === 'history' ? (
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
                  if (s.expertTitle) setChatExpertTitle(s.expertTitle);
                  navigate(`/practice/expert/${s.expertId}?session=${s.id}`);
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
                <span dir="auto">{s.expertTitle || s.expertId}</span>
              </Cell>
            ))
          )}
        </Group>
      ) : null}

      {inChat && showHistory ? (
        <Group>
          {historyLoading ? (
            <Box className="ss-center-load">
              <Spinner />
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
                  loadedSessionKeyRef.current = null;
                  saveExpertPracticeSessionId(expertId, s.id);
                  navigate(`/practice/expert/${expertId}?session=${s.id}`);
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
                {expertTitle}
              </Cell>
            ))
          )}
        </Group>
      ) : null}

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

      {error && (
        <Group>
          <Box>
            <Text>{error}</Text>
          </Box>
        </Group>
      )}

      {vkReady && !inChat && !inEditor && hubTab === 'new' && (
        <>
          {expertsLoading && (
            <Box className="ss-center-load">
              <Spinner />
            </Box>
          )}
          {!expertsLoading && (
            <Group>
              <Cell chevron onClick={openCreateExpert}>
                {tr('practice.expertCreate')}
              </Cell>
            </Group>
          )}
          {!expertsLoading && experts.length === 0 && (
            <Group>
              <Box className="ss-vpad-cell">
                <Footnote style={{ textAlign: 'center' }}>{tr('practice.expertEmpty')}</Footnote>
              </Box>
            </Group>
          )}
          {!expertsLoading &&
            experts.map((e) => (
              <Group key={e.id}>
                <Cell
                  chevron
                  onClick={() => pickExpert(e.id)}
                  after={
                    <button
                      type="button"
                      className="ss-flat-link"
                      onMouseDown={(ev) => ev.stopPropagation()}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        openEditExpert(e);
                      }}
                    >
                      {tb('practice.expertEdit')}
                    </button>
                  }
                >
                  <span dir="auto">{e.title}</span>
                </Cell>
              </Group>
            ))}
        </>
      )}

      {vkReady && !inChat && inEditor && (
        <>
          <Group>
            <FormItem top={tr('practice.expertWho')}>
              <Input
                value={editorForm.who}
                onChange={(ev) => setEditorForm((f) => ({ ...f, who: ev.target.value }))}
                maxLength={120}
                placeholder={tr('practice.expertWhoPlaceholder')}
                dir="auto"
              />
            </FormItem>
            <Box className="ss-pad-bottom-xs">
              <Footnote>{tr('practice.expertWhoHint')}</Footnote>
            </Box>
            <FormItem top={tr('practice.expertTopics')}>
              <Textarea
                rows={3}
                value={editorForm.sampleTopics}
                onChange={(ev) => setEditorForm((f) => ({ ...f, sampleTopics: ev.target.value }))}
                maxLength={500}
                placeholder={tr('practice.expertTopicsPlaceholder')}
                className="ss-textarea ss-textarea--compact"
                dir="auto"
              />
            </FormItem>
          </Group>
          <Group>
            <Cell disabled={editorSaving} onClick={() => void saveExpert()}>
              {tr('practice.expertSave')}
            </Cell>
            {editorMode === 'edit' ? (
              <Cell disabled={editorSaving} onClick={() => void removeExpert()}>
                {tr('practice.expertDelete')}
              </Cell>
            ) : null}
          </Group>
          <Group>
            <Box>
              <Footnote>{dictMessageForLearn(tr, 'practice.expertDisclaimerShort', learnLocale)}</Footnote>
            </Box>
          </Group>
        </>
      )}

      {vkReady && inChat && !showHistory && (
        <>
          <Group>
            <Box>
              <Footnote>{dictMessageForLearn(tr, 'practice.expertDisclaimerShort', learnLocale)}</Footnote>
            </Box>
          </Group>

          {showStartButton && (
            <Group className="ss-practice-action">
              <Cell i18nKey="practice.startDialog" onClick={() => void startExpertDialog()} />
            </Group>
          )}

          {showSessionBootSpinner && (
            <Box className="ss-center-load">
              <Spinner />
            </Box>
          )}

          {turns.length > 0 && (
            <Group className="ss-practice-action">
              <Cell i18nKey="practice.newDialog" onClick={startNewExpertDialog} />
            </Group>
          )}

          {(showDialogUi && (turns.length > 0 || loading)) && (
          <Group className="ss-practice-chat" header={<GroupHeader mode="secondary">{tr('practice.dialog')}</GroupHeader>}>
            {turns.map((turn, i) => {
              const userKey = turnPickKey(i, 'user');
              const echoKey = turnPickKey(i, 'echo');
              const replyKey = turnPickKey(i, 'reply');
              const userBlock = getBlockState(userKey);
              const echoBlock = getBlockState(echoKey);
              const replyBlock = getBlockState(replyKey);

              return (
              <Box key={i} className="ss-practice-turn">
                {!turn.opening && (
                  <>
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
                  </>
                )}
                <PracticeBubble variant="partner">
                <Text weight="2" className="ss-practice-bubble__label" dir="auto">{expertTitle || tr('practice.partner')}</Text>
                <StreamingPracticeReply
                  text={turn.reply}
                  streamId={`expert-${expertId}-${sessionId ?? 'new'}-${i}-${turn.reply}`}
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
                  showTapHint={Boolean(turn.opening) && i === 0}
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

          {turns.length > 0 && (
          <Group className="ss-practice-compose-bar" header={<GroupHeader mode="secondary">{tr('practice.yourReply')}</GroupHeader>}>
            <FormItem top={practiceStudyLangLabel(tr, learnLocale)}>
              <Textarea
                ref={replyInputRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                className="ss-textarea ss-textarea--ltr"
                disabled={loading || voiceBusy || turns.length === 0}
                enterKeyHint="send"
              />
            </FormItem>
            <FormItem>
              <Button
                stretched
                mode="primary"
                disabled={!input.trim() || loading || turns.length === 0 || voiceBusy}
                onClick={() => {
                  if (!input.trim() || loading || turns.length === 0 || voiceBusy) return;
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
                blockStart={loading || turns.length === 0}
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
