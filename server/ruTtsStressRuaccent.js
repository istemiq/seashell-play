import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import { convertRuaccentPlusToCombining, hasRussianStressMarks, markedTextLooksValid } from './ruTtsStressMark.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_SCRIPT = path.join(__dirname, 'scripts', 'ru_stress_worker.py');

let workerProc = null;
let workerReady = false;
let workerBootPromise = null;
const pending = [];
let buffer = '';

function envBool(name, def = true) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return def;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function ruaccentEnabled() {
  return envBool('TTS_RUACCENT_ENABLED', true);
}

function pythonBin() {
  return String(process.env.TTS_RUACCENT_PYTHON ?? 'python3').trim() || 'python3';
}

function rejectAllPending(err) {
  while (pending.length) {
    pending.shift().reject(err);
  }
}

function flushBufferLines() {
  while (true) {
    const nl = buffer.indexOf('\n');
    if (nl < 0) break;
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;

    const job = pending.shift();
    if (!job) continue;

    try {
      const payload = JSON.parse(line);
      if (payload?.error) {
        job.reject(new Error(String(payload.error)));
        continue;
      }
      const marked = String(payload?.marked ?? '').trim();
      if (!marked || !hasRussianStressMarks(marked)) {
        job.reject(new Error('RUAccent returned no stress marks'));
        continue;
      }
      if (!markedTextLooksValid(job.original, marked)) {
        job.reject(new Error('RUAccent marked text failed validation'));
        continue;
      }
      job.resolve(marked);
    } catch (e) {
      job.reject(e instanceof Error ? e : new Error(String(e)));
    }
  }
}

function killWorker() {
  workerReady = false;
  workerBootPromise = null;
  if (!workerProc) return;
  try {
    workerProc.kill('SIGTERM');
  } catch {
    /* ignore */
  }
  workerProc = null;
}

async function ensureWorker() {
  if (workerProc && workerReady) return workerProc;
  if (workerBootPromise) return workerBootPromise;

  workerBootPromise = new Promise((resolve, reject) => {
    const proc = spawn(pythonBin(), [WORKER_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    workerProc = proc;
    workerReady = false;
    buffer = '';

    let bootLog = '';
    const bootTimer = setTimeout(() => {
      if (!workerReady) {
        killWorker();
        reject(new Error('RUAccent worker boot timeout'));
      }
    }, Number(process.env.TTS_RUACCENT_BOOT_MS ?? 120_000));

    proc.stderr.on('data', (chunk) => {
      bootLog += String(chunk);
      if (bootLog.includes('[ru_stress_worker] ready')) {
        workerReady = true;
        clearTimeout(bootTimer);
        resolve(proc);
      }
    });

    proc.stdout.on('data', (chunk) => {
      buffer += String(chunk);
      flushBufferLines();
    });

    proc.on('error', (err) => {
      clearTimeout(bootTimer);
      killWorker();
      rejectAllPending(err);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(bootTimer);
      workerReady = false;
      workerBootPromise = null;
      workerProc = null;
      const err = new Error(`RUAccent worker exited (${code ?? 'signal'})`);
      rejectAllPending(err);
    });
  });

  return workerBootPromise;
}

export async function prewarmRuaccentWorker() {
  if (!ruaccentEnabled()) return;
  try {
    await markRussianStressWithRuaccent('тест');
    console.log('[ruTtsStress] RUAccent worker ready');
  } catch (e) {
    console.warn('[ruTtsStress] RUAccent prewarm failed:', e?.message || e);
  }
}

/**
 * Mark Russian stress via RUAccent worker. Returns null on failure.
 */
export async function markRussianStressWithRuaccent(text) {
  if (!ruaccentEnabled()) return null;
  const original = String(text ?? '').trim();
  if (!original) return null;

  try {
    const proc = await ensureWorker();
    const marked = await new Promise((resolve, reject) => {
      pending.push({ original, resolve, reject });
      proc.stdin.write(`${JSON.stringify({ text: original })}\n`);
    });
    return marked;
  } catch (e) {
    console.warn('[ruTtsStress] RUAccent failed:', e?.message || e);
    killWorker();
    return null;
  }
}

/** One-shot subprocess (no worker) — used in smoke tests. */
export async function markRussianStressWithRuaccentOnce(text) {
  if (!ruaccentEnabled()) return null;
  const original = String(text ?? '').trim();
  if (!original) return null;

  return new Promise((resolve) => {
    const code = `from ruaccent import RUAccent
import os, json, sys
from pathlib import Path
sys.path.insert(0, ${JSON.stringify(path.join(__dirname, 'scripts'))})
from ru_stress_worker import plus_to_combining, load_accentizer
a = load_accentizer()
text = ${JSON.stringify(original)}
marked = plus_to_combining(a.process_all(text))
print(json.dumps({"marked": marked}, ensure_ascii=False))`;

    const proc = spawn(pythonBin(), ['-c', code], { env: { ...process.env } });
    let out = '';
    proc.stdout.on('data', (c) => {
      out += String(c);
    });
    proc.on('close', () => {
      try {
        const payload = JSON.parse(out.trim());
        const marked = String(payload?.marked ?? '').trim();
        if (marked && markedTextLooksValid(original, marked)) resolve(marked);
        else resolve(null);
      } catch {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}

export { convertRuaccentPlusToCombining };
