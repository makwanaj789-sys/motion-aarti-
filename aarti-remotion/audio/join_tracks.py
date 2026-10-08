"""Continue a soundtrack with the real rest of the song taken from a second recording.

The reference clip's track stops at ~11.2 s; another clip carries the same song
further. This script finds where the second recording sits on the first one's
timeline (sample-accurate cross-correlation), matches its level, and switches
over with a short equal-power crossfade, so the song simply keeps playing. The
result fades with the picture (reference frames 362–372).

usage: python3 audio/join_tracks.py <first.wav> <second.wav> <out.wav> [duration_s=12.4]
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

a_path, b_path, out = sys.argv[1:4]
DUR = float(sys.argv[4]) if len(sys.argv) > 4 else 12.4
sr, a = wavfile.read(a_path)
sr_b, b = wavfile.read(b_path)
assert sr == sr_b, 'resample both to the same rate first'
a = a.astype(np.float64) / 32768.0
b = b.astype(np.float64) / 32768.0
am, bm = a.mean(1), b.mean(1)

# 1. coarse offset: where in A does B start? (A time = B time + off)
D = 6
ad, bd = signal.resample_poly(am, 1, D), signal.resample_poly(bm, 1, D)
win = bd[: int(6 * sr / D)]
c = signal.fftconvolve(ad, win[::-1], mode='valid')
n = np.sqrt(signal.fftconvolve(ad ** 2, np.ones(len(win)), mode='valid')) * np.sqrt((win ** 2).sum()) + 1e-12
coarse = int(np.argmax(c / n)) * D
# 2. refine to the sample, around the coarse estimate
seg_b = bm[sr: 4 * sr]
lo, hi = coarse + sr - 2 * D, coarse + sr + 2 * D + len(seg_b)
c2 = signal.fftconvolve(am[lo:hi], seg_b[::-1], mode='valid')
off = lo + int(np.argmax(c2)) - sr  # samples: A[i] ≈ B[i - off]
ncc = float(np.max(c2) / (np.sqrt((am[lo:hi] ** 2).sum()) * np.sqrt((seg_b ** 2).sum()) + 1e-12))

# 3. level match over the shared stretch (last 4 s before A ends)
s0, s1 = len(a) - 5 * sr, len(a) - sr
gain = np.sqrt(np.mean(a[s0:s1] ** 2) / (np.mean(b[s0 - off:s1 - off] ** 2) + 1e-12))

# 4. switch at the quietest 10 ms in the 0.6 s before A runs out
w = int(0.01 * sr)
cands = range(len(a) - int(0.9 * sr), len(a) - int(0.3 * sr), w)
cut = min(cands, key=lambda i: np.mean(a[i:i + w] ** 2))
xf = int(0.04 * sr)

n_out = int(DUR * sr)
y = np.zeros((n_out, 2))
y[:cut + xf] = a[:cut + xf]
tail_idx = np.arange(cut, n_out) - off
valid = (tail_idx >= 0) & (tail_idx < len(b))
tail = np.zeros((n_out - cut, 2))
tail[valid] = b[tail_idx[valid]] * gain
ramp = np.ones(n_out - cut)
ramp[:xf] = np.sin(np.linspace(0, np.pi / 2, xf)) ** 2
y[cut:] = y[cut:] * (1 - ramp)[:, None] + tail * ramp[:, None]
covered = (len(b) + off) / sr

f0, f1 = int(362 / 30 * sr), min(n_out, int(372 / 30 * sr))
y[f0:f1] *= (np.cos(np.linspace(0, np.pi, f1 - f0)) * 0.5 + 0.5)[:, None]
y[f1:] = 0
peak = np.abs(signal.resample_poly(y, 4, 1, axis=0)).max()
if peak > 10 ** (-1 / 20):
    y *= 10 ** (-1 / 20) / peak
print(f'second recording starts at {off / sr:.4f} s on the first one\'s timeline (ncc {ncc:.2f}), gain {20 * np.log10(gain):+.1f} dB')
print(f'switch at {cut / sr:.3f} s; song now runs to {covered:.2f} s; output {n_out / sr:.2f} s')
wavfile.write(out, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
