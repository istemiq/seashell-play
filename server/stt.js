import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { assertAllowedUserContent } from './contentPolicy.js';

function envBool(name, def = false) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return def;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function whisperBinPath() {
  return (
    String(process.env.STT_WHISPER_BIN ?? '').trim() ||
    '/opt/whisper.cpp/build/bin/whisper-cli'
  );
}

function normalizeSttLanguage(lang) {
  const lc = String(lang ?? 'en').trim().toLowerCase();
  if (lc === 'en' || lc.startsWith('en')) return 'en';
  if (lc === 'ru' || lc.startsWith('ru')) return 'ru';
  if (lc === 'ar' || lc.startsWith('ar')) return 'ar';
  if (lc === 'es' || lc.startsWith('es')) return 'es';
  if (lc === 'pt' || lc.startsWith('pt')) return 'pt';
  if (lc === 'it' || lc.startsWith('it')) return 'it';
  if (lc === 'el' || lc.startsWith('el')) return 'el';
  if (lc === 'fa' || lc.startsWith('fa')) return 'fa';
  if (lc === 'da' || lc.startsWith('da')) return 'da';
  if (lc === 'nl' || lc.startsWith('nl')) return 'nl';
  if (lc === 'fr' || lc.startsWith('fr')) return 'fr';
  if (lc === 'de' || lc.startsWith('de')) return 'de';
  if (lc === 'tr' || lc.startsWith('tr')) return 'tr';
  if (lc === 'sv' || lc.startsWith('sv')) return 'sv';
  if (lc === 'no' || lc.startsWith('no')) return 'no';
  if (lc === 'fi' || lc.startsWith('fi')) return 'fi';
  if (lc === 'ko' || lc.startsWith('ko')) return 'ko';
  if (lc === 'ja' || lc.startsWith('ja')) return 'ja';
  if (lc === 'zh' || lc.startsWith('zh')) return 'zh';
  if (lc === 'uk' || lc.startsWith('uk')) return 'uk';
  if (lc === 'pl' || lc.startsWith('pl')) return 'pl';
  if (lc === 'hi' || lc.startsWith('hi')) return 'hi';
  if (lc === 'ur' || lc.startsWith('ur')) return 'ur';
  if (lc === 'az' || lc.startsWith('az')) return 'az';
  if (lc === 'ba' || lc.startsWith('ba')) return 'ba';
  if (lc === 'vi' || lc.startsWith('vi')) return 'vi';
  if (lc === 'cs' || lc.startsWith('cs')) return 'cs';
  if (lc === 'hu' || lc.startsWith('hu')) return 'hu';
  if (lc === 'ro' || lc.startsWith('ro')) return 'ro';
  if (lc === 'id' || lc.startsWith('id')) return 'id';
  if (lc === 'he' || lc.startsWith('he')) return 'he';
  if (lc === 'ca' || lc.startsWith('ca')) return 'ca';
  if (lc === 'sr' || lc.startsWith('sr')) return 'sr';
  // Whisper has no such language (e.g. uyghur) — auto-detect on the multilingual
  // model instead of silently running the English-only one.
  return 'auto';
}

