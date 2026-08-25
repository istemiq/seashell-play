import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  GroupHeader,
  Cell,
  Button,
  Input,
  Textarea,
  FormItem,
  Box,
  Spinner,
  Footnote,
  Text,
  Separator,
  Checkbox,
  ModalDismissButton,
  Snackbar,
} from '../components/Ui.jsx';
import { DismissibleHint } from '../components/DismissibleHint.jsx';
import { AdBanner } from '../components/AdBanner.jsx';
import { fetchUserLimits } from '../api/userApi.js';
import { isDailyLimitError, isAdUnavailableError, runWithAdRetry } from '../utils/limitsGate.js';

/**
 * Панель «Словарь»: список слов, добавление с генерацией примеров через LLM, карусель примеров с переводом.
 * См. `dictionaryApi.js` и `server/db.js` (PostgreSQL).
 */
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/dictionaryApi.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePlatformUser } from '../hooks/usePlatformUser.js';
import { usePremium } from '../hooks/usePremium.js';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { ListenTtsButton } from '../components/ListenTtsButton.jsx';
import { SpeakAloudButton } from '../components/SpeakAloudButton.jsx';
import { DictCardMoreActions } from '../components/DictCardMoreActions.jsx';
import { SwipeableExamplePane } from '../components/SwipeableExamplePane.jsx';
import { StreamingText, StreamingCursor } from '../components/StreamingText.jsx';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';
import { SplitModalSlotContext } from '../context/SplitModalSlotContext.js';
import { CardTranslationLocalePicker } from '../components/CardTranslationLocalePicker.jsx';
import { SeashellConfirm } from '../components/SeashellConfirm.jsx';
import {
  contentLocaleNativeName,
  dictMessageForLearn,
  dictWordInputLabel,
  resolveContentLocaleForApi,
  showCardTranslationLocalePicker,
  skipAutoRefreshForPinnedCardLocale,
} from '../utils/contentLocale.js';
import { formatExampleTranslationForLocale } from '../utils/exampleTranslation.js';
import { loadSettings } from '../utils/settings.js';
import { useAutofocusInput } from '../hooks/useAutofocusInput.js';
import { useTappableDictionaryAdd } from '../hooks/useTappableDictionaryAdd.js';
import { TappableExampleEnglish } from '../components/TappableExampleEnglish.jsx';
import { useLearnLocale, isDictionaryGenerationReady, isStudyTtsSupported, isStudySttSupported } from '../hooks/useLearnLocale.js';
import { speechLocaleForLearn } from '../utils/studySpeech.js';

import { useShuffledWordExamples, splitWordExamples } from '../utils/wordExamples.js';
function lineFromExampleField(val) {
  if (val == null || val === '') return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '[object Object]') return '';
    return s;
  }
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const nested =
      val.text ??
      val.en ??
      val.english ??
      val.sentence ??
      val.example ??
      val.phrase ??
      val.translation ??
      val.ru;
    if (nested !== undefined && nested !== val) return lineFromExampleField(nested);
  }
  return '';
}

/** Слой в history для «назад» с карточки слова в список, без ухода с раздела */
const HISTORY_WORD_DETAIL = { seashellDictWord: 1 };

