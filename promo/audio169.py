"""Soundtrack, sound design and final mix for the 16:9 promo.

Original synthesized music (no samples, no third-party material) on a grid
whose downbeat lands on the narrator's "Aarti"; sound effects placed from the
cue list the picture renderer exports; the female narration on top, with the
music ducked under every phrase and allowed to rise between them.

usage: python3 audio169.py timeline169.json narration.wav out.wav [stems_dir]
"""
import json, sys, wave
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, uniform_filter1d
import soundfile as sf

TLF, VOF, OUTF = sys.argv[1:4]
STEMS = sys.argv[4] if len(sys.argv) > 4 else None
SR = 48000
TL = json.load(open(TLF)); DUR = TL['duration']; SC = TL['scenes']; T0 = TL['times']
N = int(round(DUR * SR))
rng = np.random.default_rng(29)

def t_axis(n): return np.arange(n) / SR
def buf(): return np.zeros((2, N + SR * 3))
def note_hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if x.ndim == 1:
        x = np.vstack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)])
    if i < 0: x = x[:, -i:]; i = 0
    j = min(bus.shape[1], i + x.shape[1]); bus[:, i:j] += gain * x[:, : j - i]
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def peak_eq(x, f, g_db, q=1.0):
    A = 10 ** (g_db / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)
def blsaw(f, t, phase=0.0, fmax=8000):
    out = np.zeros_like(t)
    for k in range(1, max(2, int(fmax / f)) + 1): out += np.sin(2 * np.pi * k * (f * t + phase)) / k
    return -2 / np.pi * out
def noise(n): return rng.standard_normal(n)
def sweep_bp(x, f0, f1, q=1.3):
    n = len(x); out = np.zeros(n); blk = 512; zi = None
    for s in range(0, n, blk):
        fc = f0 * (f1 / f0) ** (s / max(n - 1, 1)); lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 * 0.95)
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
        if zi is None: zi = signal.lfilter_zi(b, a) * 0
        out[s:s + blk], zi = signal.lfilter(b, a, x[s:s + blk], zi=zi)
    return out
def tvf(x, f0, f1):
    n = len(x); f = f0 * (f1 / f0) ** (np.arange(n) / max(n - 1, 1)); a = np.exp(-2 * np.pi * f / SR)
    return signal.lfilter([1], [1, 0], x) if False else _onepole(x, a)
def _onepole(x, a):
    y = np.zeros(len(x)); z = 0.0
    for i in range(len(x)): z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y

music, drums, sfx, send = buf(), buf(), buf(), buf()

# ------------------------------------------------------------------ grid & harmony
BEAT = 0.5
GRID0 = T0['aarti'] % BEAT        # a downbeat lands exactly on "Aarti"
def bar_index(t): return int(np.floor((t - T0['aarti']) / 2.0))
# F minor, i  VI  III  VII
CHORDS = [[65, 68, 72], [61, 65, 68], [68, 72, 75], [63, 67, 70]]
ROOTS = [41, 37, 44, 39]
def chord(t): return CHORDS[bar_index(t) % 4]
def root(t): return ROOTS[bar_index(t) % 4]

def section(t):
    if t < T0['aarti']: return 'intro'
    if t < SC['mood']: return 'lift'
    if t < SC['lists']: return 'A'
    if t < SC['themes']: return 'B'
    if t < SC['end']: return 'C'
    return 'outro'

def pad(freqs, dur, bright, amp):
    n = int(dur * SR); t = t_axis(n); out = np.zeros((2, n))
    for f in freqs:
        for ch, det in ((0, -1), (1, 1)):
            for c in (-6, 0, 6):
                out[ch] += blsaw(f * 2 ** ((c + det * 3) / 1200), t, rng.random(), 3500) * (0.7 if c == 0 else 0.5)
    out = np.vstack([lp(out[0], bright), lp(out[1], bright)])
    e = np.minimum(1, t / 0.4) * np.clip((dur - t) / 0.5, 0, 1)
    return out * e * amp / len(freqs)

