#!/bin/bash
# Install whisper.cpp (tiny.en) for server STT on Linux VPS.
set -euo pipefail

WHISPER_DIR="${WHISPER_DIR:-/opt/whisper.cpp}"
MODEL="${WHISPER_MODEL:-tiny.en}"

if [[ -x "$WHISPER_DIR/build/bin/whisper-cli" && -f "$WHISPER_DIR/models/ggml-${MODEL}.bin" ]]; then
  echo "whisper.cpp already installed at $WHISPER_DIR"
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git cmake build-essential ffmpeg

if [[ ! -d "$WHISPER_DIR/.git" ]]; then
  git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git "$WHISPER_DIR"
fi

cd "$WHISPER_DIR"
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j "$(nproc)"

if [[ ! -f "models/ggml-${MODEL}.bin" ]]; then
  bash ./models/download-ggml-model.sh "$MODEL"
fi

echo "OK: $WHISPER_DIR/build/bin/whisper-cli"
echo "OK: $WHISPER_DIR/models/ggml-${MODEL}.bin"
