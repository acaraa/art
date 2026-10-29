#!/bin/sh
# AI 위클리 · 10월 마지막 주 — one-command build.
# fonts → voice (Typecast) → reading check → events → picture → mix → master → .srt → poster
# Needs the lemo-opuscar library set up (setup.sh deps) with the vsco2ce and vcsl sample packs.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
sh "$HERE/tools/fonts.sh"
for l in vsco2ce vcsl; do [ -d "$LIB/core/audio/instruments/$l" ] || (cd "$LIB" && sh tools/fetch.sh instruments $l); done
# Voice: cached takes in vo/*.wav are reused; delete one to regenerate it (needs TYPECAST_API_KEY outside this session)
python3 "$HERE/tools/tts_typecast.py"
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --step 0.05 || true     # rundown rows are previews and are flagged short by design (STYLE.md §11)
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/ai-week-1029.mp4" 30 0
"$PY" "$HERE/tools/subs.py"
node core/render/still.mjs "$HERE" 41.4 --prefix poster_ --out "$HERE/stills" >/dev/null
cp "$HERE/stills/poster_41.4.jpg" "$HERE/poster.jpg"
echo "done: $HERE/ai-week-1029.mp4"
