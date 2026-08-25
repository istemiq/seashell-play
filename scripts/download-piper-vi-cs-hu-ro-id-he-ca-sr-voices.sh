#!/bin/bash
# Piper voices: vi, cs, hu, ro, id (main), he (main), ca, sr
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
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium' \
  'vi_VN-vais1000-medium.onnx' \
  'vi_VN-vais1000-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/cs/cs_CZ/jirka/medium' \
  'cs_CZ-jirka-medium.onnx' \
  'cs_CZ-jirka-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/hu/hu_HU/anna/medium' \
  'hu_HU-anna-medium.onnx' \
  'hu_HU-anna-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ro/ro_RO/mihai/medium' \
  'ro_RO-mihai-medium.onnx' \
  'ro_RO-mihai-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium' \
  'id_ID-news_tts-medium.onnx' \
  'id_ID-news_tts-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/main/he/he_IL/saspeech/medium' \
  'he_IL-saspeech-medium.onnx' \
  'he_IL-saspeech-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ca/ca_ES/upc_ona/medium' \
  'ca_ES-upc_ona-medium.onnx' \
  'ca_ES-upc_ona-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/sr/sr_RS/serbski_institut/medium' \
  'sr_RS-serbski_institut-medium.onnx' \
  'sr_RS-serbski_institut-medium.onnx.json'

ls -lh "$VOICES"/vi_VN-vais1000-medium.* "$VOICES"/cs_CZ-jirka-medium.* \
  "$VOICES"/hu_HU-anna-medium.* "$VOICES"/ro_RO-mihai-medium.* \
  "$VOICES"/id_ID-news_tts-medium.* "$VOICES"/he_IL-saspeech-medium.* \
  "$VOICES"/ca_ES-upc_ona-medium.* "$VOICES"/sr_RS-serbski_institut-medium.*

echo 'ok'
