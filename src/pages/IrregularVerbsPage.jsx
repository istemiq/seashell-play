import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as dictionaryApi from '../api/dictionaryApi.js';
import * as irregularVerbsApi from '../api/irregularVerbsApi.js';
import { fetchUserLimits } from '../api/userApi.js';
import { AdBanner } from '../components/AdBanner.jsx';
import { DismissibleHint } from '../components/DismissibleHint.jsx';
import { EnCardTranslationLocalePicker } from '../components/EnCardTranslationLocalePicker.jsx';
import { DictCardMoreActions } from '../components/DictCardMoreActions.jsx';
import { SpeakAloudButton } from '../components/SpeakAloudButton.jsx';
import { SwipeableExamplePane } from '../components/SwipeableExamplePane.jsx';
import { TappableExampleEnglish } from '../components/TappableExampleEnglish.jsx';
import { SeashellConfirm } from '../components/SeashellConfirm.jsx';
import { SplitModalSlotContext } from '../context/SplitModalSlotContext.js';
import {
  Box,
  Button,
  Cell,
  Footnote,
  FormItem,
  Group,
  GroupHeader,
  Input,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Spinner,
  Text,
  Snackbar,
} from '../components/Ui.jsx';
import {
  blockVerbCount,
  getVerbById,
  IRREGULAR_VERB_BLOCK_KEYS,
  searchVerbs,
  verbsByIds,
} from '../content/irregularVerbsIndex.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { isEnglishLearnModule, useLearnLocale } from '../hooks/useLearnLocale.js';
import { useTappableDictionaryAdd } from '../hooks/useTappableDictionaryAdd.js';
import { usePlatformUser } from '../hooks/usePlatformUser.js';
import { usePremium } from '../hooks/usePremium.js';
import { isAdUnavailableError, isDailyLimitError, runWithAdRetry } from '../utils/limitsGate.js';
import { resolveContentLocaleForApi } from '../utils/contentLocale.js';
import { formatExampleTranslationForLocale } from '../utils/exampleTranslation.js';
import { irregularVerbExampleIdentity, useShuffledList } from '../utils/wordExamples.js';
import { ListenTtsButton } from '../components/ListenTtsButton.jsx';
import {
  clearDictWordIdForVerb,
  getDictWordIdForVerb,
  loadSavedVerbIds,
  removeSavedVerbId,
  saveVerbId,
  setDictWordIdForVerb,
} from '../utils/irregularVerbsProgress.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';

const HISTORY_DETAIL = { seashellIrregularVerb: 1 };
const FORM_KEYS = ['present', 'past_simple', 'past_participle'];

function exampleFormLabel(form, t) {
  if (form === 'present') return t('verbs.examplePresent');
  if (form === 'past_simple') return t('verbs.examplePastSimple');
  if (form === 'past_participle') return t('verbs.examplePastParticiple');
  return form;
}

function formDisplayValue(verb, formKey) {
  if (formKey === 'present') return verb.infinitive;
  if (formKey === 'past_simple') return verb.past_simple;
  return verb.past_participle;
}

function formShortLabel(formKey, t) {
  if (formKey === 'present') return t('verbs.examplePresent');
  if (formKey === 'past_simple') return t('verbs.examplePastSimple');
  return t('verbs.examplePastParticiple');
}

