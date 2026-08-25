import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import { assertAllowedUserContent } from './contentPolicy.js';
import { resolveSpeakText } from './ttsSpeakText.js';

function envBool(name, def = false) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return def;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function cacheRootDir() {
  const fromEnv = String(process.env.TTS_CACHE_DIR ?? '').trim();
  if (fromEnv) return fromEnv;
  // Dev on Windows may not have /var/lib.
  if (process.platform === 'win32') return path.join(os.tmpdir(), 'seashell-tts-cache');
  return '/var/lib/seashell-tts';
}

function piperBinaryPath() {
  const fromEnv = String(process.env.TTS_PIPER_BIN ?? '').trim();
  if (fromEnv) return fromEnv;
  if (process.platform === 'win32') return 'piper';
  return '/opt/piper/piper/piper';
}

function piperRuntimeDir() {
  return path.dirname(piperBinaryPath());
}

function espeakNgBinaryPath() {
  const fromEnv = String(process.env.TTS_ESPEAK_BIN ?? '').trim();
  if (fromEnv) return fromEnv;
  if (process.platform === 'win32') return 'espeak-ng';
  return path.join(piperRuntimeDir(), 'espeak-ng');
}

/** Piper 1.2 cannot phonemize these; espeak-ng synthesis works on the VPS bundle. */
const ESPEAK_FALLBACK_LANGS = new Set(['he', 'ko', 'ja', 'az']);

export function localeUsesEspeakFallback(locale) {
  const lc = String(locale ?? '').toLowerCase().replace(/_/g, '-');
  const prefix = lc.split('-')[0];
  return ESPEAK_FALLBACK_LANGS.has(prefix);
}

function espeakVoiceForLocale(locale) {
  const lc = String(locale ?? '').toLowerCase().replace(/_/g, '-');
  if (lc.startsWith('he')) return 'he';
  if (lc.startsWith('ko')) return 'ko';
  if (lc.startsWith('ja')) return 'ja';
  if (lc.startsWith('az')) return 'az';
  return 'en';
}

function espeakChildEnv() {
  const runtimeDir = piperRuntimeDir();
  const prev = String(process.env.LD_LIBRARY_PATH ?? '').trim();
  const ld = prev ? `${runtimeDir}${path.delimiter}${prev}` : runtimeDir;
  return {
    ...process.env,
    LD_LIBRARY_PATH: ld,
    ESPEAK_DATA_PATH: path.join(runtimeDir, 'espeak-ng-data'),
  };
}

