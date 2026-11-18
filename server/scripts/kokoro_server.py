"""Kokoro TTS HTTP service (VPS: /opt/kokoro, systemd unit kokoro-tts).

Runs on 127.0.0.1:5555; server/tts.js calls it for the locales Kokoro
covers (en/es/fr/it/pt/ja/hi/zh) and falls back to Piper for the rest.

Setup on VPS:
    python3 -m venv /opt/kokoro/venv
    /opt/kokoro/venv/bin/pip install kokoro-onnx fastapi 'uvicorn[standard]' soundfile
    # model + voices into /opt/kokoro (kokoro-v1.0.fp16.onnx, voices-v1.0.bin)
    # systemd unit: /etc/systemd/system/kokoro-tts.service → this file via uvicorn
"""
import base64
import io
import threading

import numpy as np
import soundfile as sf
from fastapi import FastAPI
from pydantic import BaseModel
from kokoro_onnx import Kokoro

MODEL = '/opt/kokoro/kokoro-v1.0.fp16.onnx'
VOICES = '/opt/kokoro/voices-v1.0.bin'

kokoro = Kokoro(MODEL, VOICES)
lock = threading.Lock()
app = FastAPI()


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
    speed = min(1.3, max(0.7, req.speed or 1.0))
    with lock:
        samples, sr = kokoro.create(text, voice=req.voice, speed=speed, lang=req.lang)
    buf = io.BytesIO()
    sf.write(buf, np.asarray(samples, dtype=np.float32), sr, format='WAV')
    return {'wav_b64': base64.b64encode(buf.getvalue()).decode()}


@app.get('/health')
def health():
    return {'ok': True, 'voices': len(kokoro.voices)}
