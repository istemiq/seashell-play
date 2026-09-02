import { useCallback, useRef, useState } from 'react';

import { addWord as addWordToDictionary } from '../api/dictionaryApi.js';
import { fetchUserLimits } from '../api/userApi.js';
import { isAdUnavailableError, runWithAdRetry } from '../utils/limitsGate.js';

function selectedTextOr(fallback) {
  if (typeof window === 'undefined') return fallback;
  const sel = window.getSelection?.();
  const trimmed = sel ? String(sel.toString() || '').trim() : '';
  return trimmed || fallback;
}

/**
 * Tap a word in practice dialogue, then confirm add — with loading and success feedback.
 * pickKey examples: "2:user", "verb-usage-0", "example-3".
 */
export function usePracticeDictionaryAdd({
  tr,
  showConfirm,
  onLimitsUpdate,
  onSuccess,
  onError,
}) {
  const [wordPick, setWordPick] = useState(null);
  const [addingPick, setAddingPick] = useState(null);
  const [addedPick, setAddedPick] = useState(null);
  const addedTimerRef = useRef(null);

  const selectWord = useCallback((pickKey, word) => {
    if (addedTimerRef.current) {
      clearTimeout(addedTimerRef.current);
      addedTimerRef.current = null;
    }
    setAddedPick(null);
    setWordPick((prev) => {
      if (!word) return prev?.pickKey === pickKey ? null : prev;
      return { pickKey, word };
    });
  }, []);

  const pickWord = useCallback(
    (pickKey, fallback) => {
      if (wordPick?.pickKey === pickKey && wordPick?.word) return wordPick.word;
      return selectedTextOr(fallback);
    },
    [wordPick],
  );

  const clearWordPick = useCallback(() => setWordPick(null), []);

  const getBlockState = useCallback(
    (pickKey) => ({
      selectedWord: wordPick?.pickKey === pickKey ? wordPick.word : null,
      loading: addingPick?.pickKey === pickKey,
      loadingWord: addingPick?.pickKey === pickKey ? addingPick.word : null,
      addedWord: addedPick?.pickKey === pickKey ? addedPick.word : null,
    }),
    [wordPick, addingPick, addedPick],
  );

  const addTextToDictionary = useCallback(
    async (text, pickKey) => {
      const word = String(text || '').trim().replace(/\s+/g, ' ');
      if (!word || word.length > 200) {
        onError?.(tr('errors.dictTooLong'));
        return;
      }

      setAddingPick({ pickKey, word });

      const addOnce = async () => {
        await addWordToDictionary(word);
        onSuccess?.(word);
        const fresh = await fetchUserLimits().catch(() => null);
        if (fresh) onLimitsUpdate?.(fresh);
      };

      try {
        await runWithAdRetry({
          type: 'words',
          action: addOnce,
          confirm: () => {
            const message =
              tr('dict.limitAdConfirm') ||
              'Free word limit reached. Watch a short ad to add 2 more words?';
            if (showConfirm) {
              return showConfirm({
                title: tr('dict.limitTitle') || 'Limit reached',
                message,
                confirmLabel: tr('dict.watchAd') || 'Watch ad',
                cancelLabel: tr('common.cancel') || 'Later',
              });
            }
            return window.confirm(message);
          },
          onLimitsUpdate,
        });
        setWordPick(null);
        setAddedPick({ pickKey, word });
        if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        addedTimerRef.current = setTimeout(() => {
          setAddedPick((prev) =>
            prev?.pickKey === pickKey && prev?.word === word ? null : prev,
          );
          addedTimerRef.current = null;
        }, 3500);
      } catch (e) {
        const msg = isAdUnavailableError(e)
          ? tr('ads.unavailable')
          : e.message || tr('errors.dictAddFailed');
        onError?.(msg);
      } finally {
        setAddingPick(null);
      }
    },
    [tr, showConfirm, onLimitsUpdate, onSuccess, onError],
  );

  return {
    wordPick,
    selectWord,
    pickWord,
    clearWordPick,
    getBlockState,
    addTextToDictionary,
  };
}
