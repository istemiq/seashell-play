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
  Input,
  Separator,
  Spinner,
  Snackbar,
  Cell,
} from '../components/Ui.jsx';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  loadExpertPracticeSessionId,
  saveExpertPracticeSessionId,
} from '../utils/practiceSession.js';
import { setCustomBackHandler } from '../utils/backNavigation.js';
import { usePracticeDialogGate } from '../hooks/usePracticeDialogGate.js';


export function ExpertPracticePage() {
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
  const [wordPick, setWordPick] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  useEffect(() => {
    if (vkReady && !premium) {
      fetchUserLimits().then(setLimits).catch(console.error);
    }
  }, [vkReady, premium]);

  const expertTitle = useMemo(() => {
    const e = experts.find((x) => x.id === expertId);
    return e?.title ?? '';
  }, [experts, expertId]);
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
      return;
    }
    if (!vkReady || expertsLoading) return;

    const expert = experts.find((e) => e.id === expertId);
    if (!expert) {
      navigate('/practice/expert', { replace: true });
      return;
    }

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
      setWordPick(null);
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
  }, [expertId, experts, expertsLoading, vkReady, navigate, requestOpening, querySessionId]);

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
    setWordPick(null);
    resetDialog();
  }, [expertId, resetDialog, stopVoice, sessionId, turns]);

  const removeHistorySession = useCallback(
    async (targetId, e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      if (!expertId) return;
      try {
        await practiceApi.deletePracticeSession(targetId);
        setHistorySessions((prev) => prev.filter((s) => s.id !== targetId));
        if (sessionId === targetId) {
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

  const pickWord = useCallback(
    (turnIndex, field, fallback) => {
      if (wordPick?.turnIndex === turnIndex && wordPick?.field === field && wordPick?.word) {
        return wordPick.word;
      }
      return selectedTextOr(fallback);
    },
    [wordPick],
  );

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

  const backFromChat = useCallback(() => {
    void discardEmptyPracticeSession(sessionId, turns);
    if (expertId) saveExpertPracticeSessionId(expertId, null);
    navigate('/practice/expert');
  }, [navigate, sessionId, turns, expertId]);

  const handleBack = useCallback(() => {
    if (inEditor) {
      closeEditor();
      return;
    }
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    if (inChat) {
      backFromChat();
    } else {
      navigate('/practice');
    }
  }, [inEditor, showHistory, inChat, navigate, backFromChat, closeEditor]);

  useEscapeBack(handleBack);

  useEffect(() => {
    setCustomBackHandler(handleBack);
    return () => setCustomBackHandler(null);
  }, [handleBack]);

  const loadHistory = useCallback(async () => {
    if (!expertId) return;
    setHistoryLoading(true);
    try {
      const data = await practiceApi.fetchPracticeSessionsList('expert');
      if (Array.isArray(data?.sessions)) {
        setHistorySessions(data.sessions.filter(s => s.expertId === expertId).slice(0, 10));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }, [expertId]);

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

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(Number(ts));
    const { locale } = loadSettings();
    return d.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

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
          !inChat && !inEditor ? (
            <DismissibleHint hintId="practice.expert.disclaimer" className="ss-hint--inline ss-hint--subtle">
              {dictMessageForLearn(tr, 'practice.expertDisclaimer', learnLocale)}
            </DismissibleHint>
          ) : null
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

      {expertChatSegments}

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

      {vkReady && !inChat && !inEditor && (
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
            <Group>
              <Cell i18nKey="practice.startDialog" onClick={() => void startExpertDialog()} />
            </Group>
          )}

          {showSessionBootSpinner && (
            <Box className="ss-center-load">
              <Spinner />
            </Box>
          )}

          {turns.length > 0 && (
            <Group>
              <Cell i18nKey="practice.newDialog" onClick={startNewExpertDialog} />
            </Group>
          )}

          {(showDialogUi && (turns.length > 0 || loading)) && (
          <Group header={<GroupHeader mode="secondary">{tr('practice.dialog')}</GroupHeader>}>
            {turns.map((turn, i) => (
              <Box key={i} className="ss-practice-turn">
                {!turn.opening && (
                  <>
                    <Text weight="2">{tr('practice.you')}</Text>
                    <PracticeTappableText
                      text={turn.userText}
                      selectedWord={
                        wordPick?.turnIndex === i && wordPick?.field === 'user' ? wordPick.word : null
                      }
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
                      selectedWord={
                        wordPick?.turnIndex === i && wordPick?.field === 'echo' ? wordPick.word : null
                      }
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
                  </>
                )}
                <Text weight="2" dir="auto">{expertTitle || tr('practice.partner')}</Text>
                <StreamingPracticeReply
                  text={turn.reply}
                  streamId={`expert-${expertId}-${sessionId ?? 'new'}-${i}-${turn.reply}`}
                  selectedWord={
                    wordPick?.turnIndex === i && wordPick?.field === 'reply' ? wordPick.word : null
                  }
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

          {turns.length > 0 && (
          <Group header={<GroupHeader mode="secondary">{tr('practice.yourReply')}</GroupHeader>}>
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
              <Cell
                disabled={!input.trim() || loading || turns.length === 0 || voiceBusy}
                onClick={() => {
                  if (!input.trim() || loading || turns.length === 0 || voiceBusy) return;
                  void sendText();
                }}
              >
                {tr('practice.reply')}
              </Cell>
              {studySttSupported ? (
              <Cell
                disabled={practiceVoiceCellDisabled({
                  voiceAvailable,
                  transcribing,
                  listening,
                  voiceBusy,
                  blockStart: loading || turns.length === 0,
                })}
                onClick={voiceUsesTap(voiceMode) ? toggleVoice : undefined}
              >
                {practiceVoiceCellLabel({ tr, tb, transcribing, listening })}
              </Cell>
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
