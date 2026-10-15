"""Rough preview renderer for the generated Alight Motion XML (layout/timing check only, not a substitute for the app).

It reads the XML the way the generator assumes Alight Motion does: canvas pixels from the top-left, layers centred on
their location, keyframe t as a fraction of the layer's duration (linear between keys), nested scenes placed by their
own transform. Shapes are drawn flat (gradients as their start colour, glows/blur ignored), text with the real fonts.

usage: python3 alight/preview_xml.py <project.xml> <media_dir> <out_dir> <t> [t...]
"""
import io, os, sys, xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

xml_path, media_dir, out_dir, *times = sys.argv[1:]
os.makedirs(out_dir, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = {}
TEXT_UNIT = 3.0  # Alight Motion text size unit on a 1080p canvas
def font(family, weight, size):
    key = (family, weight)
    if key not in FONTS:
        name = {'Inter': f'inter-latin-{weight}-normal', 'Fraunces': 'fraunces-latin-400-normal'}[family]
        f = TTFont(os.path.join(ROOT, 'public', 'fonts', name + '.woff2')); f.flavor = None
        b = io.BytesIO(); f.save(b); FONTS[key] = b.getvalue()
    return ImageFont.truetype(io.BytesIO(FONTS[key]), max(1, round(size)))

def parse_vec(s): return [float(x) for x in s.split(',')]
def keyed(node, t, t0, t1, default):
    if node is None: return default
    if 'value' in node.attrib: return parse_vec(node.attrib['value'])
    kfs = [(float(k.attrib['t']), parse_vec(k.attrib['v'])) for k in node.findall('kf')]
    if not kfs: return default
    u = (t - t0) / (t1 - t0) if t1 > t0 else 0
    if u <= kfs[0][0]: return kfs[0][1]
    if u >= kfs[-1][0]: return kfs[-1][1]
    for (ta, va), (tb, vb) in zip(kfs, kfs[1:]):
        if ta <= u <= tb:
            w = (u - ta) / (tb - ta) if tb > ta else 0
            return [a + (b - a) * w for a, b in zip(va, vb)]
def argb(s):
    s = s.lstrip('#'); a = int(s[:2], 16) if len(s) == 8 else 255; rgb = s[-6:]
    return tuple(int(rgb[i:i + 2], 16) for i in (0, 2, 4)), a / 255

def draw_scene(scene, t, M, canvas):
    """M = (scale, ox, oy): parent-to-canvas transform (uniform scale + offset)"""
    for el in scene:
        if el.tag not in ('shape', 'text', 'embedScene'): continue
        t0, t1 = int(el.attrib['startTime']) / 1000, int(el.attrib['endTime']) / 1000
        if not (t0 <= t < t1): continue
        tr = el.find('transform')
        g = lambda n, d: keyed(tr.find(n) if tr is not None else None, t, t0, t1, d)
        loc, sc, op = g('location', [0, 0]), g('scale', [1, 1]), g('opacity', [1])[0]
        if op <= 0.003: continue
        s0, ox, oy = M
        X, Y, S = ox + s0 * loc[0], oy + s0 * loc[1], s0 * sc[0]
        if el.tag == 'embedScene':
            inner = el.find('scene'); w, h = int(inner.attrib['width']), int(inner.attrib['height'])
            draw_scene(inner, t - t0, (S, X - S * w / 2, Y - S * h / 2), canvas)
            continue
        layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
        fc = el.find('fillColor'); gr = el.find('gradient')
        rgb, a = argb(fc.attrib['value']) if fc is not None else (argb(gr.attrib['startColor']) if gr is not None else ((255, 255, 255), 1))
        alpha = int(255 * a * op)
        if el.tag == 'text':
            fam = 'Fraunces' if 'Fraunces' in el.attrib['font'] else 'Inter'
            wt = int(el.attrib['font'].split('weight=')[1]); size = float(el.attrib['size']) * TEXT_UNIT * S
            f = font(fam, wt, size); txt = el.find('content').text or ''
            asc, desc = f.getmetrics()
            d.text((X - f.getlength(txt) / 2, Y - (asc + desc) / 2 + 0.032 * size), txt, font=f, fill=rgb + (alpha,))
        elif el.attrib.get('fillType') == 'media':
            size = parse_vec(el.find("property[@name='size']").attrib['value'])
            sig = el.attrib['fillImage'].split('///')[1]
            img = Image.open(os.path.join(media_dir, sig)).convert('RGBA').resize((max(1, round(size[0] * S)), max(1, round(size[1] * S))))
            img.putalpha(img.getchannel('A').point(lambda v: v * op))
            layer.alpha_composite(img, (round(X - img.width / 2), round(Y - img.height / 2)))
        else:
            sp = el.find("property[@name='size']")
            if sp is None: continue  # custom path shapes are skipped in the preview
            size = keyed(sp, t, t0, t1, [100, 100])
            w, h = size[0] * s0 * sc[0], size[1] * s0 * sc[1]
            box = [X - w / 2, Y - h / 2, X + w / 2, Y + h / 2]
            if gr is not None and gr.attrib.get('type') == 'radial':
                # radial light: draw concentric ellipses fading to the end colour's alpha
                (r1, a1), (r2, a2) = argb(gr.attrib['startColor']), argb(gr.attrib['endColor'])
                for k in range(24, 0, -1):
                    f_ = k / 24; ww, hh = w * f_ / 2, h * f_ / 2
                    d.ellipse([X - ww, Y - hh, X + ww, Y + hh], fill=r1 + (int(255 * op * (a1 + (a2 - a1) * f_) / 3),))
            elif el.attrib.get('s') == '.circle':
                d.ellipse(box, fill=rgb + (alpha,)) if a > 0 else None
            else:
                r = 0
                rp = el.find("property[@name='cornerRadius']")
                if rp is not None: r = float(rp.attrib['value']) * S
                if a > 0: d.rounded_rectangle(box, r, fill=rgb + (alpha,))
            b = el.find('border')
            if b is not None:
                brgb, ba = argb(b.attrib['color'])
                d.rounded_rectangle(box, r if el.attrib.get('s') != '.circle' else min(w, h) / 2, outline=brgb + (int(255 * ba * op),), width=max(1, round(float(b.attrib['size']) * S)))
        canvas.alpha_composite(layer)

root = ET.parse(xml_path).getroot()
bg, _ = argb(root.attrib['bgcolor'])
for ts in times:
    t = float(ts)
    canvas = Image.new('RGBA', (int(root.attrib['width']), int(root.attrib['height'])), bg + (255,))
    draw_scene(root, t, (1.0, 0.0, 0.0), canvas)
    canvas.convert('RGB').save(os.path.join(out_dir, f'p{round(t * 60):04d}.png'))
print('ok', len(times))
