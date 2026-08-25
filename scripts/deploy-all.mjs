#!/usr/bin/env node
/**
 * API + фронт (seashell_tg_clean) на Aeza.
 * Требует SSH-ключ на 193.41.4.206 (см. scripts/ssh-add-key.cmd).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, cmd, args, opts = {}) {
  console.log(`\n[deploy-all] ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const pre = spawnSync(
  'ssh',
  ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'aeza', 'echo ok'],
  { encoding: 'utf8' },
);
if (pre.status !== 0) {
  console.error('\n✗ SSH к aeza (193.41.4.206) без пароля не работает.');
  console.error('  Один раз: scripts/ssh-add-key.cmd (введите пароль VPS)');
  console.error('  Потом снова: node scripts/deploy-all.mjs');
  process.exit(1);
}

process.env.SEASHELL_VPS = 'aeza';
run('API', 'node', [join(root, 'scripts', 'deploy-api-vps.mjs')], { cwd: root });
run('front', 'node', [join(root, 'scripts', 'deploy-tg-web-vps.mjs')], { cwd: root });
console.log('\n✓ API + front задеплоены');
