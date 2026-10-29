#!/bin/sh
# Rebuild the FilmCraft project for AI 위클리 from the film's files, then export it.
#   FILMCRAFT=/path/to/filmcraft-cli sh build.sh            # project + export
#   FILMCRAFT=/path/to/filmcraft-cli sh build.sh --no-export
# The picture comes from ../ai-week-1029.mp4 (video only); the sound from media/stem_*.flac, made by ../mix.py
# (out/stem_*.wav, encoded to FLAC); the caption track from ../ai-week-1029.srt.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
F=${FILMCRAFT:-filmcraft-cli}
command -v "$F" >/dev/null 2>&1 || [ -x "$F" ] || { echo "set FILMCRAFT to the filmcraft-cli binary"; exit 1; }
cd "$HERE"
OUT="$HERE/../out"
for s in vo music sfx; do
  [ -s "media/stem_$s.flac" ] || ffmpeg -v error -y -i "$OUT/stem_$s.wav" -c:a flac "media/stem_$s.flac"
done
P="$HERE/ai-week-1029.fcproj"
rm -f "$P"
"$F" --save-as "$P" --compact exec file.newSequence '{"name":"AI 위클리 · Week 44","fps":30,"video":2,"audio":3}'
"$F" --project "$P" --save --compact exec file.import \
  "{\"paths\":[\"$HERE/../ai-week-1029.mp4\",\"$HERE/media/stem_vo.flac\",\"$HERE/media/stem_music.flac\",\"$HERE/media/stem_sfx.flac\"]}"
# items 7–10 are the four imports, in that order (a fresh project numbers them the same way)
"$F" --project "$P" --save --compact run build-timeline.jsonl
# store media paths relative to the project folder, so the project opens on any computer
python3 - "$P" "$HERE" <<'PY'
import sys
p, here = sys.argv[1], sys.argv[2]
s = open(p, encoding='utf-8').read()
s = s.replace(f'"{here}/media/', '"media/').replace(f'"{here}/../ai-week-1029.mp4"', '"../ai-week-1029.mp4"')
open(p, 'w', encoding='utf-8').write(s)
PY
"$F" --project "$P" --compact exec media.findMissing
[ "$1" = "--no-export" ] && exit 0
# stems sum above 0 dBFS before the master stage: let FilmCraft's export normalise to −14 LUFS with a −1.2 dBTP limiter
"$F" --project "$P" --compact export "$OUT/ai-week-1029-filmcraft.mp4" --format h264 \
  --settings '{"effects":{"loudness":{"enabled":true,"target_lufs":-14.0,"true_peak_dbtp":-1.2}}}'
