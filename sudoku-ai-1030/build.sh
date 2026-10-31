#!/bin/sh
# AI는 스도쿠를 몇 초 만에 풀까 — one-command build.
# trace → fonts → voice (Typecast) → reading check → events → picture → score + mix → master → .srt → poster
# Needs the lemo-opuscar library set up with its core and music tiers (setup.sh deps music).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
S=1080x1920
node "$HERE/tools/trace.js"
sh "$HERE/tools/fonts.sh"
# Voice: cached takes in vo/*.wav are reused; delete one to regenerate it (needs TYPECAST_API_KEY outside a connected session)
python3 "$HERE/tools/tts_typecast.py" --tempo 1.08
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --size $S --step 0.05
node core/render/events.mjs "$HERE" --size $S
node core/render/video.mjs "$HERE" --size $S --fps 30 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
"$PY" "$HERE/score.py"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/muxed.mp4" 30 0
# mux.sh's -shortest leaves the padded audio tail on; cut the stream copy at the picture's length
ffmpeg -v error -y -i "$HERE/out/muxed.mp4" -t 39 -c copy -movflags +faststart "$HERE/sudoku-ai-1030.mp4"
"$PY" "$HERE/tools/subs.py"
node core/render/still.mjs "$HERE" 22.4 --size $S --prefix poster_ --out "$HERE/stills" >/dev/null
cp "$HERE/stills/poster_22.4.jpg" "$HERE/poster.jpg"
echo "done: $HERE/sudoku-ai-1030.mp4"
