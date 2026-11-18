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


@app.post('/speak')
def speak(req: SpeakReq):
    text = (req.text or '').strip()[:400]
    if not text:
        return {'error': 'empty'}
    lang = str(req.lang or '').lower()
    speed = min(1.3, max(0.7, req.speed or 1.0))
    with lock:
        if lang in EN_LANGS:
            chunks = [np.asarray(a, dtype=np.float32) for _g, _p, a in
                      pipeline(PIPE_CODES[lang])(text, voice=req.voice, speed=speed)]
            if not chunks:
                return {'error': 'no audio'}
            samples, sr = np.concatenate(chunks), 24000
        elif lang in ONNX_LANGS:
            samples, sr = onnx().create(text, voice=req.voice, speed=speed, lang=lang)
        else:
            return {'error': f'unsupported lang {req.lang}'}
    buf = io.BytesIO()
    sf.write(buf, samples, sr, format='WAV')
    return {'wav_b64': base64.b64encode(buf.getvalue()).decode()}


@app.get('/health')
def health():
    return {'ok': True, 'en_pipeline': bool(model or pipe_a or pipe_b), 'onnx': bool(onnx_k)}
