/** Tap-to-toggle (dictionary-style) vs legacy hold-to-speak. */
export function voiceUsesTap(mode) {
  return mode === 'tap' || mode === 'toggle-record';
}

export function practiceVoiceCellDisabled({ voiceAvailable, transcribing, listening, voiceBusy, blockStart }) {
  if (!voiceAvailable || transcribing) return true;
  if (listening) return false;
  return Boolean(blockStart || voiceBusy);
}

export function practiceVoiceCellLabel({ tr, tb, transcribing, listening }) {
  if (transcribing) return tr('practice.transcribing');
  if (listening) return tb('dict.speakAloudTapStop');
  return tr('practice.speak');
}
