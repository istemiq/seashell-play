"""Kokoro TTS HTTP service (VPS: /opt/kokoro, systemd unit kokoro-tts, :5555).

English (en-us/en-gb) goes through the real Kokoro KPipeline — misaki g2p,
no foreign accent. Other languages use the ONNX runtime (espeak g2p is
correct for them) — keeps RAM sane on a small box.

Setup on VPS (needs Python 3.12, misaki wheels don't exist for 3.14):
    uv python install 3.12 && uv venv --python 3.12 /opt/kokoro/venv312
    uv pip install --python /opt/kokoro/venv312/bin/python \
        kokoro-onnx kokoro 'misaki[en,ja,zh]' fastapi 'uvicorn[standard]' soundfile
    uv pip install --python /opt/kokoro/venv312/bin/python \
        https://github.com/explosion/spacy-models/releases/download/\
en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
    # ONNX model + voices into /opt/kokoro (kokoro-v1.0.onnx, voices-v1.0.bin)
    # systemd unit: /etc/systemd/system/kokoro-tts.service (MemoryMax=2400M, +2G swap)
"""
import base64
import io
import threading

import numpy as np
import soundfile as sf
from fastapi import FastAPI
from pydantic import BaseModel

EN_LANGS = {'en', 'en-us', 'en-gb'}
ONNX_LANGS = {'es', 'fr', 'fr-fr', 'it', 'pt', 'pt-br', 'ja', 'hi', 'cmn', 'zh', 'zh-cn'}
PIPE_CODES = {'en': 'a', 'en-us': 'a', 'en-gb': 'b'}

model = None
pipe_a = None
pipe_b = None
onnx_k = None
lock = threading.Lock()
app = FastAPI()


def pipeline(code):
    global model, pipe_a, pipe_b
    if model is None:
        from kokoro import KModel
        model = KModel(repo_id='hexgrad/Kokoro-82M')
    if code == 'a':
        if pipe_a is None:
            from kokoro import KPipeline
            pipe_a = KPipeline(lang_code='a', model=model)
        return pipe_a
    if pipe_b is None:
        from kokoro import KPipeline
        pipe_b = KPipeline(lang_code='b', model=model)
    return pipe_b


def onnx():
    global onnx_k
    if onnx_k is None:
        from kokoro_onnx import Kokoro
        onnx_k = Kokoro('/opt/kokoro/kokoro-v1.0.onnx', '/opt/kokoro/voices-v1.0.bin')
    return onnx_k


class SpeakReq(BaseModel):
    text: str
    voice: str
    lang: str
    speed: float = 1.0


GAP_S = 0.6


def synth_en(part, lang, voice, speed):
    chunks = [np.asarray(a, dtype=np.float32) for _g, _p, a in
              pipeline(PIPE_CODES[lang])(part, voice=voice, speed=speed)]
    return np.concatenate(chunks) if chunks else None, 24000


@app.post('/speak')
def speak(req: SpeakReq):
    text = (req.text or '').strip()[:400]
    if not text:
        return {'error': 'empty'}
    lang = str(req.lang or '').lower()
    speed = min(1.3, max(0.7, req.speed or 1.0))
    # «||» — явная пауза: сегменты синтезируются порознь, между ними тишина.
    # Пунктуация не даёт реального зазора — Kokoro сливает фразы в один поток.
    parts = [p.strip() for p in text.split('||') if p.strip()]
    if not parts:
        return {'error': 'empty'}
    with lock:
        if lang in EN_LANGS:
            sr = 24000
            gap = np.zeros(int(sr * GAP_S), dtype=np.float32)
            out = []
            for i, part in enumerate(parts):
                seg, _ = synth_en(part, lang, req.voice, speed)
                if seg is None:
                    return {'error': 'no audio'}
                out.append(seg)
                if i < len(parts) - 1:
                    out.append(gap)
            samples = np.concatenate(out)
        elif lang in ONNX_LANGS:
            if len(parts) == 1:
                samples, sr = onnx().create(parts[0], voice=req.voice, speed=speed, lang=lang)
            else:
                segs, sr0 = [], None
                for part in parts:
                    s, r = onnx().create(part, voice=req.voice, speed=speed, lang=lang)
                    segs.append(np.asarray(s, dtype=np.float32))
                    sr0 = r
                gap = np.zeros(int(sr0 * GAP_S), dtype=np.float32)
                out = []
                for i, seg in enumerate(segs):
                    out.append(seg)
                    if i < len(segs) - 1:
                        out.append(gap)
                samples, sr = np.concatenate(out), sr0
        else:
            return {'error': f'unsupported lang {req.lang}'}
    buf = io.BytesIO()
    sf.write(buf, samples, sr, format='WAV')
    return {'wav_b64': base64.b64encode(buf.getvalue()).decode()}


@app.get('/health')
def health():
    return {'ok': True, 'en_pipeline': bool(model or pipe_a or pipe_b), 'onnx': bool(onnx_k)}
