"""v2.0 soundtrack, sound design and mix.

A new original score (E minor 9 colours, glassy plucks, deep sub) on a grid
whose downbeat lands on the narrator's first "Aarti"; one designed sound per
interaction type from the picture's cue list; the narration on top with
voice-driven ducking and a speech-band cut in the bed.

usage: python3 audio_v2.py timeline_v2.json narration2.wav out.wav [stems_dir]
"""
import json, sys
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, uniform_filter1d
import soundfile as sf

TLF, VOF, OUTF = sys.argv[1:4]
STEMS = sys.argv[4] if len(sys.argv) > 4 else None
SR = 48000
TL = json.load(open(TLF)); DUR = TL['duration']; SC = TL['scenes']; K = TL['times']
N = int(round(DUR * SR))
rng = np.random.default_rng(41)

def ta(n): return np.arange(n) / SR
def buf(): return np.zeros((2, N + SR * 3))
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if x.ndim == 1: x = np.vstack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)])
    if i < 0: x = x[:, -i:]; i = 0
    j = min(bus.shape[1], i + x.shape[1]); bus[:, i:j] += gain * x[:, : j - i]
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def peak_eq(x, f, g_db, q=1.0):
    A = 10 ** (g_db / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)
def blsaw(f, t, ph=0.0, fmax=8000):
    o = np.zeros_like(t)
    for k in range(1, max(2, int(fmax / f)) + 1): o += np.sin(2 * np.pi * k * (f * t + ph)) / k
    return -2 / np.pi * o
def blsq(f, t, fmax=8000):
    o = np.zeros_like(t)
    for k in range(1, max(2, int(fmax / f)) + 1, 2): o += np.sin(2 * np.pi * k * f * t) / k
    return 4 / np.pi * o
def noise(n): return rng.standard_normal(n)
def sweep_bp(x, f0, f1, q=1.3):
    n = len(x); out = np.zeros(n); blk = 512; zi = None
    for s in range(0, n, blk):
        fc = f0 * (f1 / f0) ** (s / max(n - 1, 1)); lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 * 0.95)
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
        if zi is None: zi = signal.lfilter_zi(b, a) * 0
        out[s:s + blk], zi = signal.lfilter(b, a, x[s:s + blk], zi=zi)
    return out
def onepole_sweep(x, f0, f1):
    f = f0 * (f1 / f0) ** (np.arange(len(x)) / max(len(x) - 1, 1)); a = np.exp(-2 * np.pi * f / SR)
    y = np.zeros(len(x)); z = 0.0
    for i in range(len(x)): z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y

music, drums, sfx, send = buf(), buf(), buf(), buf()

# ------------------------------------------------------------------ score
BEAT = 0.5
A0 = K['aarti']
def bar(t): return int(np.floor((t - A0) / 2.0))
# Em9  Cmaj7  G6/9  D(add9)
CH = [[52, 59, 62, 66, 67], [48, 55, 59, 62, 64], [55, 59, 62, 64, 69], [50, 57, 62, 64, 66]]
RT = [40, 36, 43, 38]
def chord(t): return CH[bar(t) % 4] if t >= A0 else CH[0]
def root(t): return RT[bar(t) % 4] if t >= A0 else RT[0]
def section(t):
    if t < A0: return 'intro'
    if t < SC['search']: return 'A'
    if t < SC['bot']: return 'B'
    if t < SC['themes']: return 'C'
    if t < SC['ajay'] - 0.3: return 'D'
    if t < SC['end']: return 'maker'
    return 'outro'

def pad(freqs, dur, bright, amp, air=0.0):
    n = int(dur * SR); t = ta(n); out = np.zeros((2, n))
    for f in freqs:
        for ch, det in ((0, -1), (1, 1)):
            for c in (-5, 0, 5):
                out[ch] += blsaw(f * 2 ** ((c + det * 4) / 1200), t, rng.random(), 3200) * (0.7 if c == 0 else 0.5)
                out[ch] += air * np.sin(2 * np.pi * f * 2 * t + rng.random() * 6) * 0.6
    out = np.vstack([lp(out[0], bright), lp(out[1], bright)])
    return out * np.minimum(1, t / 0.5) * np.clip((dur - t) / 0.6, 0, 1) * amp / len(freqs)

