"""Mix: synthesised foley from events.json (window.EV) + Typecast narration (ducking the score) + out/score.wav → out/mix.wav.
Foley follows the machine: buckling-spring keys, teletype ticks, square-wave error beeps, relay clicks, a fan and the tube's faint whine."""
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core', 'audio'))
from sfx import compress, limit
SR = 48000
rng = np.random.default_rng(29)
E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; N = int(DUR * SR)
def T(d): return np.arange(int(round(d * SR))) / SR
def nz(d): return rng.standard_normal(int(round(d * SR)))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
bus = {k: np.zeros((N, 2)) for k in ['sfx', 'bed', 'vo', 'music']}
def add(name, x, at, g=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= N or len(x) == 0: return
    x = x[:N - i] * g
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[name][i:i + len(x), 0] += x * l * 1.414; bus[name][i:i + len(x), 1] += x * r * 1.414

def key(kind='key'):           # plastic click + spring ping + keycap thock
    d = .09; t = T(d); p = rng.uniform(.93, 1.08)
    click = hp(nz(d), 2200) * np.exp(-t / .0028)
    ping = np.sin(2 * np.pi * 3400 * p * t) * np.exp(-t / .03) * .22 + np.sin(2 * np.pi * 5230 * p * t) * np.exp(-t / .015) * .1
    thock = bp(nz(d), 260 * p, 900 * p) * np.exp(-np.maximum(0, t - .012) / .012) * (t > .01) * 1.3
    if kind == 'space': thock = lp(thock * 1.6, 500); ping *= .4
    if kind == 'enter': thock *= 2.0
    return click * .8 + ping + thock
def tick():                    # teletype line / remote character
    d = .03; t = T(d)
    return bp(nz(d), 1200, 4200) * np.exp(-t / .004) + np.sin(2 * np.pi * 1850 * t) * np.exp(-t / .008) * .3
def pip(f=2400):               # a digit written into a cell
    d = .06; t = T(d)
    return (np.sin(2 * np.pi * f * t) * .6 + np.sin(2 * np.pi * f * 1.5 * t) * .15) * np.exp(-t / .018) * np.minimum(1, t / .001)
def beep(f, d=.11):            # rule broken: square-wave error beep
    t = T(d); x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sin(2 * np.pi * f * 2 * t) * .12
    return lp(np.tanh(x * 1.5), 3500) * np.minimum(1, t / .003) * np.minimum(1, (d - t) / .01)
def erase():                   # a step back: dull thock with a falling chirp
    d = .35; t = T(d)
    th = bp(nz(d), 90, 500) * np.exp(-t / .05) * 1.6
    ch = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 260, len(t))) / SR) * np.exp(-t / .1) * .35
    return th + ch
def relay():
    d = .12; t = T(d)
    return hp(nz(d), 1500) * np.exp(-t / .004) * .8 + bp(nz(d), 80, 400) * np.exp(-t / .03) * 1.4 + hp(nz(d), 1500) * np.exp(-np.maximum(0, t - .035) / .003) * (t > .035) * .4