export function DictionaryPage() {
  const { t, tb, locale } = useI18n();
  const learnLocale = useLearnLocale();
  const studyTtsSupported = isStudyTtsSupported(learnLocale);
  const studySttSupported = isStudySttSupported(learnLocale);
  const dictionaryReady = isDictionaryGenerationReady(learnLocale);
  const navigate = useNavigate();
  const splitModalMount = useContext(SplitModalSlotContext);
  const goBackOrHome = useNavigateBackOrHome();
  const wordDetailHistoryRef = useRef(false);
  const { userId, error: userError } = usePlatformUser();
  const { premium } = usePremium();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sets, setSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [screen, setScreen] = useState('dictionary'); // 'dictionary' | 'groups' | 'group'
  const [activeSetId, setActiveSetId] = useState(null); // number | null
  const [newSetName, setNewSetName] = useState('');
  const [creatingSet, setCreatingSet] = useState(false);

  const [newWord, setNewWord] = useState('');
  const [adding, setAdding] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [exampleShuffleKey, setExampleShuffleKey] = useState(0);
  const [examplesTab, setExamplesTab] = useState('builtin'); // 'builtin' | 'mine'
  const [nativeSentence, setNativeSentence] = useState('');
  const [addingCustomExample, setAddingCustomExample] = useState(false);
  const [wordSetsModalOpen, setWordSetsModalOpen] = useState(false);
  const [modalNewSetName, setModalNewSetName] = useState('');
  const [creatingSetInModal, setCreatingSetInModal] = useState(false);
  const [pendingSetIds, setPendingSetIds] = useState([]);
  const [confirmUi, setConfirmUi] = useState(null);
  const confirmResolveRef = useRef(null);
  const addingRef = useRef(false);
  const autoLocaleRefreshRef = useRef(new Set());
  const [limits, setLimits] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [contentLocaleKey, setContentLocaleKey] = useState(() => resolveContentLocaleForApi());

  const bumpExampleShuffle = useCallback(() => {
    setExampleShuffleKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const syncContentLocale = () => setContentLocaleKey(resolveContentLocaleForApi());
    syncContentLocale();
    window.addEventListener('seashell-settings-changed', syncContentLocale);
    return () => window.removeEventListener('seashell-settings-changed', syncContentLocale);
  }, [learnLocale]);

  useEffect(() => {
    if (userId && !premium) {
      fetchUserLimits().then(setLimits).catch(console.error);
    }
  }, [userId, premium]);

  const showConfirm = useCallback((opts) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmUi({
        title: opts.title,
        message: opts.message ?? '',
        destructive: Boolean(opts.destructive),
        confirmLabel: opts.confirmLabel ?? t('common.yes'),
        cancelLabel: opts.cancelLabel ?? t('common.cancel'),
      });
    });
  }, [t]);

  const finishConfirm = useCallback((ok) => {
    setConfirmUi(null);
    const resolve = confirmResolveRef.current;
    confirmResolveRef.current = null;
    resolve?.(ok);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (!wordDetailHistoryRef.current) return;
      wordDetailHistoryRef.current = false;
      setSelectedId(null);
      setDetail(null);
      setExampleIdx(0);
      setExamplesTab('builtin');
      setNativeSentence('');
      setWordSetsModalOpen(false);
      setModalNewSetName('');
      setPendingSetIds([]);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (userError) setError(userError);
  }, [userError]);

  const loadList = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data =
        screen === 'group' && Number.isFinite(activeSetId) && activeSetId > 0
          ? await api.fetchWordsInSet(activeSetId)
          : await api.fetchWords();
      setWords(data.words || []);
    } catch (e) {
      setError(e.message || t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [userId, screen, activeSetId, t, learnLocale]);

  useEffect(() => {
    setSelectedId(null);
    setDetail(null);
    setExampleIdx(0);
    setExamplesTab('builtin');
    setNativeSentence('');
    setActiveSetId(null);
    setScreen('dictionary');
    setNewWord('');
    wordDetailHistoryRef.current = false;
  }, [learnLocale]);

  const { wordPick, selectWord, pickWord, clearWordPick, addTextToDictionary } = useTappableDictionaryAdd({
    tr: t,
    showConfirm,
    onLimitsUpdate: setLimits,
    onSuccess: (word) => {
      void loadList();
      const msg = t('errors.dictAdded', { word });
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={2200}>
          {msg}
        </Snackbar>,
      );
    },
    onError: (msg) => setError(msg),
  });

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadSets = useCallback(async () => {
    if (!userId) return;
    setSetsLoading(true);
    try {
      const data = await api.fetchSets();
      setSets(Array.isArray(data.sets) ? data.sets : []);
    } catch (e) {
      setError(e.message || t('errors.loadGroupsFailed'));
    } finally {
      setSetsLoading(false);
    }
  }, [userId, t, learnLocale]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const maybeAutoRefreshForLocale = useCallback(
    async (wordId, detailRow) => {
      if (!isDictionaryGenerationReady(learnLocale)) return detailRow;
      if (skipAutoRefreshForPinnedCardLocale()) return detailRow;
      const wanted = resolveContentLocaleForApi();
      const stored = String(detailRow?.content_locale ?? '')
        .trim()
        .toLowerCase();
      if (!stored || stored === wanted.toLowerCase()) return detailRow;
      const key = `${wordId}:${wanted}`;
      if (autoLocaleRefreshRef.current.has(key)) return detailRow;
      autoLocaleRefreshRef.current.add(key);
      setRefreshing(true);
      try {
        const d = await api.refreshWordExamples(wordId);
        await loadList();
        return d;
      } catch (e) {
        console.warn('[dict] auto locale refresh failed', e?.message ?? e);
        return detailRow;
      } finally {
        setRefreshing(false);
      }
    },
    [learnLocale, loadList],
  );

  useEffect(() => {
    if (selectedId == null || !detail || skipAutoRefreshForPinnedCardLocale()) return undefined;
    const stored = String(detail.content_locale ?? '')
      .trim()
      .toLowerCase();
    const wanted = String(contentLocaleKey).trim().toLowerCase();
    if (!stored || stored === wanted) return undefined;
    let cancelled = false;
    void maybeAutoRefreshForLocale(selectedId, detail).then((d) => {
      if (!cancelled && d) {
        bumpExampleShuffle();
        setDetail(d);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contentLocaleKey, selectedId, detail, maybeAutoRefreshForLocale, bumpExampleShuffle]);

  const openWord = async (wordId) => {
    if (!userId) return;
    setSelectedId(wordId);
    setDetailLoading(true);
    setExampleIdx(0);
    setExamplesTab('builtin');
    setNativeSentence('');
    setWordSetsModalOpen(false);
    setModalNewSetName('');
    setError(null);
    try {
      let d = await api.fetchWord(wordId);
      d = await maybeAutoRefreshForLocale(wordId, d);
      bumpExampleShuffle();
      setDetail(d);
      setPendingSetIds(Array.isArray(d?.setIds) ? d.setIds : []);
      if (typeof window !== 'undefined') {
        window.history.pushState(HISTORY_WORD_DETAIL, '', window.location.href);
        wordDetailHistoryRef.current = true;
      }
    } catch (e) {
      setError(e.message || t('errors.generic'));
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const reloadWordDetail = useCallback(async () => {
    if (!userId || selectedId == null) return;
    setDetailLoading(true);
    setError(null);
    try {
      const d = await api.fetchWord(selectedId);
      setDetail(d);
      setPendingSetIds(Array.isArray(d?.setIds) ? d.setIds : []);
    } catch (e) {
      setError(e.message || t('errors.generic'));
    } finally {
      setDetailLoading(false);
    }
  }, [userId, selectedId, t]);

  const handleCardLocaleChange = useCallback(
    (nextCode) => {
      const wanted = nextCode || resolveContentLocaleForApi();
      setContentLocaleKey(wanted);
      if (selectedId == null) return;
      autoLocaleRefreshRef.current.delete(`${selectedId}:${wanted}`);
      void (async () => {
        setRefreshing(true);
        setError(null);
        try {
          const d = await api.refreshWordExamples(selectedId);
          bumpExampleShuffle();
          setDetail(d);
          setExampleIdx(0);
          setExamplesTab('builtin');
          await loadList();
        } catch (e) {
          setError(e.message || t('errors.refreshFailed'));
        } finally {
          setRefreshing(false);
        }
      })();
    },
    [selectedId, loadList, t, bumpExampleShuffle],
  );

  const closeWord = () => {
    const hadHistoryLayer = wordDetailHistoryRef.current;
    wordDetailHistoryRef.current = false;
    setSelectedId(null);
    setDetail(null);
    setExampleIdx(0);
    setExamplesTab('builtin');
    setNativeSentence('');
    setWordSetsModalOpen(false);
    setModalNewSetName('');
    setPendingSetIds([]);
    if (hadHistoryLayer && typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const addWord = useCallback(async () => {
    const w = newWord.trim();
    if (!w || !userId || addingRef.current) return;

    addingRef.current = true;
    setAdding(true);
    setError(null);

    const addOnce = async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const created = await api.addWord(w);
          if (screen === 'group' && Number.isFinite(activeSetId) && activeSetId > 0 && created?.id) {
            try {
              await api.updateWordSets(created.id, [activeSetId]);
            } catch {
              // не блокируем добавление слова, если назначение группы не удалось
            }
          }
          setNewWord('');
          await loadList();
          const fresh = await fetchUserLimits().catch(() => null);
          if (fresh) setLimits(fresh);
          return true;
        } catch (e) {
          if (isDailyLimitError(e.message)) throw e;
          const msg = e.message || t('errors.addFailed');
          const retriable =
            attempt === 0 &&
            !/already in your dictionary|already exists/i.test(msg) &&
            /generation|language|JSON|502|503|модел/i.test(msg);
          if (retriable) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          throw e;
        }
      }
      return false;
    };

    try {
      const result = await runWithAdRetry({
        type: 'words',
        action: addOnce,
        confirm: () =>
          showConfirm({
            title: t('dict.limitTitle') || 'Limit reached',
            message:
              t('dict.limitAdConfirm') ||
              'You reached the daily word limit. Watch a short ad to add 2 more words.',
            confirmLabel: t('dict.watchAd') || 'Watch ad',
            cancelLabel: t('common.cancel') || 'Later',
          }),
        onLimitsUpdate: setLimits,
      });
      if (result === null) {
        /* user cancelled ad */
      } else if (result === false) {
        setError(t('errors.addFailed'));
      }
    } catch (e) {
      if (isAdUnavailableError(e)) {
        setError(t('ads.unavailable'));
      } else {
        setError(e.message || t('errors.addFailed'));
      }
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  }, [newWord, userId, screen, activeSetId, loadList, t, showConfirm]);

  const submitNewWord = useCallback(
    (e) => {
      e?.preventDefault?.();
      void addWord();
    },
    [addWord],
  );

  const refreshExamples = async () => {
    if (!selectedId || !userId) return;
    const ok = await showConfirm({
      title: t('dict.refreshExamplesConfirmTitle'),
      message: t('dict.refreshExamplesConfirmMsg'),
      confirmLabel: t('dict.refreshExamples'),
    });
    if (!ok) return;
    setRefreshing(true);
    setError(null);
    try {
      const d = await api.refreshWordExamples(selectedId);
      bumpExampleShuffle();
      setDetail(d);
      setExampleIdx(0);
      setExamplesTab('builtin');
      await loadList();
    } catch (e) {
      setError(e.message || t('errors.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const submitCustomExample = useCallback(async () => {
    if (!selectedId || !userId) return;
    const text = nativeSentence.trim();
    if (!text) return;

    setAddingCustomExample(true);
    setError(null);

    const addOnce = async () => {
      const d = await api.addCustomWordExample(selectedId, text);
      setDetail(d);
      setNativeSentence('');
      setExamplesTab('mine');
      const { custom } = splitWordExamples(d.examples);
      setExampleIdx(Math.max(0, custom.length - 1));
      const fresh = await fetchUserLimits().catch(() => null);
      if (fresh) setLimits(fresh);
      return d;
    };

    try {
      const result = await runWithAdRetry({
        type: 'words',
        action: addOnce,
        confirm: () =>
          showConfirm({
            title: t('dict.limitTitle') || 'Limit reached',
            message:
              t('dict.limitAdConfirm') ||
              'You reached the daily word limit. Watch a short ad to add 2 more words.',
            confirmLabel: t('dict.watchAd') || 'Watch ad',
            cancelLabel: t('common.cancel') || 'Later',
          }),
        onLimitsUpdate: setLimits,
      });
      if (result === null) {
        /* user cancelled ad */
      } else if (result === false) {
        setError(t('errors.addFailed'));
      }
    } catch (e) {
      if (isAdUnavailableError(e)) {
        setError(t('ads.unavailable'));
      } else {
        setError(e.message || t('errors.addFailed'));
      }
    } finally {
      setAddingCustomExample(false);
    }
  }, [selectedId, userId, nativeSentence, t, showConfirm]);

  const removeWord = async (wordId, e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!userId) {
      setError(t('errors.userTelegram'));
      return;
    }
    const ok = await showConfirm({
      title: t('dict.deleteWordTitle'),
      message: t('dict.deleteWordMsg'),
      destructive: true,
      confirmLabel: t('common.delete'),
    });
    if (!ok) return;
    try {
      await api.removeWord(wordId);
      if (selectedId === wordId) closeWord();
      await loadList();
    } catch (err) {
      setError(err.message || t('errors.deleteFailed'));
    }
  };

  const { builtin: builtinExamples, custom: customExamples } = useShuffledWordExamples(
    detail?.examples,
    exampleShuffleKey,
  );
  const activeExamples = examplesTab === 'mine' ? customExamples : builtinExamples;
  const examplesBusy = refreshing || addingCustomExample;

  const nextExample = useCallback(() => {
    if (!activeExamples.length) return;
    setExampleIdx((i) => (i + 1) % activeExamples.length);
  }, [activeExamples.length]);

  const prevExample = useCallback(() => {
    if (!activeExamples.length) return;
    setExampleIdx((i) => (i - 1 + activeExamples.length) % activeExamples.length);
  }, [activeExamples.length]);

  const canSwipeExamples = activeExamples.length > 1 && !examplesBusy;

  const switchExamplesTab = (tab) => {
    setExamplesTab(tab);
    setExampleIdx(0);
  };

  const ex = activeExamples[exampleIdx];
  const currentExampleText = lineFromExampleField(ex?.text);
  const currentExampleRuRaw = lineFromExampleField(ex?.translation);
  const currentExampleRu = currentExampleRuRaw
    ? formatExampleTranslationForLocale(currentExampleRuRaw, contentLocaleKey)
    : '';
  const cardLocaleMismatch =
    detail?.content_locale &&
    String(detail.content_locale).toLowerCase() !== String(contentLocaleKey).toLowerCase();
  // Старые карточки с колонкой note_ru — показываем второй строкой.
  const legacyExampleNoteRu = lineFromExampleField(ex?.note_ru);
  const examplePickKey = `${selectedId}-${examplesTab}-${exampleIdx}`;

  useEffect(() => {
    clearWordPick();
  }, [selectedId, examplesTab, exampleIdx, clearWordPick]);

  const myExamplesInputReady = Boolean(
    selectedId && examplesTab === 'mine' && !examplesBusy && !detailLoading,
  );
  const myExamplesInputRef = useAutofocusInput(myExamplesInputReady, [
    selectedId,
    examplesTab,
    examplesBusy,
    detailLoading,
  ]);

  const onSpeakAloudError = useCallback((msg) => {
    setError(msg);
  }, []);

  const startWordPractice = useCallback(async () => {
    if (!selectedId || examplesBusy) return;
    const wordLabel = String(detail?.word ?? words.find((w) => Number(w.id) === Number(selectedId))?.word ?? '').trim();
    const ok = await showConfirm({
      title: t('dict.wordPracticeConfirmTitle'),
      message: t('dict.wordPracticeConfirmMsg', { word: wordLabel || '…' }),
      confirmLabel: t('dict.wordPracticeConfirmGo'),
    });
    if (!ok) return;
    navigate(`/practice/word/${selectedId}`);
  }, [detail?.word, examplesBusy, navigate, selectedId, showConfirm, t, words]);

  const verbUsageRows = Array.isArray(detail?.verb_usage) ? detail.verb_usage : [];
  const showVerbUsage = verbUsageRows.length === 3;

  const selectedSetNames =
    Array.isArray(detail?.setIds) && detail.setIds.length
      ? detail.setIds
          .map((sid) => sets.find((s) => Number(s.id) === Number(sid))?.name)
          .filter(Boolean)
      : [];

  const headerTitle =
    selectedId != null ? (
      <Box className="ss-dict-header-meta">
        <span dir="auto">{detail?.word || '…'}</span>
        {selectedSetNames.length ? (
          <Footnote className="ss-dict-set-names" dir="auto">
            {selectedSetNames.join(', ')}
          </Footnote>
        ) : null}
      </Box>
    ) : (
      t('dict.title')
    );
  const activeSetName =
    screen === 'group' && Number.isFinite(activeSetId)
      ? sets.find((s) => Number(s.id) === Number(activeSetId))?.name ?? t('dict.group')
      : null;

  const createNewSet = async () => {
    const name = newSetName.trim().replace(/\s+/g, ' ');
    if (!name || !userId) return;
    setCreatingSet(true);
    setError(null);
    try {
      await api.createSet(name);
      setNewSetName('');
      await loadSets();
    } catch (e) {
      setError(e.message || t('errors.createSetFailed'));
    } finally {
      setCreatingSet(false);
    }
  };

  const doRenameSet = async (sid) => {
    const cur = sets.find((s) => Number(s.id) === Number(sid));
    const next = window.prompt(t('dict.renamePrompt'), cur?.name ?? '');
    if (next == null) return;
    const name = String(next).trim().replace(/\s+/g, ' ');
    if (!name) return;
    setError(null);
    try {
      await api.renameSet(sid, name);
      await loadSets();
    } catch (e) {
      setError(e.message || t('errors.renameFailed'));
    }
  };

  const doDeleteSet = async (sid) => {
    const ok = await showConfirm({
      title: t('dict.deleteGroupTitle'),
      message: t('dict.deleteGroupMsg'),
      destructive: true,
      confirmLabel: t('common.delete'),
    });
    if (!ok) {
      return;
    }
    setError(null);
    try {
      const r = await api.deleteSet(sid);
      const removedWordIds = Array.isArray(r?.removedWordIds) ? r.removedWordIds : [];
      if (screen === 'group' && Number(activeSetId) === Number(sid)) {
        setScreen('dictionary');
        setActiveSetId(null);
      }
      if (selectedId && removedWordIds.some((x) => Number(x) === Number(selectedId))) {
        closeWord();
      }
      await loadSets();
      await loadList();
    } catch (e) {
      setError(e.message || t('errors.deleteSetFailed'));
    }
  };

  const togglePendingSet = (sid) => {
    const n = Number(sid);
    setPendingSetIds((prev) =>
      prev.some((x) => Number(x) === n) ? prev.filter((x) => Number(x) !== n) : [...prev, n],
    );
  };

  const closeWordSetsModalDiscard = useCallback(() => {
    setWordSetsModalOpen(false);
    setModalNewSetName('');
    setCreatingSetInModal(false);
    setPendingSetIds(Array.isArray(detail?.setIds) ? [...detail.setIds] : []);
  }, [detail?.setIds]);

  const openWordSetsPicker = useCallback(() => {
    setModalNewSetName('');
    setPendingSetIds(Array.isArray(detail?.setIds) ? [...detail.setIds] : []);
    void loadSets();
    setWordSetsModalOpen(true);
  }, [detail?.setIds, loadSets]);

  useEffect(() => {
    if (!wordSetsModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [wordSetsModalOpen]);

  const createSetFromModal = async () => {
    const name = modalNewSetName.trim().replace(/\s+/g, ' ');
    if (!name || !userId) return;
    setCreatingSetInModal(true);
    setError(null);
    try {
      const created = await api.createSet(name);
      setModalNewSetName('');
      await loadSets();
      const newId = created?.id != null ? Number(created.id) : NaN;
      if (Number.isFinite(newId) && newId > 0) {
        setPendingSetIds((prev) => (prev.some((x) => Number(x) === newId) ? prev : [...prev, newId]));
      }
    } catch (e) {
      setError(e.message || t('errors.createSetFailed'));
    } finally {
      setCreatingSetInModal(false);
    }
  };

  const saveWordSets = async () => {
    if (selectedId == null || !userId) return;
    setError(null);
    try {
      const r = await api.updateWordSets(selectedId, pendingSetIds);
      const out = Array.isArray(r?.setIds) ? r.setIds : pendingSetIds;
      setDetail((prev) => (prev ? { ...prev, setIds: out } : prev));
      setWordSetsModalOpen(false);
      setModalNewSetName('');
      await loadList();
    } catch (e) {
      setError(e.message || t('errors.saveSetsFailed'));
    }
  };

  const onBack = () => {
    if (selectedId != null) {
      if (wordDetailHistoryRef.current) {
        window.history.back();
      } else {
        closeWord();
      }
      return;
    }
    if (screen === 'group') {
      setScreen('groups');
      return;
    }
    if (screen === 'groups') {
      setScreen('dictionary');
      return;
    }
    void goBackOrHome();
  };

  const resolveBeforeEscape = useCallback(() => {
    if (wordSetsModalOpen) {
      closeWordSetsModalDiscard();
      return true;
    }
    if (confirmUi) {
      finishConfirm(false);
      return true;
    }
    return false;
  }, [wordSetsModalOpen, closeWordSetsModalDiscard, confirmUi, finishConfirm]);

  useEscapeBack(onBack, { resolveBeforeBack: resolveBeforeEscape });

  const wordSetsModal =
    splitModalMount != null && wordSetsModalOpen
      ? createPortal(
          <div className="seashell-wordsets-shell seashell-crt">
            <button
              type="button"
              className="seashell-wordsets-shell__backdrop"
              aria-label={t('common.close')}
              onClick={closeWordSetsModalDiscard}
            />
            <div
              className="seashell-wordsets-shell__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="seashell-wordsets-title"
            >
              <div className="seashell-wordsets-shell__head">
                <ModalDismissButton onClick={closeWordSetsModalDiscard} />
                <Text weight="2" id="seashell-wordsets-title" className="seashell-wordsets-shell__title">
                  {t('dict.wordSetsTitle')}
                </Text>
              </div>
              <div className="seashell-wordsets-shell__body">
                <Box
                  style={{
                    paddingTop: 12,
                    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                    paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
                    paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
                    boxSizing: 'border-box',
                  }}
                >
                  {setsLoading ? (
                    <Box className="ss-center-load ss-center-load--compact">
                      <Spinner />
                    </Box>
                  ) : null}

                  {!setsLoading && sets.length === 0 ? (
                    <Footnote>{t('dict.noGroupsModal')}</Footnote>
                  ) : null}

                  {!setsLoading && sets.length > 0 ? (
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {sets.map((s) => (
                        <Checkbox
                          key={s.id}
                          checked={pendingSetIds.some((x) => Number(x) === Number(s.id))}
                          onChange={() => togglePendingSet(s.id)}
                        >
                          {s.name}
                        </Checkbox>
                      ))}
                    </Box>
                  ) : null}

                  <Separator className="ss-dict-separator--lg" />

                  <FormItem top={t('dict.newGroup')}>
                    <Input
                      id="seashell-modal-new-set"
                      value={modalNewSetName}
                      onChange={(e) => setModalNewSetName(e.target.value)}
                      disabled={creatingSetInModal}
                    />
                  </FormItem>

                  <Box className="seashell-wordsets-shell__body seashell-dict-card-actions">
                    <Button
                      type="button"
                      size="l"
                      flat
                      stretched
                      loading={creatingSetInModal}
                      disabled={!modalNewSetName.trim() || creatingSetInModal}
                      i18nKey="dict.createAndSelect"
                      onClick={() => void createSetFromModal()}
                    />
                    <Button
                      type="button"
                      size="l"
                      flat
                      stretched
                      disabled={refreshing || setsLoading}
                      i18nKey="common.save"
                      onClick={() => void saveWordSets()}
                    />
                    <Button
                      type="button"
                      size="l"
                      flat
                      stretched
                      mode="secondary"
                      disabled={creatingSetInModal}
                      i18nKey="common.cancel"
                      onClick={closeWordSetsModalDiscard}
                    />
                  </Box>
                </Box>
              </div>
            </div>
          </div>,
          splitModalMount,
        )
      : null;

  return (
    <Panel>
      {snackbar}
      {wordSetsModal}
      <SeashellConfirm
        mountEl={splitModalMount}
        open={Boolean(confirmUi)}
        title={confirmUi?.title ?? ''}
        message={confirmUi?.message}
        destructive={confirmUi?.destructive}
        confirmLabel={confirmUi?.confirmLabel}
        cancelLabel={confirmUi?.cancelLabel}
        onConfirm={() => finishConfirm(true)}
        onCancel={() => finishConfirm(false)}
      />

      <PanelHeader before={<PanelHeaderBack onClick={onBack} />}>
        {selectedId != null ? headerTitle : screen === 'group' ? activeSetName : t('dict.title')}
      </PanelHeader>

      {!userId && !error && (
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

      {/* Список слов и форма добавления */}
      {selectedId == null && userId && (
        <>
          {showCardTranslationLocalePicker(learnLocale) && (screen === 'dictionary' || screen === 'group') && (
            <CardTranslationLocalePicker
              modalMount={splitModalMount}
              learnLocale={learnLocale}
              onLocaleChange={handleCardLocaleChange}
            />
          )}

          {screen === 'dictionary' && (
            <Group header={<GroupHeader mode="secondary">{t('dict.groups')}</GroupHeader>}>
              <Cell
                chevron
                disabled={setsLoading}
                onClick={() => setScreen('groups')}
                after={
                  <DismissibleHint hintId="dict.groups" className="ss-hint--inline ss-hint--subtle">
                    {t('dict.groupsHint')}
                  </DismissibleHint>
                }
              >
                {t('dict.myGroups')}
              </Cell>
            </Group>
          )}

          {screen === 'groups' && (
            <Group header={<GroupHeader mode="secondary">{t('dict.myGroups')}</GroupHeader>}>
              <form
                className="ss-form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void createNewSet();
                }}
              >
                <FormItem top={t('dict.newGroup')}>
                  <Input
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    disabled={creatingSet}
                  />
                </FormItem>
                <Button
                  type="submit"
                  size="l"
                  flat
                  stretched
                  mode="secondary"
                  loading={creatingSet}
                  disabled={!newSetName.trim()}
                  i18nKey="dict.createGroup"
                />
              </form>

              {setsLoading && (
                <Box className="ss-center-load ss-center-load--compact">
                  <Spinner />
                </Box>
              )}

              {!setsLoading && sets.length === 0 && (
                <Box>
                  <Text>{t('dict.noGroups')}</Text>
                </Box>
              )}

              {!setsLoading &&
                sets.map((s) => (
                  <Cell
                    key={s.id}
                    onClick={() => {
                      setActiveSetId(Number(s.id));
                      setScreen('group');
                      setWordSetsModalOpen(false);
                    }}
                    subtitle={t('dict.openGroup')}
                    after={
                      <Box style={{ display: 'flex', gap: 12 }}>
                        <button
                          type="button"
                          className="ss-flat-link"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            doRenameSet(s.id);
                          }}
                        >
                          {tb('dict.rename')}
                        </button>
                        <button
                          type="button"
                          className="ss-flat-link"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            doDeleteSet(s.id);
                          }}
                        >
                          {tb('dict.delete')}
                        </button>
                      </Box>
                    }
                  >
                    {s.name}
                  </Cell>
                ))}
            </Group>
          )}

          {(screen === 'dictionary' || screen === 'group') && dictionaryReady && (
            <Group
              header={
                <div className="seashell-group-header-row">
                  <GroupHeader mode="secondary">
                    {screen === 'group' ? t('dict.newWordInGroup') : t('dict.newWord')}
                  </GroupHeader>
                  <DismissibleHint
                    hintId={screen === 'group' ? 'dict.add.group' : 'dict.add'}
                    className="ss-hint--inline ss-hint--subtle"
                  >
                    {screen === 'group'
                      ? dictMessageForLearn(t, 'dict.addHintGroup', learnLocale)
                      : dictMessageForLearn(t, 'dict.addHint', learnLocale)}
                  </DismissibleHint>
                </div>
              }
            >
            <form className="ss-form-stack" onSubmit={submitNewWord}>
              <FormItem top={dictWordInputLabel(t, learnLocale)}>
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  disabled={adding}
                  enterKeyHint="done"
                  autoComplete="off"
                />
              </FormItem>
              <Button
                type="submit"
                size="l"
                flat
                stretched
                mode="secondary"
                loading={adding}
                disabled={adding || !newWord.trim()}
                i18nKey="dict.addWord"
              />
            </form>
            </Group>
          )}

          {(screen === 'dictionary' || screen === 'group') && !dictionaryReady && (
            <Group>
              <Footnote>{t('dict.targetLangNotReady')}</Footnote>
            </Group>
          )}

          {(screen === 'dictionary' || screen === 'group') && (
            <Group header={<GroupHeader mode="secondary">{screen === 'group' ? t('dict.wordsInGroup') : t('dict.myWords')}</GroupHeader>}>
              {loading && (
                <Box className="ss-center-load">
                  <Spinner />
                </Box>
              )}
              {!loading && words.length === 0 && (
                <Box className="seashell-inline-action-row">
                  <Text style={{ flex: 1 }}>{t('dict.emptyWords')}</Text>
                  {!error && (
                    <DismissibleHint hintId="dict.emptyWords" className="ss-hint--inline ss-hint--subtle">
                      {t('dict.emptyWordsHint')}
                    </DismissibleHint>
                  )}
                </Box>
              )}
              {!loading &&
                words.map((w) => (
                  <Cell
                    key={w.id}
                    onClick={() => openWord(w.id)}
                    subtitle={
                      w.content_locale ? (
                        <>
                          {t('dict.examplesCount', { count: w.example_count ?? 0 })}
                          {' · '}
                          <span className="ss-native-name" lang={w.content_locale}>
                            {contentLocaleNativeName(w.content_locale)}
                          </span>
                        </>
                      ) : (
                        t('dict.examplesCount', { count: w.example_count ?? 0 })
                      )
                    }
                    after={
                      <button
                        type="button"
                        className="ss-flat-link seashell-dict-delete-btn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          void removeWord(w.id, e);
                        }}
                      >
                        {t('dict.delete')}
                      </button>
                    }
                  >
                    <span dir="auto">{w.word}</span>
                  </Cell>
                ))}
            </Group>
          )}
        </>
      )}

      {/* Карточка слова: значение, примеры, озвучка */}
      {selectedId != null && (
        <>
          {showCardTranslationLocalePicker(learnLocale) && (
            <CardTranslationLocalePicker
              modalMount={splitModalMount}
              learnLocale={learnLocale}
              hideHint
              onLocaleChange={handleCardLocaleChange}
            />
          )}
        <Group>
          {detailLoading && (
            <Box className="ss-center-load">
              <Spinner size="l" />
            </Box>
          )}
          {!detailLoading && detail && (
            <>
              <Box>
                <Text weight="2">{t('dict.meaning')}</Text>
                {detail.gloss_ru ? (
                  <Text className="ss-mt-6" dir="auto">{detail.gloss_ru}</Text>
                ) : (
                  <Footnote className="ss-mt-6">{t('dict.noMeaning')}</Footnote>
                )}
                {cardLocaleMismatch ? (
                  <Footnote className="ss-mt-md ss-opacity-dim" dir="auto">
                    {t('dict.cardLocaleMismatch', {
                      stored: contentLocaleNativeName(detail.content_locale),
                      current: contentLocaleNativeName(contentLocaleKey),
                    })}
                  </Footnote>
                ) : null}
                {lineFromExampleField(detail?.gloss_note_ru) ? (
                  <Footnote className="ss-mt-md ss-opacity-strong" dir="auto">
                    {t('dict.glossNoteLegacy', { text: lineFromExampleField(detail.gloss_note_ru) })}
                  </Footnote>
                ) : null}
                {showVerbUsage ? (
                  <>
                    <Separator className="ss-dict-separator" />
                    <Text weight="2">{t('dict.verbForms')}</Text>
                    {verbUsageRows.map((row, i) => {
                      const label = lineFromExampleField(row?.label) || t('dict.formN', { n: i + 1 });
                      const en = lineFromExampleField(row?.text);
                      const ru = lineFromExampleField(row?.translation);
                      return (
                        <Box key={`verb-usage-${i}`} className="ss-verb-usage-block">
                          <Footnote className="ss-opacity-subtle" dir="auto">{label}</Footnote>
                          {en ? (
                            <TappableExampleEnglish
                              text={en}
                              pickKey={`verb-usage-${i}`}
                              wordPick={wordPick}
                              onSelectWord={selectWord}
                              addLabel={t('practice.toDictionary')}
                              disabled={examplesBusy}
                              onAddClick={() =>
                                void addTextToDictionary(pickWord(`verb-usage-${i}`, en))
                              }
                            />
                          ) : null}
                          {ru ? (
                            <Text className="ss-mt-6 ss-opacity-soft" dir="auto">{ru}</Text>
                          ) : null}
                        </Box>
                      );
                    })}
                  </>
                ) : null}
                <Separator className="ss-dict-separator" />
                <div className="seashell-segmented" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examplesTab === 'builtin'}
                    className={`seashell-segmented__item${examplesTab === 'builtin' ? ' is-active' : ''}`}
                    onClick={() => switchExamplesTab('builtin')}
                  >
                    {tb('dict.examplesTab')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examplesTab === 'mine'}
                    className={`seashell-segmented__item${examplesTab === 'mine' ? ' is-active' : ''}`}
                    onClick={() => switchExamplesTab('mine')}
                  >
                    {tb('dict.myExamples')}
                  </button>
                </div>
                {examplesTab === 'mine' ? (
                  <Box className="ss-form-stack ss-mt-lg">
                    <FormItem top={t('dict.addMyExampleLabel')}>
                      <Textarea
                        ref={myExamplesInputRef}
                        rows={3}
                        value={nativeSentence}
                        onChange={(e) => setNativeSentence(e.target.value)}
                        disabled={examplesBusy}
                        enterKeyHint="done"
                      />
                    </FormItem>
                    <Button
                      size="l"
                      flat
                      stretched
                      mode="secondary"
                      loading={addingCustomExample}
                      disabled={examplesBusy || !nativeSentence.trim()}
                      i18nKey="dict.addMyExample"
                      onClick={() => void submitCustomExample()}
                    />
                    <Footnote className="ss-mt-md ss-opacity-soft" dir="auto">
                      {dictMessageForLearn(t, 'dict.myExamplesEmpty', learnLocale)}
                    </Footnote>
                  </Box>
                ) : null}
                {activeExamples.length ? (
                  <SwipeableExamplePane
                    enabled={canSwipeExamples}
                    pageKey={exampleIdx}
                    pageCount={activeExamples.length}
                    onNext={nextExample}
                    onPrev={prevExample}
                  >
                    <Separator className="ss-dict-separator" />
                    <Text weight="2">
                      {t('dict.exampleN', { n: exampleIdx + 1 })} {t('dict.of')} {activeExamples.length}
                    </Text>
                    <Separator className="ss-dict-separator" />
                    {currentExampleText ? (
                      <>
                        <TappableExampleEnglish
                          text={currentExampleText}
                          pickKey={examplePickKey}
                          wordPick={wordPick}
                          onSelectWord={selectWord}
                          addLabel={t('practice.toDictionary')}
                          disabled={examplesBusy}
                          onAddClick={() =>
                            void addTextToDictionary(pickWord(examplePickKey, currentExampleText))
                          }
                        />
                        {addingCustomExample ? (
                          <Box className="ss-mt-lg">
                            <StreamingCursor />
                          </Box>
                        ) : currentExampleRu ? (
                          examplesTab === 'mine' ? (
                            <StreamingText
                              text={currentExampleRu}
                              streamId={`dict-tr-${selectedId}-${exampleIdx}-${currentExampleRu}`}
                              className="ss-mt-lg ss-opacity-soft"
                              dir="auto"
                            />
                          ) : (
                            <Text className="ss-mt-lg ss-opacity-soft" dir="auto">
                              {currentExampleRu}
                            </Text>
                          )
                        ) : (
                          <Footnote className="ss-mt-md">{t('dict.noTranslation')}</Footnote>
                        )}
                        {legacyExampleNoteRu ? (
                          <Footnote className="ss-mt-md ss-opacity-subtle" dir="auto">
                            {t('dict.exampleNoteLegacy', { text: legacyExampleNoteRu })}
                          </Footnote>
                        ) : null}
                      </>
                    ) : (
                      <Footnote>{t('dict.noExample')}</Footnote>
                    )}
                  </SwipeableExamplePane>
                ) : examplesTab === 'mine' ? null : (
                  <Footnote className="ss-mt-lg">{t('dict.noExample')}</Footnote>
                )}
              </Box>
              <Group className="seashell-dict-card-actions">
                {examplesTab === 'builtin' && premium ? (
                  <Button
                    size="l"
                    flat
                    stretched
                    loading={refreshing}
                    disabled={examplesBusy}
                    mode="secondary"
                    i18nKey="dict.refreshExamples"
                    onClick={refreshExamples}
                  />
                ) : null}
                {examplesTab === 'builtin' && !premium ? (
                  <Box className="ss-vpad-block">
                    <Footnote dir="auto">{t('dict.refreshPremiumOnly')}</Footnote>
                  </Box>
                ) : null}
                {studyTtsSupported && currentExampleText ? (
                  <>
                    <ListenTtsButton
                      text={currentExampleText}
                      ttsLocale={learnLocale}
                      labelKey="dict.listen"
                      stretched
                      disabled={examplesBusy}
                      onError={(msg) => setError(msg)}
                    />
                    {studySttSupported ? (
                    <SpeakAloudButton
                      disabled={examplesBusy}
                      resetKey={`${selectedId}-${examplesTab}-${exampleIdx}`}
                      expectedText={currentExampleText}
                      speechLang={speechLocaleForLearn(learnLocale)}
                      onVoiceError={onSpeakAloudError}
                    />
                    ) : null}
                    {activeExamples.length > 1 ? (
                      <Button
                        size="l"
                        flat
                        stretched
                        mode="secondary"
                        disabled={examplesBusy}
                        i18nKey="dict.otherExample"
                        onClick={nextExample}
                      />
                    ) : null}
                  </>
                ) : null}
                <DictCardMoreActions resetKey={String(selectedId ?? '')}>
                  <Button
                    size="l"
                    flat
                    stretched
                    mode="secondary"
                    disabled={examplesBusy}
                    i18nKey="dict.wordPractice"
                    onClick={() => void startWordPractice()}
                  />
                  <Button
                    type="button"
                    flat
                    mode="secondary"
                    size="l"
                    stretched
                    disabled={setsLoading || detailLoading || examplesBusy}
                    i18nKey="dict.addToGroup"
                    onClick={openWordSetsPicker}
                  />
                  <Button
                    type="button"
                    size="l"
                    flat
                    stretched
                    mode="secondary"
                    disabled={examplesBusy}
                    i18nKey="dict.deleteWord"
                    onClick={() => {
                      void removeWord(selectedId, null);
                    }}
                  />
                </DictCardMoreActions>
                <AdBanner refreshKey={`${selectedId}-${examplesTab}-${exampleIdx}`} enabled />
              </Group>
            </>
          )}
        </Group>
        </>
      )}
    </Panel>
  );
}