export function IrregularVerbsPage() {
  const { t, tb, locale } = useI18n();
  const splitModalMount = useContext(SplitModalSlotContext);
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { userId, error: userError } = usePlatformUser();
  const { premium } = usePremium();
  const learnLocale = useLearnLocale();

  useEffect(() => {
    if (!isEnglishLearnModule(learnLocale)) {
      navigate('/', { replace: true });
    }
  }, [learnLocale, navigate]);

  const [screen, setScreen] = useState('hub');
  const [activeBlock, setActiveBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerbId, setSelectedVerbId] = useState(null);
  const [activeForm, setActiveForm] = useState('present');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [exampleShuffleKey, setExampleShuffleKey] = useState(0);
  const [savedIds, setSavedIds] = useState(() => loadSavedVerbIds());
  const [dictWordId, setDictWordId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verbExamples, setVerbExamples] = useState([]);
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [examplesRefreshing, setExamplesRefreshing] = useState(false);
  const [examplesLocaleKey, setExamplesLocaleKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmUi, setConfirmUi] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const confirmResolveRef = useRef(null);
  const detailHistoryRef = useRef(false);
  const addingRef = useRef(false);

  const selectedVerb = selectedVerbId != null ? getVerbById(selectedVerbId) : null;

  const bumpExampleShuffle = useCallback(() => {
    setExampleShuffleKey((k) => k + 1);
  }, []);

  const examplesForActiveForm = useMemo(() => {
    if (!verbExamples.length) return [];
    return verbExamples.filter((e) => e.form === activeForm);
  }, [verbExamples, activeForm]);

  const exampleListShuffleKey = `${exampleShuffleKey}:${selectedVerbId ?? 'none'}:${activeForm}`;
  const examplesForForm = useShuffledList(
    examplesForActiveForm,
    exampleListShuffleKey,
    irregularVerbExampleIdentity,
  );

  const showConfirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        confirmResolveRef.current = resolve;
        setConfirmUi({
          title: opts.title,
          message: opts.message ?? '',
          destructive: Boolean(opts.destructive),
          confirmLabel: opts.confirmLabel ?? t('common.yes'),
          cancelLabel: opts.cancelLabel ?? t('common.cancel'),
        });
      }),
    [t],
  );

  const finishConfirm = useCallback((ok) => {
    setConfirmUi(null);
    const resolve = confirmResolveRef.current;
    confirmResolveRef.current = null;
    resolve?.(ok);
  }, []);

  const { selectWord, pickWord, clearWordPick, getBlockState, addTextToDictionary } = useTappableDictionaryAdd({
    tr: t,
    showConfirm,
    onSuccess: (word) => {
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
    if (userError) setError(userError);
  }, [userError]);

  useEffect(() => {
    if (userId && !premium) {
      fetchUserLimits().catch(console.error);
    }
  }, [userId, premium]);

  useEffect(() => {
    const onPopState = () => {
      if (!detailHistoryRef.current) return;
      detailHistoryRef.current = false;
      setSelectedVerbId(null);
      setActiveForm('present');
      setExampleIdx(0);
      setDictWordId(null);
      setVerbExamples([]);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (selectedVerbId == null) {
      setDictWordId(null);
      return;
    }
    setDictWordId(getDictWordIdForVerb(selectedVerbId));
  }, [selectedVerbId]);

  useEffect(() => {
    if (!selectedVerb || dictWordId || !userId) return undefined;
    let cancelled = false;
    void (async () => {
      try {
        const data = await dictionaryApi.fetchWords();
        const match = (data.words || []).find(
          (w) => String(w.word).toLowerCase() === selectedVerb.infinitive.toLowerCase(),
        );
        if (!cancelled && match?.id) {
          setDictWordIdForVerb(selectedVerb.id, match.id);
          setDictWordId(Number(match.id));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedVerb, dictWordId, userId]);

  const filteredVerbs = useMemo(
    () => searchVerbs(activeBlock, searchQuery),
    [activeBlock, searchQuery],
  );

  const myVerbs = useMemo(() => verbsByIds(savedIds), [savedIds]);

  const bumpExamplesLocale = useCallback(() => {
    setExamplesLocaleKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (selectedVerbId == null || !userId) {
      setVerbExamples([]);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setExamplesLoading(true);
      setError(null);
      try {
        const data = await irregularVerbsApi.fetchIrregularVerbExamples(selectedVerbId);
        if (cancelled) return;
        if (data.needsGeneration) {
          const runGenerate = async () => {
            const generated = await irregularVerbsApi.generateIrregularVerbExamples(selectedVerbId);
            if (cancelled) return generated;
            setVerbExamples(Array.isArray(generated.examples) ? generated.examples : []);
            bumpExampleShuffle();
            setExampleIdx(0);
            return generated;
          };
          if (premium) {
            await runGenerate();
          } else {
            await runWithAdRetry({
              type: 'words',
              action: runGenerate,
              confirm: () =>
                showConfirm({
                  title: t('dict.limitTitle') || 'Limit reached',
                  message:
                    t('dict.limitAdConfirm') ||
                    'You reached the daily word limit. Watch a short ad to add 2 more words.',
                  confirmLabel: t('dict.watchAd') || 'Watch ad',
                  cancelLabel: t('common.cancel') || 'Later',
                }),
            });
          }
          return;
        }
        setVerbExamples(Array.isArray(data.examples) ? data.examples : []);
        bumpExampleShuffle();
        setExampleIdx(0);
      } catch (e) {
        if (cancelled) return;
        if (isAdUnavailableError(e)) {
          setError(t('ads.unavailable'));
        } else if (isDailyLimitError(e.message)) {
          setError(e.message);
        } else {
          setError(e.message || t('errors.loadFailed'));
        }
      } finally {
        if (!cancelled) setExamplesLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedVerbId, userId, premium, t, showConfirm, examplesLocaleKey, bumpExampleShuffle]);

  const refreshExamples = useCallback(async () => {
    if (!selectedVerbId || !userId || !premium) return;
    const ok = await showConfirm({
      title: t('dict.refreshExamplesConfirmTitle'),
      message: t('dict.refreshExamplesConfirmMsg'),
      confirmLabel: t('dict.refreshExamples'),
    });
    if (!ok) return;
    setExamplesRefreshing(true);
    setError(null);
    try {
      const data = await irregularVerbsApi.refreshIrregularVerbExamples(selectedVerbId);
      setVerbExamples(Array.isArray(data.examples) ? data.examples : []);
      bumpExampleShuffle();
      setExampleIdx(0);
    } catch (e) {
      setError(e.message || t('errors.refreshFailed'));
    } finally {
      setExamplesRefreshing(false);
    }
  }, [selectedVerbId, userId, premium, t, showConfirm, bumpExampleShuffle]);

  const openVerb = useCallback((verbId) => {
    bumpExampleShuffle();
    setSelectedVerbId(verbId);
    setActiveForm('present');
    setExampleIdx(0);
    saveVerbId(verbId);
    setSavedIds(loadSavedVerbIds());
    if (typeof window !== 'undefined') {
      window.history.pushState(HISTORY_DETAIL, '', window.location.href);
      detailHistoryRef.current = true;
    }
  }, [bumpExampleShuffle]);

  const closeVerb = useCallback(() => {
    const hadHistory = detailHistoryRef.current;
    detailHistoryRef.current = false;
    setSelectedVerbId(null);
    setActiveForm('present');
    setExampleIdx(0);
    setDictWordId(null);
    setVerbExamples([]);
    if (hadHistory && typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  const openBlock = (block) => {
    setActiveBlock(block);
    setSearchQuery('');
    setScreen('list');
  };

  const resolveDictWordId = useCallback(async () => {
    if (!selectedVerb || !userId) return null;
    if (dictWordId) return dictWordId;

    const addOnce = async () => {
      const created = await dictionaryApi.addWordFromIrregularVerb(selectedVerb.id);
      if (created?.id) {
        const id = Number(created.id);
        setDictWordIdForVerb(selectedVerb.id, id);
        setDictWordId(id);
        setSavedIds(loadSavedVerbIds());
        return id;
      }
      return null;
    };

    try {
      let createdId = null;
      await runWithAdRetry({
        type: 'words',
        action: async () => {
          createdId = await addOnce();
          return createdId != null;
        },
        confirm: () =>
          showConfirm({
            title: t('dict.limitTitle') || 'Limit reached',
            message:
              t('dict.limitAdConfirm') ||
              'You reached the daily word limit. Watch a short ad to add 2 more words.',
            confirmLabel: t('dict.watchAd') || 'Watch ad',
            cancelLabel: t('common.cancel') || 'Later',
          }),
      });
      if (createdId) return createdId;
      return getDictWordIdForVerb(selectedVerb.id);
    } catch (e) {
      if (isAdUnavailableError(e)) {
        setError(t('ads.unavailable'));
      } else if (isDailyLimitError(e.message)) {
        setError(e.message);
      } else if (/already in your dictionary|already exists/i.test(e.message || '')) {
        const data = await dictionaryApi.fetchWords();
        const match = (data.words || []).find(
          (w) => String(w.word).toLowerCase() === selectedVerb.infinitive.toLowerCase(),
        );
        if (match?.id) {
          const id = Number(match.id);
          setDictWordIdForVerb(selectedVerb.id, id);
          setDictWordId(id);
          setSavedIds(loadSavedVerbIds());
          return id;
        }
        setError(e.message || t('errors.addFailed'));
      } else {
        setError(e.message || t('errors.addFailed'));
      }
      return null;
    }
  }, [selectedVerb, userId, dictWordId, t, showConfirm]);

  const addToDictionary = useCallback(async () => {
    if (!selectedVerb || !userId || addingRef.current) return;
    addingRef.current = true;
    setAdding(true);
    setError(null);
    try {
      await resolveDictWordId();
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  }, [selectedVerb, userId, resolveDictWordId]);

  const onSpeakAloudError = useCallback((msg) => {
    setError(msg);
  }, []);

  const startPractice = useCallback(async () => {
    if (!selectedVerb || !userId || practiceLoading) return;
    const wordLabel = String(selectedVerb.infinitive ?? '').trim();
    const ok = await showConfirm({
      title: t('dict.wordPracticeConfirmTitle'),
      message: t('verbs.wordPracticeConfirmMsg', { word: wordLabel || '…' }),
      confirmLabel: t('dict.wordPracticeConfirmGo'),
    });
    if (!ok) return;
    setPracticeLoading(true);
    setError(null);
    try {
      let wordId = dictWordId;
      if (!wordId) {
        wordId = await resolveDictWordId();
      }
      if (wordId) navigate(`/practice/word/${wordId}`);
    } finally {
      setPracticeLoading(false);
    }
  }, [selectedVerb, userId, dictWordId, practiceLoading, resolveDictWordId, navigate, showConfirm, t]);

  const removeFromDictionary = useCallback(async () => {
    if (!selectedVerb || !dictWordId || !userId || deleting) return;
    const ok = await showConfirm({
      title: t('dict.deleteWordTitle'),
      message: t('dict.deleteWordMsg'),
      destructive: true,
      confirmLabel: t('common.delete'),
    });
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      await dictionaryApi.removeWord(dictWordId);
      clearDictWordIdForVerb(selectedVerb.id);
      setDictWordId(null);
    } catch (e) {
      setError(e.message || t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }, [selectedVerb, dictWordId, userId, deleting, t, showConfirm]);

  const removeFromMyVerbs = useCallback(
    async (verbId = selectedVerbId, { closeDetail = true } = {}) => {
      const id = verbId != null ? Number(verbId) : NaN;
      if (!Number.isFinite(id) || removing) return;
      const ok = await showConfirm({
        title: t('verbs.removeFromMyVerbsTitle'),
        message: t('verbs.removeFromMyVerbsMsg'),
        destructive: true,
        confirmLabel: t('common.delete'),
      });
      if (!ok) return;
      setRemoving(true);
      setError(null);
      try {
        removeSavedVerbId(id);
        setSavedIds(loadSavedVerbIds());
        if (closeDetail && selectedVerbId === id) {
          closeVerb();
        }
      } finally {
        setRemoving(false);
      }
    },
    [selectedVerbId, removing, t, showConfirm, closeVerb],
  );

  const selectForm = (formKey) => {
    setActiveForm(formKey);
    setExampleIdx(0);
  };

  const nextExample = useCallback(() => {
    if (examplesForForm.length < 2) return;
    setExampleIdx((i) => (i + 1) % examplesForForm.length);
  }, [examplesForForm.length]);

  const prevExample = useCallback(() => {
    if (examplesForForm.length < 2) return;
    setExampleIdx((i) => (i - 1 + examplesForForm.length) % examplesForForm.length);
  }, [examplesForForm.length]);

  const onBack = () => {
    if (selectedVerbId != null) {
      if (detailHistoryRef.current) {
        window.history.back();
      } else {
        closeVerb();
      }
      return;
    }
    if (screen === 'list') {
      setScreen('blocks');
      setActiveBlock(null);
      setSearchQuery('');
      return;
    }
    if (screen === 'blocks') {
      setScreen('hub');
      return;
    }
    void goBackOrHome();
  };

  const resolveBeforeEscape = useCallback(() => {
    if (confirmUi) {
      finishConfirm(false);
      return true;
    }
    return false;
  }, [confirmUi, finishConfirm]);

  useEscapeBack(onBack, { resolveBeforeBack: resolveBeforeEscape });

  const headerTitle = (() => {
    if (selectedVerb) return selectedVerb.infinitive;
    if (screen === 'blocks') return t('verbs.chooseList');
    if (screen === 'list' && activeBlock) {
      if (activeBlock === 'top_50') return t('verbs.blockTop50');
      if (activeBlock === 'top_100') return t('verbs.blockTop100');
      return t('verbs.blockAdvanced');
    }
    return t('verbs.title');
  })();

  const blockTitle = (block) => {
    if (block === 'top_50') return t('verbs.blockTop50');
    if (block === 'top_100') return t('verbs.blockTop100');
    return t('verbs.blockAdvanced');
  };

  const currentExample = examplesForForm[exampleIdx] ?? examplesForForm[0];
  const exampleCount = examplesForForm.length;
  const canSwipeExamples = exampleCount > 1 && !examplesLoading && !examplesRefreshing;
  const exampleTranslationDisplay = useMemo(() => {
    if (!currentExample?.translation) return '';
    return formatExampleTranslationForLocale(
      currentExample.translation,
      resolveContentLocaleForApi(),
    );
  }, [currentExample?.translation, examplesLocaleKey]);
  const examplePickKey = `${selectedVerb?.id ?? 'none'}-${activeForm}-${exampleIdx}`;

  useEffect(() => {
    clearWordPick();
  }, [selectedVerb?.id, activeForm, exampleIdx, clearWordPick]);

  const isInMyVerbs = selectedVerbId != null && savedIds.includes(selectedVerbId);
  return (
    <Panel>
      {snackbar}
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

      <PanelHeader before={<PanelHeaderBack onClick={onBack} />}>{headerTitle}</PanelHeader>

      {error ? (
        <Group>
          <Box>
            <Footnote style={{ color: 'var(--ss-destructive, #e64646)' }}>{error}</Footnote>
          </Box>
        </Group>
      ) : null}

      {locale === 'en' && selectedVerbId == null ? (
        <EnCardTranslationLocalePicker
          modalMount={splitModalMount}
          onLocaleChange={bumpExamplesLocale}
          hideHint
        />
      ) : null}

      {screen === 'hub' && selectedVerbId == null ? (
        <>
          <Group>
            <Cell
              chevron
              onClick={() => setScreen('blocks')}
              after={
                <DismissibleHint hintId="verbs.hub" className="ss-hint--inline ss-hint--subtle">
                  {locale === 'en' ? (
                    <>
                      {t('dict.cardLangHint')}
                      <br />
                      <br />
                      {t('verbs.hubHint')}
                    </>
                  ) : (
                    t('verbs.hubHint')
                  )}
                </DismissibleHint>
              }
            >
              {t('verbs.addWord')}
            </Cell>
          </Group>

          <Group header={<GroupHeader size="s">{t('verbs.myVerbs')}</GroupHeader>}>
            {myVerbs.length === 0 ? (
              <Box>
                <Footnote>{t('verbs.emptyMyVerbs')}</Footnote>
              </Box>
            ) : (
              myVerbs.map((v) => (
                <Cell
                  key={v.id}
                  chevron
                  onClick={() => openVerb(v.id)}
                  subtitle={v.translation}
                  after={
                    <button
                      type="button"
                      className="ss-flat-link seashell-dict-delete-btn"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void removeFromMyVerbs(v.id, { closeDetail: false });
                      }}
                    >
                      {tb('dict.delete')}
                    </button>
                  }
                >
                  <span dir="auto">{v.infinitive}</span>
                </Cell>
              ))
            )}
          </Group>
        </>
      ) : null}

      {screen === 'blocks' && selectedVerbId == null ? (
        <Group header={<GroupHeader mode="secondary">{t('verbs.chooseList')}</GroupHeader>}>
          {IRREGULAR_VERB_BLOCK_KEYS.map((block) => (
            <Cell
              key={block}
              chevron
              subtitle={t('verbs.blockCount', { count: blockVerbCount(block) })}
              onClick={() => openBlock(block)}
            >
              {blockTitle(block)}
            </Cell>
          ))}
        </Group>
      ) : null}

      {screen === 'list' && selectedVerbId == null ? (
        <>
          <Group>
            <FormItem top={t('verbs.searchLabel')}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </FormItem>
          </Group>
          <Group>
            {filteredVerbs.length === 0 ? (
              <Box>
                <Footnote>{t('verbs.emptySearch')}</Footnote>
              </Box>
            ) : (
              filteredVerbs.map((v) => (
                <Cell key={v.id} chevron onClick={() => openVerb(v.id)} subtitle={v.translation}>
                  <span dir="auto">{v.infinitive}</span>
                </Cell>
              ))
            )}
          </Group>
        </>
      ) : null}

      {selectedVerb ? (
        <>
          <Group>
            <Box>
              <Text dir="auto">
                {selectedVerb.translation}
              </Text>
              {selectedVerb.transcription ? (
                <Footnote className="ss-mt-sm" dir="auto">
                  {t('verbs.transcription')}: [{selectedVerb.transcription}] · {t('verbs.pattern')}{' '}
                  {selectedVerb.pattern}
                </Footnote>
              ) : null}
            </Box>
          </Group>

          <Group header={<GroupHeader size="s">{t('dict.verbForms')}</GroupHeader>}>
            {FORM_KEYS.map((formKey) => (
              <Cell
                key={formKey}
                selected={activeForm === formKey}
                onClick={() => selectForm(formKey)}
                subtitle={formShortLabel(formKey, t)}
              >
                <span dir="auto">{formDisplayValue(selectedVerb, formKey)}</span>
              </Cell>
            ))}
          </Group>

          <Group>
            <Box>
              {examplesLoading ? (
                <Box className="ss-center-load--y">
                  <Spinner size="m" />
                </Box>
              ) : currentExample ? (
                <SwipeableExamplePane
                  enabled={canSwipeExamples}
                  pageKey={exampleIdx}
                  pageCount={exampleCount}
                  onNext={nextExample}
                  onPrev={prevExample}
                >
                  <Text weight="2">
                    {t('dict.exampleN', { n: exampleIdx + 1 })} {t('dict.of')} {exampleCount}
                  </Text>
                  <Footnote className="ss-mt-sm" dir="auto">
                    {exampleFormLabel(currentExample.form, t)}
                  </Footnote>
                  <TappableExampleEnglish
                    text={currentExample.en}
                    pickKey={examplePickKey}
                    blockState={getBlockState(examplePickKey)}
                    onSelectWord={selectWord}
                    disabled={examplesLoading || examplesRefreshing}
                    onAddClick={() =>
                      void addTextToDictionary(pickWord(examplePickKey, currentExample.en), examplePickKey)
                    }
                    className="ss-mt-sm"
                  />
                  <Text className="ss-mt-md ss-dict-translation-text" dir="auto">
                    {exampleTranslationDisplay}
                  </Text>
                </SwipeableExamplePane>
              ) : !examplesLoading ? (
                <Text weight="2">{t('dict.noExample')}</Text>
              ) : null}
            </Box>
          </Group>

          <Group className="seashell-dict-card-actions ss-mt-xl">
            {premium ? (
              <Button
                size="l"
                flat
                stretched
                loading={examplesRefreshing}
                disabled={examplesRefreshing || examplesLoading}
                mode="secondary"
                i18nKey="dict.refreshExamples"
                onClick={() => void refreshExamples()}
              />
            ) : (
              <Box className="ss-vpad-block">
                <Footnote dir="auto">{t('dict.refreshPremiumOnly')}</Footnote>
              </Box>
            )}
            {currentExample?.en ? (
              <>
                <ListenTtsButton
                  text={currentExample.en}
                  labelKey="dict.listen"
                  stretched
                  disabled={examplesLoading || examplesRefreshing}
                  onError={(msg) => setError(msg)}
                />
                <SpeakAloudButton
                  disabled={examplesLoading || examplesRefreshing}
                  resetKey={`${selectedVerb.id}-${activeForm}-${exampleIdx}`}
                  expectedText={currentExample.en}
                  onVoiceError={onSpeakAloudError}
                />
                {exampleCount >= 2 ? (
                  <Button
                    size="l"
                    flat
                    stretched
                    mode="secondary"
                    disabled={examplesLoading || examplesRefreshing}
                    i18nKey="dict.otherExample"
                    onClick={nextExample}
                  />
                ) : null}
              </>
            ) : null}

            {!dictWordId ? (
              <Button
                size="l"
                flat
                stretched
                loading={adding}
                disabled={adding || practiceLoading || !userId || examplesLoading || examplesRefreshing}
                i18nKey="verbs.addToDictionary"
                onClick={() => void addToDictionary()}
              />
            ) : (
              <Box className="ss-vpad-block">
                <Footnote>{t('verbs.inDictionary')}</Footnote>
              </Box>
            )}

            <DictCardMoreActions resetKey={`${selectedVerb.id}-${activeForm}`}>
              <Button
                size="l"
                flat
                stretched
                mode="secondary"
                loading={practiceLoading}
                disabled={adding || practiceLoading || !userId || examplesLoading || examplesRefreshing}
                i18nKey="dict.wordPractice"
                onClick={() => void startPractice()}
              />
              {isInMyVerbs ? (
                <Button
                  size="l"
                  flat
                  stretched
                  mode="secondary"
                  loading={removing}
                  disabled={removing || deleting || adding || practiceLoading || examplesRefreshing}
                  i18nKey="verbs.removeFromMyVerbsShort"
                  onClick={() => void removeFromMyVerbs()}
                />
              ) : null}
              {dictWordId ? (
                <Button
                  size="l"
                  flat
                  stretched
                  mode="secondary"
                  loading={deleting}
                  disabled={deleting || removing || adding || practiceLoading || examplesRefreshing}
                  i18nKey="dict.deleteWord"
                  onClick={() => void removeFromDictionary()}
                />
              ) : null}
            </DictCardMoreActions>

            <AdBanner refreshKey={`iv-${selectedVerb.id}-${activeForm}-${exampleIdx}`} enabled />
          </Group>
        </>
      ) : null}
    </Panel>
  );
}
