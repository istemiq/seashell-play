/** @type {MediaStream | null} */
let sharedMicStream = null;

/** @type {Promise<MediaStream> | null} */
let sharedMicPromise = null;

function attachTrackEnded(stream) {
  for (const track of stream.getTracks()) {
    track.onended = () => {
      if (sharedMicStream === stream) {
        sharedMicStream = null;
      }
    };
  }
}

function isLiveStream(stream) {
  return Boolean(stream?.active && stream.getAudioTracks().some((t) => t.readyState === 'live'));
}

/**
 * Reuse one mic stream for the whole Mini App session — avoids permission on every card.
 */
export async function acquireSharedMicStream() {
  if (isLiveStream(sharedMicStream)) {
    return sharedMicStream;
  }
  sharedMicStream = null;

  if (sharedMicPromise) {
    return sharedMicPromise;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  sharedMicPromise = navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      sharedMicStream = stream;
      sharedMicPromise = null;
      attachTrackEnded(stream);
      return stream;
    })
    .catch((err) => {
      sharedMicPromise = null;
      throw err;
    });

  return sharedMicPromise;
}

/** Only for full app teardown — not on card navigation. */
export function releaseSharedMicStream() {
  const stream = sharedMicStream;
  sharedMicStream = null;
  sharedMicPromise = null;
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // ignore
    }
  }
}
