"""Original soundtrack + sound design for the AartiMusic promo.

Everything is synthesized here (no samples, no third-party music). Timing
comes from timeline.json, which the picture renderer writes from the same
constants it animates with, so every whoosh, tap and impact lands on its frame.
"""
import json, sys
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d

SR = 48000
TL = json.load(open('timeline.json'))
DUR = TL['duration']
N = int(round(DUR * SR)) + SR // 2
SC = TL['scenes']
rng = np.random.default_rng(11)
BEAT = 0.5          # 120 BPM
GRID0 = 0.25        # scene starts sit on this beat grid

def t_axis(n): return np.arange(n) / SR
def buf(): return np.zeros((2, N))
def note_hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N: return
    if x.ndim == 1:
        l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        x = np.vstack([x * l, x * r]) * np.sqrt(2)
    j = min(N, i + x.shape[1]); s = max(0, -i)
    bus[:, max(i, 0):j] += gain * x[:, s:j - i]
def lp(x, f, order=2): b, a = signal.butter(order, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, order=2): b, a = signal.butter(order, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi, order=2): b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def env_ad(n, a, d):
    t = t_axis(n); e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) / d)); return e
def saw(ph): return 2 * (ph % 1.0) - 1
def blsaw(f, t, phase=0.0, fmax=9000):
    """Band-limited sawtooth (additive), so bright voices don't alias."""
    out = np.zeros_like(t)
    for k in range(1, max(2, int(fmax / f)) + 1):
        out += np.sin(2 * np.pi * k * (f * t + phase)) / k
    return -2 / np.pi * out
def tvf(x, f_start, f_end):
    """Time-varying one-pole lowpass, exponential cutoff sweep."""
    n = len(x); f = f_start * (f_end / f_start) ** (np.arange(n) / max(n - 1, 1))
    a = np.exp(-2 * np.pi * f / SR); y = np.zeros(n); z = 0.0
    for i in range(n):
        z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y
def sweep_bp(x, f0, f1, q=1.2):
    """Band-pass noise sweep via block processing (cheap and smooth enough)."""
    n = len(x); out = np.zeros(n); blk = 512
    zi = None
    for s in range(0, n, blk):
        fc = f0 * (f1 / f0) ** (s / max(n - 1, 1)); lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 * 0.95)
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
        if zi is None: zi = signal.lfilter_zi(b, a) * 0
        out[s:s + blk], zi = signal.lfilter(b, a, x[s:s + blk], zi=zi)
    return out

music, drums, sfx, verb_send = buf(), buf(), buf(), buf()

