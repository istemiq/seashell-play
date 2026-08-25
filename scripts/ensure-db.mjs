#!/usr/bin/env node
/**
 * Поднять Postgres в Docker, если :5432 не слушает.
 */
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function portOpen(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: root, ...opts });
  return r;
}

async function waitPort(port, attempts = 30, intervalMs = 1000) {
  for (let i = 0; i < attempts; i += 1) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

if (await portOpen(5432)) {
  process.exit(0);
}

console.log('[ensure-db] PostgreSQL на :5432 не отвечает — поднимаю Docker…');

const dockerInfo = run('docker', ['info']);
if (dockerInfo.status !== 0) {
  console.error('');
  console.error('[ensure-db] Docker не запущен.');
  console.error('[ensure-db] Включите Docker Desktop вручную и снова: npm run dev');
  console.error('');
  process.exit(1);
}

const up = run('docker', ['compose', 'up', '-d', 'db']);
if (up.status !== 0) {
  console.error(up.stderr || up.stdout || 'docker compose failed');
  process.exit(up.status ?? 1);
}

if (await waitPort(5432)) {
  console.log('[ensure-db] PostgreSQL готов на :5432');
  process.exit(0);
}

console.error('[ensure-db] Postgres не поднялся за 30 с. Проверьте: docker compose logs db');
process.exit(1);
