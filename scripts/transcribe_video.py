import whisper
import sys

wav = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Пайчармик\seashell_tg_clean\video-audio.wav"
lang = sys.argv[2] if len(sys.argv) > 2 else None

model = whisper.load_model("small")
kwargs = {"language": lang, "task": "transcribe", "verbose": False} if lang else {"task": "transcribe", "verbose": False}
result = model.transcribe(wav, **kwargs)

out = wav.replace(".wav", "-transcript.txt")
lines = [f"FILE: {wav}", f"LANG: {result.get('language')}"]
for seg in result["segments"]:
    lines.append(f"[{seg['start']:.1f}-{seg['end']:.1f}] {seg['text'].strip()}")
text = "\n".join(lines)
with open(out, "w", encoding="utf-8") as f:
    f.write(text)
print(text)
