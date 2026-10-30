"""Original analogue-synth score, synthesised from scratch (numpy + numba, deterministic) → out/score.wav (48 kHz stereo).
A minor, 120 BPM (beat 0.5 s), on the same timeline as main.js:
  3.3   drone fades in (ahead of the push-in at 3.5)
  9.5   eighth-note arpeggio while the rules are shown
  12.0  the arpeggio speeds up: eighths → sixteenths (14.0) → thirty-seconds (17.0), filter opening, Am | F | G | E
  19.5  digital zero, reverb tails included
  20.0  the film's only major chord (A major) on the colour change; its tail runs into the code
  26.5  low pulse under the code; 31.25 one high note on the highlighted line; out at 34.5"""
import os, numpy as np, soundfile as sf
from numba import njit
from scipy.signal import fftconvolve, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000; DUR = 39.0; N = int(DUR * SR)
mf = lambda m: 440.0 * 2 ** ((m - 69) / 12)
ix = lambda t: int(round(t * SR))

@njit(cache=True)
def osc(freq, ph0, kind):
    # PolyBLEP saw (kind 0) or square (kind 1, two offset saws)
    n = len(freq); out = np.empty(n); ph = ph0
    for i in range(n):
        dt = freq[i] / SR
        v = 2.0 * ph - 1.0
        if ph < dt:
            x = ph / dt; v -= x + x - x * x - 1.0
        elif ph > 1.0 - dt:
            x = (ph - 1.0) / dt; v -= x * x + x + x + 1.0
        if kind == 1:
            p2 = ph + .5
            if p2 >= 1.0: p2 -= 1.0
            w = 2.0 * p2 - 1.0
            if p2 < dt:
                x = p2 / dt; w -= x + x - x * x - 1.0
            elif p2 > 1.0 - dt:
                x = (p2 - 1.0) / dt; w -= x * x + x + x + 1.0
            v = (v - w) * .5
        out[i] = v
        ph += dt
        if ph >= 1.0: ph -= 1.0
    return out

@njit(cache=True)
def ladder(x, fc, res):
    # resonant 4-pole ladder low-pass with a cutoff per sample
    y1 = 0.0; y2 = 0.0; y3 = 0.0; y4 = 0.0; out = np.empty(len(x))
    for i in range(len(x)):
        f = min(max(fc[i], 20.0), SR * .42)
        g = 1.0 - np.exp(-2.0 * np.pi * f / SR)
        u = np.tanh(x[i] - 4.0 * res * y4)
        y1 += g * (u - np.tanh(y1)); y2 += g * (np.tanh(y1) - np.tanh(y2))
        y3 += g * (np.tanh(y2) - np.tanh(y3)); y4 += g * (np.tanh(y3) - np.tanh(y4))
        out[i] = y4
    return out

rng = np.random.default_rng(1030)
def wow(n, t0):   # slow tape wow, ± 3 cents
    t = t0 + np.arange(n) / SR
    return 2 ** ((3 / 1200) * np.sin(2 * np.pi * .41 * t + rng.random() * 6.28))

def voice(midi, dur, t0, kind=0, cutoff=900., fenv=0., fdec=.12, res=.2, amp=1., a=.005, d=.15, s=.7, r=.2, detune=(-6, 6), spread=.5):
    n = ix(dur + r * 5); t = np.arange(n) / SR; w = wow(n, t0)
    sig = np.zeros((n, 2))
    for j, c in enumerate(detune):
        o = osc(mf(midi) * 2 ** (c / 1200) * w, rng.random(), kind)
        p = (j / max(1, len(detune) - 1) * 2 - 1) * spread
        sig[:, 0] += o * np.cos((p + 1) * np.pi / 4); sig[:, 1] += o * np.sin((p + 1) * np.pi / 4)
    sig /= np.sqrt(len(detune))
    cf = np.broadcast_to(np.asarray(cutoff, float), (n,)) if np.ndim(cutoff) == 0 else np.interp(t, np.linspace(0, dur, len(cutoff)), cutoff)
    fc = cf * (1 + fenv * np.exp(-t / fdec))
    env = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    env = np.where(t > dur, np.interp(dur, t, env) * np.exp(-np.maximum(t - dur, 0) / r), env)
    out = np.stack([ladder(sig[:, 0], fc, res), ladder(sig[:, 1], fc, res)], 1)
    return out * env[:, None] * amp

def place(bus, x, t):
    i = ix(t)
    if i >= N: return
    L = min(len(x), N - i); bus[i:i + L] += x[:L]

def ir(dec, seed):
    n = ix(dec * 1.5); t = np.arange(n) / SR
    r = np.random.default_rng(seed).standard_normal((n, 2)) * np.exp(-t / (dec / 6.9))[:, None]
    r[:ix(.018)] = 0
    r = sosfilt(butter(1, 250, 'high', fs=SR, output='sos'), sosfilt(butter(1, 5000, 'low', fs=SR, output='sos'), r, axis=0), axis=0)
    return r / np.sqrt((r ** 2).sum(0).mean())
