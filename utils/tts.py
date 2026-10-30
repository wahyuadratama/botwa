#!/usr/bin/env python3
"""Helper TTS untuk bot WA: teks Indonesia -> voice note (ogg opus).

Dipanggil dari Node.js (WerewolfFeature):
    python3 tts.py "<teks>" /tmp/keluaran.ogg

Butuh: pip install edge-tts  +  ffmpeg (apt install ffmpeg).
Suara default id-ID-ArdiNeural; ganti via env WW_TTS_VOICE.
"""
import asyncio
import os
import subprocess
import sys

import edge_tts

VOICE = os.environ.get("WW_TTS_VOICE", "id-ID-ArdiNeural")


async def main():
    text, out = sys.argv[1], sys.argv[2]
    mp3 = out + ".mp3"
    await edge_tts.Communicate(text, VOICE).save(mp3)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", mp3,
         "-c:a", "libopus", "-b:a", "64k", out],
        check=True,
    )
    os.remove(mp3)


if __name__ == "__main__":
    asyncio.run(main())