function voiceModelPath(locale) {
  const lc = String(locale ?? '').toLowerCase().replace(/_/g, '-');
  if (lc === 'en-gb') {
    return (
      String(process.env.TTS_MODEL_EN_GB ?? '').trim() ||
      '/opt/piper/voices/en_GB-cori-medium.onnx'
    );
  }
  if (lc === 'ru' || lc === 'ru-ru') {
    return (
      String(process.env.TTS_MODEL_RU ?? '').trim() ||
      '/opt/piper/voices/ru_RU-dmitri-medium.onnx'
    );
  }
  if (lc === 'ar' || lc === 'ar-jo' || lc.startsWith('ar-')) {
    return (
      String(process.env.TTS_MODEL_AR ?? '').trim() ||
      '/opt/piper/voices/ar_JO-kareem-medium.onnx'
    );
  }
  if (lc === 'es' || lc === 'es-es' || lc.startsWith('es-')) {
    return (
      String(process.env.TTS_MODEL_ES ?? '').trim() ||
      '/opt/piper/voices/es_ES-sharvard-medium.onnx'
    );
  }
  if (lc === 'pt' || lc === 'pt-br' || lc.startsWith('pt-')) {
    return (
      String(process.env.TTS_MODEL_PT ?? '').trim() ||
      '/opt/piper/voices/pt_BR-faber-medium.onnx'
    );
  }
  if (lc === 'it' || lc === 'it-it' || lc.startsWith('it-')) {
    return (
      String(process.env.TTS_MODEL_IT ?? '').trim() ||
      '/opt/piper/voices/it_IT-paola-medium.onnx'
    );
  }
  if (lc === 'el' || lc === 'el-gr' || lc.startsWith('el-')) {
    return (
      String(process.env.TTS_MODEL_EL ?? '').trim() ||
      '/opt/piper/voices/el_GR-rapunzelina-low.onnx'
    );
  }
  if (lc === 'fa' || lc === 'fa-ir' || lc.startsWith('fa-')) {
    return (
      String(process.env.TTS_MODEL_FA ?? '').trim() ||
      '/opt/piper/voices/fa_IR-amir-medium.onnx'
    );
  }
  if (lc === 'da' || lc === 'da-dk' || lc.startsWith('da-')) {
    return (
      String(process.env.TTS_MODEL_DA ?? '').trim() ||
      '/opt/piper/voices/da_DK-talesyntese-medium.onnx'
    );
  }
  if (lc === 'nl' || lc === 'nl-nl' || lc.startsWith('nl-')) {
    return (
      String(process.env.TTS_MODEL_NL ?? '').trim() ||
      '/opt/piper/voices/nl_NL-mls-medium.onnx'
    );
  }
  if (lc === 'fr' || lc === 'fr-fr' || lc.startsWith('fr-')) {
    return (
      String(process.env.TTS_MODEL_FR ?? '').trim() ||
      '/opt/piper/voices/fr_FR-siwis-medium.onnx'
    );
  }
  if (lc === 'de' || lc === 'de-de' || lc.startsWith('de-')) {
    return (
      String(process.env.TTS_MODEL_DE ?? '').trim() ||
      '/opt/piper/voices/de_DE-thorsten-medium.onnx'
    );
  }
  if (lc === 'tr' || lc === 'tr-tr' || lc.startsWith('tr-')) {
    return (
      String(process.env.TTS_MODEL_TR ?? '').trim() ||
      '/opt/piper/voices/tr_TR-dfki-medium.onnx'
    );
  }
  if (lc === 'sv' || lc === 'sv-se' || lc.startsWith('sv-')) {
    return (
      String(process.env.TTS_MODEL_SV ?? '').trim() ||
      '/opt/piper/voices/sv_SE-nst-medium.onnx'
    );
  }
  // nb-NO (Bokmål BCP-47) — same Piper voice as no-NO
  if (lc === 'no' || lc === 'no-no' || lc.startsWith('no-') || lc === 'nb-no' || lc.startsWith('nb-')) {
    return (
      String(process.env.TTS_MODEL_NO ?? '').trim() ||
      '/opt/piper/voices/no_NO-talesyntese-medium.onnx'
    );
  }
  if (lc === 'fi' || lc === 'fi-fi' || lc.startsWith('fi-')) {
    return (
      String(process.env.TTS_MODEL_FI ?? '').trim() ||
      '/opt/piper/voices/fi_FI-harri-medium.onnx'
    );
  }
  if (lc === 'ko' || lc === 'ko-kr' || lc.startsWith('ko-')) {
    return (
      String(process.env.TTS_MODEL_KO ?? '').trim() ||
      '/opt/piper/voices/ko_KR-kss-medium.onnx'
    );
  }
  if (lc === 'zh-cn' || lc === 'zh') {
    return (
      String(process.env.TTS_MODEL_ZH ?? '').trim() ||
      '/opt/piper/voices/zh_CN-huayan-medium.onnx'
    );
  }
  if (lc === 'zh-tw') {
    return '';
  }
  if (lc === 'uk' || lc === 'uk-ua' || lc.startsWith('uk-')) {
    return (
      String(process.env.TTS_MODEL_UK ?? '').trim() ||
      '/opt/piper/voices/uk_UA-ukrainian_tts-medium.onnx'
    );
  }
  if (lc === 'pl' || lc === 'pl-pl' || lc.startsWith('pl-')) {
    return (
      String(process.env.TTS_MODEL_PL ?? '').trim() ||
      '/opt/piper/voices/pl_PL-gosia-medium.onnx'
    );
  }
  if (lc === 'hi' || lc === 'hi-in' || lc.startsWith('hi-')) {
    return (
      String(process.env.TTS_MODEL_HI ?? '').trim() ||
      '/opt/piper/voices/hi_IN-pratham-medium.onnx'
    );
  }
  if (lc === 'ur' || lc === 'ur-pk' || lc.startsWith('ur-')) {
    return (
      String(process.env.TTS_MODEL_UR ?? '').trim() ||
      '/opt/piper/voices/ur_PK-fasih-medium.onnx'
    );
  }
  if (lc === 'vi' || lc === 'vi-vn' || lc.startsWith('vi-')) {
    return (
      String(process.env.TTS_MODEL_VI ?? '').trim() ||
      '/opt/piper/voices/vi_VN-vais1000-medium.onnx'
    );
  }
  if (lc === 'cs' || lc === 'cs-cz' || lc.startsWith('cs-')) {
    return (
      String(process.env.TTS_MODEL_CS ?? '').trim() ||
      '/opt/piper/voices/cs_CZ-jirka-medium.onnx'
    );
  }
  if (lc === 'hu' || lc === 'hu-hu' || lc.startsWith('hu-')) {
    return (
      String(process.env.TTS_MODEL_HU ?? '').trim() ||
      '/opt/piper/voices/hu_HU-anna-medium.onnx'
    );
  }
  if (lc === 'ro' || lc === 'ro-ro' || lc.startsWith('ro-')) {
    return (
      String(process.env.TTS_MODEL_RO ?? '').trim() ||
      '/opt/piper/voices/ro_RO-mihai-medium.onnx'
    );
  }
  if (lc === 'id' || lc === 'id-id' || lc.startsWith('id-')) {
    return (
      String(process.env.TTS_MODEL_ID ?? '').trim() ||
      '/opt/piper/voices/id_ID-news_tts-medium.onnx'
    );
  }
  if (lc === 'he' || lc === 'he-il' || lc.startsWith('he-')) {
    return (
      String(process.env.TTS_MODEL_HE ?? '').trim() ||
      '/opt/piper/voices/he_IL-saspeech-medium.onnx'
    );
  }
  if (lc === 'ca' || lc === 'ca-es' || lc.startsWith('ca-')) {
    return (
      String(process.env.TTS_MODEL_CA ?? '').trim() ||
      '/opt/piper/voices/ca_ES-upc_ona-medium.onnx'
    );
  }
  if (lc === 'sr' || lc === 'sr-rs' || lc.startsWith('sr-')) {
    return (
      String(process.env.TTS_MODEL_SR ?? '').trim() ||
      '/opt/piper/voices/sr_RS-serbski_institut-medium.onnx'
    );
  }
  // default en-US
  return (
    String(process.env.TTS_MODEL_EN_US ?? '').trim() ||
    '/opt/piper/voices/en_US-ljspeech-medium.onnx'
  );
}