edges = sorted(set([0.0] + [A0 + 2 * k for k in range(-2, 14) if 0.05 < A0 + 2 * k < DUR] + [SC['ajay'] - 0.3, SC['end']]))
for i in range(len(edges) - 1):
    a, b = edges[i], edges[i + 1]; sec = section(a + 0.01)
    if sec == 'outro': continue
    bright = {'intro': 1100, 'A': 1500, 'B': 2100, 'C': 2300, 'D': 2800, 'maker': 1300}[sec]
    amp = {'intro': 0.26, 'A': 0.2, 'B': 0.18, 'C': 0.19, 'D': 0.2, 'maker': 0.2}[sec]
    v = pad([hz(m) for m in chord(a + 0.01)], b - a + 0.5, bright, amp, air=0.25 if sec in ('intro', 'maker') else 0.1)
    if a == 0.0: v *= np.linspace(0.55, 1, v.shape[1]) ** 1.3
    place(music, v, a); place(send, v, a, 0.4)
endc = [40, 52, 59, 62, 66, 71, 74]
v = pad([hz(m) for m in endc], DUR - K['endAarti'] + 1.5, 1900, 0.24, air=0.3); v *= np.exp(-ta(v.shape[1]) / 2.6) * 0.7 + 0.3
place(music, v, K['endAarti']); place(send, v, K['endAarti'], 0.5)

# glass pluck arpeggio (square-ish, soft), sparse in intro/maker, 16ths in B-D
def pluck(f, amp, bright=6000, dur=0.36):
    n = int(dur * SR); t = ta(n)
    x = blsq(f, t, 7000) * 0.35 + np.sin(2 * np.pi * f * t) * 0.6 + np.sin(2 * np.pi * 3 * f * t) * 0.12
    return onepole_sweep(x * np.exp(-t / 0.14), bright, 600) * amp * np.minimum(1, t / 0.002)
ARP = [0, 2, 3, 4, 3, 2, 1, 3]
t = 0.2; i = 0
while t < SC['end'] - 0.25:
    sec = section(t + 1e-3)
    step = {'intro': 0.5, 'A': 0.25, 'B': 0.125, 'C': 0.125, 'D': 0.125, 'maker': 0.5}[sec]
    if sec == 'D' and t > SC['ajay'] - 0.6: t += step; continue
    c = chord(t + 1e-3); m = c[ARP[i % 8] % len(c)] + 12 + (12 if sec in ('C', 'D') and i % 16 in (6, 14) else 0)
    amp = {'intro': 0.04, 'A': 0.05, 'B': 0.055, 'C': 0.058, 'D': 0.064, 'maker': 0.04}[sec]
    p = pluck(hz(m), amp); pan = 0.45 * np.sin(i * 0.8)
    place(music, p, t, pan=pan); place(send, p, t, 0.55, pan=-pan)
    t += step; i += 1

# sub bass
def bass(f, dur, amp=0.3):
    n = int(dur * SR); t = ta(n)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.tanh(2 * blsaw(f, t, 0, 2200))
    return lp(x, 600) * np.minimum(1, t / 0.005) * np.exp(-t / (dur * 0.9)) * amp
t = A0
while t < SC['end'] - 0.3:
    sec = section(t + 1e-3); r = root(t + 1e-3)
    if sec == 'maker': place(music, bass(hz(r), 1.9, 0.18), t); t += 2.0; continue
    if sec == 'A': place(music, bass(hz(r), 0.9, 0.24), t); t += 1.0; continue
    if sec == 'D' and t > SC['ajay'] - 0.6: t += 0.25; continue
    place(music, bass(hz(r + (12 if int(round((t - A0) / 0.25)) % 4 == 3 else 0)), 0.2, 0.26), t); t += 0.25

# drums
def kick(amp):
    n = int(0.4 * SR); t = ta(n); f = 44 + 100 * np.exp(-t / 0.03)
    return np.tanh(1.25 * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.19) + 0.05 * noise(n) * np.exp(-t / 0.004))) * amp
