"""Average motion-blur sub-frames f####_k.jpg (written by render.mjs with MB=n) into f####.png-ready JPEGs."""
import glob, os, sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
frames = sorted({os.path.basename(p).split('_')[0] for p in glob.glob(os.path.join(src, 'f*_*.jpg'))})
for name in frames:
    subs = sorted(glob.glob(os.path.join(src, name + '_*.jpg')))
    # average in linear light so bright streaks smear the way a real shutter would
    acc = None
    for p in subs:
        a = (np.asarray(Image.open(p), dtype=np.float32) / 255.0) ** 2.2
        acc = a if acc is None else acc + a
    out = (acc / len(subs)) ** (1 / 2.2)
    Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(dst, name + '.png'), compress_level=1)
print('averaged', len(frames))