function execFileChecked(cmd, args, { stdinText, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], env: env ?? process.env });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString('utf8')));
    child.stderr.on('data', (d) => (err += d.toString('utf8')));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve({ out, err });
      const e = new Error(`${cmd} exited with code ${code}`);
      e.stdout = out;
      e.stderr = err;
      e.exitCode = code;
      reject(e);
    });
    if (stdinText != null) {
      child.stdin.write(String(stdinText));
    }
    child.stdin.end();
  });
}

const inFlight = new Map(); // key -> Promise<{ relUrl: string }>

function normalizeTtsLocale(locale) {
  const raw = String(locale ?? 'en-US').trim() || 'en-US';
  const lc = raw.toLowerCase().replace(/_/g, '-');
  if (lc === 'nb' || lc === 'nb-no' || lc.startsWith('nb-')) return 'no-NO';
  return raw;
}

async function synthesizeEspeakMp3({ text, locale, rate, mp3Path, wavPath }) {
  const voice = espeakVoiceForLocale(locale);
  const wpm = Math.min(250, Math.max(80, Math.round(175 * rate)));
  await execFileChecked(
    espeakNgBinaryPath(),
    ['-v', voice, '-s', String(wpm), '-w', wavPath, text],
    { env: espeakChildEnv() },
  );
  await execFileChecked('ffmpeg', ['-y', '-i', wavPath, '-f', 'mp3', '-codec:a', 'libmp3lame', '-qscale:a', '3', mp3Path]);
}