# pad: from frame 0, one chord per bar; the intro chord already sounding
edges = [0.0] + [T0['aarti'] + 2 * k for k in range(-1, 14) if T0['aarti'] + 2 * k > 0.05]
edges = sorted(set([e for e in edges if e < SC['end'] - 0.1] + [SC['end'] - 0.1]))
for i in range(len(edges) - 1):
    a, b = edges[i], edges[i + 1]; sec = section(a + 0.01)
    bright = {'intro': 900, 'lift': 1300, 'A': 1500, 'B': 2000, 'C': 2400}[sec]
    amp = {'intro': 0.26, 'lift': 0.22, 'A': 0.18, 'B': 0.17, 'C': 0.18}[sec]
    c = chord(a + 0.01) if a >= T0['aarti'] else CHORDS[0]
    v = pad([note_hz(m) for m in c] + [note_hz(c[0] - 12)], b - a + 0.45, bright, amp)
    if a == 0.0: v *= np.linspace(0.55, 1, v.shape[1]) ** 1.3
    place(music, v, a); place(send, v, a, 0.35)
# the end: a warm Ab(add9) that blooms on the logo and settles
endc = [56, 63, 68, 70, 72, 75]
v = pad([note_hz(m) for m in endc], DUR - T0['endAarti'] + 1.5, 1700, 0.2)
v *= (np.exp(-t_axis(v.shape[1]) / 2.6) * 0.7 + 0.3)
place(music, v, T0['endAarti']); place(send, v, T0['endAarti'], 0.5)

# plucks: a restrained motif, 8ths in A, 16ths from the library onward
def pluck(f, amp, bright=5200, dur=0.34):
    n = int(dur * SR); t = t_axis(n)
    x = blsaw(f, t, 0, 7000) * 0.55 + np.sin(2 * np.pi * 2 * f * t) * 0.3
    return tvf(x * np.exp(-t / 0.15), bright, 450) * amp * np.minimum(1, t / 0.002)
ARP = [0, 2, 1, 2, 0, 1, 2, 1]
t = T0['aarti']; i = 0
while t < SC['end'] - 0.3:
    sec = section(t + 1e-3); step = 0.25 if sec in ('lift', 'A') else 0.125
    c = chord(t + 1e-3); m = c[ARP[i % 8]] + 12 + (12 if sec in ('B', 'C') and i % 16 in (5, 13) else 0)
    amp = {'lift': 0.045, 'A': 0.06, 'B': 0.065, 'C': 0.07}[sec]
    p = pluck(note_hz(m), amp); pan = 0.4 * np.sin(i * 0.9)
    place(music, p, t, pan=pan); place(send, p, t, 0.5, pan=-pan)
    t += step; i += 1
# a small tonal motif on the intro question (felt more than heard)
for dt, m in [(0.0, 77), (0.5, 80), (1.0, 84), (1.5, 82)]:
    n = int(1.2 * SR); tt = t_axis(n); x = np.sin(2 * np.pi * note_hz(m) * tt + 1.6 * np.sin(2 * np.pi * note_hz(m) * 2 * tt) * np.exp(-tt / 0.25)) * np.exp(-tt / 0.45) * 0.035
    place(music, x, 0.05 + dt, pan=0.3 * np.sin(dt * 3)); place(send, x, 0.05 + dt, 0.7)

# sub bass
def bass(f, dur, amp=0.3):
    n = int(dur * SR); t = t_axis(n)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.tanh(2.5 * blsaw(f, t, 0, 2500))
    return lp(x, 700) * np.minimum(1, t / 0.005) * np.exp(-t / (dur * 0.9)) * amp
t = T0['aarti']
while t < SC['end'] - 0.3:
    sec = section(t + 1e-3); r = root(t + 1e-3)
    if sec == 'lift': place(music, bass(note_hz(r), 1.8, 0.22), t); t += 2.0; continue
    if sec == 'A': place(music, bass(note_hz(r), 0.22), t + 0.25); t += 0.5; continue
    place(music, bass(note_hz(r + (12 if int(round((t - GRID0) / 0.25)) % 4 == 3 else 0)), 0.2, 0.28), t); t += 0.25

# ------------------------------------------------------------------ drums
def kick(amp):
    n = int(0.42 * SR); t = t_axis(n); f = 46 + 105 * np.exp(-t / 0.032)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2) + 0.05 * noise(n) * np.exp(-t / 0.004)
    return np.tanh(1.3 * x) * amp
def hat(dur=0.03, amp=0.1):
    n = int(max(dur * 6, 0.05) * SR); t = t_axis(n); return hp(noise(n), 8000) * np.exp(-t / dur) * amp
def clap(amp=0.28):
    n = int(0.3 * SR); t = t_axis(n); x = np.zeros(n); nz = noise(n)
    for o in (0, 0.01, 0.021): i = int(o * SR); x[i:] += np.exp(-t[: n - i] / (0.012 if o < 0.02 else 0.08))
    return bp(nz * x, 1000, 3500) * amp
