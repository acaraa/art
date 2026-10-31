#!/bin/sh
# OFL fonts from the Google Fonts CSS API, saved into fonts/. Hangul is subset to the characters the film uses
# (read from main.js, solver.js and vo/lines.json). After changing on-screen Korean text, delete fonts/*.woff2 and rerun.
set -e
H=$(cd "$(dirname "$0")/.." && pwd); D=$H/fonts; mkdir -p "$D"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
KO=$(python3 -c "
import urllib.parse
s=''.join(open('$H/'+f,encoding='utf-8').read() for f in ('main.js','solver.js','vo/lines.json'))
print(urllib.parse.quote(''.join(sorted(set(c for c in s if ord(c)>126)))))")
ASCII=$(python3 -c "import urllib.parse; print(urllib.parse.quote(''.join(chr(i) for i in range(32,127))))")
font() { [ -s "$D/$2" ] && return 0
  url=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?$1" | grep -o 'https://[^)]*' | head -1); curl -fsS -o "$D/$2" "$url"; echo "font $2"; }
font "family=VT323&text=$ASCII" vt323.woff2
font "family=Nanum+Gothic+Coding:wght@700&text=$KO" nanumcoding700.woff2
