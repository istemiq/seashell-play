#!/bin/bash
# Бесплатные голоса Piper: uk, pl — rhasspy v1.0.0, MIT
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
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/uk/uk_UA/ukrainian_tts/medium' \
  'uk_UA-ukrainian_tts-medium.onnx' \
  'uk_UA-ukrainian_tts-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pl/pl_PL/gosia/medium' \
  'pl_PL-gosia-medium.onnx' \
  'pl_PL-gosia-medium.onnx.json'

ls -lh "$VOICES"/uk_UA-ukrainian_tts-medium.* "$VOICES"/pl_PL-gosia-medium.*

echo 'test uk wav…'
echo 'Привіт, це тест українського голосу.' | "$PIPER_BIN" \
  --model "$VOICES/uk_UA-ukrainian_tts-medium.onnx" \
  --output_file /tmp/uk-ukrainian-test.wav

echo 'test pl wav…'
echo 'Cześć, to test polskiego głosu.' | "$PIPER_BIN" \
  --model "$VOICES/pl_PL-gosia-medium.onnx" \
  --output_file /tmp/pl-gosia-test.wav

ls -lh /tmp/uk-ukrainian-test.wav /tmp/pl-gosia-test.wav
echo 'ok'