function whisperModelPath(lang) {
  const code = normalizeSttLanguage(lang);
  if (code === 'ru') {
    return (
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'ar') {
    return (
      String(process.env.STT_WHISPER_MODEL_AR ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'es') {
    return (
      String(process.env.STT_WHISPER_MODEL_ES ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'pt') {
    return (
      String(process.env.STT_WHISPER_MODEL_PT ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'it') {
    return (
      String(process.env.STT_WHISPER_MODEL_IT ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'el') {
    return (
      String(process.env.STT_WHISPER_MODEL_EL ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'fa') {
    return (
      String(process.env.STT_WHISPER_MODEL_FA ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'da') {
    return (
      String(process.env.STT_WHISPER_MODEL_DA ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'nl') {
    return (
      String(process.env.STT_WHISPER_MODEL_NL ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'fr') {
    return (
      String(process.env.STT_WHISPER_MODEL_FR ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'de') {
    return (
      String(process.env.STT_WHISPER_MODEL_DE ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  if (code === 'auto' || code === 'tr' || code === 'sv' || code === 'no' || code === 'fi' || code === 'ko' || code === 'ja' || code === 'zh' || code === 'uk' || code === 'pl' || code === 'hi' || code === 'ur' || code === 'az' || code === 'ba' || code === 'vi' || code === 'cs' || code === 'hu' || code === 'ro' || code === 'id' || code === 'he' || code === 'ca' || code === 'sr') {
    return (
      String(process.env[`STT_WHISPER_MODEL_${code.toUpperCase()}`] ?? '').trim() ||
      String(process.env.STT_WHISPER_MODEL_RU ?? '').trim() ||
      '/opt/whisper.cpp/models/ggml-small.bin'
    );
  }
  // English-only tiny model — reached only for `en` (multilingual model above).
  return (
    String(process.env.STT_WHISPER_MODEL ?? '').trim() ||
    '/opt/whisper.cpp/models/ggml-tiny.en.bin'
  );
}

function whisperLanguageCode(lang) {
  return normalizeSttLanguage(lang);
}

function ffmpegBinPath() {
  return String(process.env.STT_FFMPEG_BIN ?? '').trim() || 'ffmpeg';
}

function execChecked(cmd, args, { timeoutMs = 90_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${cmd} timed out`));
    }, timeoutMs);
    child.stdout.on('data', (d) => {
      out += d.toString('utf8');
    });
    child.stderr.on('data', (d) => {
      err += d.toString('utf8');
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve({ out, err });
      const e = new Error(`${cmd} exited with code ${code}`);
      e.stdout = out;
      e.stderr = err;
      reject(e);
    });
  });
}

async function unlinkQuiet(p) {
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

function extFromMime(mime) {
  const m = String(mime ?? '').toLowerCase();
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  return 'webm';
}

async function transcodeToWav(inputPath) {
  // Never reuse the input name: ffmpeg refuses to write "in place" when the
  // uploaded file already has a .wav extension (mime audio/wav → 500).
  const outPath = `${inputPath}.16k.wav`;
  await execChecked(ffmpegBinPath(), [
    '-y',
    '-i',
    inputPath,
    '-ar',
    '16000',
    '-ac',
    '1',
    '-c:a',
    'pcm_s16le',
    outPath,
  ]);
  return outPath;
}

async function transcribeWav(wavPath, lang = 'en') {
  const outBase = path.join(os.tmpdir(), `seashell-stt-${randomUUID()}`);
  const model = whisperModelPath(lang);
  const wl = whisperLanguageCode(lang);
  await execChecked(
    whisperBinPath(),
    ['-m', model, '-f', wavPath, '-l', wl, '-nt', '-otxt', '-of', outBase],
    { timeoutMs: 120_000 },
  );
  const txtPath = `${outBase}.txt`;
  const text = await fs.readFile(txtPath, 'utf8').catch(() => '');
  await unlinkQuiet(txtPath);
  return String(text).trim();
}

async function transcribeAudioBuffer(buf, mime, lang = 'en') {
  const enabled = envBool('STT_ENABLED', true);
  if (!enabled) {
    const e = new Error('STT disabled');
    e.httpStatus = 503;
    throw e;
  }

  const maxBytes = Number(process.env.STT_AUDIO_MAX_BYTES ?? 1_500_000);
  if (!buf?.length) {
    const e = new Error('Empty audio');
    e.httpStatus = 400;
    throw e;
  }
  if (buf.length > maxBytes) {
    const e = new Error('Audio too large');
    e.httpStatus = 413;
    throw e;
  }

  const inputPath = path.join(os.tmpdir(), `seashell-stt-in-${randomUUID()}.${extFromMime(mime)}`);
  let wavPath = null;
  try {
    await fs.writeFile(inputPath, buf);
    wavPath = await transcodeToWav(inputPath);
    return await transcribeWav(wavPath, lang);
  } finally {
    await unlinkQuiet(inputPath);
    if (wavPath) await unlinkQuiet(wavPath);
  }
}

export function registerSttTranscribe(app, { makeRateLimiter }) {
  const limitStt = makeRateLimiter({
    windowMs: 60_000,
    max: Number(process.env.STT_RPM ?? 20),
    keyFn: (req) => `stt:${req.vkUserId}`,
  });

  app.post('/api/stt/transcribe', limitStt, async (req, res) => {
    const b64 = String(req.body?.audioBase64 ?? req.body?.audio ?? '').trim();
    const mime = String(req.body?.mime ?? 'audio/webm').trim() || 'audio/webm';
    if (!b64) {
      return res.status(400).json({ error: 'Missing audio' });
    }

    let buf;
    try {
      buf = Buffer.from(b64, 'base64');
    } catch {
      return res.status(400).json({ error: 'Invalid audio encoding' });
    }

    const langRaw = String(req.body?.lang ?? req.body?.locale ?? req.headers['x-target-lang'] ?? 'en').trim();
    const lang = normalizeSttLanguage(langRaw);

    try {
      const bin = whisperBinPath();
      const model = whisperModelPath(lang);
      await fs.access(bin);
      await fs.access(model);
    } catch {
      const msg =
        lang === 'ru'
          ? 'Russian STT not configured'
          : lang === 'ar'
            ? 'Arabic STT not configured'
            : lang === 'es'
              ? 'Spanish STT not configured'
              : lang === 'pt'
                ? 'Portuguese STT not configured'
                : lang === 'it'
                  ? 'Italian STT not configured'
                  : lang === 'el'
                    ? 'Greek STT not configured'
                    : lang === 'fa'
                      ? 'Farsi STT not configured'
                      : lang === 'da'
                        ? 'Danish STT not configured'
                        : lang === 'nl'
                          ? 'Dutch STT not configured'
                          : lang === 'fr'
                            ? 'French STT not configured'
                            : lang === 'de'
                              ? 'German STT not configured'
                              : lang === 'tr'
                                ? 'Turkish STT not configured'
                                : lang === 'sv'
                                  ? 'Swedish STT not configured'
                                  : lang === 'no'
                                    ? 'Norwegian STT not configured'
                                    : lang === 'fi'
                                      ? 'Finnish STT not configured'
                                      : lang === 'ko'
                                        ? 'Korean STT not configured'
                                        : lang === 'ja'
                                          ? 'Japanese STT not configured'
                                          : lang === 'zh'
                                            ? 'Chinese STT not configured'
                                            : lang === 'uk'
                                              ? 'Ukrainian STT not configured'
                                              : lang === 'pl'
                                                ? 'Polish STT not configured'
                                                : lang === 'hi'
                                                  ? 'Hindi STT not configured'
                                                  : lang === 'ur'
                                                    ? 'Urdu STT not configured'
                                                    : lang === 'az'
                                                      ? 'Azerbaijani STT not configured'
                                                      : lang === 'ug'
                                                        ? 'Uyghur STT not configured'
                                            : 'STT not configured';
      return res.status(503).json({ error: msg });
    }

    try {
      const startedAt = Date.now();
      const text = await transcribeAudioBuffer(buf, mime, lang);
      const pol = assertAllowedUserContent(text);
      if (!pol.ok) {
        return res.status(400).json({ error: pol.error });
      }
      res.json({ text, ms: Date.now() - startedAt });
    } catch (e) {
      const status = Number(e?.httpStatus) || 500;
      const msg = e?.message || 'STT failed';
      if (status >= 500) console.error('[stt]', e);
      res.status(status).json({ error: msg });
    }
  });
}
