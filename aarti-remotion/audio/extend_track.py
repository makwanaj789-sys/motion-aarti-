"""Fit a supplied soundtrack to the promo's length.

The promo is timed frame-for-frame to the reference cut, so the reference's own
track lines up from t=0. The promo runs longer (end card), so this script
continues the track musically: it finds the earlier passage that best matches
the ending (log-spectrogram correlation), crossfades into it, and fades out
with the picture (reference frames 362–372).

usage: python3 audio/extend_track.py <track.wav> <out.wav> [duration_s=12.4]
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
n_src = len(x)

# --- where does the song repeat itself? compare the last bars with every earlier offset
hop = int(0.01 * sr)
_, _, S = signal.stft(x.mean(1), sr, nperseg=2048, noverlap=2048 - hop)
S = np.log1p(np.abs(S[:400]))


def feat(t0, dur=1.2):
    a = int(t0 * sr / hop)
    v = S[:, a:a + int(dur * sr / hop)]
    return (v - v.mean()) / (v.std() + 1e-9)


probe = n_src / sr - 1.6
tail = feat(probe)
lag, score = max(((d, float((feat(probe - d) * tail).mean())) for d in np.arange(1.0, probe - 0.1, 0.01)), key=lambda p: p[1])

# --- splice a little before the end, at the quietest 10 ms within ±0.2 s of the target
target = n_src / sr - 0.5
win = int(0.01 * sr)
cands = range(int((target - 0.2) * sr), int((target + 0.2) * sr), win)
splice = min(cands, key=lambda i: np.mean(x[i:i + win] ** 2) + np.mean(x[i - int(lag * sr):i - int(lag * sr) + win] ** 2))

n_out = int(DUR * sr)
y = np.zeros((n_out, 2))
y[:min(n_src, n_out)] = x[:n_out]
L = int(lag * sr)
src_idx = np.arange(splice, n_out) - L
cont = x[np.clip(src_idx, 0, n_src - 1)]
xf = int(0.12 * sr)  # equal-power crossfade
w = np.ones(n_out - splice)
w[:xf] = np.sin(np.linspace(0, np.pi / 2, xf)) ** 2
orig = np.zeros_like(cont)
k = min(n_src - splice, len(cont))
orig[:k] = x[splice:splice + k]
y[splice:] = orig * (1 - w)[:, None] + cont * w[:, None]

# fade out with the picture: reference frames 362–372
f0, f1 = int(362 / 30 * sr), min(n_out, int(372 / 30 * sr))
y[f0:f1] *= (np.cos(np.linspace(0, np.pi, f1 - f0)) * 0.5 + 0.5)[:, None]
y[f1:] = 0

peak = np.abs(signal.resample_poly(y, 4, 1, axis=0)).max()
if peak > 10 ** (-1 / 20):
    y *= 10 ** (-1 / 20) / peak
print(f'loop-back {lag:.2f} s (similarity {score:.2f}), splice at {splice / sr:.3f} s, out {n_out / sr:.2f} s')
wavfile.write(out, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