def hat(d=0.028, amp=0.09): n = int(max(d * 6, 0.05) * SR); t = ta(n); return hp(noise(n), 8500) * np.exp(-t / d) * amp
def clap(amp=0.24):
    n = int(0.3 * SR); t = ta(n); x = np.zeros(n); nz = noise(n)
    for o in (0, 0.01, 0.02): i2 = int(o * SR); x[i2:] += np.exp(-t[: n - i2] / (0.012 if o < 0.02 else 0.08))
    return bp(nz * x, 1100, 4000) * amp
def tick_perc(amp=0.08): n = int(0.05 * SR); t = ta(n); return (np.sin(2 * np.pi * 2800 * t) * np.exp(-t / 0.008) + 0.3 * hp(noise(n), 6000) * np.exp(-t / 0.004)) * amp
kicks = []
t = A0
while t < SC['end'] - 0.26:
    sec = section(t + 1e-3); bn = int(round((t - A0) / BEAT))
    if sec == 'D' and t > SC['ajay'] - 0.55: t += BEAT; continue
    if sec == 'A':
        if bn % 2 == 0: place(drums, kick(0.46), t); kicks.append(t)
        if bn % 2 == 1: place(drums, tick_perc(), t + 0.25, pan=0.3)
        place(drums, hat(0.028, 0.07), t + 0.25, pan=-0.2)
    elif sec in ('B', 'C', 'D'):
        place(drums, kick(0.5), t); kicks.append(t)
        if bn % 2 == 1: c = clap(); place(drums, c, t); place(send, c, t, 0.3)
        for k2 in range(4): place(drums, hat(0.026, 0.085 if k2 % 2 else 0.06), t + k2 * 0.125, pan=0.25 if k2 % 2 else -0.2)
        if sec == 'D' and bn % 2 == 0: place(drums, tick_perc(0.06), t + 0.375, pan=-0.35)
    elif sec == 'maker':
        if bn % 4 == 0: place(drums, kick(0.32), t); kicks.append(t)
    t += BEAT

# ------------------------------------------------------------------ interaction sounds
def whoosh(d=0.5, f0=250, f1=5000, amp=0.2, sweep=0.7):
    n = int(d * SR * 1.3); t = ta(n); x = sweep_bp(noise(n), f0, f1, 1.4)
    x = x * np.sin(np.pi * np.clip(t / (d * 1.3), 0, 1)) ** 1.6 / (np.abs(x).max() + 1e-9) * amp
    p = np.linspace(-sweep, sweep, n); return np.vstack([x * np.sqrt(1 - p), x * np.sqrt(1 + p)])
def rise(d, amp=0.1):
    n = int(d * SR); t = ta(n); x = sweep_bp(noise(n), 600, 10000, 2.0); x /= np.abs(x).max() + 1e-9
    tone = np.sin(2 * np.pi * np.cumsum(330 * 4 ** (t / d)) / SR) * 0.3
    return (x * 0.6 + tone) * (t / d) ** 2.4 * amp
def reverse_swell(d, amp=0.14):
    n = int(d * SR); t = ta(n); tone = sum(np.sin(2 * np.pi * hz(m + 12) * t) for m in CH[0][:3]) / 3
    return (lp(noise(n), 3500) * 0.4 + tone) * (t / d) ** 3 * amp
def sub_hit(amp, big):
    n = int((1.8 if big else 0.7) * SR); t = ta(n); f = 36 + 60 * np.exp(-t / 0.07)
    return np.tanh(1.2 * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.9 if big else 0.3)) + lp(noise(n), 2400) * np.exp(-t / 0.06) * 0.4)) * amp
def blip(f, amp=0.07, d=0.07):
    n = int(0.3 * SR); t = ta(n); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / d) * amp * np.minimum(1, t / 0.002)
def click(amp=0.13): n = int(0.04 * SR); t = ta(n); return (hp(noise(n), 3500) * np.exp(-t / 0.003) * 0.5 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.008) * 0.5) * amp
def key(amp=0.07): n = int(0.04 * SR); t = ta(n); fc = 2600 + 1600 * rng.random(); return bp(noise(n), fc * 0.7, fc * 1.3) * np.exp(-t / 0.006) * amp
def bell(f, amp, d=1.2):
    n = int(d * SR); t = ta(n); return np.sin(2 * np.pi * f * t + 2.0 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.28)) * np.exp(-t / (d * 0.35)) * amp * np.minimum(1, t / 0.002)
