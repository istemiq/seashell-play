#!/bin/bash
# Бесплатный голос Piper: Kareem (ar_JO, MIT) — https://huggingface.co/rhasspy/piper-voices/tree/main/ar/ar_JO/kareem
set -euo pipefail

VOICES="${PIPER_VOICES_DIR:-/opt/piper/voices}"
BASE='https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ar/ar_JO/kareem/medium'
PIPER_BIN="${TTS_PIPER_BIN:-/opt/piper/piper/piper}"

mkdir -p "$VOICES"

for f in ar_JO-kareem-medium.onnx ar_JO-kareem-medium.onnx.json; do
  dest="$VOICES/$f"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "already: $f"
    continue
  fi
  echo "download: $f"
  curl -fsSL -o "$dest" "$BASE/$f"
done

ls -lh "$VOICES"/ar_JO-kareem-medium.*

echo 'test wav…'
echo 'مرحبا، هذا اختبار للصوت العربي.' | "$PIPER_BIN" \
  --model "$VOICES/ar_JO-kareem-medium.onnx" \
  --output_file /tmp/ar-kareem-test.wav

ls -lh /tmp/ar-kareem-test.wav
echo 'ok'
