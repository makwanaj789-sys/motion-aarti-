"""Original abstract cover art for demo songs (no third-party artwork)."""
import numpy as np
from PIL import Image, ImageFilter
import os
N = 640
yy, xx = np.mgrid[0:N, 0:N] / N
PALS = [
 ("#5fe3ff", "#1f4fd8", "#040a1c"), ("#39d98a", "#0d5c55", "#03120f"),
 ("#7aa8ff", "#2a2f9c", "#070a24"), ("#46f0d0", "#127a8a", "#031318"),
 ("#8fd3ff", "#1c6fe0", "#040d1f"), ("#5bf2a4", "#157a5c", "#04140d"),
 ("#9a9cff", "#3b3fbf", "#080a26"), ("#6ae8ff", "#0e5f86", "#030f18"),
 ("#b8f1ff", "#2b7bd6", "#051022"), ("#4de0c2", "#1d4fa8", "#040b1c"),
 ("#7cc8ff", "#3a2fa0", "#07081e"), ("#d6f6ff", "#2e6a8c", "#050e14"),
]
def hexc(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float)
rng = np.random.default_rng(7)
for i, (a, b, c) in enumerate(PALS):
    A, B, C = hexc(a), hexc(b), hexc(c)
    img = np.zeros((N, N, 3)) + C
    # soft blobs
    for k in range(4):
        cx, cy = rng.uniform(.1, .9, 2); r = rng.uniform(.25, .6)
        col = [A, B, (A + B) / 2, B][k]
        d = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (r * r)) * 2.2)
        img = img * (1 - d[..., None] * .75) + col * d[..., None] * .75
    style = i % 4
    if style == 0:  # concentric rings (sun / mandala)
        cx, cy = .5, .56
        rr = np.hypot(xx - cx, yy - cy)
        ring = (np.sin(rr * 70) > .6) * (rr < .38)
        img = img * (1 - ring[..., None] * .25) + A * ring[..., None] * .25
        disc = np.clip(1 - (rr - .16) * 60, 0, 1)
        img = img * (1 - disc[..., None]) + (A * .9 + 25) * disc[..., None]
    elif style == 1:  # wave bands
        for j in range(7):
            y0 = .35 + j * .07 + .04 * np.sin(xx * 9 + j)
            band = np.clip(1 - np.abs(yy - y0) * 90, 0, 1)
            img = img * (1 - band[..., None] * .6) + A * band[..., None] * .6
    elif style == 2:  # equaliser bars
        for j in range(9):
            x0 = .14 + j * .09; h = .15 + .5 * abs(np.sin(j * 1.7 + i))
            m = (np.abs(xx - x0) < .025) & (yy > .78 - h) & (yy < .78)
            img[m] = img[m] * .2 + A * .8
    else:  # arcs / horizon
        rr = np.hypot(xx - .5, yy - 1.05)
        for j in range(5):
            arc = np.clip(1 - np.abs(rr - (.35 + j * .12)) * 120, 0, 1)
            img = img * (1 - arc[..., None] * .55) + A * arc[..., None] * .55
    # grain + vignette
    v = 1 - .45 * (np.hypot(xx - .5, yy - .5) ** 2) * 2
    img = img * v[..., None] + rng.normal(0, 4, img.shape)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    im.save(f"art/cover{i:02d}.jpg", quality=92)
print("ok")