# ------------------------------------------------------------------ harmony
# D major, vi IV I V: Bm  G  D  A, one chord per bar (2 s)
CHORDS = [[59, 62, 66], [55, 59, 62], [62, 66, 69], [57, 61, 64]]
ROOTS = [47, 43, 50, 45]
def chord_at(t): return int(((t - GRID0) // 2) % 4) if t >= GRID0 else 0

def section(t):
    if t < SC['discover']: return 'intro'
    if t < SC['player']: return 'A'
    if t < SC['themes']: return 'B'
    if t < SC['hero']: return 'C'
    return 'outro'

# ---- pad (whole piece, swelling in; bigger in the outro)
def pad_voice(freqs, dur, bright=1400, amp=0.12):
    n = int(dur * SR); t = t_axis(n); out = np.zeros((2, n))
    for f in freqs:
        for ch, det in ((0, -1), (1, 1)):
            for k, c in enumerate((-7, 0, 7)):
                ff = f * 2 ** ((c + det * 3) / 1200)
                out[ch] += blsaw(ff, t, rng.random(), 4000) * (0.5 if k != 1 else 0.7)
    out = np.vstack([lp(out[0], bright), lp(out[1], bright)])
    e = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.4).clip(0, 1)
    return out * e * amp / len(freqs)

bar_starts = [0.0] + [GRID0 + 2 * k for k in range(13)]
for i, b0 in enumerate(bar_starts):
    b1 = min(bar_starts[i + 1] if i + 1 < len(bar_starts) else DUR + 0.4, DUR + 0.4)
    if b0 >= DUR: break
    c = CHORDS[chord_at(b0 + 0.01)]
    sec = section(b0 + 0.01)
    if sec == 'outro':
        continue
    bright = {'intro': 1100, 'A': 1500, 'B': 2200, 'C': 2600}[sec]
    amp = {'intro': 0.22, 'A': 0.15, 'B': 0.14, 'C': 0.15}[sec]
    v = pad_voice([note_hz(m) for m in c] + [note_hz(c[0] - 12)], b1 - b0 + 0.35, bright, amp)
    if b0 == 0.0:  # opening swell, already audible on frame 0
        v *= np.linspace(0.6, 1, v.shape[1]) ** 1.5
    place(music, v, b0); place(verb_send, v, b0, 0.35)
# outro: one wide D(add9) chord, blooming then settling
out_ch = [50, 57, 62, 64, 66, 69, 74]
v = pad_voice([note_hz(m) for m in out_ch], DUR - SC['hero'] + 0.4, 1800, 0.2)
v *= np.exp(-t_axis(v.shape[1]) / 2.2) * 0.75 + 0.25
place(music, v, SC['hero']); place(verb_send, v, SC['hero'], 0.5)

# ---- plucks: arpeggio motif, 8ths in A, 16ths in B/C
def pluck(f, dur=0.35, amp=0.09, bright=5000):
    n = int(dur * SR); t = t_axis(n)
    x = blsaw(f, t, 0, 7000) * 0.6 + np.sin(2 * np.pi * 2 * f * t) * 0.3
    x = tvf(x * np.exp(-t / 0.16), bright, 500)
    return x * amp * np.minimum(1, t / 0.002)
ARP = [0, 1, 2, 1, 2, 0, 1, 2]
t = GRID0
step_i = 0
while t < SC['hero'] - 0.01:
    sec = section(t + 1e-3)
    step = 0.25 if sec == 'A' or sec == 'intro' else 0.125
    if sec == 'intro' and t < TL['times']['logo']:
        step = 0.25
    c = CHORDS[chord_at(t + 1e-3)]
    m = c[ARP[step_i % 8]] + 12 + (12 if (sec in 'BC' and step_i % 16 in (6, 14)) else 0)
    amp = {'intro': 0.06, 'A': 0.085, 'B': 0.09, 'C': 0.095}[sec]
    p = pluck(note_hz(m), amp=amp, bright=3000 if sec == 'intro' else 5200)
    pan = 0.35 * np.sin(step_i * 0.9)
    place(music, p, t, pan=pan); place(verb_send, p, t, 0.5, pan=-pan)
    t += step; step_i += 1

# ---- bass: offbeat 8ths in A, driving 8ths in B/C
def bass_note(f, dur, amp=0.32):
    n = int(dur * SR); t = t_axis(n)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.tanh(3 * blsaw(f, t, 0, 3000))
    x = lp(x, 900) * np.minimum(1, t / 0.004) * np.exp(-t / (dur * 0.9))
    return x * amp
t = SC['discover']
while t < SC['hero'] - 0.01:
    sec = section(t + 1e-3); r = ROOTS[chord_at(t + 1e-3)]
    if sec == 'A':
        place(music, bass_note(note_hz(r), 0.22), t + 0.25)
        t += 0.5
    else:
        if not (sec == 'C' and t >= SC['hero'] - 1.0):
            oct_ = 12 if int(round((t - GRID0) / 0.25)) % 4 == 3 else 0
            place(music, bass_note(note_hz(r + oct_), 0.2, 0.3), t)
        t += 0.25

# ------------------------------------------------------------------ drums
def kick(amp=0.9):
    n = int(0.45 * SR); t = t_axis(n)
    f = 45 + 110 * np.exp(-t / 0.035); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.22) + 0.25 * np.exp(-t / 0.004) * rng.standard_normal(n) * 0.3
    return np.tanh(1.4 * x) * amp
def hat(dur=0.035, amp=0.12):
    n = int(max(dur * 6, 0.05) * SR); t = t_axis(n)
    return hp(rng.standard_normal(n), 7500) * np.exp(-t / dur) * amp
def clap(amp=0.35):
    n = int(0.3 * SR); t = t_axis(n); x = np.zeros(n); nz = rng.standard_normal(n)
    for o in (0, 0.011, 0.022):
        i = int(o * SR); x[i:] += np.exp(-t[:n - i] / (0.012 if o < 0.02 else 0.09))
    return bp(nz * x, 900, 3200) * amp
kicks = []
t = SC['discover']
while t < SC['hero'] - 1e-3:
    sec = section(t + 1e-3)
    if not (sec == 'C' and t >= SC['hero'] - 1.0):   # drop the last bar before the hero for the build
        place(drums, kick(0.5 if sec == 'A' else 0.58), t); kicks.append(t)
    beat_n = int(round((t - GRID0) / 0.5))
    if sec in ('B', 'C') and beat_n % 2 == 1 and t < SC['hero'] - 1.0:
        c = clap(); place(drums, c, t, pan=0.05); place(verb_send, c, t, 0.35)
    # hats
    sub = 2 if sec == 'A' else 4
    for k in range(sub):
        th = t + k * 0.5 / sub
        if sec == 'A' and k == 0: continue
        amp = 0.09 if (sub == 4 and k % 2 == 1) else 0.12
        if sec == 'A': amp = 0.1
        place(drums, hat(0.03, amp), th, pan=0.25 if k % 2 else -0.15)
    if sec in ('B', 'C') and beat_n % 4 == 3:
        place(drums, hat(0.16, 0.07), t + 0.25, pan=0.3)
    t += 0.5

