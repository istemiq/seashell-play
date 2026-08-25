#!/usr/bin/env bash
# Install RUAccent for Russian TTS stress (Piper/espeak U+0301 marks).
set -euo pipefail

VENV="${TTS_RUACCENT_VENV:-/opt/seashell-ruaccent-venv}"
PY="${TTS_RUACCENT_PYTHON:-$VENV/bin/python3}"

if [[ ! -x "$PY" ]]; then
  echo "[setup-ruaccent] Creating venv at $VENV ..."
  python3 -m venv "$VENV"
fi

echo "[setup-ruaccent] Installing ruaccent into $VENV ..."
"$PY" -m pip install --upgrade pip
"$PY" -m pip install --upgrade 'ruaccent>=1.5.8'

mkdir -p /var/lib/seashell-ruaccent
chmod 755 /var/lib/seashell-ruaccent

echo "[setup-ruaccent] Pre-download model (first run may take 1–2 min)..."
TTS_RUACCENT_WORKDIR=/var/lib/seashell-ruaccent \
TTS_RUACCENT_MODEL="${TTS_RUACCENT_MODEL:-tiny2}" \
"$PY" - <<'PY'
import os
from ruaccent import RUAccent

model = os.environ.get("TTS_RUACCENT_MODEL", "tiny2")
workdir = os.environ.get("TTS_RUACCENT_WORKDIR", "/var/lib/seashell-ruaccent")
a = RUAccent()
a.load(omograph_model_size=model, use_dictionary=True, tiny_mode=False, workdir=workdir)
sample = a.process_all("На двери висит замок.")
print("sample:", sample)
PY

echo "[setup-ruaccent] OK — set in server .env:"
echo "  TTS_RUACCENT_ENABLED=1"
echo "  TTS_RUACCENT_PYTHON=$PY"
echo "  TTS_RUACCENT_MODEL=tiny2"
echo "  TTS_RUACCENT_WORKDIR=/var/lib/seashell-ruaccent"
