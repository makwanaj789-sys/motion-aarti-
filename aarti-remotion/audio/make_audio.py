"""Original score + interaction sounds for the AartiMusic promo.

Everything is synthesised here (no samples, no third-party music). Cues use the
same reference-frame numbers as src/timing.ts / src/Promo.tsx, so sound and
picture share one timeline:  seconds = r / 30.

usage: python3 audio/make_audio.py public/audio/score.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
REF_END = 372
DUR = REF_END / 30
N = int(DUR * SR) + SR // 2
rng = np.random.default_rng(7)
T = lambda r: r / 30.0


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def place(buf, x, at, gain=1.0, pan=0.0):
    """mix mono x into stereo buf at time `at` (s) with constant-power pan (-1..1)"""
    i = int(at * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i] * gain
    a = (pan + 1) * np.pi / 4
    buf[i:i + len(x), 0] += x * np.cos(a)
    buf[i:i + len(x), 1] += x * np.sin(a)


def env_adsr(n, a, d, s, rel, sus=0.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where(t >= a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)), e)
    tail = n - int(rel * SR)
    if tail > 0:
        e[tail:] *= np.linspace(1, 0, n - tail)
    return e


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# ------------------------------------------------------------------ instruments
def pluck(midi, dur=2.2, bright=1.0):
    """santoor-like struck string: inharmonic partials, fast decay of the highs"""
    t = t_axis(dur)
    f0 = hz(midi)
    x = np.zeros_like(t)
    for k, (m, g) in enumerate([(1, 1.0), (2.002, 0.45), (3.006, 0.22 * bright), (4.012, 0.12 * bright), (5.02, 0.06 * bright)]):
        x += g * np.sin(2 * np.pi * f0 * m * t + k) * np.exp(-t * (1.6 + 2.2 * k))
    # a second, slightly detuned string — santoor courses are doubled
    x += 0.5 * np.sin(2 * np.pi * f0 * 1.0035 * t) * np.exp(-t * 1.9)
    att = np.minimum(1, t / 0.003)
    return x * att * 0.5


def bell(midi, dur=3.5):
    t = t_axis(dur)
    f0 = hz(midi)
    x = np.zeros_like(t)
    for m, g, d in [(1, 1, 1.1), (2.76, 0.4, 2.2), (5.4, 0.2, 3.5), (8.93, 0.08, 5.0)]:
        x += g * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * d)
    return x * np.minimum(1, t / 0.002) * 0.4


def pad(midis, dur, attack=1.2, release=1.5, bright=0.5):
    t = t_axis(dur)
    x = np.zeros_like(t)
    for j, m in enumerate(midis):
        for det in (-0.07, 0.0, 0.07):
            f = hz(m + det)
            ph = rng.uniform(0, 2 * np.pi)
            # soft saw from a few harmonics
            for h in range(1, 7):
                x += (bright ** (h - 1)) / h * np.sin(2 * np.pi * f * h * t + ph * h)
    x = lp(x, 2600)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release)
    return x * e / (len(midis) * 3)


def drone(dur):
    """tanpura-flavoured bed on D: Pa–Sa–Sa–Sa (A2 D3 D3 D2) with a buzzy jawari tone"""
    t = t_axis(dur)
    x = np.zeros_like(t)
    for k, (m, at) in enumerate([(45, 0.0), (50, 0.55), (50, 1.1), (38, 1.65)] * 6):
        start = at + 2.2 * (k // 4)
        if start > dur:
            break
        f = hz(m)
        n = len(t) - int(start * SR)
        tt = np.arange(n) / SR
        tone = sum((0.9 ** h) * np.sin(2 * np.pi * f * h * tt + h) for h in range(1, 14))
        tone *= np.exp(-tt * 0.55) * np.minimum(1, tt / 0.01)
        x[int(start * SR):] += tone
    return lp(x, 1800) * 0.035


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def whoosh(sec, lo=300, hi=4000, peak=0.55, gain=1.0):
    """filtered noise swell; energy peaks at `peak` (0..1) of its length"""
    x = noise(sec)
    n = len(x)
    u = np.arange(n) / n
    e = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak) * 4))
    # sweep the band with a few static bands crossfaded by the envelope position
    y = np.zeros(n)
    bands = np.geomspace(lo, hi, 5)
    for i in range(len(bands) - 1):
        w = np.clip(1 - abs(u * (len(bands) - 2) - i), 0, 1)
        y += bp(x, bands[i], bands[i + 1]) * w
    return y * e * gain


def click(bright=1.0, gain=1.0):
    t = t_axis(0.05)
    x = noise(0.05) * np.exp(-t * 180)
    x = bp(x, 1800, 7000) * bright + 0.6 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 300)
    return x * gain


def key(gain=1.0):
    t = t_axis(0.06)
    x = bp(noise(0.06), 2500, 9000) * np.exp(-t * 260) + 0.25 * np.sin(2 * np.pi * 1450 * t) * np.exp(-t * 220)
    return x * gain


def soft_kick(gain=1.0):
    t = t_axis(0.5)
    f = 46 + 70 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) * gain


def shimmer(sec, gain=1.0):
    t = t_axis(sec)
    x = bp(noise(sec), 5000, 12000)
    e = np.minimum(1, t / (sec * 0.7)) ** 2 * np.minimum(1, (sec - t) / (sec * 0.3))
    tones = sum(np.sin(2 * np.pi * hz(m) * t) for m in (86, 90, 93, 98)) * 0.05
    return (x * 0.35 + tones) * e * gain


# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
sfx = np.zeros((N, 2))

# harmonic bed: D major colour (D–F#–A–E), lifting at the field and at the end card
place(mus, drone(DUR + 0.3), 0.15, 0.9)
place(mus, pad([50, 57, 62, 66], T(110)), T(2), 0.55, -0.2)        # D3 A3 D4 F#4
place(mus, pad([47, 54, 62, 66, 69], T(115)), T(95), 0.5, 0.2)       # Bm9 colour under the typing
place(mus, pad([43, 50, 59, 62, 66], T(100)), T(195), 0.5, -0.1)     # G maj7 as results stream
place(mus, pad([50, 57, 64, 66, 69], T(REF_END - 270) + 0.8, attack=0.6, release=1.6, bright=0.6), T(276), 0.6, 0.0)  # Dadd9 home

# melodic plucks on the picture's accents (D major pentatonic: D E F# A B)
P = {'D4': 62, 'E4': 64, 'F#4': 66, 'A4': 69, 'B4': 71, 'D5': 74, 'E5': 76, 'F#5': 78, 'A5': 81, 'A3': 57, 'B3': 59, 'D3': 50}
melody = [
    (12, 'A4', 0.9), (25, 'D5', 0.5), (27, 'E5', 0.4), (29, 'F#5', 0.45), (40, 'A4', 0.35),
    (62, 'D5', 0.5), (64.5, 'E5', 0.35), (66.5, 'A5', 0.55),
    (84, 'F#4', 0.6), (88, 'A4', 0.45),
    (104, 'B4', 0.5),
    (134.5, 'D5', 0.45), (147, 'E5', 0.4),
    (189.5, 'A4', 0.55),
    (213, 'D5', 0.5), (217, 'F#4', 0.4), (220.5, 'A4', 0.4), (224, 'B4', 0.4), (228, 'D5', 0.4),
    (234, 'E5', 0.45), (235.5, 'A4', 0.35), (239.5, 'B4', 0.35), (250, 'F#5', 0.45), (251.5, 'D5', 0.35), (255.5, 'E5', 0.35), (263, 'A4', 0.35),
    (281, 'D5', 0.5), (290, 'F#5', 0.4), (301, 'A5', 0.5),
    (321.5, 'D5', 0.6), (326, 'A4', 0.4), (330, 'F#5', 0.35), (336, 'E5', 0.35), (340, 'D5', 0.45),
]
for k, (r, n, g) in enumerate(melody):
    place(mus, pluck(P[n]), T(r), g * 0.55, pan=((k * 0.37) % 1.0 - 0.5) * 0.6)

# low pulse on the big structural hits
for r, g in [(53, 0.5), (84, 0.6), (104.5, 0.5), (189.5, 0.7), (213, 0.6), (281, 0.6), (321.5, 0.75)]:
    place(mus, soft_kick(), T(r), g)

# gentle shaker motion while the results stream (eighths at the reveal rhythm, ~96 bpm)
r = 213.0
k = 0
while r < 272:
    x = hp(noise(0.08), 6000) * np.exp(-t_axis(0.08) * 60)
    place(mus, x, T(r), 0.05 if k % 2 else 0.08, pan=0.3 if k % 2 else -0.3)
    r += 9.375
    k += 1

# ------------------------------------------------------------------ interaction sounds (restrained)
place(sfx, whoosh(T(5.5), 400, 6000, 0.75), T(0.5), 0.22, -0.6)           # streak lands
place(sfx, shimmer(0.55), T(9.5), 0.25)                                    # spark → icon ring
place(sfx, bell(86), T(12.2), 0.12)
place(sfx, whoosh(T(7), 250, 2500, 0.8), T(47), 0.16)                      # lockup sinks
place(sfx, whoosh(T(10), 600, 7000, 0.6), T(53), 0.16, 0.3)                # arcs of light
place(sfx, shimmer(0.4), T(62), 0.18)                                      # greeting assembles
place(sfx, whoosh(T(8), 300, 3000, 0.6), T(81), 0.14)                      # bloom → field
place(sfx, whoosh(T(12), 200, 5000, 0.62), T(97), 0.3, 0.4)                # whip zoom
for kk, r in enumerate([113, 114.5, 116, 118, 119.5, 121, 122.5, 125, 126.5, 128, 129.5, 131, 133, 135, 137, 140, 142, 144, 146.5]):
    place(sfx, key(), T(r), 0.11 + 0.02 * ((kk * 5) % 3), pan=0.25 if kk % 2 else 0.05)
place(sfx, whoosh(T(16), 250, 5000, 0.4), T(128.5), 0.26, 0.5)             # whip pan
place(sfx, whoosh(T(16), 200, 3500, 0.55), T(150), 0.2)                    # field lifts away
place(sfx, click(), T(189.3), 0.32)                                        # the press
place(sfx, shimmer(T(8.5)), T(190), 0.32)                                  # ring opens
place(sfx, bell(93, 2.0), T(196), 0.07)
place(sfx, whoosh(T(7), 200, 2000, 0.85), T(203), 0.14)                    # button drops
for r in (217, 220.5, 224, 228, 235.5, 239.5, 251.5, 255.5):               # rows land
    place(sfx, click(0.4, 0.5), T(r), 0.09, 0.2)
place(sfx, whoosh(T(8), 300, 4000, 0.7), T(271), 0.16)                     # list folds into the waveform
for r in (281, 283, 284.5, 286, 289, 290.5, 292, 293, 295):                # letters
    place(sfx, key(0.8), T(r), 0.06)
place(sfx, bell(81, 3.0), T(321.5), 0.14)                                  # logo pop
place(sfx, shimmer(0.6), T(326), 0.12)

# ------------------------------------------------------------------ mix & master
def room(x, decay=1.6, mix=0.22):
    """small diffuse reverb: exponentially decaying stereo noise convolution"""
    n = int(decay * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / decay)
        ir = lp(ir, 6000)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = signal.fftconvolve(x[:, ch], ir)[: len(x)]
    return x * (1 - mix) + out * mix


mix = room(mus, 2.2, 0.28) + room(sfx, 0.9, 0.12)
mix[:, 0] = hp(mix[:, 0], 28)
mix[:, 1] = hp(mix[:, 1], 28)
mix = mix[: int(DUR * SR)]
fade = int(T(10) * SR)                    # follows the picture's fade to black
mix[-fade:] *= (np.cos(np.linspace(0, np.pi, fade)) * 0.5 + 0.5)[:, None]
mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]


def lufs(x):
    """ITU-R BS.1770-4 integrated loudness (K-weighting, 400 ms blocks, gating)"""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[l > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return -0.691 + 10 * np.log10(z.mean())


TARGET = -16.0
mix *= 10 ** ((TARGET - lufs(mix)) / 20)
# true-peak safety: if the 4x-oversampled peak passes -1.5 dBTP, trade a little loudness for headroom
tp = np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max()
ceil = 10 ** (-1.5 / 20)
if tp > ceil:
    mix *= ceil / tp
print(f'loudness {lufs(mix):.2f} LUFS, true peak {20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max()):.2f} dBTP, {len(mix) / SR:.3f} s')
wavfile.write(sys.argv[1], SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