# ------------------------------------------------------------------ sfx
def noise(n): return rng.standard_normal(n)
def whoosh(d=0.5, f0=300, f1=5000, amp=0.28):
    n = int(d * SR * 1.3); t = t_axis(n); x = sweep_bp(noise(n), f0, f1, 1.4)
    e = np.sin(np.pi * np.clip(t / (d * 1.3), 0, 1)) ** 1.6
    x = x * e / (np.abs(x).max() + 1e-9) * amp
    pan = np.linspace(-0.6, 0.6, n)
    return np.vstack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)]) * np.sqrt(2)
def riser(d, amp=0.2):
    n = int(d * SR); t = t_axis(n); x = sweep_bp(noise(n), 400, 9000, 2.0)
    x = x / (np.abs(x).max() + 1e-9)
    f = 180 * (6.5 ** (t / d)); tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    return (x * 0.65 + tone) * (t / d) ** 2.2 * amp
def impact(amp=0.8, big=True):
    n = int((1.8 if big else 0.8) * SR); t = t_axis(n)
    f = 38 + 70 * np.exp(-t / 0.06); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.9 if big else 0.35))
    nz = lp(noise(n), 2500) * np.exp(-t / 0.08) * 0.5
    return np.tanh(1.3 * (sub + nz)) * amp
def pop(f0=900, f1=520, amp=0.16, d=0.07):
    n = int(d * 2 * SR); t = t_axis(n); f = f1 + (f0 - f1) * np.exp(-t / 0.015)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d * 2.5) * amp
def tap(amp=0.2):
    n = int(0.05 * SR); t = t_axis(n)
    return (hp(noise(n), 3000) * np.exp(-t / 0.004) * 0.6 + np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.01) * 0.5) * amp
def key(amp=0.1):
    n = int(0.04 * SR); t = t_axis(n); fc = 2500 + 1500 * rng.random()
    return bp(noise(n), fc * 0.7, fc * 1.3) * np.exp(-t / 0.006) * amp
PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93]
def blip(n_, amp=0.1):
    f = note_hz(PENTA[n_ % len(PENTA)]); n = int(0.25 * SR); t = t_axis(n)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.07) * amp * np.minimum(1, t / 0.002)
def bell(f, amp=0.12, d=1.2):
    n = int(d * SR); t = t_axis(n)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t / 0.3)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / (d * 0.35)) * amp * np.minimum(1, t / 0.002)
def chime(amp=0.1):
    n = int(1.0 * SR); x = np.zeros(n); x += bell(note_hz(86), amp, 1.0)[:n]
    o = int(0.09 * SR); x[o:] += bell(note_hz(93), amp * 0.8, 1.0)[: n - o]
    return x
def shimmer(amp=0.05, d=1.2):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(14):
        f = rng.uniform(3000, 8000); o = int(rng.uniform(0, d * 0.5) * SR); t = t_axis(n - o)
        x[o:] += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.15) * rng.uniform(0.4, 1)
    return x * amp / 4
def lift(amp=0.12):
    return whoosh(0.4, 600, 3500, amp)
def settle(amp=0.2):
    n = int(0.25 * SR); t = t_axis(n); return np.sin(2 * np.pi * (90 + 40 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.07) * amp
def digital(n_, amp=0.1):
    f = note_hz(PENTA[n_ % len(PENTA)] - 12); n = int(0.22 * SR); t = t_axis(n)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * 2 * f * t)
    x = np.round(x * 6) / 6  # a little bit-crush grit
    return lp(x, 6000) * np.exp(-t / 0.06) * amp

