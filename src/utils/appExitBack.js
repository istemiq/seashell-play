const EXIT_WINDOW_MS = 2000;

let lastRootBackAt = 0;

/** @returns {boolean} true when second press within window (should exit). */
export function registerRootBackPress() {
  const now = Date.now();
  if (now - lastRootBackAt <= EXIT_WINDOW_MS) {
    lastRootBackAt = 0;
    return true;
  }
  lastRootBackAt = now;
  return false;
}

export function resetRootBackPress() {
  lastRootBackAt = 0;
}