def glass(f, amp, d=1.4):   # clean glassy tone for reveals
    n = int(d * SR); t = ta(n)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t / 0.4) + 0.2 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t / 0.15)) * np.exp(-t / (d * 0.4)) * amp * np.minimum(1, t / 0.003)
def shimmer(amp=0.03, d=1.3):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(16):
        f = rng.uniform(3500, 9000); o = int(rng.uniform(0, d * 0.5) * SR); t = ta(n - o)
        x[o:] += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.15) * rng.uniform(0.4, 1)
    return x * amp / 4
def digital(f, amp=0.05):
    n = int(0.16 * SR); t = ta(n); x = np.round((np.sign(np.sin(2 * np.pi * f * t)) * 0.35 + np.sin(4 * np.pi * f * t)) * 5) / 5
    return lp(x, 7000) * np.exp(-t / 0.045) * amp
def zip_line(d, amp=0.05):
    n = int(d * SR); t = ta(n); f = 1000 * (2.2 ** (t / d))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + bp(noise(n), 2500, 8000) * 0.3) * np.sin(np.pi * t / d) ** 1.5 * amp
PENT = [76, 79, 81, 83, 86, 88, 91, 93]

impacts, dips = [], []
for c in TL['cues']:
    t, k = c['t'], c['k']; d = c.get('d', 0.5); n_ = c.get('n', 0)
    if k == 'swell': place(sfx, reverse_swell(0.6, 0.06), 0)
    elif k == 'rise': place(sfx, rise(d, 0.08), t)
    elif k == 'card_land': place(sfx, sub_hit(0.18, False), t); x = glass(hz(83), 0.035); place(sfx, x, t); place(send, x, t, 0.5)
    elif k == 'pass': place(sfx, whoosh(d, 300, 6000, 0.2, 0.9), t)
    elif k == 'card_in': place(sfx, whoosh(0.3, 900, 5000, 0.07, 0.5), t); x = blip(hz(PENT[(n_ + 2) % 8]), 0.04); place(sfx, x, t + 0.12, pan=0.2)
    elif k == 'click': place(sfx, click(), t)
    elif k == 'focus': x = glass(hz(88), 0.03, 0.6); place(sfx, x, t); place(send, x, t, 0.4)
    elif k == 'key': place(sfx, key(0.04 if c.get('soft') else 0.07), t, pan=rng.uniform(-0.2, 0.2))
    elif k == 'logo': x = sub_hit(0.3, True); place(sfx, x, t); place(send, x, t, 0.15); x = glass(hz(71), 0.06, 2.0); place(sfx, x, t); place(send, x, t, 0.6); impacts.append((t, 0.5))
    elif k == 'shimmer': x = shimmer(); place(sfx, x, t, pan=-0.2); place(send, x, t, 0.6)
    elif k == 'pulse': place(sfx, blip(hz(71), 0.05, 0.12), t); place(sfx, blip(hz(78), 0.04, 0.12), t + 0.12)
    elif k == 'circle_wipe': place(sfx, whoosh(d, 200, 3000, 0.15, 0.2), t); place(sfx, reverse_swell(0.35, 0.06), t - 0.2)
    elif k == 'pull': place(sfx, whoosh(d, 3000, 400, 0.1, 0.4), t)
    elif k == 'tab': place(sfx, blip(hz(88), 0.045, 0.05), t)
    elif k == 'morph': place(sfx, whoosh(d, 400, 4500, 0.12, 0.3), t); place(sfx, zip_line(0.3, 0.035), t + 0.05)
    elif k == 'select': n2 = int(d * SR); tt = ta(n2); place(sfx, np.sin(2 * np.pi * np.cumsum(700 * 2 ** (tt / d)) / SR) * np.sin(np.pi * tt / d) * 0.035, t)
    elif k == 'enter': place(sfx, click(0.1), t); place(sfx, blip(hz(81), 0.04), t + 0.02)
    elif k == 'hover': place(sfx, blip(hz(93), 0.02, 0.04), t)
    elif k == 'tap_pop': x = blip(hz(86), 0.06, 0.06); place(sfx, x, t); place(send, x, t, 0.3)
    elif k == 'expand': place(sfx, whoosh(d, 250, 4000, 0.15, 0.4), t); place(sfx, rise(d * 0.9, 0.05), t)
    elif k == 'play': place(sfx, click(0.12), t)
    elif k == 'drop': place(sfx, sub_hit(0.26, False), t); impacts.append((t, 0.3))
    elif k == 'line': place(sfx, zip_line(d, 0.05), t)
    elif k == 'create': x = glass(hz(83), 0.05, 0.9); place(sfx, x, t); place(send, x, t, 0.5); place(sfx, blip(hz(90), 0.035), t + 0.1)
    elif k == 'flow': place(sfx, whoosh(0.35, 1500, 5000, 0.05, 0.6), t)
    elif k == 'heart': x = bell(hz(88), 0.05, 0.9); place(sfx, x, t); place(send, x, t, 0.5); place(sfx, bell(hz(93), 0.035, 0.8), t + 0.08)
    elif k == 'swoosh': place(sfx, whoosh(d, 500, 4000, 0.09), t)
    elif k == 'bot': x = glass(hz(79), 0.05, 1.0); place(sfx, x, t); place(send, x, t, 0.5); place(sfx, digital(hz(91), 0.03), t + 0.05)
    elif k == 'chime': x = bell(hz(83), 0.05, 1.0); place(sfx, x, t); place(sfx, bell(hz(90), 0.04, 1.0), t + 0.09); place(send, x, t, 0.5)
    elif k == 'orbit': place(sfx, whoosh(d, 300, 3500, 0.12, 0.8), t)
    elif k == 'theme': x = digital(hz(PENT[n_ % 8]), 0.04); place(sfx, x, t, pan=0.3 * np.sin(n_)); place(send, x, t, 0.3)
    elif k == 'tick': place(sfx, tick_perc(0.05), t)
    elif k == 'type_wipe': place(sfx, whoosh(d, 200, 7000, 0.16, 0.0), t); place(sfx, rise(d, 0.06), t)
    elif k == 'dip': dips.append((t, d))
    elif k == 'ajay':   # the maker's name: a warm tonal hit with a soft sub under it
        x = glass(hz(64), 0.05, 2.6) + glass(hz(71), 0.032, 2.6)[: int(2.6 * SR)]; place(sfx, x, t); place(send, x, t, 0.7)
        place(sfx, sub_hit(0.16, False), t); x = shimmer(0.025, 1.2); place(sfx, x, t + 0.05); impacts.append((t, 0.25))
    elif k == 'ig': x = digital(hz(95), 0.04); place(sfx, x, t, pan=0.2); place(sfx, blip(hz(100), 0.025, 0.04), t + 0.07, pan=0.3)