impacts = []
for c in TL['cues']:
    t, k = c['t'], c['k']
    if k == 'riser': place(sfx, riser(c['d'], 0.2), t)
    elif k == 'impact_big':
        x = impact(0.55, True); place(sfx, x, t); place(verb_send, x, t, 0.25)
        place(sfx, whoosh(0.35, 6000, 800, 0.12), t - 0.02); impacts.append((t, 0.75))
    elif k == 'impact': place(sfx, impact(0.55, False), t); impacts.append((t, 0.5))
    elif k == 'whoosh': x = whoosh(c.get('d', 0.5), 250, 5500, 0.26); place(sfx, x, t); place(verb_send, x, t, 0.2)
    elif k == 'swoosh': place(sfx, whoosh(c.get('d', 0.5), 500, 4000, 0.14), t)
    elif k == 'swell_whoosh':
        place(sfx, whoosh(c.get('d', 0.6), 200, 3000, 0.22), t); place(sfx, riser(0.45, 0.08), t)
    elif k == 'pop': x = pop(); place(sfx, x, t); place(verb_send, x, t, 0.3)
    elif k == 'tap': place(sfx, tap(), t)
    elif k == 'key': place(sfx, key(), t, pan=rng.uniform(-0.2, 0.2))
    elif k == 'blip': x = blip(c.get('n', 0)); place(sfx, x, t, pan=0.2); place(verb_send, x, t, 0.4)
    elif k == 'chime': x = chime(); place(sfx, x, t); place(verb_send, x, t, 0.5)
    elif k == 'shimmer': x = shimmer(); place(sfx, x, t, pan=-0.2); place(verb_send, x, t, 0.6)
    elif k == 'lift': place(sfx, lift(), t)
    elif k == 'settle': place(sfx, settle(), t)
    elif k == 'digital': x = digital(c.get('n', 0)); place(sfx, x, t, pan=0.3 * np.sin(c.get('n', 0))); place(verb_send, x, t, 0.35)

# hero bell motif over the final chord
for i, (dt, m) in enumerate([(0.2, 81), (0.7, 78), (1.3, 74), (1.8, 76), (2.3, 74)]):
    x = bell(note_hz(m), 0.07, 1.4); place(music, x, SC['hero'] + dt + (0 if i < 2 else 0.05)); place(verb_send, x, SC['hero'] + dt, 0.6)

# ------------------------------------------------------------------ sidechain
tt = t_axis(N); duck = np.ones(N)
for k in kicks:
    i = int(k * SR); d = 0.22 * np.exp(-tt[: N - i] / 0.12); duck[i:] *= 1 - d
for t0, depth in impacts:
    i = int(t0 * SR); d = depth * np.exp(-tt[: N - i] / 0.35); duck[i:] *= 1 - d
music *= duck; verb_send *= (0.5 + 0.5 * duck)

# ------------------------------------------------------------------ reverb
def ir(sec=1.9):
    n = int(sec * SR); t = t_axis(n)
    e = np.exp(-t / (sec / 6.9))
    return np.vstack([lp(noise(n), 6000) * e, lp(noise(n), 6000) * e]) * 0.03
IR = ir()
wet = np.vstack([signal.fftconvolve(verb_send[c], IR[c])[:N] for c in (0, 1)])
wet = np.vstack([hp(wet[0], 200), hp(wet[1], 200)])

mixb = music * 1.25 + drums * 0.42 + sfx * 0.9 + wet * 0.6
mixb = np.vstack([hp(mixb[0], 28), hp(mixb[1], 28)])
# gentle low-mid clean-up and air
mixb = mixb[:, : int(round(DUR * SR))]
# final settle: fade the last moments to silence, matching the picture
n = mixb.shape[1]; tf = TL['times']['fade']
fade = np.clip(1 - (t_axis(n) - tf) / (DUR - tf), 0, 1) ** 1.5
mixb *= fade
mixb[:, : int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))

# ------------------------------------------------------------------ mastering
def k_weight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x))
def lufs(x):
    y = np.vstack([k_weight(x[0]), k_weight(x[1])]); blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, y.shape[1] - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return -0.691 + 10 * np.log10(z.mean())
def limiter(x, ceiling_db=-1.2, look=0.004, rel=0.08):
    c = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=1)          # true-peak-ish detection
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    L = int(look * SR); pk = maximum_filter1d(pk, 2 * L + 1)
    g = np.minimum(1, c / np.maximum(pk, 1e-9))
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); z = 1.0
    for i in range(len(g)):
        z = g[i] if g[i] < z else a * z + (1 - a) * g[i]; out[i] = z
    out = np.convolve(out, np.ones(L) / L, mode='same')
    return x * out
def soft(x, drive=1.0): return np.tanh(x * drive) / drive

target = -14.0
y = mixb.copy()
for _ in range(4):
    y *= 10 ** ((target - lufs(y)) / 20)
    y = limiter(soft(y, 0.9))
y *= 10 ** ((target - lufs(y)) / 20)
assert np.abs(y).max() < 0.95
print('integrated LUFS (internal):', round(lufs(y), 2), 'peak dBFS:', round(20 * np.log10(np.abs(y).max()), 2))
pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').T.copy()
import wave
w = wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
