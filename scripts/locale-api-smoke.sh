#!/bin/bash
set -u
AUTH=( -H "X-Play-App-Secret: ss-play-2026-k7m2p9x4" -H "X-Platform-User-Id: 497039245" -H "Content-Type: application/json" )
tests=(
  "en|zephyr|ru"
  "ru|дом|ru"
  "de|Hund|ru"
  "ja|本|ru"
  "uk|dim|ru"
  "pl|dom|ru"
  "he|ספר|ru"
  "ba|Кролик|ru"
  "ar|كتاب|ru"
  "es|casa|ru"
  "fr|maison|ru"
  "tr|ev|ru"
)

echo "Dictionary API smoke (localhost:3001)"
for item in "${tests[@]}"; do
  IFS='|' read -r lang word cloc <<< "$item"
  code=$(curl -sS -o /tmp/locale-out.json -w "%{http_code}" -X POST "${AUTH[@]}" \
    -H "X-Target-Lang: $lang" -H "X-Content-Locale: $cloc" -H "X-UI-Locale: ru" \
    -d "{\"word\":\"$word\"}" http://127.0.0.1:3001/api/words)
  if [ "$code" = "201" ]; then
    w=$(python3 -c "import json; print(json.load(open('/tmp/locale-out.json')).get('word','')[:40])" 2>/dev/null)
    echo "OK   $lang/$cloc  in=$word  headword=$w"
  elif [ "$code" = "409" ]; then
    echo "DUP  $lang/$cloc  in=$word  (already in dictionary)"
  else
    err=$(head -c 150 /tmp/locale-out.json)
    echo "FAIL $lang/$cloc  in=$word  HTTP=$code  $err"
  fi
done