def rim(amp=0.12):
    n = int(0.08 * SR); t = t_axis(n); return (bp(noise(n), 1800, 4500) * np.exp(-t / 0.008) + 0.4 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.012)) * amp
kicks = []
t = T0['aarti']
while t < SC['end'] - 0.26:
    sec = section(t + 1e-3); bn = int(round((t - T0['aarti']) / BEAT))
    if sec == 'lift':
        if bn % 2 == 0: place(drums, kick(0.5), t); kicks.append(t)
    else:
        place(drums, kick(0.46 if sec == 'A' else 0.52), t); kicks.append(t)
        if sec in ('B', 'C') and bn % 2 == 1: c = clap(); place(drums, c, t); place(send, c, t, 0.3)
        if sec == 'A' and bn % 4 == 3: place(drums, rim(), t + 0.25, pan=-0.3)
        sub = 2 if sec == 'A' else 4
        for k in range(sub):
            if sec == 'A' and k == 0: continue
            place(drums, hat(0.028, 0.09 if k % 2 else 0.11), t + k * BEAT / sub, pan=0.25 if k % 2 else -0.2)
        if sec in ('B', 'C') and bn % 4 == 2: place(drums, hat(0.15, 0.06), t + 0.25, pan=0.35)
    t += BEAT

# ------------------------------------------------------------------ sound design
def whoosh(d=0.5, f0=250, f1=5000, amp=0.22, pan_sweep=0.7):
    n = int(d * SR * 1.3); t = t_axis(n); x = sweep_bp(noise(n), f0, f1, 1.4)
    x = x * np.sin(np.pi * np.clip(t / (d * 1.3), 0, 1)) ** 1.6 / (np.abs(x).max() + 1e-9) * amp
    p = np.linspace(-pan_sweep, pan_sweep, n); return np.vstack([x * np.sqrt(1 - p), x * np.sqrt(1 + p)])
def riser(d, amp=0.16):
    n = int(d * SR); t = t_axis(n); x = sweep_bp(noise(n), 500, 9000, 2.0); x /= np.abs(x).max() + 1e-9
    tone = np.sin(2 * np.pi * np.cumsum(220 * 5 ** (t / d)) / SR) * 0.3
    return (x * 0.7 + tone) * (t / d) ** 2.4 * amp
def reverse(d, amp=0.18):
    n = int(d * SR); t = t_axis(n); x = lp(noise(n), 3000) * (t / d) ** 3
    c = chord(T0['aarti'] + 0.1); tone = sum(np.sin(2 * np.pi * note_hz(m + 12) * t) for m in c) / 3 * (t / d) ** 2.5 * 0.5
    return (x * 0.5 + tone) * amp
def impact(amp, big):
    n = int((1.9 if big else 0.8) * SR); t = t_axis(n); f = 36 + 62 * np.exp(-t / 0.07)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.95 if big else 0.32))
    return np.tanh(1.2 * (sub + lp(noise(n), 2200) * np.exp(-t / 0.07) * 0.45)) * amp
def pop(f0=950, f1=520, amp=0.12, d=0.06):
    n = int(d * 2.5 * SR); t = t_axis(n); f = f1 + (f0 - f1) * np.exp(-t / 0.015)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d * 2.5) * amp
def tap(amp=0.15):
    n = int(0.05 * SR); t = t_axis(n); return (hp(noise(n), 3000) * np.exp(-t / 0.004) * 0.6 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.01) * 0.5) * amp
def key(amp=0.075):
    n = int(0.04 * SR); t = t_axis(n); fc = 2600 + 1400 * rng.random(); return bp(noise(n), fc * 0.7, fc * 1.3) * np.exp(-t / 0.006) * amp
PENTA = [77, 80, 82, 84, 87, 89, 92, 94]
def blip(n_, amp=0.075):
    f = note_hz(PENTA[n_ % len(PENTA)]); n = int(0.25 * SR); t = t_axis(n)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.07) * amp * np.minimum(1, t / 0.002)
def bell(f, amp, d=1.2):
    n = int(d * SR); t = t_axis(n); return np.sin(2 * np.pi * f * t + 2.2 * np.sin(2 * np.pi * f * 3.5 * t) * np.exp(-t / 0.3)) * np.exp(-t / (d * 0.35)) * amp * np.minimum(1, t / 0.002)
def shimmer(amp=0.04, d=1.3):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(16):
        f = rng.uniform(3000, 8500); o = int(rng.uniform(0, d * 0.5) * SR); t = t_axis(n - o)
        x[o:] += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.16) * rng.uniform(0.4, 1)
    return x * amp / 4
