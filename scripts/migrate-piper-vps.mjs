#!/usr/bin/env node
/**
 * Перенос Piper + кэша mp3 (/var/lib/seashell-tts) с Beget на новый VPS.
 * Без скачивания на Windows — поток Beget → Aeza.
 *
 *   set SEASHELL_VPS_OLD=root@155.212.141.148
 *   set SEASHELL_VPS_NEW=root@193.41.4.206
 *   node scripts/migrate-piper-vps.mjs
 */
import { spawn, spawnSync } from 'node:child_process';

const OLD = process.env.SEASHELL_VPS_OLD ?? 'root@155.212.141.148';
const NEW = process.env.SEASHELL_VPS_NEW ?? 'root@193.41.4.206';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`[migrate-piper] ${OLD} → ${NEW}`);
console.log('  ( /opt/piper + /var/lib/seashell-tts )');

// 1. Архив на Beget
run('ssh', [
  OLD,
  `set -e
has_piper=0
[[ -x /opt/piper/piper ]] || command -v piper >/dev/null 2>&1 && has_piper=1
if [[ "$has_piper" -eq 0 ]]; then
  echo 'ОШИБКА: Piper не найден на Beget (/opt/piper).'
  echo 'На новом VPS: bash setup-piper-vps.sh'
  exit 2
fi
mkdir -p /var/lib/seashell-tts
cd /tmp
rm -f seashell-piper.tar.gz
tar -czf seashell-piper.tar.gz /opt/piper /var/lib/seashell-tts
ls -lh seashell-piper.tar.gz
echo "mp3 в архиве: $(tar -tzf seashell-piper.tar.gz | grep -c '\\.mp3$' || true)"
echo OK`,
]);

// 2. Поток Beget → Aeza (не через диск Windows)
console.log('\nКопирование архива Beget → Aeza (введите пароли SSH по запросу)…');
await new Promise((resolve, reject) => {
  const reader = spawn('ssh', [OLD, 'cat /tmp/seashell-piper.tar.gz'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const writer = spawn('ssh', [NEW, 'cat > /tmp/seashell-piper.tar.gz'], { stdio: ['pipe', 'inherit', 'inherit'] });
  reader.stdout.pipe(writer.stdin);
  let err = 0;
  reader.on('error', reject);
  writer.on('error', reject);
  reader.on('close', (code) => {
    if (code !== 0) err = code;
  });
  writer.on('close', (code) => {
    if (code !== 0 || err) reject(new Error(`stream exit ${code ?? err}`));
    else resolve();
  });
});

// 3. Распаковка на Aeza
run('ssh', [
  NEW,
  `set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ffmpeg
cd /
tar -xzf /tmp/seashell-piper.tar.gz
rm -f /tmp/seashell-piper.tar.gz
PIPER_BIN=$(find /opt/piper -type f -name piper -executable ! -path '*/voices/*' 2>/dev/null | head -1)
if [[ -z "$PIPER_BIN" ]]; then
  echo 'Бинарник piper не найден — запустите setup-piper-vps.sh'
else
  ln -sf "$PIPER_BIN" /usr/local/bin/piper
  cat > /usr/bin/piper <<EOF
#!/bin/sh
exec "$PIPER_BIN" "\\$@"
EOF
  chmod +x /usr/bin/piper
  echo "piper: $($PIPER_BIN --version 2>&1 | head -1)"
fi
chmod -R a+rX /opt/piper /var/lib/seashell-tts 2>/dev/null || true
echo "mp3 cache: $(find /var/lib/seashell-tts -name '*.mp3' 2>/dev/null | wc -l) files"
pm2 restart seashell-api --update-env
echo OK`,
]);

console.log('\n✓ Piper + кэш mp3 перенесены. Проверьте «Прослушать» в Mini App.');
