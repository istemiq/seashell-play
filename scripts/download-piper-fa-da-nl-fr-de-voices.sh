#!/bin/bash
# Бесплатные голоса Piper: fa (amir), da (talesyntese), nl (mls), fr (siwis), de (thorsten) — rhasspy v1.0.0, MIT
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
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fa/fa_IR/amir/medium' \
  'fa_IR-amir-medium.onnx' \
  'fa_IR-amir-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/da/da_DK/talesyntese/medium' \
  'da_DK-talesyntese-medium.onnx' \
  'da_DK-talesyntese-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/nl/nl_NL/mls/medium' \
  'nl_NL-mls-medium.onnx' \
  'nl_NL-mls-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium' \
  'fr_FR-siwis-medium.onnx' \
  'fr_FR-siwis-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium' \
  'de_DE-thorsten-medium.onnx' \
  'de_DE-thorsten-medium.onnx.json'

ls -lh "$VOICES"/fa_IR-amir-medium.* "$VOICES"/da_DK-talesyntese-medium.* \
  "$VOICES"/nl_NL-mls-medium.* "$VOICES"/fr_FR-siwis-medium.* "$VOICES"/de_DE-thorsten-medium.*

echo 'test fa wav…'
echo 'سلام، این یک آزمایش صدای فارسی است.' | "$PIPER_BIN" \
  --model "$VOICES/fa_IR-amir-medium.onnx" \
  --output_file /tmp/fa-amir-test.wav

echo 'test da wav…'
echo 'Hej, dette er en test af den danske stemme.' | "$PIPER_BIN" \
  --model "$VOICES/da_DK-talesyntese-medium.onnx" \
  --output_file /tmp/da-talesyntese-test.wav

echo 'test nl wav…'
echo 'Hallo, dit is een test van de Nederlandse stem.' | "$PIPER_BIN" \
  --model "$VOICES/nl_NL-mls-medium.onnx" \
  --output_file /tmp/nl-mls-test.wav

echo 'test fr wav…'
echo 'Bonjour, ceci est un test de la voix française.' | "$PIPER_BIN" \
  --model "$VOICES/fr_FR-siwis-medium.onnx" \
  --output_file /tmp/fr-siwis-test.wav

echo 'test de wav…'
echo 'Hallo, das ist ein Test der deutschen Stimme.' | "$PIPER_BIN" \
  --model "$VOICES/de_DE-thorsten-medium.onnx" \
  --output_file /tmp/de-thorsten-test.wav

ls -lh /tmp/fa-amir-test.wav /tmp/da-talesyntese-test.wav /tmp/nl-mls-test.wav \
  /tmp/fr-siwis-test.wav /tmp/de-thorsten-test.wav
echo 'ok'
