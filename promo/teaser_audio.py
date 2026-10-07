"""Sound for the teaser: an ambient bed and one designed sound per beat, from the picture's cue list.
usage: python3 teaser_audio.py timeline_teaser.json out.wav"""
import json, sys
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d
import soundfile as sf
SR = 48000
TL = json.load(open(sys.argv[1])); DUR = TL['duration']; T = TL['times']; N = int(round(DUR * SR))
rng = np.random.default_rng(3)
def ta(n): return np.arange(n) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
bus, send = np.zeros((2, N + SR * 3)), np.zeros((2, N + SR * 3))
def place(b, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if x.ndim == 1: x = np.vstack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)])
    j = min(b.shape[1], i + x.shape[1]); b[:, i:j] += g * x[:, : j - i]
def lp(x, f): b, a = signal.butter(2, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f): b, a = signal.butter(2, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi): b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def noise(n): return rng.standard_normal(n)
def sweep(x, f0, f1, q=1.4):
    n = len(x); out = np.zeros(n); zi = None
    for s in range(0, n, 512):
        fc = f0 * (f1 / f0) ** (s / max(n - 1, 1)); lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 * 0.95)
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
        if zi is None: zi = signal.lfilter_zi(b, a) * 0
        out[s:s + 512], zi = signal.lfilter(b, a, x[s:s + 512], zi=zi)
    return out
def whoosh(d, f0, f1, amp, pan=0.6):
    n = int(d * SR * 1.2); t = ta(n); x = sweep(noise(n), f0, f1); x = x * np.sin(np.pi * np.clip(t / (d * 1.2), 0, 1)) ** 1.5 / (np.abs(x).max() + 1e-9) * amp
    p = np.linspace(-pan, pan, n); return np.vstack([x * np.sqrt(1 - p), x * np.sqrt(1 + p)])
def glass(f, amp, d=1.4):
    n = int(d * SR); t = ta(n)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t / 0.4) + 0.2 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t / 0.15)) * np.exp(-t / (d * 0.4)) * amp * np.minimum(1, t / 0.003)
def sub(amp, d=1.4):
    n = int(d * SR); t = ta(n); f = 34 + 60 * np.exp(-t / 0.07)
    return np.tanh(1.2 * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * 0.5)) + lp(noise(n), 2000) * np.exp(-t / 0.05) * 0.35)) * amp
def key(amp=0.1): n = int(0.04 * SR); t = ta(n); fc = 2600 + 1600 * rng.random(); return bp(noise(n), fc * 0.7, fc * 1.3) * np.exp(-t / 0.006) * amp
def click(amp=0.12): n = int(0.04 * SR); t = ta(n); return (hp(noise(n), 3500) * np.exp(-t / 0.003) * 0.5 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.008) * 0.5) * amp
def riser(d, amp):
    n = int(d * SR); t = ta(n); x = sweep(noise(n), 500, 11000, 2.0); x /= np.abs(x).max() + 1e-9
    return (x * 0.6 + np.sin(2 * np.pi * np.cumsum(300 * 5 ** (t / d)) / SR) * 0.3) * (t / d) ** 2.5 * amp
def shimmer(amp, d=1.2):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(14):
        f = rng.uniform(3500, 9000); o = int(rng.uniform(0, d * 0.4) * SR); t = ta(n - o); x[o:] += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.15) * rng.uniform(0.4, 1)
    return x * amp / 4
def blsaw(f, t):
    o = np.zeros_like(t)
    for k in range(1, int(3200 / f) + 1): o += np.sin(2 * np.pi * k * f * t) / k
    return o * 2 / np.pi

# ambient bed: an Em9 drone that opens up after the bloom, settles on the logo
def pad(notes, a, b, amp, bright):
    n = int((b - a + 0.8) * SR); t = ta(n); x = np.zeros((2, n))
    for m in notes:
        for ch, det in ((0, -4), (1, 4)):
            for c in (-5, 0, 5): x[ch] += blsaw(hz(m) * 2 ** ((c + det) / 1200), t) * (0.7 if c == 0 else 0.5)
    x = np.vstack([lp(x[0], bright), lp(x[1], bright)]) * np.minimum(1, t / 0.8) * np.clip((b - a + 0.8 - t) / 0.8, 0, 1) * amp / len(notes)
    place(bus, x, a); place(send, x, a, 0.4)
pad([40, 52, 59, 62, 66], 0.0, T['bloom'], 0.26, 1100)
pad([36, 48, 55, 59, 64], T['bloom'], T['words'][0], 0.2, 1700)
pad([43, 55, 59, 62, 69], T['words'][0], T['end'], 0.2, 1500)
pad([40, 52, 59, 64, 66, 71], T['end'], DUR + 0.6, 0.2, 1400)
# a soft pulse once the results arrive, and under the three words
for k in np.arange(T['results'], T['wave'], 0.5):
    n = int(0.4 * SR); t = ta(n); f = 46 + 90 * np.exp(-t / 0.03); place(bus, np.tanh(1.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)) * 0.3, k)
for i, k in enumerate(np.arange(T['results'], T['wave'], 0.25)):
    n = int(0.06 * SR); t = ta(n); place(bus, hp(noise(n), 8500) * np.exp(-t / 0.02) * 0.05, k + 0.125, pan=0.3 if i % 2 else -0.3)
