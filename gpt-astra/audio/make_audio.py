"""Original score for the GPT Astra 6 concept promo (fully synthesised, no samples).

Pacing follows the reference: a quiet celestial open, a pulse that enters with the
interface, a lift into the capability words and a held resolve on the final logo.
Cues use the same seconds as src/Astra.tsx (T = {...}). Interaction sounds are sparse
and quiet: a few soft key ticks, the menu click, the selection and the send.

usage: python3 audio/make_audio.py public/audio/score.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 18.2
N = int(DUR * SR)
rng = np.random.default_rng(11)
T = dict(moonGlow=0.55, logoIn=0.85, letters=1.35, sub=2.25, toUI=2.95, type0=4.3, click=6.55, pick=7.45, send=8.1,
         code0=8.45, morph0=10.35, reason=12.55, build=13.25, understand=13.95, frm=14.85, to=15.75, final=16.6)


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def put(buf, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i] * g
    a = (pan + 1) * np.pi / 4
    buf[i:i + len(x), 0] += x * np.cos(a)
    buf[i:i + len(x), 1] += x * np.sin(a)


def lp(x, f):
    b, a = signal.butter(2, f / (SR / 2))
    return signal.lfilter(b, a, x)


def hp(x, f):
    b, a = signal.butter(2, f / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def pad(notes, dur, att=1.0, rel=1.2, bright=0.45, cutoff=2400):
    t = tt(dur)
    x = np.zeros_like(t)
    for m in notes:
        for det in (-0.06, 0.0, 0.06):
            ph = rng.uniform(0, 6.28)
            for h in range(1, 6):
                x += bright ** (h - 1) / h * np.sin(2 * np.pi * hz(m + det) * h * t + ph * h)
    x = lp(x, cutoff)
    e = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel))
    return x * e / (len(notes) * 3)


def bell(m, dur=2.5, g=1.0):
    t = tt(dur)
    x = sum(a * np.sin(2 * np.pi * hz(m) * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 1.4), (2.0, 0.35, 2.4), (3.01, 0.18, 3.5), (4.2, 0.08, 5)])
    return x * np.minimum(1, t / 0.004) * 0.35 * g


def pluck(m, dur=1.2):
    t = tt(dur)
    x = sum(np.sin(2 * np.pi * hz(m) * k * t) * np.exp(-t * (3 + 3 * k)) / k for k in (1, 2, 3, 4))
    return x * np.minimum(1, t / 0.003) * 0.4


def kick(g=1.0):
    t = tt(0.45)
    f = 48 + 60 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * g


def hat(g=1.0):
    t = tt(0.06)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70) * g


def swell(dur, lo=300, hi=5000):
    t = tt(dur)
    x = rng.standard_normal(len(t))
    b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
    x = signal.lfilter(b, a, x)
    e = (t / dur) ** 2 * np.minimum(1, (dur - t) / 0.08)
    return x * e


def tick(g=1.0):
    t = tt(0.03)
    x = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300)
    return x * g


mus = np.zeros((N, 2))
sfx = np.zeros((N, 2))

# harmony: A minor add9 colours → F maj7 → C → G sus, resolving to A minor add9 / C major on the logo
put(mus, pad([57, 64, 71, 76], 3.3, att=1.6, bright=0.35, cutoff=1800), 0.0, 0.7)            # night: Am(add9) high, dark
put(mus, bell(81, 3.0), T['moonGlow'], 0.35, 0.2)
put(mus, bell(88, 2.5), T['logoIn'], 0.22, -0.2)
for i, m in enumerate([76, 79, 83, 84, 86, 88, 91]):                                         # one note per letter of ChatGPT
    put(mus, pluck(m), T['letters'] + i * 0.075, 0.16, (i - 3) * 0.12)
put(mus, pad([53, 60, 64, 69], 5.4, att=0.8), T['toUI'], 0.6)                                 # Fmaj7 under the interface
put(mus, pad([48, 55, 64, 67], 4.4, att=0.6), 8.3, 0.6)                                       # C under code → dashboard
put(mus, pad([55, 62, 67, 72], 4.2, att=0.4, bright=0.55, cutoff=3200), 12.4, 0.62)           # G sus under the words
put(mus, pad([45, 57, 64, 69, 71, 76], DUR - T['final'] + 0.2, att=0.25, rel=1.0, bright=0.5, cutoff=3000), T['final'] - 0.05, 0.75)

# pulse: enters with the UI, lifts at the code, drives the words, stops for the resolve
BEAT = 0.4096  # ≈146.5 bpm, the reference's pulse
t = T['toUI'] + 0.4
k = 0
while t < T['final'] - 0.1:
    strong = k % 4 == 0
    if t > 4.0:
        put(mus, kick(0.55 if strong else 0.28), t, 1.0)
    put(mus, hat(0.12 if k % 2 else 0.07), t + BEAT / 2, 1.0, 0.3)
    t += BEAT
    k += 1
for at in (T['reason'], T['build'], T['understand'], T['frm'], T['to']):                     # each word lands on a note
    put(mus, bell({T['reason']: 76, T['build']: 79, T['understand']: 81, T['frm']: 74, T['to']: 76}[at], 1.6), at, 0.28)
    put(mus, kick(0.7), at, 1.0)
put(mus, swell(0.5, 400, 7000), T['toUI'] - 0.42, 0.10)
put(mus, swell(0.45, 400, 7000), T['send'] - 0.4, 0.09)
put(mus, swell(0.6, 300, 6000), T['reason'] - 0.55, 0.12)
put(mus, swell(0.6, 300, 6000), T['final'] - 0.55, 0.12)
put(mus, bell(69, 3.0), T['final'], 0.35)
put(mus, bell(76, 3.0), T['final'] + 0.02, 0.25)
put(mus, kick(0.9), T['final'], 1.0)

# sparse interaction sounds
prompt = 'Turn this idea into a working dashboard.'
t = T['type0']
for i, ch in enumerate(prompt):
    if i % 3 == 0:
        put(sfx, tick(1.0), t, 0.05, 0.1)
    t += 0.034 + ((i * 37) % 7) * 0.004 + (0.03 if ch == ' ' else 0) + (0.08 if i == 25 else 0)
put(sfx, tick(2.5), T['click'], 0.08)
put(sfx, pluck(88, 0.6), T['pick'], 0.12)
put(sfx, pluck(83, 0.6), T['send'], 0.10)


def room(x, decay, mix):
    n = int(decay * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = lp(rng.standard_normal(n) * np.exp(-t * 6.9 / decay), 5000)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = signal.fftconvolve(x[:, ch], ir)[: len(x)]
    return x * (1 - mix) + out * mix


mix = room(mus, 2.4, 0.3) + room(sfx, 0.6, 0.1)
for ch in range(2):
    mix[:, ch] = hp(mix[:, ch], 30)
f = int(0.6 * SR)
mix[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5   # the last chord rings out with the held logo


def lufs(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    z = z[-0.691 + 10 * np.log10(z + 1e-12) > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return -0.691 + 10 * np.log10(z.mean())


mix *= 10 ** ((-16 - lufs(mix)) / 20)
tp = np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max()
if tp > 10 ** (-1.5 / 20):
    mix *= 10 ** (-1.5 / 20) / tp
print(f'{lufs(mix):.1f} LUFS, TP {20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max()):.1f} dBTP, {len(mix) / SR:.2f} s')
wavfile.write(sys.argv[1], SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