def tick(amp=0.05):
    n = int(0.03 * SR); t = t_axis(n); return (np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.006) + 0.3 * hp(noise(n), 5000) * np.exp(-t / 0.003)) * amp
def select(d, amp=0.05):
    n = int(d * SR); t = t_axis(n); f = 600 * (2.2 ** (t / d)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * amp
def line(d, amp=0.06):
    n = int(d * SR); t = t_axis(n); f = 900 * (2.0 ** (t / d))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + bp(noise(n), 2000, 7000) * 0.3) * np.sin(np.pi * t / d) ** 1.5 * amp
def digital(n_, amp=0.045):
    f = note_hz(PENTA[n_ % len(PENTA)] - 12); n = int(0.2 * SR); t = t_axis(n)
    x = np.round((np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(4 * np.pi * f * t)) * 6) / 6
    return lp(x, 6000) * np.exp(-t / 0.05) * amp

impacts, dips = [], []
for c in TL['cues']:
    t, k = c['t'], c['k']; d = c.get('d', 0.5)
    if k == 'tick': place(sfx, tick(), t, pan=0.2 * np.sin(c.get('n', 0)))
    elif k == 'pop': x = pop(); place(sfx, x, t); place(send, x, t, 0.3)
    elif k == 'reverse': x = reverse(d); place(sfx, x, t); place(send, x, t, 0.4)
    elif k == 'riser': place(sfx, riser(d, 0.1), t)
    elif k == 'impact_big': x = impact(0.3, True); place(sfx, x, t); place(send, x, t, 0.2); place(sfx, whoosh(0.3, 7000, 900, 0.08), t - 0.02); impacts.append((t, 0.6))
    elif k == 'impact': place(sfx, impact(0.32, False), t); impacts.append((t, 0.35))
    elif k == 'shimmer': x = shimmer(0.03); place(sfx, x, t, pan=-0.2); place(send, x, t, 0.6)
    elif k == 'whoosh': x = whoosh(d, 220, 5000, 0.2); place(sfx, x, t); place(send, x, t, 0.15)
    elif k == 'whip': place(sfx, whoosh(d, 900, 9000, 0.22, 0.9), t)
    elif k == 'swoosh': place(sfx, whoosh(d, 500, 3800, 0.11), t)
    elif k == 'blip': x = blip(c.get('n', 0)); place(sfx, x, t, pan=0.25); place(send, x, t, 0.4)
    elif k == 'tap': place(sfx, tap(), t)
    elif k == 'key': place(sfx, key(0.045 if c.get('soft') else 0.075), t, pan=rng.uniform(-0.2, 0.2))
    elif k == 'select': place(sfx, select(d), t)
    elif k == 'heart': x = bell(note_hz(PENTA[(c.get('n', 0) + 2) % 8]), 0.05, 0.8); place(sfx, x, t, pan=-0.2); place(send, x, t, 0.5)
    elif k == 'line': place(sfx, line(d), t)
    elif k == 'chime':
        x = bell(note_hz(84), 0.07, 1.0); place(sfx, x, t); place(send, x, t, 0.5)
        x = bell(note_hz(89), 0.05, 1.0); place(sfx, x, t + 0.09); place(send, x, t + 0.09, 0.5)
    elif k == 'digital': x = digital(c.get('n', 0)); place(sfx, x, t, pan=0.3 * np.sin(c.get('n', 0))); place(send, x, t, 0.3)
    elif k == 'dip': dips.append((t, d))
# end bell motif
for dt, m in [(0.25, 80), (0.8, 77), (1.45, 75), (2.0, 72)]:
    x = bell(note_hz(m), 0.03, 1.6); place(music, x, T0['endAarti'] + dt); place(send, x, T0['endAarti'] + dt, 0.6)

# ------------------------------------------------------------------ narration
vo, vsr = sf.read(VOF); assert vsr == SR
vo = vo if vo.ndim == 1 else vo.mean(1)
vo = hp(vo, 85, 2); vo = peak_eq(vo, 3200, 2.5, 0.9); vo = peak_eq(vo, 250, -1.5, 1.0)
# gentle RMS compression (about 3:1 above threshold), transparent make-up
env = np.sqrt(uniform_filter1d(vo ** 2, int(0.03 * SR)) + 1e-12); thr = 10 ** (-24 / 20)
g = np.where(env > thr, (env / thr) ** (1 / 3 - 1), 1.0); g = uniform_filter1d(g, int(0.01 * SR)); vo = vo * g
vo_bus = np.zeros((2, music.shape[1])); vo_bus[:, : len(vo)] = vo
place(send, vo_bus[:, :N] * 0.12, 0)