def swell(d, down=False):
    t = T(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    f = np.linspace(1400, 200, len(t)) if down else np.linspace(200, 1400, len(t))
    return lp(nz(d), 900) * e * .6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * e * .05
def grain(n):                  # many cells changing in one frame: a cluster of tiny high ticks
    d = .03; t = T(d); x = np.zeros_like(t)
    for _ in range(min(n, 6)):
        f = rng.uniform(2200, 6500); o = rng.uniform(0, .02)
        x += np.sin(2 * np.pi * f * t) * np.exp(-np.maximum(0, t - o) / .003) * (t >= o)
    return x * min(1.5, np.sqrt(n) / 2.5)
def thump():
    d = .5; t = T(d)
    return lp(nz(d), 140) * np.exp(-t / .09) * 2.2

for e in E['ev']:
    t, ty = e['t'], e['type']; pan = rng.uniform(-.2, .2)
    if ty in ('key', 'space', 'enter'): add('sfx', key(ty), t, .5 * e.get('v', 1), pan)
    elif ty == 'remote': add('sfx', tick(), t, .22, .15)
    elif ty == 'tick': add('sfx', tick(), t, .4 * e.get('v', 1), pan)
    elif ty == 'zoomIn': add('sfx', swell(e['d'] + .3), t - .15, .22)
    elif ty == 'zoomOut': add('sfx', swell(e['d'] + .3, True), t - .15, .2)
    elif ty == 'place': add('sfx', pip(), t, .1 if e.get('soft') else .3, pan)
    elif ty == 'err':
        if e.get('soft'): add('sfx', tick(), t, .18, pan)
        else: add('sfx', beep(330 * 2 ** (max(0, e['n']) / 12) if e['n'] >= 0 else 392), t, .2)
    elif ty == 'erase': add('sfx', erase(), t, .55)
    elif ty == 'grain': add('sfx', grain(e['n']), t, .1, rng.uniform(-.5, .5))
    elif ty == 'solve': add('sfx', thump(), t, .6); add('sfx', relay(), t, .5)
    elif ty == 'clear': add('sfx', relay(), t, .7)
    elif ty == 'mark': add('sfx', relay(), t, .25)

# room tone: fan, 120 Hz hum, a very quiet flyback whine
tt = np.arange(N) / SR
fan = lp(rng.standard_normal(N), 700) * .045 + lp(rng.standard_normal(N), 180) * .05 + np.sin(2 * np.pi * 120 * tt) * .006
whine = np.sin(2 * np.pi * 15734 * tt) * .002
bus['bed'][:, 0] += fan + whine; bus['bed'][:, 1] += fan * .97 + whine

# narration, compressed; the score ducks about 8 dB under it
env = np.zeros(N)
for e in E['ev']:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(HERE, 'vo', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    if sr != SR: y = resample_poly(y, SR, sr)
    y = compress(y / np.abs(y).max() * .8, thr=.2, ratio=3); y = y / np.abs(y).max() * .75
    add('vo', y, e['t'])
    i = int(e['t'] * SR); env[i:i + len(y)] = 1
k = int(.25 * SR)
duck = 1 - .6 * np.clip(np.convolve(env, np.ones(k) / k, 'same') * 1.5, 0, 1)
m, sr = sf.read(os.path.join(HERE, 'out', 'score.wav'))
bus['music'][:len(m)] += m[:N] * .65
bus['music'] *= duck[:, None]

mix = bus['music'] + bus['vo'] * 1.3 + bus['sfx'] * .9 + bus['bed']
# 19.5–20.0: digital zero before the solve — every layer, room tone included
z0, z1 = int(19.5 * SR), int(20.0 * SR); r = 240
gate = np.ones(N); gate[z0:z1] = 0; gate[z0 - r:z0] = np.linspace(1, 0, r); gate[z1 - 1:z1 + r - 1] = np.linspace(0, 1, r)
mix *= gate[:, None]
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
# mux.sh compares the decoded length with the file length; loudnorm's 3 s look-ahead makes films under ~58 s look cut off.
# Padding with digital silence to 60 s avoids that false alarm; mux.sh cuts the audio at the picture's end (39 s).
sf.write(os.path.join(HERE, 'out', 'mix.wav'), np.concatenate([mix, np.zeros((max(0, 60 * SR - N), 2))]).astype(np.float32), SR)
sf.write(os.path.join(HERE, 'out', 'stem_vo.wav'), bus['vo'].astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for a, b, lab in [(.6, 3.4, 'question'), (3.6, 9.2, 'rules'), (14.3, 19.4, 'fast'), (19.55, 19.95, 'zero'), (20.5, 26.0, 'answer'), (26.75, 34.4, 'code'), (35.9, 39, 'end')]:
    s = slice(int(a * SR), int(b * SR))
    print(f"{lab:9s} music {rms(bus['music'][s]):6.1f}  vo {rms(bus['vo'][s]):6.1f}  sfx {rms(bus['sfx'][s]):6.1f}  bed {rms(bus['bed'][s]):6.1f}  mix {rms(mix[s]):6.1f}")
print('peak', round(float(np.abs(mix).max()), 3))
