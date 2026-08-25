const CHECK_MS = 180;
const SPEECH_RMS = 0.014;

/**
 * Calls `onSilence` after `silenceMs` without speech once the user has spoken at least once.
 */
export function startRecordingSilenceWatch(stream, silenceMs, onSilence) {
  if (!stream || silenceMs <= 0) return () => {};

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  let stopped = false;
  let timer = 0;
  let ctx;
  let source;
  let analyser;

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    if (timer) window.clearTimeout(timer);
    try {
      source?.disconnect();
    } catch {
      // ignore
    }
    try {
      analyser?.disconnect();
    } catch {
      // ignore
    }
    if (ctx && ctx.state !== 'closed') {
      void ctx.close();
    }
  };

  try {
    ctx = new AudioCtx();
    source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
  } catch {
    cleanup();
    return () => {};
  }

  const samples = new Float32Array(analyser.fftSize);
  let lastSpeechAt = Date.now();
  let hadSpeech = false;

  const tick = () => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const v = samples[i];
      sum += v * v;
    }
    const rms = Math.sqrt(sum / samples.length);
    const now = Date.now();

    if (rms >= SPEECH_RMS) {
      hadSpeech = true;
      lastSpeechAt = now;
    } else if (hadSpeech && now - lastSpeechAt >= silenceMs) {
      cleanup();
      onSilence();
      return;
    }

    timer = window.setTimeout(tick, CHECK_MS);
  };

  void ctx.resume?.();
  timer = window.setTimeout(tick, CHECK_MS);

  return cleanup;
}