PENT = [76, 79, 81, 83, 86, 88]
for c in TL['cues']:
    t, k, d = c['t'], c['k'], c.get('d', 0.5)
    if k == 'comet': place(bus, whoosh(d + 0.1, 400, 9000, 0.22, 0.9), t)
    elif k == 'land': x = glass(hz(71), 0.08, 2.0); place(bus, x, t); place(send, x, t, 0.6); place(bus, sub(0.34), t)
    elif k == 'shimmer': x = shimmer(0.04); place(bus, x, t); place(send, x, t, 0.6)
    elif k == 'type': place(bus, key(0.035 if c.get('soft') else 0.06), t, pan=rng.uniform(-0.2, 0.2))
    elif k == 'swoosh': place(bus, whoosh(d, 300, 5000, 0.14), t)
    elif k == 'word': x = glass(hz(83), 0.025, 0.6); place(bus, x, t); place(send, x, t, 0.5)
    elif k == 'rise': place(bus, whoosh(d, 200, 2500, 0.1, 0.2), t)
    elif k == 'sweep': place(bus, whoosh(d, 3000, 7000, 0.05, 0.9), t)
    elif k == 'key': place(bus, key(), t, pan=rng.uniform(-0.15, 0.15))
    elif k == 'move': place(bus, whoosh(d, 600, 3000, 0.06, 0.4), t)
    elif k == 'click': place(bus, click(), t)
    elif k == 'riser': place(bus, riser(d, 0.12), t)
    elif k == 'bloom': place(bus, sub(0.4, 2.0), t); x = glass(hz(64), 0.07, 2.4) + glass(hz(71), 0.05, 2.4); place(bus, x, t); place(send, x, t, 0.7); x = shimmer(0.06, 1.6); place(bus, x, t); place(send, x, t, 0.6); place(bus, whoosh(0.8, 8000, 600, 0.16, 0.0), t)
    elif k == 'row': x = glass(hz(PENT[c.get('n', 0) % 6]), 0.035, 0.7); place(bus, x, t, pan=0.2); place(send, x, t, 0.5)
    elif k == 'whoosh': place(bus, whoosh(d, 4000, 300, 0.14), t)
    elif k == 'wave': x = glass(hz(59), 0.04, 1.2); place(bus, x, t); place(send, x, t, 0.6)
    elif k == 'beat': place(bus, sub(0.3, 1.0), t); x = glass(hz([71, 74, 76][c.get('n', 0)]), 0.06, 1.4); place(bus, x, t); place(send, x, t, 0.6)
    elif k == 'collapse': place(bus, whoosh(d, 6000, 500, 0.1, 0.0), t)
    elif k == 'end_chime':
        place(bus, sub(0.35, 1.6), t)
        for j, m in enumerate([76, 83, 88]): x = glass(hz(m), 0.05, 2.2); place(bus, x, t + j * 0.09); place(send, x, t + j * 0.09, 0.7)
def ir(sec=2.2):
    n = int(sec * SR); t = ta(n); e = np.exp(-t / (sec / 6.9)); return np.vstack([lp(noise(n), 7000) * e, lp(noise(n), 7000) * e]) * 0.03
IR = ir(); wet = np.vstack([hp(signal.fftconvolve(send[c], IR[c])[: send.shape[1]], 200) for c in (0, 1)])
mix = (bus + wet * 0.6)[:, :N]; mix = np.vstack([hp(mix[0], 28), hp(mix[1], 28)])
fs = T['fade']; mix *= np.clip(1 - (ta(N) - fs) / (DUR - fs), 0, 1) ** 1.4; mix[:, :200] *= np.linspace(0, 1, 200)
def kw(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    return signal.lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], signal.lfilter(b1, a1, x))
def lufs(x):
    y = np.vstack([kw(x[0]), kw(x[1])]); blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, y.shape[1] - blk, hop)]); l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]
    rl = -0.691 + 10 * np.log10(z.mean()) - 10; z = z[-0.691 + 10 * np.log10(z) > rl]; return -0.691 + 10 * np.log10(z.mean())
def limiter(x, c_db=-1.6):
    c = 10 ** (c_db / 20); up = signal.resample_poly(x, 4, 1, axis=1); pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    L = int(0.005 * SR); pk = maximum_filter1d(pk, 2 * L + 1); gg = np.minimum(1, c / np.maximum(pk, 1e-9)); a = np.exp(-1 / (0.09 * SR)); out = np.empty_like(gg); z = 1.0
    for i in range(len(gg)): z = gg[i] if gg[i] < z else a * z + (1 - a) * gg[i]; out[i] = z
    return x * np.convolve(out, np.ones(L) / L, mode='same')
y = mix.copy()
for _ in range(5): y *= 10 ** ((-14.0 - lufs(y)) / 20); y = limiter(y)
tp = 20 * np.log10(np.abs(signal.resample_poly(y, 4, 1, axis=1)).max()); print(f'LUFS {lufs(y):.2f} TP {tp:.2f}'); assert tp < -1
sf.write(sys.argv[2], y.T, SR, subtype='PCM_24')
