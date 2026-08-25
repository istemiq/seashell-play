#!/bin/bash
# Бесплатные голоса Piper: paola (it_IT, MIT) и rapunzelina (el_GR, MIT)
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
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/it/it_IT/paola/medium' \
  'it_IT-paola-medium.onnx' \
  'it_IT-paola-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/el/el_GR/rapunzelina/low' \
  'el_GR-rapunzelina-low.onnx' \
  'el_GR-rapunzelina-low.onnx.json'

ls -lh "$VOICES"/it_IT-paola-medium.* "$VOICES"/el_GR-rapunzelina-low.*

echo 'test it wav…'
echo 'Ciao, questa è una prova della voce italiana.' | "$PIPER_BIN" \
  --model "$VOICES/it_IT-paola-medium.onnx" \
  --output_file /tmp/it-paola-test.wav

echo 'test el wav…'
echo 'Γεια σας, αυτή είναι μια δοκιμή της ελληνικής φωνής.' | "$PIPER_BIN" \
  --model "$VOICES/el_GR-rapunzelina-low.onnx" \
  --output_file /tmp/el-rapunzelina-test.wav

ls -lh /tmp/it-paola-test.wav /tmp/el-rapunzelina-test.wav
echo 'ok'