for dt, m in [(0.3, 83), (0.85, 79), (1.5, 76), (2.05, 74)]:
    x = bell(hz(m), 0.03, 1.6); place(music, x, K['endAarti'] + dt); place(send, x, K['endAarti'] + dt, 0.6)

# ------------------------------------------------------------------ narration
vo, vsr = sf.read(VOF); assert vsr == SR
vo = vo if vo.ndim == 1 else vo.mean(1)
vo = hp(vo, 85, 2); vo = peak_eq(vo, 3200, 2.5, 0.9); vo = peak_eq(vo, 250, -1.5, 1.0); vo = peak_eq(vo, 7500, -1.0, 0.8)
env = np.sqrt(uniform_filter1d(vo ** 2, int(0.03 * SR)) + 1e-12); thr = 10 ** (-24 / 20)
g = np.where(env > thr, (env / thr) ** (1 / 3 - 1), 1.0); vo = vo * uniform_filter1d(g, int(0.01 * SR))
vo_bus = np.zeros((2, music.shape[1])); vo_bus[:, : len(vo)] = vo
place(send, vo_bus[:, :N] * 0.1, 0)

# ------------------------------------------------------------------ ducking & automation
tt = ta(music.shape[1])
v_env = np.sqrt(uniform_filter1d(vo_bus[0] ** 2, int(0.05 * SR)) + 1e-12)
active = (v_env > 10 ** (-40 / 20)).astype(float)
att, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR)); d_env = np.zeros_like(active); z = 0.0
for i in range(len(active)):
    a = att if active[i] > z else rel; z = a * z + (1 - a) * active[i]; d_env[i] = z
