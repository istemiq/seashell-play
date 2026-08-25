#!/usr/bin/env node
/** One-off: delete all practice dialogues from prod DB. */
import { spawnSync } from 'node:child_process';

const VPS = process.env.SEASHELL_VPS ?? 'root@193.41.4.206';
const REMOTE_DIR = process.env.SEASHELL_VPS_DIR ?? '/root/seashell-server-new';

const remoteScript = `
set -e
cd ${REMOTE_DIR}
node --input-type=module -e "
import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query('DELETE FROM practice_sessions');
console.log('Purged practice sessions:', r.rowCount ?? 0);
await pool.end();
"
`;

console.log(`[purge-practice-history] ${VPS} — удаление всех practice_sessions…`);
const r = spawnSync('ssh', [VPS, remoteScript], { encoding: 'utf8', stdio: 'inherit' });
process.exit(r.status ?? 0);
