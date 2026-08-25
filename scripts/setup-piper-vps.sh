#!/bin/bash
# Установка Piper + ffmpeg + голоса на VPS (после миграции с Beget).
# Запуск на сервере:
#   scp scripts/setup-piper-vps.sh root@193.41.4.206:/root/
#   ssh root@193.41.4.206 bash /root/setup-piper-vps.sh
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

PIPER_VER="${PIPER_VER:-2023.11.14-2}"
PIPER_ARCHIVE="${PIPER_ARCHIVE:-piper_linux_x86_64.tar.gz}"
PIPER_DIR="${PIPER_DIR:-/opt/piper}"
VOICES_DIR="${PIPER_DIR}/voices"
TTS_CACHE="${TTS_CACHE_DIR:-/var/lib/seashell-tts}"
ENV_FILE="${SEASHELL_ENV_FILE:-/root/seashell-server-new/.env}"

echo "=== Piper TTS для Seashell ==="

apt-get update -qq
apt-get install -y -qq ffmpeg curl ca-certificates

mkdir -p "$PIPER_DIR" "$VOICES_DIR" "$TTS_CACHE"

piper_binary() {
  find "$PIPER_DIR" -type f -name piper -executable ! -path '*/voices/*' 2>/dev/null | head -1
}

PIPER_BIN="$(piper_binary || true)"
if [[ -z "$PIPER_BIN" ]]; then
  echo "Скачиваю Piper ${PIPER_VER}…"
  rm -rf "$PIPER_DIR/piper"
  curl -fsSL -o /tmp/piper.tar.gz \
    "https://github.com/rhasspy/piper/releases/download/${PIPER_VER}/${PIPER_ARCHIVE}"
  tar -xzf /tmp/piper.tar.gz -C "$PIPER_DIR"
  rm -f /tmp/piper.tar.gz
  PIPER_BIN="$(piper_binary || true)"
fi

if [[ -z "$PIPER_BIN" ]]; then
  echo "ОШИБКА: бинарник piper не найден в $PIPER_DIR"
  exit 1
fi

ln -sf "$PIPER_BIN" /usr/local/bin/piper
cat > /usr/bin/piper <<EOF
#!/bin/sh
exec "$PIPER_BIN" "\$@"
EOF
chmod +x /usr/bin/piper

download_voice() {
  local base="$1"
  local url="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/${base}"
  local name
  name="$(basename "$base")"
  if [[ -f "$VOICES_DIR/$name" ]]; then
    echo "  уже есть: $name"
    return 0
  fi
  echo "  $name"
  curl -fsSL -o "$VOICES_DIR/$name" "$url"
}

echo "Голоса en-US / en-GB…"
download_voice "en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx"
download_voice "en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx.json"
download_voice "en/en_GB/cori/medium/en_GB-cori-medium.onnx"
download_voice "en/en_GB/cori/medium/en_GB-cori-medium.onnx.json"

echo "Голос ru-RU (dmitri, CC0)…"
download_voice "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx"
download_voice "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx.json"

echo "Голос ar-JO (kareem, MIT)…"
download_voice "ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx"
download_voice "ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx.json"

echo "Голос es-ES (sharvard, MIT)…"
download_voice "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx"
download_voice "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json"

echo "Голос pt-BR (faber, MIT)…"
download_voice "pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx"
download_voice "pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json"

echo "Голос it-IT (paola, MIT)…"
download_voice "it/it_IT/paola/medium/it_IT-paola-medium.onnx"
download_voice "it/it_IT/paola/medium/it_IT-paola-medium.onnx.json"

echo "Голос el-GR (rapunzelina, MIT)…"
download_voice "el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx"
download_voice "el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx.json"

echo "Голос fa-IR (amir, MIT)…"
download_voice "fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx"
download_voice "fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx.json"

echo "Голос da-DK (talesyntese, MIT)…"
download_voice "da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx"
download_voice "da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx.json"

echo "Голос nl-NL (mls, MIT)…"
download_voice "nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx"
download_voice "nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx.json"

echo "Голос fr-FR (siwis, MIT)…"
download_voice "fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx"
download_voice "fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json"

echo "Голос de-DE (thorsten, MIT)…"
download_voice "de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx"
download_voice "de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json"

echo "Голос tr-TR (dfki, MIT)…"
download_voice "tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx"
download_voice "tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx.json"

echo "Голос sv-SE (nst, MIT)…"
download_voice "sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx"
download_voice "sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx.json"

echo "Голос no-NO (talesyntese, MIT)…"
download_voice "no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx"
download_voice "no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx.json"

echo "Голос fi-FI (harri, MIT)…"
download_voice "fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx"
download_voice "fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx.json"

echo "Голос zh-CN (huayan, MIT)…"
download_voice "zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx"
download_voice "zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json"

echo "Голос uk-UA (ukrainian_tts, MIT)…"
download_voice "uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx"
download_voice "uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx.json"

echo "Голос pl-PL (gosia, MIT)…"
download_voice "pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx"
download_voice "pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx.json"

echo "Голос hi-IN (pratham, MIT)…"
download_voice "hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx"
download_voice "hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json"

echo "Голос ur-PK (fasih, main branch, MIT)…"
curl -fsSL -o "$VOICES_DIR/ur_PK-fasih-medium.onnx" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx"
curl -fsSL -o "$VOICES_DIR/ur_PK-fasih-medium.onnx.json" \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx.json"

echo "Проверка piper…"
piper --version || "$PIPER_BIN" --version
ffmpeg -version | head -1

# TTS_KEY_SECRET обязателен в production (иначе API /api/tts/speak → 503)
if [[ -f "$ENV_FILE" ]]; then
  if ! grep -q '^TTS_KEY_SECRET=' "$ENV_FILE" 2>/dev/null || grep -q '^TTS_KEY_SECRET=$' "$ENV_FILE"; then
    secret="$(openssl rand -hex 24)"
    if grep -q '^TTS_KEY_SECRET=' "$ENV_FILE"; then
      sed -i "s/^TTS_KEY_SECRET=.*/TTS_KEY_SECRET=${secret}/" "$ENV_FILE"
    else
      printf '\n# TTS (Piper)\nTTS_ENABLED=true\nTTS_CACHE_DIR=%s\nTTS_KEY_SECRET=%s\n' "$TTS_CACHE" "$secret" >>"$ENV_FILE"
    fi
    echo "✓ TTS_KEY_SECRET добавлен в $ENV_FILE"
  else
    echo "✓ TTS_KEY_SECRET уже в .env"
  fi
  grep -q '^TTS_ENABLED=' "$ENV_FILE" || echo 'TTS_ENABLED=true' >>"$ENV_FILE"
  grep -q '^TTS_CACHE_DIR=' "$ENV_FILE" || echo "TTS_CACHE_DIR=${TTS_CACHE}" >>"$ENV_FILE"
  if grep -q '^TTS_PIPER_BIN=' "$ENV_FILE"; then
    sed -i "s|^TTS_PIPER_BIN=.*|TTS_PIPER_BIN=${PIPER_BIN}|" "$ENV_FILE"
  else
    echo "TTS_PIPER_BIN=${PIPER_BIN}" >>"$ENV_FILE"
  fi
  pm2 restart seashell-api --update-env 2>/dev/null || true
else
  echo "⚠ $ENV_FILE не найден — задайте TTS_KEY_SECRET вручную и pm2 restart"
fi

echo ""
echo "✓ Piper готов:"
echo "  piper:  $(command -v piper)"
echo "  voices: $VOICES_DIR"
echo "  cache:  $TTS_CACHE"
echo "Проверка в приложении: карточка слова → «Прослушать»"
