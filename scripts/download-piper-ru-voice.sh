#!/bin/bash
set -euo pipefail

VOICES="${PIPER_VOICES_DIR:-/opt/piper/voices}"
BASE='https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/dmitri/medium'
PIPER_BIN="${TTS_PIPER_BIN:-/opt/piper/piper/piper}"

mkdir -p "$VOICES"

for f in ru_RU-dmitri-medium.onnx ru_RU-dmitri-medium.onnx.json; do
  dest="$VOICES/$f"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "already: $f"
    continue
  fi
  echo "download: $f"
  curl -fsSL -o "$dest" "$BASE/$f"
done

ls -lh "$VOICES"/ru_RU-dmitri-medium.*

echo 'test wav…'
echo 'Привет, это проверка русской озвучки.' | "$PIPER_BIN" \
  --model "$VOICES/ru_RU-dmitri-medium.onnx" \
  --output_file /tmp/ru-dmitri-test.wav

ls -lh /tmp/ru-dmitri-test.wav
echo 'ok'
