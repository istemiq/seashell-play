#!/usr/bin/env node
/**
 * Сборка + выгрузка TG-фронта на VPS → /var/www/seashell-tg (front.sishel.ru).
 *
 * PowerShell:  $env:SEASHELL_VPS='root@193.41.4.206'
 * cmd.exe:     set SEASHELL_VPS=root@193.41.4.206
 *
 *   deploy-front.cmd
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = join(root, 'build');
const VPS = process.env.SEASHELL_VPS ?? 'root@193.41.4.206';
const REMOTE_DIR = process.env.SEASHELL_TG_WEB_DIR ?? '/var/www/seashell-tg';
/** В папке проекта (ASCII-путь), не %TEMP% — иначе scp на Windows с кириллицей в профиле ломается */
const tarPath = join(root, '.deploy-tg-web.tar.gz');

const winShell = process.platform === 'win32';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: 'inherit', shell: winShell, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r;
}

/** ssh/scp без shell — иначе cmd.exe разбирает && внутри удалённой команды локально */
function runRemote(remoteCmd, { capture = false } = {}) {
  const r = spawnSync('ssh', [VPS, remoteCmd], {
    encoding: 'utf8',
    shell: false,
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (r.status !== 0) {
    if (capture) console.error(r.stderr || r.stdout);
    process.exit(r.status ?? 1);
  }
  return capture ? r.stdout.trim() : '';
}

function runScp(localPath, remotePath) {
  const r = spawnSync('scp', [localPath, remotePath], {
    encoding: 'utf8',
    shell: false,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!existsSync(buildDir)) {
  console.error('Нет папки build/. Сначала: npm run build:prod');
  process.exit(1);
}

console.log('[deploy:tg-web] Сборка production…');
run('npm', ['run', 'build:prod'], { cwd: root });

console.log(`[deploy:tg-web] ${buildDir} → ${VPS}:${REMOTE_DIR}`);
console.log('[deploy:tg-web] Пароль SSH — 4 раза (mkdir, upload, verify, unpack)');

try {
  if (existsSync(tarPath)) unlinkSync(tarPath);
  run('tar', ['-czf', tarPath, '-C', buildDir, '.']);
  if (!existsSync(tarPath)) {
    console.error('Не удалось создать архив:', tarPath);
    process.exit(1);
  }
  const localSize = readFileSync(tarPath).length;
  console.log(`[deploy:tg-web] архив ${Math.round(localSize / 1024)} KB → ${tarPath}`);

  runRemote(`mkdir -p ${REMOTE_DIR}`);
  runScp(tarPath, `${VPS}:${REMOTE_DIR}/deploy.tar.gz`);

  const remoteCheck = runRemote(`ls -la ${REMOTE_DIR}/deploy.tar.gz`, { capture: true });
  console.log('[deploy:tg-web] на сервере:', remoteCheck);

  const liveJs = runRemote(
    `cd ${REMOTE_DIR} && tar -xzf deploy.tar.gz && rm -f deploy.tar.gz && chmod -R a+rX ${REMOTE_DIR} && grep -o 'index-[^.]*\\.js' index.html | head -1`,
    { capture: true },
  );
  const jsCode = runRemote(
    `JS=$(grep -o 'index-[^.]*\\.js' ${REMOTE_DIR}/index.html | head -1); curl -s -o /dev/null -w '%{http_code}' https://front.sishel.ru/assets/$JS`,
    { capture: true },
  );
  const code = runRemote(`curl -s -o /dev/null -w '%{http_code}' https://front.sishel.ru/`, {
    capture: true,
  });
  if (jsCode !== '200') {
    console.error(`✗ JS bundle HTTP ${jsCode} — Mini App зависнет на «seashell». Повторите деплой.`);
    process.exit(1);
  }
  console.log(`\n✓ Деплой завершён. https://front.sishel.ru/ → HTTP ${code}, bundle: ${liveJs} (JS HTTP ${jsCode})`);
  console.log('Закрой Mini App полностью и открой снова.');
} finally {
  try {
    unlinkSync(tarPath);
  } catch {
    // ignore
  }
}
