import sys, glob
from PIL import Image, ImageDraw
src, dst, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 4
fs = sorted(glob.glob(src + '/t*.png'), key=lambda f: float(f.split('/t')[-1][:-4]))
W, H = 480, 270
rows = (len(fs) + cols - 1) // cols
s = Image.new('RGB', (W * cols, H * rows), (40, 40, 40))
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS); d = ImageDraw.Draw(im); d.text((6, 4), f.split('/t')[-1][:-4], fill=(0, 255, 0))
    s.paste(im, ((i % cols) * W, (i // cols) * H))
s.save(dst)
