"""AI 위클리 · score + foley + voice → out/mix.wav (48 kHz stereo; mux.sh brings it to −14 LUFS).
Score: A-minor news theme, 120 BPM, beat 0 = 5.5 s (cold open and sting stand before the grid).
Sections: cold open drone → sting tutti → theme (rundown, models) → markets: violins down an octave, tremolo, four-on-the-floor
→ infrastructure: pulse only, one beat of silence at 40.0, the heaviest hit at 40.5, then a held drone
→ research: lifts to C major → recap theme → next week: pizzicato and horns → A-major tutti on the end card.
Run: $LIB/.venv/bin/python mix.py"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ['LIB']
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
import sampler as S

SR = X.SR
EVD = json.load(open(os.path.join(HERE, 'events.json')))
DUR, EV = EVD['dur'], EVD['ev']
N = int(DUR * SR) + SR
music = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32); vo = np.zeros((N, 2), np.float32)
tt = np.arange(N) / SR

BPM, T0 = 120, 5.5
B = 60 / BPM
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def triad(ch, octv):
    minor = ch.endswith('m'); r = 12 * (octv + 1) + NOTE[ch.rstrip('m')]
    return [r, r + (3 if minor else 4), r + 7]

SIL = (40.0, 40.5)                      # one beat of silence before the 3 GW hit
END = 61.45
def state(t):
    if t < T0 or t >= END or SIL[0] <= t < SIL[1]: return 'off'
    if t < 21.0: return 'full'
    if t < 31.0: return 'tense'
    if t < SIL[0]: return 'pulse'
    if t < 44.0: return 'drone'
    if t < 53.0: return 'lift'
    if t < 57.0: return 'full'
    return 'sparse'
PROG = {'full': ['Am', 'F', 'C', 'G'], 'tense': ['Dm', 'E', 'Am', 'E'], 'pulse': ['Am', 'Am', 'F', 'E'], 'drone': ['Am'],
        'lift': ['C', 'G', 'Am', 'F'], 'sparse': ['Dm', 'E'], 'off': ['Am']}
def chord_at(tb, st): p = PROG[st]; return p[int(round((tb - T0) / (4 * B))) % len(p)]

M = []
def ev(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw): M.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))
stab = lambda t, notes, v=.9, d=.35: [ev(t, ins, n + o, d, v, pan, g) for ins, o, pan, g in [('trumpet_stac', 12, .15, .9), ('horn_stac', 0, -.2, 1.0), ('trombone_stac', -12, .05, 1.0)] for n in notes]

# —— cold open (0–4): low strings hold A under the flaps ——
ev(0.0, 'cellos', 45, 3.8, .35, -.1, .5, attack=.6, release=.4); ev(0.0, 'contrabass', 33, 3.8, .35, .1, .5, attack=.6, release=.4)
ev(2.05, 'tubular_bells', 'A4', 1.5, .4, .2, .35)                      # the −50% badge
for i, p in enumerate([57, 60, 64, 69]): ev(3.55 + i * .1, 'violins_trem', p + 12, .45, .25 + i * .05, (i - 1.5) * .2, .45, attack=.3)
# —— sting (4.0–5.5) ——
stab(4.4, [57, 60, 64], .95, .5)
ev(4.4, 'timpani', 'A2', 1, .95, 0, 1.3); ev(4.4, 'bass_drum', None, None, .9, 0, 1.1); ev(4.4, 'crash', None, None, .7, .1, .7)
for i, p in enumerate([81, 88, 84, 93]): ev(4.82 + i * .1, 'glockenspiel', p, .6, .55, .3 - i * .2, .7)

# —— theme on the grid ——
nb = int((END - T0) / (4 * B)) + 1
for bar in range(nb):
    tb = T0 + bar * 4 * B
    for k in range(8):   # spiccato violins: root–fifth–octave eighths
        t = tb + k * B / 2; st = state(t)
        if st in ('off', 'drone', 'pulse') or (st == 'sparse' and k % 2): continue
        tri = triad(chord_at(tb, st), 3); pat = [tri[0] + 12, tri[2] + 12, tri[0] + 24, tri[2] + 12]
        v = (.42 if k % 2 == 0 else .32) * (.8 if st == 'sparse' else 1)
        ev(t, 'violins_spic', pat[k % 4] - (12 if st == 'tense' else 0), .2, v, .25, .55)
    for k in range(4):   # pizzicato bass on the beat
        t = tb + k * B; st = state(t)
        if st in ('off', 'drone'): continue
        tri = triad(chord_at(tb, st), 3)
        ev(t, 'contrabass_pizz', tri[0] - 12, .4, .72 if k == 0 else .5, -.1, .9)
        if st == 'sparse' and k in (0, 2): ev(t, 'cellos_pizz', tri[1], .4, .45, .2, .5)
    st0 = state(tb + .6); tri = triad(chord_at(tb, st0), 3)
    if st0 in ('full', 'lift', 'sparse'):
        ev(tb, 'horn', tri[1], 2.0, .3, -.25, .5, attack=.25); ev(tb, 'horn', tri[2], 2.0, .28, .25, .45, attack=.25)
    if st0 in ('tense', 'pulse'):
        ev(tb, 'violins_trem', tri[0] + 12, 2.0, .3 if st0 == 'tense' else .22, -.2, .45, attack=.2); ev(tb, 'violins_trem', tri[2] + 12, 2.0, .28 if st0 == 'tense' else .2, .2, .4, attack=.2)
    for k in range(4):   # drums
        t = tb + k * B; st = state(t)
        if st in ('off', 'drone'): continue
        if st in ('tense', 'pulse'): ev(t, 'bass_drum', None, None, .5 if st == 'tense' else .42, 0, .7)   # heartbeat
        elif st == 'sparse': (k == 0) and ev(t, 'bass_drum', None, None, .4, 0, .55)
        else:
            if k in (0, 2): ev(t, 'bass_drum', None, None, .55, 0, .7)
            if k in (1, 3): ev(t, 'snare2', None, None, .35, .1, .35)

# rundown rows land on glockenspiel notes; timpani on every story change and hard cut
for t, n in ((6.5, 81), (7.0, 84), (7.5, 88), (8.0, 93)): ev(t, 'glockenspiel', n, .5, .5, .2, .55)
for t in (10.5, 16.0, 21.0, 26.5, 31.0, 44.0, 53.0, 57.0): ev(t, 'timpani', 'A2', 1, .7, 0, .9)
stab(10.5, [57, 60, 64], .75, .3)
# the hit: low brass, timpani, crash, bass drum; then a roll and a held drone
stab(40.5, [45, 48, 52], 1.0, .8); ev(40.5, 'timpani', 'A2', 1.4, 1.0, 0, 1.4); ev(40.5, 'crash', None, None, .85, -.1, .8); ev(40.5, 'bass_drum', None, None, 1.0, 0, 1.2)
for i in range(16): ev(41.3 + i * .06, 'timpani', 'E3', .3, .25 + i * .03, 0, .5)
ev(41.0, 'cellos', 45, 2.9, .4, -.1, .55, attack=.3, release=.5); ev(41.0, 'contrabass', 33, 2.9, .4, .1, .5, attack=.3, release=.5); ev(41.0, 'horn', 57, 2.8, .25, 0, .35, attack=.5)
# research lifts to C major: brass stab + glockenspiel
stab(44.05, [60, 64, 67], .8, .35)
for i, n in enumerate([84, 88, 91]): ev(44.2 + i * .1, 'glockenspiel', n, .6, .5, -.2 + i * .2, .55)
ev(50.2, 'tubular_bells', 'C5', 2, .45, .2, .35)                      # RESEARCH PREVIEW stamp
# recap ticks
for i, n in enumerate([81, 84, 88, 93]): ev(53.9 + i * .4, 'glockenspiel', n, .6, .55, -.3 + i * .2, .6)
# end card: roll → A-major tutti (Picardy third)
for i in range(10): ev(61.0 + i * .05, 'timpani', 'E3', .3, .35 + i * .05, 0, .6)
for ins, ns, g in [('trumpet', [81, 85, 88], .7), ('horn', [69, 73, 76], .8), ('trombone', [57, 64], .8), ('violins', [81, 85, 88, 93], .5), ('cellos', [45, 57], .7)]:
    for n in ns: ev(61.5, ins, n, 2.8, .78, 0, g, attack=.02, release=1.2)
ev(61.5, 'timpani', 'A2', 1, 1.0, 0, 1.3); ev(61.5, 'crash', None, None, .8, 0, .8); ev(61.5, 'tubular_bells', 'A4', 3, .7, .2, .6); ev(61.5, 'bass_drum', None, None, 1.0, 0, 1.1)
for i, p in enumerate([81, 85, 88, 93]): ev(61.85 + i * .09, 'glockenspiel', p, .8, .5, -.3 + i * .2, .55)

music += S.render(M, DUR + 1, master=False)[:N]

# low-passed 16th-note saw pulse (theme, markets, and alone under the GPU grid)
def saw(f, d): t = X.t_(d); return 2 * ((t * f) % 1) - 1
pulse = np.zeros((N, 2), np.float32)
for bar in range(nb):
    tb = T0 + bar * 4 * B
    for k in range(16):
        t = tb + k * B / 4; st = state(t)
        if st not in ('full', 'tense', 'pulse', 'lift'): continue
        f = 440 * 2 ** ((12 * 3 + NOTE[chord_at(tb, st).rstrip('m')] - 69) / 12)
        x = saw(f, .11) * X.env_exp(.11, .045); x = X.lp(x, 1300 if st == 'pulse' else 1000 if st == 'tense' else 850)
        X.add(pulse, x.astype(np.float32), t, (.2 if st == 'pulse' else .15) * (1.0 if k % 4 else .6))
music += pulse
music = S.room(music, .35, .14)

# —— ambience beds ——
amb = np.zeros((N, 2), np.float32)
def bed(a, b, x, g):
    n0, n1 = int(a * SR), min(N, int(b * SR)); s = x[:n1 - n0] * g
    fade = np.minimum(1, np.minimum(np.arange(len(s)) / (.3 * SR), (len(s) - np.arange(len(s))) / (.3 * SR)))
    amb[n0:n1] += (s * fade)[:, None]
bed(0.0, 4.0, X.norm(X.lp(X.brown(4.0), 300), .5), .06)                                            # room tone, cold open
hum = X.lp(X.brown(5.6), 400) + np.sin(2 * np.pi * 120 * X.t_(5.6)) * .05; bed(10.4, 16.0, X.norm(hum, .5), .1)   # server-room hum
air = X.lp(X.noise(13.2), 900); bed(31.0, 44.0, X.norm(air, .5), .045); bed(44.0, 53.0, X.norm(X.lp(X.noise(9.0), 700), .5), .04)

# —— foley ——
def market(d):   # trading-screen ticks
    out = np.zeros(int(d * SR), np.float32); rng = np.random.default_rng(7); t = 0
    while t < d - .05:
        c = X.bp(X.click(1.6 + rng.random() * .6, .4), 1500, 6000); s = int(t * SR); out[s:s + len(c)] += c[:len(out) - s] * (.4 + rng.random() * .4); t += .08 + rng.random() * .14
    return out
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'swish': X.add(fx, X.whoosh(.32, .7), t, .6, -.4)
    elif ty == 'whoosh': X.add(fx, X.whoosh(.38, .8), t - .1, .55, .3)
    elif ty == 'glint': X.add(fx, X.ding(.4), t, .25, .4)
    elif ty == 'hit': X.add(fx, X.thump(.9, 60), t, .6)
    elif ty == 'hit_cut': X.add(fx, X.thump(.8, 55), t, .55)
    elif ty == 'stab': X.add(fx, X.thump(1.0, 50), t, .6)
    elif ty == 'slide': X.add(fx, X.whoosh(.2, .5), t, .3, -.4)
    elif ty == 'row': X.add(fx, X.click(.8, .9), t, .4, .3); X.add(fx, X.thump(.5, 110), t, .35)
    elif ty == 'blip': X.add(fx, X.ding(.5), t, .2, .3)
    elif ty == 'slam': X.add(fx, X.thump(.7, 75), t, .45); X.add(fx, X.whoosh(.18, .6), t - .1, .3, .4)
    elif ty == 'stamp': X.add(fx, X.thump(.9, 90), t, .55); X.add(fx, X.lp(X.clack(.7, .8), 3000), t, .3)   # low-passed clack: keeps the voice clear
    elif ty == 'key': X.add(fx, X.clack(1.3 + X._rng.random() * .3, .6), t, .2, -.2)
    elif ty == 'card': X.add(fx, X.thump(.7, 65), t, .5); X.add(fx, X.whoosh(.2, .5), t - .08, .3)
    elif ty == 'flap':
        for i in range(3): X.add(fx, X.click(1.1 + i * .15, .7), t + i * .05, .3, .2)
    elif ty == 'click': X.add(fx, X.click(1.4, .8), t, .35, .35)
    elif ty == 'bar': X.add(fx, X.lp(X.whoosh(.4, .6), 2500), t, .3, -.2)
    elif ty == 'ding': X.add(fx, X.ding(.9), t, .35, .3)
    elif ty == 'market': X.add(fx, market(e['dur']), t, .1, .3)
    elif ty == 'paper':
        X.add(fx, (X.bp(X.noise(.4), 1200, 6000) * X.env_exp(.4, .14)).astype(np.float32), t, .25, .4); X.add(fx, X.whoosh(.35, .6), t, .3, .4)
    elif ty == 'tick_ok': X.add(fx, X.pop(.6), t, .3); X.add(fx, X.click(1.2, .6), t, .2)
    elif ty == 'zoom': X.add(fx, X.lp(X.whoosh(1.0, .7), 1800)[::-1].copy(), t, .4)
    elif ty == 'cell':
        for i in range(3): X.add(fx, X.click(1.5 + e['c'] * .01, .4), t + i * .03, .12, -.5 + e['c'] / 40)
    elif ty == 'draw': X.add(fx, (X.bp(X.noise(.4), 3000, 7000) * np.sin(np.pi * X.t_(.4) / .4)).astype(np.float32), t, .05, -.2)
    elif ty == 'pop': X.add(fx, X.pop(.7), t, .3, .3)
    elif ty == 'boom': X.add(fx, X.thump(1.0, 42), t, .9); X.add(fx, X.lp(X.whoosh(.5, .9), 1200), t - .3, .35)
    elif ty == 'sweep': X.add(fx, X.lp(X.whoosh(.9, .6), 2200), t, .3, .4)
    elif ty == 'end': X.add(fx, X.thump(1.0, 55), t, .5)
fx = S.room(fx, .2, .08)

# —— narration: broadcast EQ + compression ——
spans = []
for e in EV:
    if e['type'] != 'vo': continue
    sr, x = wavfile.read(os.path.join(HERE, 'vo', e['id'] + '.wav'))
    x = x.astype(np.float32) / (32768 if x.dtype == np.int16 else 1)
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr).astype(np.float32)
    x = X.hp(x, 90).astype(np.float32); x = X.compress(x / (np.abs(x).max() + 1e-9) * .8, .3, 3)
    X.add(vo, x.astype(np.float32), e['t'], 1.0, 0)
    spans.append((e['t'], e['t'] + len(x) / SR))

duck = np.ones(N, np.float32)
for a, b in spans:
    k = np.clip(np.minimum((tt - (a - .08)) / .08, ((b + .15) - tt) / .15), 0, 1)
    duck = np.minimum(duck, 1 - .55 * k)
music *= duck[:, None]
cut = 1 - duck   # under speech the music also loses part of the 1.2–5 kHz band
band = np.stack([X.bp(music[:, c], 1200, 5000) for c in range(2)], 1).astype(np.float32)
music -= band * (cut / .55 * .6)[:, None]

mix = music * .9 + fx * .8 + amb * .8 + vo * 1.3
fade = np.clip((DUR - tt) / 1.0, 0, 1); mix *= fade[:, None]
mix = mix[:int(DUR * SR)]
mix = np.stack([X.limit(mix[:, 0], .95), X.limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
wavfile.write(os.path.join(HERE, 'out', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print('mix', mix.shape, 'peak', float(np.abs(mix).max()))
print('\n'.join(S.credits(sorted({e['inst'] for e in M}))))
