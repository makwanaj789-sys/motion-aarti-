"""Prepare supplied transparent PNG cutouts: keep their alpha, make near-opaque
pixels fully opaque, clear colour from fully transparent pixels and trim to the subject.
usage: python3 scripts/prep_png.py   (reads assets_src/*.png, writes public/photos/*.png + src/photos.json)"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
out = {}
for f in sorted((ROOT / 'assets_src').glob('*.png')):
    im = np.asarray(Image.open(f).convert('RGBA')).copy()
    a = im[..., 3]
    a[a >= 250] = 255
    im[a == 0, :3] = 0
    img = Image.fromarray(im)
    box = Image.fromarray(a).point(lambda v: 255 if v > 6 else 0).getbbox()
    img = img.crop(box)
    dst = ROOT / 'public' / 'photos' / f.name
    img.save(dst, optimize=True)
    out[f.stem] = {'file': f'photos/{f.name}', 'w': img.width, 'h': img.height}
    print(f.stem, img.size)
(ROOT / 'src' / 'photos.json').write_text(json.dumps(out, indent=1))
