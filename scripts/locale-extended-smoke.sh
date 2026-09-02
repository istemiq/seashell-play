#!/bin/bash
set -u
AUTH=( -H "X-Play-App-Secret: ss-play-2026-k7m2p9x4" -H "X-Platform-User-Id: 497039245" -H "Content-Type: application/json" )

echo "=== TTS smoke ==="
for item in "en-US:hello" "ru-RU:привет" "de-DE:Hallo" "ja-JP:こんにちは" "uk-UA:привіт" "ba:сәләм" "ar-JO:مرحبا" "he-IL:שלום" "ko-KR:안녕" "tr-TR:merhaba" "pl-PL:cześć" "es-ES:hola" "fr-FR:bonjour"; do
  IFS=':' read -r loc text <<< "$item"
  code=$(curl -sS -o /tmp/tts-out.bin -w "%{http_code}" -X POST "${AUTH[@]}" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$text\",\"locale\":\"$loc\"}" http://127.0.0.1:3001/api/tts/speak)
  size=$(wc -c < /tmp/tts-out.bin 2>/dev/null || echo 0)
  if [ "$code" = "200" ] && [ "$size" -gt 1000 ]; then
    echo "OK   TTS $loc  size=${size}B"
  else
    err=$(head -c 120 /tmp/tts-out.bin)
    echo "FAIL TTS $loc  HTTP=$code  size=$size  $err"
  fi
done

echo ""
echo "=== contentLocale=en (UI English) ==="
tests=(
  "en|apple|en"
  "ru|house|en"
  "de|Wasser|en"
  "ja|水|en"
  "uk|вода|en"
  "ba|Медведь|en"
)
for item in "${tests[@]}"; do
  IFS='|' read -r lang word cloc <<< "$item"
  code=$(curl -sS -o /tmp/locale-out.json -w "%{http_code}" -X POST "${AUTH[@]}" \
    -H "X-Target-Lang: $lang" -H "X-Content-Locale: $cloc" -H "X-UI-Locale: en" \
    -d "{\"word\":\"$word\"}" http://127.0.0.1:3001/api/words)
  if [ "$code" = "201" ]; then
    w=$(python3 -c "import json; print(json.load(open('/tmp/locale-out.json')).get('word','')[:40])" 2>/dev/null)
    echo "OK   $lang/$cloc  in=$word  headword=$w"
  elif [ "$code" = "409" ]; then
    echo "DUP  $lang/$cloc  in=$word"
  else
    err=$(head -c 150 /tmp/locale-out.json)
    echo "FAIL $lang/$cloc  in=$word  HTTP=$code  $err"
  fi
done

echo ""
echo "=== ba contentLocale fix (en->ru) ==="
code=$(curl -sS -o /tmp/locale-out.json -w "%{http_code}" -X POST "${AUTH[@]}" \
  -H "X-Target-Lang: ba" -H "X-Content-Locale: en" -H "X-UI-Locale: en" \
  -d '{"word":"Лиса"}' http://127.0.0.1:3001/api/words)
if [ "$code" = "201" ]; then
  w=$(python3 -c "import json; print(json.load(open('/tmp/locale-out.json')).get('word','')[:40])" 2>/dev/null)
  echo "OK   ba/en->ru  in=Лиса  headword=$w"
elif [ "$code" = "409" ]; then
  echo "DUP  ba/en->ru  in=Лиса"
else
  err=$(head -c 150 /tmp/locale-out.json)
  echo "FAIL ba/en->ru  HTTP=$code  $err"
fi
