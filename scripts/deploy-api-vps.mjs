#!/usr/bin/env node
/**
 * Деплой backend (./server) на VPS для Telegram Mini App.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = resolve(process.env.SEASHELL_BACKEND_DIR || join(root, 'server'));
const VPS = process.env.SEASHELL_VPS ?? 'root@193.41.4.206';
const REMOTE_DIR = process.env.SEASHELL_VPS_DIR ?? '/root/seashell-server-new';
const tarPath = join(tmpdir(), `seashell-server-${Date.now()}.tar.gz`);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || `${cmd} exit ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return r;
}

if (!existsSync(join(serverDir, 'index.js'))) {
  console.error(`[deploy:api-vps] Backend не найден: ${serverDir}`);
  console.error('Задайте SEASHELL_BACKEND_DIR или положите API в ./server');
  process.exit(1);
}

console.log(`[deploy:api-vps] ${serverDir} → ${VPS}:${REMOTE_DIR}`);
console.log('  (весь server/, без .env / node_modules / data/)');

try {
  run('tar', [
    '--force-local',
    '-czf',
    tarPath,
    '-C',
    serverDir,
    '--exclude=node_modules',
    '--exclude=.env',
    '--exclude=.env.save',
    '--exclude=data',
    '.',
  ]);

  run('scp', [tarPath, `${VPS}:${REMOTE_DIR}/deploy.tar.gz`]);
  run('ssh', [VPS, `cd ${REMOTE_DIR} && tar -xzf deploy.tar.gz && rm -f deploy.tar.gz`]);
  run('ssh', [VPS, `cd ${REMOTE_DIR} && rm -rf node_modules && npm install --omit=dev`]);
  run('ssh', [
    VPS,
    `cd ${REMOTE_DIR} && (pm2 restart seashell-api 2>/dev/null || pm2 start index.js --name seashell-api) && pm2 save && node scripts/install-usage-stats-cron.mjs --hour 9`,
  ]);

  const health = run('ssh', [VPS, 'curl -s http://127.0.0.1:3001/api/health']);
  console.log(health.stdout.trim());
  console.log('\n✓ VPS API обновлён из ./server');
} finally {
  try {
    unlinkSync(tarPath);
  } catch {
    // ignore
  }
}
