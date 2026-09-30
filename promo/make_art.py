"""Original abstract cover art for demo songs (no third-party artwork)."""
import numpy as np
from PIL import Image, ImageFilter
import os
N = 640
yy, xx = np.mgrid[0:N, 0:N] / N
PALS = [
 ("#E0A253", "#7a2e12", "#1a0d06"), ("#ff70c6", "#5b1a6e", "#12081c"),
 ("#77ccdb", "#1d5a6e", "#061318"), ("#d1a0ff", "#4b2a8c", "#0f0820"),
 ("#ffb36b", "#b33b4a", "#1c0810"), ("#5FD68F", "#1f5e44", "#06140e"),
 ("#a6a2ff", "#2d2f7a", "#0a0b22"), ("#ff9aaa", "#8a2a3e", "#1a080c"),
 ("#ffd27a", "#8c5a1e", "#150c04"), ("#8fe3ff", "#3a3f9e", "#0a0a1e"),
 ("#ffa36b", "#5b2a8c", "#100818"), ("#e9e1c8", "#6e4a2a", "#120c08"),
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
