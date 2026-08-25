import { useCallback, useState } from 'react';

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
 * Tap a word in generated English text, then add it to the dictionary (same flow as practice dialogue).
 */
export function useTappableDictionaryAdd({
  tr,
  showConfirm,
  onLimitsUpdate,
  onSuccess,
  onError,
}) {
  const [wordPick, setWordPick] = useState(null);

  const selectWord = useCallback((pickKey, word) => {
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

  const addTextToDictionary = useCallback(
    async (text) => {
      const word = String(text || '').trim().replace(/\s+/g, ' ');
      if (!word || word.length > 200) {
        onError?.(tr('errors.dictTooLong'));
        return;
      }

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
      } catch (e) {
        const msg = isAdUnavailableError(e)
          ? tr('ads.unavailable')
          : e.message || tr('errors.dictAddFailed');
        onError?.(msg);
      }
    },
    [tr, showConfirm, onLimitsUpdate, onSuccess, onError],
  );

  return { wordPick, selectWord, pickWord, clearWordPick, addTextToDictionary };
}
