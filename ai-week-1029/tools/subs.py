"""VO_AT (main.js) + vo/dur.json + vo/lines.json → out/cues.json → ai-week-1029.srt (sidecar subtitles; nothing is burned in)."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ['LIB']
src = open(os.path.join(HERE, 'main.js'), encoding='utf-8').read()
at = {k: float(v) for k, v in re.findall(r'(v\d+[ab]?): ([\d.]+)', src[src.index('const VO_AT'):src.index('};', src.index('const VO_AT'))])}
dur = json.load(open(os.path.join(HERE, 'vo', 'dur.json')))
lines = {L['id']: L['text'] for L in json.load(open(os.path.join(HERE, 'vo', 'lines.json')))}
cues = []
for k in sorted(at, key=at.get):
    t0 = at[k]; t1 = max(t0 + dur[k] + .4, t0 + 1.8)
    cues.append({'t0': t0, 't1': round(t1, 2), 'text': lines[k]})
for a, b in zip(cues, cues[1:]): a['t1'] = min(a['t1'], b['t0'] - .05)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
p = os.path.join(HERE, 'out', 'cues.json'); json.dump(cues, open(p, 'w'), ensure_ascii=False, indent=1)
subprocess.run([sys.executable, os.path.join(LIB, 'core/render/srt.py'), p, os.path.join(HERE, 'ai-week-1029.srt')], check=True)
print(len(cues), 'cues')
