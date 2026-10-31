#!/bin/sh
# Build the SoundCraft session for AI 위클리, bounce the mastered mix and lay it under the picture.
#   sh build.sh            (soundcraft-cli on PATH: `. tools/env.sh` from the repo root)
# Writes ai-week-1029.scraft + Audio Files/ (the session, ~100 MB, not committed),
# out/mix-soundcraft.wav, and ai-week-1029-soundcraft.mp4 (the film with this mix).
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"
S=${SOUNDCRAFT:-soundcraft-cli}
python3 make_session.py
rm -rf ai-week-1029.scraft "Audio Files"; mkdir -p out
"$S" script session.txt --save ai-week-1029.scraft --bounce out/mix-soundcraft.wav --end 68
ffmpeg -v error -y -i ../ai-week-1029.mp4 -i out/mix-soundcraft.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest ai-week-1029-soundcraft.mp4
ffmpeg -nostats -i ai-week-1029-soundcraft.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:"