# ------------------------------------------------------------------ ducking & automation
tt = t_axis(music.shape[1])
v_env = np.sqrt(uniform_filter1d(vo_bus[0] ** 2, int(0.05 * SR)) + 1e-12)
active = (v_env > 10 ** (-40 / 20)).astype(float)
# fast attack, slow release, so words are cleared and gaps breathe back up
att, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR)); d_env = np.zeros_like(active); z = 0.0
for i in range(len(active)):
    a = att if active[i] > z else rel; z = a * z + (1 - a) * active[i]; d_env[i] = z
duck = 1 - 0.8 * d_env            # about -12 dB under the voice
for k0 in kicks:
    i = int(k0 * SR); duck[i:] *= 1 - 0.1 * np.exp(-tt[: len(duck) - i] / 0.1)
for t0, dp in impacts:
    i = int(t0 * SR); duck[i:] *= 1 - dp * 0.6 * np.exp(-tt[: len(duck) - i] / 0.3)
auto = np.ones_like(duck)
for t0, d in dips:  # a held breath before the final reveal
    i0, i1, i2 = int(t0 * SR), int((t0 + d) * SR), int((t0 + d + 0.05) * SR)
    auto[i0:i1] = np.linspace(1, 0.22, i1 - i0); auto[i1:i2] = np.linspace(0.22, 1, i2 - i1)
music *= duck * auto; drums *= (0.55 + 0.45 * duck) * auto; send *= 0.7 + 0.3 * duck

def ir(sec=1.8):
    n = int(sec * SR); t = t_axis(n); e = np.exp(-t / (sec / 6.9)); return np.vstack([lp(noise(n), 6500) * e, lp(noise(n), 6500) * e]) * 0.03
IR = ir(); wet = np.vstack([hp(signal.fftconvolve(send[c], IR[c])[: send.shape[1]], 220) for c in (0, 1)])

bed = music * 1.1 + drums * 0.5 + wet * 0.55
# clear the speech band in the bed while she talks (a dynamic EQ, not just a fader)
def band(x, lo, hi): return np.vstack([bp(x[0], lo, hi), bp(x[1], lo, hi)])
bed_mid = band(bed, 700, 5000); bed = bed - bed_mid + bed_mid * (1 - 0.6 * d_env)
fx_mid = band(sfx, 700, 5000); fx = (sfx - fx_mid + fx_mid * (1 - 0.45 * d_env)) * 0.8
voice = vo_bus * 2.7
mixb = bed + fx + voice
mixb = np.vstack([hp(mixb[0], 28), hp(mixb[1], 28)])[:, :N]
tf = T0['fade']; fade = np.clip(1 - (t_axis(N) - tf) / (DUR - tf), 0, 1) ** 1.4
mixb *= fade; mixb[:, : int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))

# ------------------------------------------------------------------ master
def k_weight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x))
def lufs(x):
    y = np.vstack([k_weight(x[0]), k_weight(x[1])]); blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, y.shape[1] - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]; rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
def true_peak(x): return np.abs(signal.resample_poly(x, 4, 1, axis=1)).max()
def limiter(x, ceiling_db=-1.6, look=0.005, rel=0.09):
    c = 10 ** (ceiling_db / 20); up = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    L = int(look * SR); pk = maximum_filter1d(pk, 2 * L + 1); g = np.minimum(1, c / np.maximum(pk, 1e-9))
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); z = 1.0
    for i in range(len(g)): z = g[i] if g[i] < z else a * z + (1 - a) * g[i]; out[i] = z
    return x * np.convolve(out, np.ones(L) / L, mode='same')
y = mixb.copy()
for _ in range(5):
    y *= 10 ** ((-14.0 - lufs(y)) / 20); y = limiter(y)
tp = 20 * np.log10(true_peak(y)); print(f'LUFS {lufs(y):.2f}  true peak {tp:.2f} dBTP')
assert tp < -1.0
sf.write(OUTF, y.T, SR, subtype='PCM_24')
if STEMS:
    g = 10 ** ((-14.0 - lufs(mixb)) / 20)
    for nm, b in (('music_bed', bed), ('sfx', fx), ('voice', voice)): sf.write(f'{STEMS}/{nm}.wav', (b[:, :N] * g).T, SR, subtype='PCM_24')
