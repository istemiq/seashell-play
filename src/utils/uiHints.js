const STORAGE_KEY = 'seashell_ui_hints_dismissed_v1';

function readSet() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function isUiHintDismissed(hintId) {
  if (!hintId) return false;
  return readSet().has(hintId);
}

export function dismissUiHint(hintId) {
  if (!hintId) return;
  const set = readSet();
  if (set.has(hintId)) return;
  set.add(hintId);
  writeSet(set);
}
