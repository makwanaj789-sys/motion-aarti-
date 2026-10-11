"""Prepare photos for the edit.

Put one licensed image per slot in assets_src/, named after the slot
(ground.jpg, dancerF.jpg, garbo.png …; slot list in src/assets.ts) and record its
source and licence in assets_src/CREDITS.csv. Then run:

    python3 scripts/make_cutouts.py

Cutout slots get their background removed (rembg, isnet-general-use model),
alpha edges cleaned and the canvas trimmed to the subject; photo slots are only
resized. Results go to public/photos/ and src/photos.json is rewritten so the
composition picks them up. Nothing is stretched: the composition crops/fits by
aspect ratio.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'assets_src', ROOT / 'public' / 'photos'
CUTOUT = {'dancerF', 'dancerM', 'dandiyaPair', 'sticks', 'jewel', 'garbo', 'marigold'}
PHOTO = {'ground', 'bandhani', 'mirror', 'amba'}
OUT.mkdir(parents=True, exist_ok=True)

session = None


def remove_bg(img: Image.Image) -> Image.Image:
    global session
    from rembg import new_session, remove
    if session is None:
        session = new_session('isnet-general-use')
    cut = remove(img, session=session, post_process_mask=True)
    a = np.asarray(cut.split()[-1]).astype(np.float32) / 255
    # tidy the matte: drop faint haze, keep a 1px soft edge (no halo, no jaggies)
    a = np.clip((a - 0.06) / 0.88, 0, 1)
    alpha = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    cut.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        m = 8
        box = (max(0, box[0] - m), max(0, box[1] - m), min(cut.width, box[2] + m), min(cut.height, box[3] + m))
        cut = cut.crop(box)
    return cut


manifest = {}
for f in sorted(SRC.iterdir()) if SRC.exists() else []:
    slot = f.stem
    if f.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp') or slot not in CUTOUT | PHOTO:
        continue
    img = Image.open(f).convert('RGB')
    if max(img.size) > 3000:
        img.thumbnail((3000, 3000), Image.LANCZOS)
    if slot in CUTOUT:
        out = remove_bg(img)
        dst = OUT / f'{slot}.png'
        out.save(dst, optimize=True)
    else:
        out = img
        if max(out.size) > 2600:
            out.thumbnail((2600, 2600), Image.LANCZOS)
        dst = OUT / f'{slot}.jpg'
        out.save(dst, quality=92)
    manifest[slot] = {'file': f'photos/{dst.name}', 'w': out.width, 'h': out.height}
    print(f'{slot:12s} {"cutout" if slot in CUTOUT else "photo ":6s} {out.width}x{out.height}')

(ROOT / 'src' / 'photos.json').write_text(json.dumps(manifest, indent=1))
missing = sorted((CUTOUT | PHOTO) - set(manifest))
print('missing slots:', ', '.join(missing) if missing else 'none')
sys.exit(0)
