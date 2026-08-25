#!/usr/bin/env python3
"""
Long-running worker: one JSON line in, one JSON line out.
Input:  {"text":"..."}
Output: {"marked":"..."} or {"error":"..."}

Uses RUAccent (+ before vowel) then converts to combining acute for Piper/espeak.
"""
from __future__ import annotations

import json
import os
import sys
import unicodedata

VOWELS = set("аеёиоуыэюяАЕЁИОУЫЭЮЯ")
STRESS = "\u0301"


def plus_to_combining(text: str) -> str:
    out: list[str] = []
    i = 0
    s = text or ""
    while i < len(s):
        ch = s[i]
        if ch == "+" and i + 1 < len(s) and s[i + 1] in VOWELS:
            vowel = s[i + 1]
            out.append(vowel)
            out.append(STRESS)
            i += 2
            continue
        if ch in ("'", "’") and out:
            last = out[-1]
            if last in VOWELS:
                out.append(STRESS)
                i += 1
                continue
        out.append(ch)
        i += 1
    return unicodedata.normalize("NFC", "".join(out))


def load_accentizer():
    from ruaccent import RUAccent

    model = os.environ.get("TTS_RUACCENT_MODEL", "tiny2").strip() or "tiny2"
    use_dict = os.environ.get("TTS_RUACCENT_USE_DICT", "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )
    workdir = os.environ.get("TTS_RUACCENT_WORKDIR", "/var/lib/seashell-ruaccent").strip()
    accentizer = RUAccent()
    accentizer.load(
        omograph_model_size=model,
        use_dictionary=use_dict,
        tiny_mode=False,
        workdir=workdir or None,
    )
    return accentizer


def main() -> int:
    accentizer = load_accentizer()
    sys.stderr.write("[ru_stress_worker] ready\n")
    sys.stderr.flush()

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
            text = str(payload.get("text") or "").strip()
            if not text:
                print(json.dumps({"marked": ""}), flush=True)
                continue
            accented = accentizer.process_all(text)
            marked = plus_to_combining(accented)
            print(json.dumps({"marked": marked}, ensure_ascii=False), flush=True)
        except Exception as exc:  # noqa: BLE001
            print(json.dumps({"error": str(exc)}), flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