duck = 1 - 0.8 * d_env
for k0 in kicks: i = int(k0 * SR); duck[i:] *= 1 - 0.08 * np.exp(-tt[: len(duck) - i] / 0.1)
for t0, dp in impacts: i = int(t0 * SR); duck[i:] *= 1 - dp * 0.6 * np.exp(-tt[: len(duck) - i] / 0.3)
auto = np.ones_like(duck)
for t0, d in dips:   # a held breath before the maker's line
    i0, i1, i2 = int(t0 * SR), int((t0 + d) * SR), int((t0 + d + 0.25) * SR)
    auto[i0:i1] = 0.3; auto[i1:i2] = np.linspace(0.3, 1, i2 - i1)
    j0 = int((t0 - 0.12) * SR); auto[j0:i0] = np.linspace(1, 0.3, i0 - j0)
music *= duck * auto; drums *= (0.55 + 0.45 * duck) * auto; send *= 0.7 + 0.3 * duck

def ir(sec=1.9):
    n = int(sec * SR); t = ta(n); e = np.exp(-t / (sec / 6.9)); return np.vstack([lp(noise(n), 7000) * e, lp(noise(n), 7000) * e]) * 0.03
IR = ir(); wet = np.vstack([hp(signal.fftconvolve(send[c], IR[c])[: send.shape[1]], 220) for c in (0, 1)])
bed = music * 1.1 + drums * 0.5 + wet * 0.55
def band(x, lo, hi): return np.vstack([bp(x[0], lo, hi), bp(x[1], lo, hi)])
bm = band(bed, 700, 5000); bed = bed - bm + bm * (1 - 0.6 * d_env)
fm = band(sfx, 700, 5000); fx = (sfx - fm + fm * (1 - 0.45 * d_env)) * 0.8
voice = vo_bus * 2.7
mixb = np.vstack([hp((bed + fx + voice)[0], 28), hp((bed + fx + voice)[1], 28)])[:, :N]
mixb = np.vstack([lp(mixb[0], 16000, 2), lp(mixb[1], 16000, 2)])   # no harsh top end
tf = K['fade']; mixb *= np.clip(1 - (ta(N) - tf) / (DUR - tf), 0, 1) ** 1.4
mixb[:, : int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))

# ------------------------------------------------------------------ master
def k_weight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x))
def lufs(x):
    y = np.vstack([k_weight(x[0]), k_weight(x[1])]); blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, y.shape[1] - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]; rl = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rl]; return -0.691 + 10 * np.log10(z.mean())
def true_peak(x): return np.abs(signal.resample_poly(x, 4, 1, axis=1)).max()
def limiter(x, ceiling_db=-1.6, look=0.005, rel_s=0.09):
    c = 10 ** (ceiling_db / 20); up = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    L = int(look * SR); pk = maximum_filter1d(pk, 2 * L + 1); g = np.minimum(1, c / np.maximum(pk, 1e-9))
    a = np.exp(-1 / (rel_s * SR)); out = np.empty_like(g); z = 1.0
    for i in range(len(g)): z = g[i] if g[i] < z else a * z + (1 - a) * g[i]; out[i] = z
    return x * np.convolve(out, np.ones(L) / L, mode='same')
y = mixb.copy()
for _ in range(5): y *= 10 ** ((-14.0 - lufs(y)) / 20); y = limiter(y)
tp = 20 * np.log10(true_peak(y)); print(f'LUFS {lufs(y):.2f}  true peak {tp:.2f} dBTP'); assert tp < -1.0
sf.write(OUTF, y.T, SR, subtype='PCM_24')
if STEMS:
    g = 10 ** ((-14.0 - lufs(mixb)) / 20)
    for nm, b in (('music_bed', bed), ('sfx', fx), ('voice', voice)): sf.write(f'{STEMS}/{nm}.wav', (b[:, :N] * g).T, SR, subtype='PCM_24')
