#!/bin/bash
# Бесплатные голоса Piper: tr, sv, no, fi, zh — rhasspy v1.0.0, MIT (ko/ja — нет бесплатных голосов)
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
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/tr/tr_TR/dfki/medium' \
  'tr_TR-dfki-medium.onnx' \
  'tr_TR-dfki-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/sv/sv_SE/nst/medium' \
  'sv_SE-nst-medium.onnx' \
  'sv_SE-nst-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/no/no_NO/talesyntese/medium' \
  'no_NO-talesyntese-medium.onnx' \
  'no_NO-talesyntese-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fi/fi_FI/harri/medium' \
  'fi_FI-harri-medium.onnx' \
  'fi_FI-harri-medium.onnx.json'

download_voice \
  'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/zh/zh_CN/huayan/medium' \
  'zh_CN-huayan-medium.onnx' \
  'zh_CN-huayan-medium.onnx.json'

ls -lh "$VOICES"/tr_TR-dfki-medium.* "$VOICES"/sv_SE-nst-medium.* \
  "$VOICES"/no_NO-talesyntese-medium.* "$VOICES"/fi_FI-harri-medium.* \
  "$VOICES"/zh_CN-huayan-medium.*

echo 'test tr wav…'
echo 'Merhaba, bu Türkçe ses testidir.' | "$PIPER_BIN" \
  --model "$VOICES/tr_TR-dfki-medium.onnx" \
  --output_file /tmp/tr-dfki-test.wav

echo 'test sv wav…'
echo 'Hej, det här är ett svenskt rösttest.' | "$PIPER_BIN" \
  --model "$VOICES/sv_SE-nst-medium.onnx" \
  --output_file /tmp/sv-nst-test.wav

echo 'test no wav…'
echo 'Hei, dette er en norsk stemmetest.' | "$PIPER_BIN" \
  --model "$VOICES/no_NO-talesyntese-medium.onnx" \
  --output_file /tmp/no-talesyntese-test.wav

echo 'test fi wav…'
echo 'Hei, tämä on suomenkielinen äänitesti.' | "$PIPER_BIN" \
  --model "$VOICES/fi_FI-harri-medium.onnx" \
  --output_file /tmp/fi-harri-test.wav

echo 'test zh wav…'
echo '你好，这是中文语音测试。' | "$PIPER_BIN" \
  --model "$VOICES/zh_CN-huayan-medium.onnx" \
  --output_file /tmp/zh-huayan-test.wav

ls -lh /tmp/tr-dfki-test.wav /tmp/sv-nst-test.wav /tmp/no-talesyntese-test.wav \
  /tmp/fi-harri-test.wav /tmp/zh-huayan-test.wav
echo 'ok'
