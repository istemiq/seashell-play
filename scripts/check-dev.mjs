#!/usr/bin/env node
/**
 * Перед npm run dev: предупреждение, если Postgres (:5432) не слушает.
 */
import net from 'node:net';

function portOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(800);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

const pgOk = await portOpen(5432);
if (!pgOk) {
  console.warn('');
  console.warn('[check-dev] PostgreSQL на :5432 не отвечает.');
  console.warn('[check-dev] 1) Включите Docker Desktop');
  console.warn('[check-dev] 2) npm run db');
  console.warn('[check-dev] 3) снова npm run dev');
  console.warn('');
  console.warn('[check-dev] Без БД словарь покажет «Database error» / HTTP 500.');
  console.warn('');
}
