#!/bin/bash
# Бесплатные голоса Piper: sharvard (es_ES, MIT) и faber (pt_BR, MIT)
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
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium' \
  'es_ES-sharvard-medium.onnx' \
  'es_ES-sharvard-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pt/pt_BR/faber/medium' \
  'pt_BR-faber-medium.onnx' \
  'pt_BR-faber-medium.onnx.json'

ls -lh "$VOICES"/es_ES-sharvard-medium.* "$VOICES"/pt_BR-faber-medium.*

echo 'test es wav…'
echo 'Hola, esta es una prueba de voz en español.' | "$PIPER_BIN" \
  --model "$VOICES/es_ES-sharvard-medium.onnx" \
  --output_file /tmp/es-sharvard-test.wav

echo 'test pt wav…'
echo 'Olá, este é um teste de voz em português.' | "$PIPER_BIN" \
  --model "$VOICES/pt_BR-faber-medium.onnx" \
  --output_file /tmp/pt-faber-test.wav

ls -lh /tmp/es-sharvard-test.wav /tmp/pt-faber-test.wav
echo 'ok'
