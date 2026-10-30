"""events.json ('sub' cues from main.js) → out/cues.json → sudoku-ai-1030.srt. The same lines are typed into the LOG strip on screen."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(HERE, 'events.json')))
cues = [{'t0': e['t'], 't1': e['t1'], 'text': e['text']} for e in E['ev'] if e['type'] == 'sub']
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
p = os.path.join(HERE, 'out', 'cues.json'); json.dump(cues, open(p, 'w'), ensure_ascii=False, indent=1)
subprocess.run([sys.executable, os.path.join(os.environ['LIB'], 'core/render/srt.py'), p, os.path.join(HERE, 'sudoku-ai-1030.srt')], check=True)
print(len(cues), 'cues')
