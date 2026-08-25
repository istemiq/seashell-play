import { useCallback, useEffect, useState } from 'react';

/**
 * Lazy practice dialogue — no AI until the user taps «Start dialogue».
 * Restored sessions (turnCount > 0) count as already started.
 */
export function usePracticeDialogGate(turnCount, { booting = false } = {}) {
  const [optedIn, setOptedIn] = useState(false);

  useEffect(() => {
    if (turnCount > 0) setOptedIn(true);
  }, [turnCount]);

  const startDialog = useCallback(() => setOptedIn(true), []);

  const resetDialog = useCallback(() => {
    setOptedIn(false);
  }, []);

  const idle = turnCount === 0 && !optedIn && !booting;
  const showDialogUi = turnCount > 0 || optedIn;

  return { idle, showDialogUi, startDialog, resetDialog };
}
