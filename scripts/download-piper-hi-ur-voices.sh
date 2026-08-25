#!/bin/bash
# Бесплатные голоса Piper: hi (v1.0.0), ur (main branch) — rhasspy, MIT
set -euo pipefail

VOICES="${PIPER_VOICES_DIR:-/opt/piper/voices}"
PIPER_BIN="${TTS_PIPER_BIN:-/opt/piper/piper/piper}"

mkdir -p "$VOICES"

download_voice() {
  local base="$1"
  local onnx="$2"
  local json="$3"
  for f in "$onnx" "$json"; do
    dest="$VOICES/$f"
    if [[ -f "$dest" && -s "$dest" ]]; then
      echo "already: $f"
      continue
    fi
    echo "download: $f"
    curl -fsSL -o "$dest" "$base/$f"
  done
}

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/hi/hi_IN/pratham/medium' \
  'hi_IN-pratham-medium.onnx' \
  'hi_IN-pratham-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/fasih/medium' \
  'ur_PK-fasih-medium.onnx' \
  'ur_PK-fasih-medium.onnx.json'

ls -lh "$VOICES"/hi_IN-pratham-medium.* "$VOICES"/ur_PK-fasih-medium.*

echo 'test hi wav…'
echo 'नमस्ते, यह हिन्दी आवाज़ का परीक्षण है।' | "$PIPER_BIN" \
  --model "$VOICES/hi_IN-pratham-medium.onnx" \
  --output_file /tmp/hi-pratham-test.wav

echo 'test ur wav…'
echo 'سلام، یہ اردو آواز کا ٹیسٹ ہے۔' | "$PIPER_BIN" \
  --model "$VOICES/ur_PK-fasih-medium.onnx" \
  --output_file /tmp/ur-fasih-test.wav

ls -lh /tmp/hi-pratham-test.wav /tmp/ur-fasih-test.wav
echo 'ok'
