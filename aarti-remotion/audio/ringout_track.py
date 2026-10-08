"""Play a supplied soundtrack uncut, then let it ring out to the promo's length.

Nothing is repeated or rearranged: the track plays exactly as supplied until it
ends, its last moment is carried on by a long, darkening reverb tail, and the
tail fades with the picture (reference frames 362–372).

usage: python3 audio/ringout_track.py <track.wav> <out.wav> [duration_s=12.4]
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

src, out = sys.argv[1], sys.argv[2]
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 12.4
sr, x = wavfile.read(src)
x = x.astype(np.float64) / 32768.0
if x.ndim == 1:
    x = np.stack([x, x], 1)
n_src, n_out = len(x), int(DUR * sr)
end = n_src / sr

y = np.zeros((n_out, 2))
y[:n_src] = x[:n_out]

# the last 0.7 s of the song feeds a 2.6 s hall-like reverb whose tail carries on after the cut
rng = np.random.default_rng(3)
feed = np.zeros((n_src, 2))
a = n_src - int(0.7 * sr)
feed[a:] = x[a:] * np.linspace(0, 1, n_src - a)[:, None] ** 0.5
ir_len = int(2.6 * sr)
t = np.arange(ir_len) / sr
tail = np.zeros((n_src + ir_len - 1, 2))
for ch in range(2):
    ir = rng.standard_normal(ir_len) * np.exp(-t * 6.9 / 2.6)
    b, al = signal.butter(2, 3500 / (sr / 2), 'low')
    ir = signal.lfilter(b, al, ir)
    ir /= np.sqrt((ir ** 2).sum())
    tail[:, ch] = signal.fftconvolve(feed[:, ch], ir)
tail = tail[:n_out]
# match the tail's level to the song where it takes over
ref = np.sqrt(np.mean(x[-int(0.3 * sr):] ** 2))
cur = np.sqrt(np.mean(tail[n_src - int(0.1 * sr):n_src + int(0.2 * sr)] ** 2)) + 1e-9
tail *= 0.8 * ref / cur
# song keeps full level to its last 60 ms (just enough to avoid a click), the tail rises underneath
k = int(0.06 * sr)
y[n_src - k:n_src] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None] ** 2
rise = np.clip((np.arange(n_out) - (n_src - int(0.25 * sr))) / int(0.25 * sr), 0, 1)
y += tail * rise[:, None]

f0, f1 = int(362 / 30 * sr), min(n_out, int(372 / 30 * sr))
y[f0:f1] *= (np.cos(np.linspace(0, np.pi, f1 - f0)) * 0.5 + 0.5)[:, None]
y[f1:] = 0
peak = np.abs(signal.resample_poly(y, 4, 1, axis=0)).max()
if peak > 10 ** (-1 / 20):
    y *= 10 ** (-1 / 20) / peak
print(f'song plays uncut to {end:.3f} s, rings out to {DUR:.2f} s')
wavfile.write(out, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
