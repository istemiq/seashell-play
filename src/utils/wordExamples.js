import { useMemo, useRef } from 'react';

import { shuffleArray } from './shuffleArray.js';

export function isCustomExample(ex) {
  return Boolean(ex?.is_custom ?? ex?.isCustom);
}

export function splitWordExamples(examples) {
  const list = Array.isArray(examples) ? examples : [];
  const builtin = list.filter((ex) => !isCustomExample(ex));
  const custom = list.filter((ex) => isCustomExample(ex));
  return { builtin, custom };
}

function wordExampleIdentity(ex) {
  const text = String(ex?.text ?? '').trim();
  const translation = String(ex?.translation ?? '').trim();
  const idx = ex?.idx ?? '';
  return `${text}|${translation}|${idx}`;
}

export function irregularVerbExampleIdentity(ex) {
  const form = String(ex?.form ?? '').trim();
  const en = String(ex?.en ?? ex?.text ?? '').trim();
  const translation = String(ex?.translation ?? '').trim();
  return `${form}|${en}|${translation}`;
}

function reconcileShuffledList(prev, nextItems, identityFn) {
  const byId = new Map(nextItems.map((item) => [identityFn(item), item]));
  const kept = [];
  for (const item of prev) {
    const id = identityFn(item);
    if (byId.has(id)) {
      kept.push(byId.get(id));
      byId.delete(id);
    }
  }
  for (const item of byId.values()) kept.push(item);
  return kept;
}

/** Shuffle a list whenever shuffleKey changes; keep order stable until the next shuffle. */
export function useShuffledList(items, shuffleKey, identityFn) {
  const shuffledRef = useRef([]);
  const keyRef = useRef(null);

  return useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const key = String(shuffleKey ?? '');

    if (key !== keyRef.current) {
      keyRef.current = key;
      shuffledRef.current = shuffleArray(list);
      return shuffledRef.current;
    }

    if (list.length !== shuffledRef.current.length) {
      if (shuffledRef.current.length === 0 && list.length > 0) {
        shuffledRef.current = shuffleArray(list);
      } else {
        shuffledRef.current = reconcileShuffledList(shuffledRef.current, list, identityFn);
      }
    }

    return shuffledRef.current;
  }, [items, shuffleKey, identityFn]);
}

/** Built-in examples shuffled on shuffleKey change; custom examples keep API order. */
export function useShuffledWordExamples(examples, shuffleKey) {
  const { builtin, custom } = splitWordExamples(examples);
  const shuffledBuiltin = useShuffledList(builtin, shuffleKey, wordExampleIdentity);
  return { builtin: shuffledBuiltin, custom };
}
