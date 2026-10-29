#!/bin/sh
# Start a new AI 위클리 episode from the previous one: copies the sources, leaves out renders, voice takes and fonts.
#   sh .claude/skills/ai-weekly-news/scripts/new_week.sh <previous folder> <new folder>     (run from the repo root)
#   e.g. sh .claude/skills/ai-weekly-news/scripts/new_week.sh ai-week-1029 ai-week-1105
set -e
[ $# -eq 2 ] || { echo "usage: new_week.sh <previous folder> <new folder>"; exit 2; }
OLD=${1%/}; NEW=${2%/}
[ -f "$OLD/main.js" ] || { echo "$OLD/main.js not found (run from the repo root)"; exit 1; }
[ -e "$NEW" ] && { echo "$NEW already exists"; exit 1; }
case $NEW in *[!a-z0-9-]*) echo "folder names use lowercase letters, digits and hyphens only"; exit 2 ;; esac

mkdir -p "$NEW/vo" "$NEW/fonts" "$NEW/tools" "$NEW/filmcraft/media" "$NEW/effectcraft" "$NEW/soundcraft/media"
cp "$OLD/main.js" "$OLD/index.html" "$OLD/mix.py" "$OLD/build.sh" "$NEW/"
cp "$OLD/tools/"* "$NEW/tools/"
[ -f "$OLD/.gitignore" ] && cp "$OLD/.gitignore" "$NEW/"
cp "$OLD/vo/lines.json" "$NEW/vo/lines.json"                     # the previous script, to rewrite line by line
for f in build.sh build-timeline.jsonl README.md; do [ -f "$OLD/filmcraft/$f" ] && cp "$OLD/filmcraft/$f" "$NEW/filmcraft/"; done
for f in sting.jsx README.md; do [ -f "$OLD/effectcraft/$f" ] && cp "$OLD/effectcraft/$f" "$NEW/effectcraft/"; done
for f in make_session.py build.sh README.md .gitignore; do [ -f "$OLD/soundcraft/$f" ] && cp "$OLD/soundcraft/$f" "$NEW/soundcraft/"; done

# the folder name appears in build scripts and output names
grep -rl "$OLD" "$NEW" 2>/dev/null | while read -r f; do sed -i "s/$OLD/$NEW/g" "$f"; done
echo "created $NEW from $OLD"
echo "next: write FACTS.md and TREATMENT.md, rewrite vo/lines.json, then main.js (STRAP, ROWS, SOURCES, TAGS, VO_AT, EV, dates, story shots)"
echo "dates and week numbers to update in main.js and effectcraft/sting.jsx:"
grep -n "WEEK [0-9]\|OCT\|NOV\|DEC\|[0-9]월" "$NEW/main.js" "$NEW/effectcraft/sting.jsx" | head -20