export async function ensureMp3Cached({ text, ttsText, locale, rate }) {
  const enabled = envBool('TTS_ENABLED', true);
  if (!enabled) {
    const e = new Error('TTS disabled');
    e.httpStatus = 501;
    throw e;
  }

  locale = normalizeTtsLocale(locale);
  const lc = String(locale ?? '').toLowerCase().replace(/_/g, '-');
  let t = normalizeText(
    await resolveSpeakText({
      text,
      ttsText,
      locale,
      targetLang: lc.split('-')[0],
    }),
  );
  if (!t) {
    const e = new Error('Invalid text');
    e.httpStatus = 400;
    throw e;
  }
  const maxLen = Number(process.env.TTS_TEXT_MAX_LEN ?? 400);
  if (t.length > maxLen) {
    const e = new Error(`Text too long (max ${maxLen})`);
    e.httpStatus = 400;
    throw e;
  }

  const pol = assertAllowedUserContent(t);
  if (!pol.ok) {
    const e = new Error(pol.error);
    e.httpStatus = 400;
    throw e;
  }

  const useEspeak = localeUsesEspeakFallback(locale);
  const model = useEspeak ? 'espeak-ng' : voiceModelPath(locale);
  if (!model) {
    const e = new Error('No Piper model for locale');
    e.httpStatus = 501;
    throw e;
  }
  const r = Number.isFinite(rate) ? rate : Number(process.env.TTS_RATE_DEFAULT ?? 0.95);
  const rateClamped = Math.min(1.25, Math.max(0.75, r));

  const secret = String(process.env.TTS_KEY_SECRET ?? '').trim();
  const key = sha256Hex([secret, locale || 'en-US', model, String(rateClamped), t].join('|'));

  const dir = path.join(cacheRootDir(), 'v1', String(locale || 'en-US'), key.slice(0, 2));
  const mp3Path = path.join(dir, `${key}.mp3`);

  const existing = await fs
    .stat(mp3Path)
    .then((s) => (s.isFile() && s.size > 0 ? true : false))
    .catch(() => false);

  if (existing) {
    return { relUrl: `/tts/v1/${encodeURIComponent(locale || 'en-US')}/${key.slice(0, 2)}/${key}.mp3` };
  }

  const prev = inFlight.get(key);
  if (prev) return prev;

  const p = (async () => {
    await fs.mkdir(dir, { recursive: true });
    // Temp files must live on the same volume as cache — rename from /tmp → /var fails with EXDEV.
    const tmpWav = path.join(dir, `${key}.wav.part`);
    const tmpMp3 = path.join(dir, `${key}.tmp.mp3`);

    try {
      if (useEspeak) {
        await synthesizeEspeakMp3({ text: t, locale, rate: rateClamped, mp3Path: tmpMp3, wavPath: tmpWav });
      } else {
        await execFileChecked(piperBinaryPath(), ['--model', model, '--output_file', tmpWav, '--length_scale', String(1 / rateClamped)], {
          stdinText: t,
        });
        await execFileChecked('ffmpeg', ['-y', '-i', tmpWav, '-f', 'mp3', '-codec:a', 'libmp3lame', '-qscale:a', '3', tmpMp3]);
      }

      // Atomic-ish write: rename within cache dir (same filesystem)
      await fs.rename(tmpMp3, mp3Path);
      await fs.rm(tmpWav, { force: true }).catch(() => {});

      return { relUrl: `/tts/v1/${encodeURIComponent(locale || 'en-US')}/${key.slice(0, 2)}/${key}.mp3` };
    } finally {
      inFlight.delete(key);
      await fs.rm(tmpWav, { force: true }).catch(() => {});
      await fs.rm(tmpMp3, { force: true }).catch(() => {});
    }
  })();

  inFlight.set(key, p);
  return p;
}

export function registerTtsStatic(app) {
  const staticDir = path.join(cacheRootDir(), 'v1');
  app.use(
    '/tts/v1',
    express.static(staticDir, {
      fallthrough: false,
      maxAge: '365d',
      immutable: true,
      setHeaders(res) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');
      },
    }),
  );
}

export function registerTtsSpeak(app, { makeRateLimiter }) {
  const limitTts = makeRateLimiter({
    windowMs: 60_000,
    max: Number(process.env.TTS_RPM ?? 30),
    keyFn: (req) => `tts:${req.vkUserId}`,
  });

  app.post('/api/tts/speak', limitTts, async (req, res) => {
    const text = req.body?.text ?? req.body?.t ?? '';
    const ttsText = req.body?.ttsText ?? req.body?.tts_text ?? '';
    const locale = String(req.body?.locale ?? 'en-US').trim() || 'en-US';
    const rate = req.body?.rate != null ? Number(req.body.rate) : NaN;
    try {
      const isProd = String(process.env.NODE_ENV ?? '').toLowerCase() === 'production';
      if (isProd && !String(process.env.TTS_KEY_SECRET ?? '').trim()) {
        return res.status(503).json({ error: 'TTS not configured' });
      }
      const startedAt = Date.now();
      const r = await ensureMp3Cached({ text, ttsText, locale, rate });
      res.json({ url: r.relUrl, cached: true, ms: Date.now() - startedAt });
    } catch (e) {
      const status = Number(e?.httpStatus) || 500;
      const msg = e?.message || 'TTS failed';
      if (status >= 500) console.error(e);
      res.status(status).json({ error: msg });
    }
  });
}

/** @deprecated Use registerTtsStatic + registerTtsSpeak (speak must be after auth). */
export function registerTts(app, deps) {
  registerTtsStatic(app);
  registerTtsSpeak(app, deps);
}

/** Resolve Piper model path for a BCP-47 locale (tests / diagnostics). */
export function resolveVoiceModelPath(locale) {
  return voiceModelPath(locale);
}