def verb(x, imp, wet):
    y = np.stack([fftconvolve(x[:, c], imp[:, c])[:len(x)] for c in range(2)], 1)
    return x + y * wet

dry = np.zeros((N, 2)); wet = np.zeros((N, 2))
A1, A2 = 33, 45
CH = {'Am': [57, 60, 64, 69], 'F': [53, 57, 60, 65], 'G': [55, 59, 62, 67], 'E': [56, 59, 64, 68]}   # E with G# leans back to A

# drone (3.3 → 19.5): square A1 + saw A2, the filter opens with the acceleration
dl = 19.5 - 3.3
cut = np.concatenate([np.full(60, 260.), np.linspace(260, 1400, 40)])
place(dry, voice(A1, dl, 3.3, kind=1, cutoff=cut, res=.25, amp=.34, a=1.2, d=1, s=1, r=.01, detune=(-4, 4)), 3.3)
place(dry, voice(A2, dl, 3.3, kind=0, cutoff=cut * 1.3, res=.15, amp=.16, a=1.6, d=1, s=1, r=.01), 3.3)

# arpeggio (9.5 → 19.5)
def chord_at(t):
    return 'Am' if t < 14 else 'F' if t < 16 else 'G' if t < 18 else 'E'
t = 9.5; k = 0
while t < 19.5 - 1e-6:
    step = .25 if t < 14 else .125 if t < 17 else .0625
    ch = CH[chord_at(t)]; m = ch[k % 4] + (12 if (k // 4) % 2 and t >= 14 else 0)
    u = np.clip((t - 9.5) / 10, 0, 1)
    v = voice(m, step * .7, t, kind=1, cutoff=700 + 4200 * u ** 1.6, fenv=1.2, fdec=.04, res=.3, amp=.22 + .08 * u, a=.002, d=.06, s=.4, r=.05, detune=(0,), spread=0)
    pan = .35 * np.sin(k * 1.7)
    v[:, 0] *= 1 - max(0, pan); v[:, 1] *= 1 + min(0, pan)
    place(dry, v, t); place(wet, v * .5, t)
    t += step; k += 1
# bass pulse in eighths (12.0 → 19.5)
ROOT = {'Am': 33, 'F': 29, 'G': 31, 'E': 28}
t = 12.0
while t < 19.5 - 1e-6:
    place(dry, voice(ROOT[chord_at(t)] + 12, .18, t, kind=0, cutoff=380, fenv=3, fdec=.05, res=.3, amp=.3, a=.003, d=.08, s=.3, r=.05, detune=(-5, 5), spread=.1), t)
    t += .25

# everything before 19.5 gets its reverb, then the whole score drops to digital zero
early = verb(dry, ir(1.8, 3), 0) + verb(wet, ir(2.2, 4), .5) - wet
g = np.ones(N); g[ix(19.5):] = 0; g[ix(19.5) - 240:ix(19.5)] = np.linspace(1, 0, 240)
early *= g[:, None]

# 20.0 — A major, the only major chord; long reverb tail into the code section
late_dry = np.zeros((N, 2))
for m in [45, 52, 57, 61, 64, 69]:
    place(late_dry, voice(m, 4.6, 20.0, kind=0, cutoff=2600, fenv=1.5, fdec=.6, res=.12, amp=.17, a=.015, d=1.2, s=.65, r=1.6, detune=(-9, 0, 9), spread=.8), 20.0)
place(late_dry, voice(33, 1.2, 20.0, kind=1, cutoff=500, fenv=4, fdec=.08, res=.2, amp=.4, a=.002, d=.3, s=.3, r=.6, detune=(0,)), 20.0)
# 26.5 → 34.5 — low pulse and a quiet minor pad under the code
t = 26.5
while t < 34.5 - 1e-6:
    place(late_dry, voice(33, .3, t, kind=1, cutoff=420, fenv=2.5, fdec=.06, res=.25, amp=.28, a=.003, d=.12, s=.3, r=.08, detune=(0,)), t)
    t += .5
for m in [45, 48, 52]:
    place(late_dry, voice(m, 7.6, 26.6, kind=0, cutoff=650, res=.1, amp=.07, a=1.5, d=1, s=1, r=.4), 26.6)
place(late_dry, voice(88, .9, 31.25, kind=1, cutoff=3000, fenv=1, fdec=.2, res=.2, amp=.12, a=.004, d=.4, s=.2, r=.8, detune=(0,)), 31.25)
late = verb(late_dry, ir(3.4, 5), .55)
g2 = np.ones(N); g2[ix(34.5):] = 0; g2[ix(34.0):ix(34.5)] = np.linspace(1, 0, ix(34.5) - ix(34.0))
late *= g2[:, None]

mix = early + late
mix = mix / np.abs(mix).max() * .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mix.astype(np.float32), SR)
print('score', round(DUR, 2), 's, peak', round(float(np.abs(mix).max()), 3))
