"""Alight Motion project (XML) for GPT Astra 6 v3, generated from the same measured timing as src/AstraV3.tsx.

Format notes (from Alight Motion's own exported presets inside the APK and the community docs at
github.com/kuchingneko28/alight-motion-docs):
  * <scene> with width/height/fps/totalTime (ms); elements in z-order (first = back)
  * element startTime/endTime in ms; keyframe t is a 0..1 fraction of the element's duration
  * location is in canvas pixels (origin top-left) at the element's centre; text is centred on its box
  * nested scenes (<embedScene>) carry the camera moves of the UI and code shots

Every animated value is sampled at 60 fps from the same formulas the Remotion composition uses, then reduced
(points that a straight line already reproduces within a small tolerance are dropped). Easing is linear between
the kept keys, so the motion path is the sampled one.

usage: python3 alight/build_alight_xml.py <out_dir>
writes <out_dir>/GPT_Astra_6_v3.xml, <out_dir>/<SIG>.png (logo), and a copy of the reference audio if present
"""
import hashlib, io, math, os, re, shutil, sys
from fontTools.ttLib import TTFont
import resvg_py

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'alight', 'out')
os.makedirs(OUT, exist_ok=True)
W, H, CX, CY = 1920, 1080, 960, 540
DUR = 14.6
SR = 60  # sampling rate for keyframes

# ----------------------------------------------------------------- measured data (same arrays as src/refData.ts)
REF = {}
for name, body in re.findall(r'export const (\w+) = \{(.*?)\};', open(os.path.join(ROOT, 'src', 'refData.ts')).read()):
    REF[name] = {k: [float(x) for x in v.split(',')] for k, v in re.findall(r'(\w+): \[([^\]]*)\]', body)}

# ----------------------------------------------------------------- maths (ports of AstraV3.tsx)
def clamp(x, a=0.0, b=1.0): return min(b, max(a, x))
def lerp(a, b, t): return a + (b - a) * t
def seg(t, a, b): return clamp((t - a) / (b - a))
def bez(x1, y1, x2, y2):
    cx = 3 * x1; bx = 3 * (x2 - x1) - cx; ax = 1 - cx - bx; c_ = 3 * y1; by = 3 * (y2 - y1) - c_; ay = 1 - c_ - by
    X = lambda u: ((ax * u + bx) * u + cx) * u; Y = lambda u: ((ay * u + by) * u + c_) * u; dX = lambda u: (3 * ax * u + 2 * bx) * u + cx
    def f(x):
        if x <= 0: return 0.0
        if x >= 1: return 1.0
        u = x
        for _ in range(8):
            d = dX(u)
            if abs(d) < 1e-6: break
            u = clamp(u - (X(u) - x) / d)
        return Y(u)
    return f
E = dict(out=bez(0.16, 1, 0.3, 1), soft=bez(0.42, 0, 0.58, 1), inn=bez(0.55, 0, 0.9, 0.4), expo=bez(0.12, 0.9, 0.2, 1))
def mono(t, ts, vs, extend=False):
    n = len(ts)
    if t <= ts[0]: return vs[0] + ((vs[1] - vs[0]) / (ts[1] - ts[0])) * (t - ts[0]) if extend else vs[0]
    if t >= ts[-1]: return vs[-1] + ((vs[-1] - vs[-2]) / (ts[-1] - ts[-2])) * (t - ts[-1]) if extend else vs[-1]
    i = 0
    while t > ts[i + 1]: i += 1
    d = lambda k: (vs[k + 1] - vs[k]) / (ts[k + 1] - ts[k])
    def m(k):
        if k == 0: return d(0)
        if k == n - 1: return d(n - 2)
        a, b = d(k - 1), d(k)
        if a * b <= 0: return 0.0
        w1 = 2 * (ts[k + 1] - ts[k]) + (ts[k] - ts[k - 1]); w2 = (ts[k + 1] - ts[k]) + 2 * (ts[k] - ts[k - 1])
        return (w1 + w2) / (w1 / a + w2 / b)
    h = ts[i + 1] - ts[i]; u = (t - ts[i]) / h; u2 = u * u; u3 = u2 * u
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m(i + 1)
def bump(t, a, m, b):
    if t <= a or t >= b: return 0.0
    return E['soft'](seg(t, a, m)) if t < m else 1 - E['soft'](seg(t, m, b))

# ----------------------------------------------------------------- fonts: advances and metrics, as the browser measured them
class Font:
    def __init__(self, file):
        f = TTFont(os.path.join(ROOT, 'public', 'fonts', file + '.woff2'))
        self.upm = f['head'].unitsPerEm; self.cmap = f.getBestCmap(); self.hmtx = f['hmtx']
        self.asc, self.desc = f['hhea'].ascent, -f['hhea'].descent
        self.glyf = f['glyf'] if 'glyf' in f else None
    def width(self, s, size):
        return sum(self.hmtx[self.cmap.get(ord(c), 'space')][0] for c in s) * size / self.upm
    def ink_top(self, s, size):  # highest ink point above the baseline
        top = 0
        for c in s:
            g = self.glyf[self.cmap.get(ord(c), 'space')] if self.glyf else None
            if g is not None and hasattr(g, 'yMax'): top = max(top, g.yMax)
        return top * size / self.upm
    def ink_bottom(self, s, size):
        bot = 0
        for c in s:
            g = self.glyf[self.cmap.get(ord(c), 'space')] if self.glyf else None
            if g is not None and hasattr(g, 'yMin'): bot = min(bot, g.yMin)
        return -bot * size / self.upm
    def centre_y(self, baseline, size):  # Alight Motion centres a text layer on its line box
        return baseline - (self.asc - self.desc) / 2 * size / self.upm
INTER = {w: Font(f'inter-latin-{w}-normal') for w in (400, 500, 600)}
FRAUN = Font('fraunces-latin-400-normal')
def size_for(s, width, font): return width / font.width(s, 100) * 100

# ----------------------------------------------------------------- XML model
def col(hexrgb, a=1.0):
    h = hexrgb.lstrip('#')
    return '#%02X%s' % (round(clamp(a) * 255), h.upper())
def num(v): return '%.6f' % v
def vec(v): return ','.join(num(x) for x in v)

def reduce(samples, tol):
    """drop samples a straight line between neighbours reproduces within tol (iterative Douglas-Peucker on time series)"""
    if len(samples) <= 2: return samples
    keep = [False] * len(samples); keep[0] = keep[-1] = True
    stack = [(0, len(samples) - 1)]
    while stack:
        a, b = stack.pop()
        ta, va = samples[a]; tb, vb = samples[b]; worst, wi = 0.0, -1
        for i in range(a + 1, b):
            t, v = samples[i]; u = (t - ta) / (tb - ta)
            err = max(abs(v[j] - (va[j] + (vb[j] - va[j]) * u)) for j in range(len(v)))
            if err > worst: worst, wi = err, i
        if worst > tol and wi > 0:
            keep[wi] = True; stack += [(a, wi), (wi, b)]
    return [s for s, k in zip(samples, keep) if k]

class Layer:
    _id = 0
    def __init__(self, tag, label, t0, t1, **attrs):
        Layer._id += 1; self.id = Layer._id
        self.tag, self.label, self.t0, self.t1, self.attrs = tag, label, t0, t1, attrs
        self.tr = {}          # name -> (fn or static, dims, tol)
        self.fill = None; self.gradient = None; self.effects = []; self.decor = []; self.props = []; self.body = ''
    def anim(self, name, fn, tol):
        self.tr[name] = (fn, tol); return self
    def keyable(self, tagname, fn, tol, typ=None, pname=None):
        """static when constant over the layer's life, otherwise <kf> samples at 60 fps (t as fraction of the duration)"""
        n = max(1, round((self.t1 - self.t0) * SR))
        ts = [self.t0 + (self.t1 - self.t0) * k / n for k in range(n + 1)]
        vals = [fn(t) if callable(fn) else fn for t in ts]
        vals = [v if isinstance(v, (tuple, list)) else (v,) for v in vals]
        open_ = f'<property name="{pname}" type="{typ}"' if pname else f'<{tagname}'
        close = '</property>' if pname else f'</{tagname}>'
        if all(max(abs(a - b) for a, b in zip(v, vals[0])) < 1e-9 for v in vals):
            return f'{open_} value="{vec(vals[0])}"/>'
        ks = reduce(list(zip(ts, vals)), tol)
        span = self.t1 - self.t0
        return open_ + '>' + ''.join(f'<kf t="{num((t - self.t0) / span)}" v="{vec(v)}"/>' for t, v in ks) + close
    def xml(self, ind='  '):
        a = f'id="{self.id}" label="{esc(self.label)}" startTime="{round(self.t0 * 1000)}" endTime="{round(self.t1 * 1000)}"'
        a += ''.join(f' {k}="{v}"' for k, v in self.attrs.items())
        out = [f'{ind}<{self.tag} {a}>']
        if self.tr:
            out.append(f'{ind}  <transform>')
            for name in ('location', 'pivot', 'scale', 'rotation', 'opacity'):
                if name in self.tr:
                    fn, tol = self.tr[name]
                    out.append(f'{ind}    ' + self.keyable(name, fn, tol))
            out.append(f'{ind}  </transform>')
        if self.fill: out.append(f'{ind}  <fillColor value="{self.fill}"/>')
        if self.gradient: out.append(f'{ind}  {self.gradient}')
        for eid, params in self.effects:
            out.append(f'{ind}  <effect id="{eid}" locallyApplied="true">')
            for pname, (typ, fn, tol) in params.items():
                if typ in ('color', 'bool', 'int'):
                    out.append(f'{ind}    <property name="{pname}" type="{typ}" value="{fn}"/>')
                else:
                    out.append(f'{ind}    ' + self.keyable(None, fn, tol, typ, pname))
            out.append(f'{ind}  </effect>')
        out += [f'{ind}  {d}' for d in self.decor]  # edge decorations come before shape properties
        for p in self.props:
            out.append(f'{ind}  ' + (p if isinstance(p, str) else self.keyable(None, p[2], p[3], p[1], p[0])))
        if self.body: out.append(self.body)
        out.append(f'{ind}</{self.tag}>')
        return '\n'.join(out)
def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def shape(label, t0, t1, slug, size, loc, color=None, alpha=1.0, opacity=1.0, scale=None, radius=None, gradient=None, tol_loc=0.25):
    L = Layer('shape', label, t0, t1, fillType='gradient' if gradient else 'color', s='.' + slug)
    L.anim('location', loc, tol_loc)
    if scale is not None: L.anim('scale', scale, 0.0015)
    L.anim('opacity', opacity, 0.004)
    if color: L.fill = col(color, alpha)
    if gradient: L.gradient = gradient
    L.props.append(('size', 'vec2', size, 0.25) if callable(size) else f'<property name="size" type="vec2" value="{vec(size)}"/>')
    if radius is not None: L.props.append(f'<property name="cornerRadius" type="float" value="{num(radius)}"/>')
    return L
def contour(label, t0, t1, d, loc, color, alpha=1.0, opacity=1.0, scale=None, rotation=None):
    L = Layer('shape', label, t0, t1, fillType='color')
    L.anim('location', loc, 0.25)
    if scale is not None: L.anim('scale', scale, 0.0015)
    if rotation is not None: L.anim('rotation', rotation, 0.2)
    L.anim('opacity', opacity, 0.004)
    L.fill = col(color, alpha)
    L.body = f'    <parameter><contour d="{d}"/></parameter>'
    return L
def text(label, t0, t1, content, font, weight, size, loc, color='#F4F7F8', alpha=1.0, opacity=1.0, scale=None, wrap=None):
    fam = 'Fraunces' if font is FRAUN else 'Inter'
    w = font.width(content, size)
    L = Layer('text', label, t0, t1, fillType='color', size=num(size), font=f'googlefonts?name={fam}&amp;weight={weight}',
              wrapWidth=str(int(wrap or (w + size * 2 + 40))), align='center')
    L.anim('location', loc, 0.25)
    if scale is not None: L.anim('scale', scale, 0.0015)
    L.anim('opacity', opacity, 0.004)
    L.fill = col(color, alpha)
    L.body = f'    <content>{esc(content)}</content>'
    return L
def media_layer(label, t0, t1, sig, size, loc, opacity=1.0, scale=None):
    L = Layer('shape', label, t0, t1, fillType='media', fillImage=f'am-internal:///{sig}.png', mediaFillMode='fit', s='.rect')
    L.anim('location', loc, 0.25)
    if scale is not None: L.anim('scale', scale, 0.0015)
    L.anim('opacity', opacity, 0.004)
    L.props.append(f'<property name="size" type="vec2" value="{vec((size, size))}"/>')
    return L
def glow(L, alpha_fn, radius, color='#10B981'):
    L.effects.append(('com.alightcreative.glow', {'radius': ('float', radius, 0.5), 'alpha': ('float', alpha_fn, 0.01), 'color': ('color', col(color, 1.0), 0)}))
    return L
def blur(L, px_fn):
    # Alight Motion's Gaussian blur "strength" is not in pixels; ~px / 40 matches the look at this canvas size (approximation)
    L.effects.append(('com.alightcreative.effects.gaussianblur', {'strength': ('float', (lambda t: px_fn(t) / 40.0) if callable(px_fn) else px_fn / 40.0, 0.004)}))
    return L
def radial(start_hex, start_a, end_hex=None, end_a=0.0, centre=(0.5, 0.5), edge=(1.0, 0.5)):
    return (f'<gradient type="radial" startColor="{col(start_hex, start_a)}" endColor="{col(end_hex or start_hex, end_a)}" '
            f'start="{vec(centre)}" end="{vec(edge)}"/>')

# ----------------------------------------------------------------- assets: logo PNG (white, transparent) and audio
LOGO_PATH = re.search(r'LOGO_PATH\s*=\s*"([^"]+)"', open(os.path.join(ROOT, 'src', 'logo.ts')).read()).group(1)
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 24 24"><path d="{LOGO_PATH}" fill="#F4F7F8" fill-rule="evenodd"/></svg>'
png = bytes(resvg_py.svg_to_bytes(svg_string=svg, width=1024, height=1024))
LOGO_SIG = hashlib.sha1(png).hexdigest().upper()
open(os.path.join(OUT, f'{LOGO_SIG}.png'), 'wb').write(png)
shutil.copy(os.path.join(OUT, f'{LOGO_SIG}.png'), os.path.join(OUT, 'chatgpt_logo_white.png'))
AUDIO = os.path.join(ROOT, 'public', 'audio', 'reference.wav')
AUDIO_SIG = None
if os.path.exists(AUDIO):
    data = open(AUDIO, 'rb').read(); AUDIO_SIG = hashlib.sha1(data).hexdigest().upper()
    shutil.copy(AUDIO, os.path.join(OUT, f'{AUDIO_SIG}.wav')); shutil.copy(AUDIO, os.path.join(OUT, 'reference_audio.wav'))

layers = []   # main scene, back to front
C = dict(ink='#F4F7F8', em='#10B981', mint='#A7F3D0', cy='#67E8F9', mute='#F4F7F8')
CUTS = [0, 2.25, 7.05, 8.583, 9.95, 11.717, 12.983, DUR]

# ================================================================= light (two localized lights per shot; same keys as AstraV3)
LIGHT_A = [
    [[0, .5, .5, .1, .1, 0], [.74, .5, .5, .12, .14, 0], [.86, .55, .62, .34, .5, .75], [1.1, .72, .86, .42, .6, .85], [1.6, .53, .74, .48, .6, .9], [2.0, .5, .74, .5, .55, .88], [2.25, .6, .96, .48, .45, .75]],
    [[2.25, .56, 1.04, .32, .3, .35], [2.7, .56, .96, .36, .38, .85], [3.2, .57, .86, .38, .5, .9], [3.45, .76, .3, .44, .62, .85], [4.0, .8, .02, .44, .42, .72], [4.25, .62, 0, .5, .45, .66], [4.48, .3, .04, .5, .5, .56], [4.8, .3, .3, .48, .6, .5], [5.0, .42, .6, .38, .55, .72], [5.6, .5, .46, .26, .5, .48], [6.25, .55, .38, .26, .5, .48], [6.36, .45, .3, .32, .5, .78], [6.62, .42, .34, .34, .5, .5], [7.05, .3, .06, .5, .5, .6]],
    [[7.05, 1.03, .86, .24, .5, 0], [7.14, 1.03, .8, .32, .62, .7], [7.6, 1.03, .64, .36, .62, .95], [8.2, 1.03, .46, .36, .62, 1.0], [8.45, 1.03, .4, .36, .6, .9], [8.583, 1.03, .38, .36, .6, .35]],
    [[8.583, 1.03, -.03, .4, .46, .85], [9.3, 1.02, -.03, .42, .5, .88], [9.95, 1.0, -.02, .42, .5, .88]],
    [[9.95, 1.0, -.02, .42, .5, .88], [11.45, .98, 0, .42, .5, .85], [11.62, .98, 0, .42, .5, .35], [11.717, .98, 0, .42, .5, .1]],
    None, None]
LIGHT_B = [None,
    [[2.25, .9, -.05, .3, .3, 0], [3.4, .9, -.05, .3, .3, .15], [7.05, .9, -.05, .3, .3, .1]],
    None,
    [[8.583, .45, 1.06, .3, .26, .6], [9.2, .3, 1.06, .3, .3, .7], [9.36, .06, 1.03, .33, .36, .95], [9.95, .05, 1.03, .33, .36, .95]],
    [[9.95, .05, 1.03, .33, .36, .95], [11.45, .04, 1.02, .33, .36, .95], [11.62, .04, 1.02, .33, .36, .4], [11.717, .04, 1.02, .33, .36, .1]],
    None, None]
def light_layers(keys, colour, peak, name):
    for si, ks in enumerate(keys):
        if not ks: continue
        ts = [k[0] for k in ks]
        g = lambda t, j, ks=ks, ts=ts: mono(t, ts, [k[j] for k in ks])
        # a linear radial gradient that reaches 0 at 0.75 r approximates the composition's gaussian-like falloff
        layers.append(shape(f'Light {name} · shot {si + 1}', CUTS[si], CUTS[si + 1], 'rect', (200, 200),
                            lambda t, g=g: (g(t, 1) * W, g(t, 2) * H), opacity=lambda t, g=g: clamp(g(t, 5)),
                            scale=lambda t, g=g: (g(t, 3) * W * 2 * 0.75 / 200, g(t, 4) * H * 2 * 0.75 / 200),
                            gradient=radial(colour, peak, colour, 0.0)))
light_layers(LIGHT_A, '0E7052', 0.92, 'A')
light_layers(LIGHT_B, '108068', 0.85, 'B')

# ================================================================= 1 · night (0 – 1.0)
sky = lambda t: 1 - E['soft'](seg(t, 0.72, 0.92))
layers.append(shape('Night sky', 0, 1.0, 'rect', (W, H), (CX, CY), opacity=sky,
                    gradient='<gradient type="linear" startColor="#FF071019" endColor="#FF071015" start="0.500000,0.000000" end="0.500000,1.000000"/>'))
for i in range(70):
    r = lambda n, i=i: (lambda x: x - math.floor(x))(math.sin(i * 127.1 + n * 311.7) * 43758.5453)
    sx, sy, ss, sp = r(1) * W, r(2) * H, 0.6 + r(3) * 1.5, r(4) * 6.3
    layers.append(shape(f'Star {i + 1}', 0, 1.0, 'circle', (2 * ss, 2 * ss), lambda t, sx=sx, sy=sy: (sx, sy - 40 * t), color='#E8F4FF',
                        opacity=lambda t, sp=sp: sky(t) * E['soft'](seg(t, 0.08, 0.3)) * (0.28 + 0.3 * math.sin(t * 5 + sp))))
MOON_T = [0.033, 0.067, 0.1] + REF['MOON']['t'] + [0.733]
MOON_Y = [0.76, 0.72, 0.66] + REF['MOON']['cy'] + [0.5]
MOON_R = [0.12, 0.135, 0.145] + REF['MOON']['r'] + [0.176]
moonIn = lambda t: E['soft'](seg(t, 0.02, 0.17))
mglow = lambda t: E['soft'](seg(t, 0.58, 0.74))
toLogo = lambda t: seg(t, 0.745, 0.785)
mR = lambda t: mono(t, MOON_T, MOON_R) * H
mY = lambda t: mono(t, MOON_T, MOON_Y) * H
RMAX = 0.176 * H
moon = shape('Moon', 0, 0.8, 'circle', (2 * RMAX, 2 * RMAX), lambda t: (CX, mY(t)), opacity=lambda t: moonIn(t) * (1 - toLogo(t)),
             scale=lambda t: (mR(t) / RMAX, mR(t) / RMAX), gradient=radial('FFFFFF', 1, 'B9C7CA', 1, (0.42, 0.38), (1.0, 0.5)))
glow(moon, lambda t: 0.1 + 0.6 * mglow(t), lambda t: 20 + 160 * mglow(t), '#A7F3D0')
layers.append(moon)
part = lambda t: E['soft'](seg(t, 0.6, 0.82))
cloudO = lambda t: (1 - E['soft'](seg(t, 0.8, 1.0))) * moonIn(t)
PUFFS = [(0, 30, 70), (52, 0, 92), (126, 14, 74), (178, 38, 52), (30, 48, 64), (104, 48, 70), (152, 56, 50)]
for ci, (dxr, dyr, k, travel, o) in enumerate([(-1.55, 0.25, 1.75, -0.36, 0.95), (0.55, -1.05, 1.0, 0.3, 0.9)]):
    for pi, (px, py, pr) in enumerate(PUFFS):
        layers.append(shape(f'Cloud {ci + 1} puff {pi + 1}', 0, 1.0, 'circle', (pr * k, pr * k),
                            lambda t, px=px, py=py, pr=pr, dxr=dxr, dyr=dyr, k=k, travel=travel: (CX + mR(t) * dxr + travel * W * part(t) + (px + pr / 2) * k, mY(t) + mR(t) * dyr + (py + pr / 2) * k),
                            opacity=lambda t, o=o: cloudO(t) * o, gradient=radial('E6EEF2', 1, '93A9B6', 1, (0.4, 0.3), (1.0, 0.5))))

# ================================================================= 2 · logo + ChatGPT (0.72 – 2.25)
WORD, WS = 'ChatGPT', 252
LOGO_CORE = 0.161 * W
ww = FRAUN.width(WORD, WS); gap = 0.0615 * W
left = (W - (LOGO_CORE + gap + ww)) / 2
logoCX, wordX = left + LOGO_CORE / 2, left + LOGO_CORE + gap
BL = REF['BRAND_LOGO']
x0r, x1r = BL['x'][0], BL['x'][len(BL['x']) - 12]
lx = lambda t: lerp(CX, logoCX, clamp((mono(t, BL['t'], BL['x']) - x0r) / (x1r - x0r), -0.05, 1.05))
ly = lambda t: mono(t, BL['t'], BL['y']) * H
bloom = lambda t: 1 - E['soft'](seg(t, 0.75, 1.0))
logoIn = lambda t: E['out'](seg(t, 0.742, 0.78))
lscale = lambda t: max(1.0, mono(t, BL['t'], BL['size']) * W / LOGO_CORE) if t < 0.97 else 1.0
layers.append(shape('Logo bloom', 0.72, 1.05, 'circle', (0.4 * W, 0.4 * W), lambda t: (lx(t), ly(t)), opacity=lambda t: bloom(t) * logoIn(t),
                    gradient=radial('A7F3D0', 0.55, '10B981', 0.0)))
L = media_layer('ChatGPT logo (lockup)', 0.72, 2.25, LOGO_SIG, LOGO_CORE, lambda t: (lx(t), ly(t)), opacity=logoIn, scale=lambda t: (lscale(t), lscale(t)))
glow(L, lambda t: clamp(0.25 + 0.6 * bloom(t)), lambda t: LOGO_CORE * (0.12 + 0.2 * bloom(t)))
layers.append(L)
LETTER_AT = [1.29 + i * 0.37 / (len(WORD) - 1) for i in range(len(WORD))]
LO = REF['LETTER_OFFSET']
baseline = 0.4944 * H + FRAUN.ink_top(WORD, WS) / 2
pen = wordX
for i, ch in enumerate(WORD):
    adv = FRAUN.width(ch, WS); cx_ = pen + adv / 2; pen += adv
    a = LETTER_AT[i]
    L = text(f'Wordmark {ch}', a, 2.25, ch, FRAUN, 400, WS,
             lambda t, cx_=cx_, a=a: (cx_ + (lx(t) - logoCX) + mono(t - a, LO['t'], LO['dx']) * W, FRAUN.centre_y(baseline, WS) + ly(t) - 0.4944 * H),
             opacity=lambda t, a=a: E['out'](seg(t - a, 0, 0.14)))
    blur(L, lambda t, a=a: 9 * (1 - E['out'](seg(t - a, 0, 0.22))))
    glow(L, lambda t, a=a: 0.18 + 0.45 * (1 - E['out'](seg(t - a, 0, 0.14))), 30)
    layers.append(L)

# ================================================================= 3 · chat UI in a nested scene; its transform is the measured camera
UI0, UI1 = 2.25, 7.05
ui = []  # inner layers, times relative to the nested scene
def u(t): return t + UI0  # inner time → absolute time for formulas
BOX = dict(x=370.5, y=489, w=1171.5, h=213, r=36)
GREET = dict(logoCX=772.5, cy=379.5, textX=832.5, textW=331.5)
PH = dict(x=410, cy=544.5, size=30)
PILL = dict(right=1428, cy=645)
MENU = dict(x=1146, y=673.5, w=343.5, h=375)
RING = dict(cx=1327.5, cy=864, r=285)
ITEM_TOP, ITEM_H = 12, 58
itemY = lambda i: MENU['y'] + ITEM_TOP + i * ITEM_H
D = UI1 - UI0
ui.append(media_layer('Greeting logo', 0, D, LOGO_SIG, 78, (GREET['logoCX'], GREET['cy'])))
glow(ui[-1], 0.3, 18)
GS = size_for('Welcome', GREET['textW'], FRAUN)
ui.append(text('Welcome', 0, D, 'Welcome', FRAUN, 400, GS, (GREET['textX'] + GREET['textW'] / 2, FRAUN.centre_y(GREET['cy'] + FRAUN.ink_top('Welcome', GS) / 2, GS))))
box = shape('Input box', 0, D, 'roundrect', (BOX['w'], BOX['h']), (BOX['x'] + BOX['w'] / 2, BOX['y'] + BOX['h'] / 2), color='060E0D', alpha=0.55, radius=BOX['r'])
box.decor += [f'<border direction="centered" color="{col(C["mint"], 0.55)}" size="1.600000"/>',
              f'<glow direction="outside" color="{col(C["em"], 1)}" opacity="0.350000" size="14.000000" hardness="0.300000"/>']
ui.append(box)
# typing: one layer per typed state (typed text + what is left of the placeholder), caret blinks after the last key
PROMPT, PLACE = 'Help me build a dashboard', 'Ask anything'
KEYS = [3.533 + (i / len(PROMPT)) * 0.36 + (((i * 7) % 3) - 1) * 0.004 for i in range(len(PROMPT))]
f400 = INTER[400]
base_ph = PH['cy'] + f400.ink_top('Hg', PH['size']) / 2 - 2
edges = [UI0] + KEYS + [UI1]
for n in range(len(PROMPT) + 1):
    a, b = edges[n] - UI0, edges[n + 1] - UI0
    if b - a <= 0: continue
    typed = PROMPT[:n]; wt = f400.width(typed, PH['size'])
    if typed:
        ui.append(text(f'Typed {n}', a, b, typed, f400, 400, PH['size'], (PH['x'] + wt / 2, f400.centre_y(base_ph, PH['size']))))
    rest = PLACE[n:]
    if rest:
        wr = f400.width(rest, PH['size']); x = PH['x'] + wt + 4.5
        ui.append(text(f'Placeholder {n}', a, b, rest, f400, 400, PH['size'], (x + wr / 2, f400.centre_y(base_ph, PH['size'])), alpha=0.52))
    last = KEYS[n - 1] if n else 2.9
    caret_vis = lambda t, last=last: 1.0 if (u(t) > 2.9 and (u(t) - last < 0.3 or math.floor((u(t) - last) / 0.42) % 2 == 1)) else 0.0
    ui.append(shape(f'Caret {n}', a, b, 'rect', (2.5, PH['size'] * 1.05), (PH['x'] + wt + 2.25, PH['cy'] - 1), color=C['ink'], opacity=caret_vis))
ui.append(shape('Plus h', 0, D, 'rect', (22, 2), (430.5, PILL['cy']), color=C['ink'], alpha=0.85))
ui.append(shape('Plus v', 0, D, 'rect', (2, 22), (430.5, PILL['cy']), color=C['ink'], alpha=0.85))
for k, (bx, bh) in enumerate(zip([4, 7.5, 11, 14.5, 18], [3, 6, 8, 6, 3])):
    ui.append(shape(f'Voice bar {k + 1}', 0, D, 'roundrect', (2.8, bh * 2 * 40 / 24), (1465 + bx * 40 / 24, PILL['cy']), color=C['ink'], radius=1.4))
# selector
pillOn = lambda t: E['soft'](seg(u(t), 4.8, 4.86))
flash = lambda t: bump(u(t), 6.29, 6.37, 6.6)
menuH = lambda t: E['expo'](seg(u(t), 4.867, 5.0)) * (1 - E['inn'](seg(u(t), 6.62, 6.76)))
menuO = lambda t: E['soft'](seg(u(t), 4.86, 4.92)) * (1 - E['soft'](seg(u(t), 6.62, 6.76)))
PICK = 6.36 - UI0
f500 = INTER[500]
for lab, a, b, colr in (('GPT-6', 0, PICK, C['ink']), ('GPT Astra 6', PICK, D, C['cy'])):
    lw = f500.width(lab, 25) + 26
    pc = PILL['right'] + 10 - lw / 2
    ui.append(shape(f'Selector pill ({lab})', a, b, 'roundrect', (lw, 44), (pc, PILL['cy']), color=C['em'], radius=10,
                    opacity=lambda t, picked=(lab != 'GPT-6'): clamp(0.22 * pillOn(t) * (0.6 if picked else 1) + 0.3 * flash(t))))
    tw = f500.width(lab, 25)
    ui.append(text(f'Selector label ({lab})', a, b, lab, f500, 500, 25, (pc - 10.5, f500.centre_y(PILL['cy'] + f500.ink_top('GPT', 25) / 2, 25)), color=colr))
    chev = 'M -5.5 -2.5 L -4.1 -3.9 L 0 0.2 L 4.1 -3.9 L 5.5 -2.5 L 0 3.0 Z'
    ui.append(contour(f'Selector chevron ({lab})', a, b, chev, (pc - 10.5 + tw / 2 + 14, PILL['cy']), colr, rotation=lambda t: 180 * menuO(t)))
# chips (space-between across the measured row)
CHIPS = ['Write', 'Code', 'Analyze', 'Create', 'Learn']
cw = [f400.width(c, 25) + 52 for c in CHIPS]
gapc = ((1365 - 541.5) - sum(cw)) / (len(CHIPS) - 1)
x = 541.5
for i, (c, w_) in enumerate(zip(CHIPS, cw)):
    chipIn = lambda t, i=i: E['out'](seg(u(t), 2.27 + i * 0.055, 2.42 + i * 0.055))
    ch = shape(f'Chip {c}', 0, D, 'roundrect', (w_, 52), lambda t, x=x, w_=w_, ci=chipIn: (x + w_ / 2, 764 + 10 * (1 - ci(t))), color='000000', alpha=0.0, radius=13, opacity=chipIn)
    ch.decor.append(f'<border direction="centered" color="{col(C["mint"], 0.5)}" size="1.500000"/>')
    ui.append(ch)
    ui.append(text(f'Chip label {c}', 0, D, c, f400, 400, 25, lambda t, x=x, w_=w_, ci=chipIn: (x + w_ / 2, f400.centre_y(764 + f400.ink_top('Wd', 25) / 2, 25) + 10 * (1 - ci(t))), opacity=chipIn))
    x += w_ + gapc
# ring around the opening menu
ringO = lambda t: E['soft'](seg(u(t), 4.93, 5.03)) * (1 - E['soft'](seg(u(t), 5.2, 5.43)))
ringS = lambda t: lerp(0.9, 1.06, E['out'](seg(u(t), 4.93, 5.43)))
ring = shape('Menu ring', 4.9 - UI0, 5.45 - UI0, 'circle', (2 * RING['r'], 2 * RING['r']), (RING['cx'], RING['cy']), color='000000', alpha=0.0,
             opacity=ringO, scale=lambda t: (ringS(t), ringS(t)))
ring.decor.append(f'<border direction="centered" color="{col(C["em"], 0.42)}" size="70.000000"/>')
blur(ring, 10)
ui.append(ring)
# dropdown
MT0, MT1 = 4.86 - UI0, 6.78 - UI0
menu = shape('Menu', MT0, MT1, 'roundrect', lambda t: (MENU['w'], max(1.0, MENU['h'] * menuH(t))), lambda t: (MENU['x'] + MENU['w'] / 2, MENU['y'] + MENU['h'] * menuH(t) / 2),
             color='111B1D', alpha=0.97, radius=18, opacity=menuO)
menu.decor += [f'<border direction="inside" color="{col(C["mint"], 0.42)}" size="1.400000"/>',
               f'<shadow direction="outside" color="#000000" opacity="0.600000" size="60.000000" hardness="0.300000" offset="0.000000,24.000000"/>']
ui.append(menu)
HOVER = [(5.433, 1), (5.6, 1), (5.68, 2), (5.78, 2), (5.86, 3), (5.9, 3), (5.97, 4)]
hov = lambda t: mono(u(t), [h[0] for h in HOVER], [h[1] for h in HOVER])
hovO = lambda t: E['soft'](seg(u(t), 5.42, 5.5)) * (1 - E['soft'](seg(u(t), 6.6, 6.67)))
hl = shape('Menu highlight', 5.4 - UI0, 6.7 - UI0, 'roundrect', (MENU['w'] - 20, ITEM_H - 4), lambda t: (MENU['x'] + MENU['w'] / 2, itemY(hov(t)) + (ITEM_H - 4) / 2),
           color=C['em'], radius=11, opacity=lambda t: hovO(t) * menuO(t) * clamp(0.2 + 0.45 * flash(t)) / 0.65)
hl.decor.append(f'<border direction="inside" color="{col(C["mint"], 0.5)}" size="1.000000"/>')
glow(hl, lambda t: 0.8 * flash(t), 40)
ui.append(hl)
MODELS = [('GPT-6', 'Latest model', False), ('GPT-6 Pro', 'Pro reasoning', False), ('GPT-5.6 Sol', 'Earlier model', False),
          ('GPT-5.6 Luna', 'Free and Go default', False), ('GPT Astra 6', 'Concept', True)]
for i, (name, desc, concept) in enumerate(MODELS):
    rowO = lambda t, i=i: E['out'](seg(u(t), 4.9 + i * 0.045, 5.0 + i * 0.045)) * menuO(t)
    cyc = itemY(i) + (ITEM_H - 4) / 2
    nw = f500.width(name, 20)
    ui.append(text(f'Model {name}', MT0, MT1, name, f500, 500, 20, (MENU['x'] + 24 + nw / 2, f500.centre_y(cyc - 1, 20)), color=C['cy'] if concept else C['ink'], opacity=rowO))
    dw = f400.width(desc, 15.5)
    ui.append(text(f'Model {name} note', MT0, MT1, desc, f400, 400, 15.5, (MENU['x'] + 24 + dw / 2, f400.centre_y(cyc + 18, 15.5)), alpha=0.72, opacity=rowO))
    if concept:
        tx = MENU['x'] + 24 + nw + 9
        tg = shape('CONCEPT tag', MT0, MT1, 'roundrect', (f600w := INTER[600].width('CONCEPT', 12) + 14, 20), (tx + f600w / 2, cyc - 10), color='000000', alpha=0.0, radius=6, opacity=rowO)
        tg.decor.append(f'<border direction="inside" color="{col(C["em"], 0.7)}" size="1.000000"/>')
        ui.append(tg)
        ui.append(text('CONCEPT', MT0, MT1, 'CONCEPT', INTER[600], 600, 12, (tx + f600w / 2, INTER[600].centre_y(cyc - 10 + 4.5, 12)), color=C['em'], opacity=rowO))
TICK = 'M -7 0.5 L -5 -1.5 L -2 1.5 L 5.5 -6 L 7.5 -4 L -2 5.5 Z'
ui.append(contour('Check (GPT-6)', MT0, PICK, TICK, (MENU['x'] + MENU['w'] - 20 - 9 - 6 + 9, itemY(0) + (ITEM_H - 4) / 2), C['em'], opacity=lambda t: E['out'](seg(u(t), 4.9, 5.0)) * menuO(t)))
ui.append(contour('Check (GPT Astra 6)', PICK, MT1, TICK, (MENU['x'] + MENU['w'] - 20 - 9 - 6 + 9, itemY(4) + (ITEM_H - 4) / 2), C['em'], opacity=menuO))
ui.append(shape('Menu separator', MT0, MT1, 'rect', (MENU['w'] - 32, 1.2), (MENU['x'] + MENU['w'] / 2, itemY(5) + 4.6), color=C['ink'], alpha=0.16,
                opacity=lambda t: E['out'](seg(u(t), 5.08, 5.16)) * menuO(t)))
thO = lambda t: E['out'](seg(u(t), 5.1, 5.2)) * menuO(t)
ui.append(text('Thinking', MT0, MT1, 'Thinking', f400, 400, 18, (MENU['x'] + 24 + f400.width('Thinking', 18) / 2, f400.centre_y(itemY(5) + 35 + 6, 18)), alpha=0.82, opacity=thO))
mw = f400.width('Medium ›', 18)
ui.append(text('Medium', MT0, MT1, 'Medium ›', f400, 400, 18, (MENU['x'] + MENU['w'] - 22 - mw / 2, f400.centre_y(itemY(5) + 35 + 6, 18)), alpha=0.52, opacity=thO))
# pointer
curT = [4.55, 4.8, 4.86, 5.25, 5.433, 5.6, 5.68, 5.78, 5.86, 5.9, 5.97, 6.3, 6.6, 6.9]
curX = [PILL['right'] + 160, PILL['right'] - 50, PILL['right'] - 52, MENU['x'] + 250, MENU['x'] + 236, MENU['x'] + 236, MENU['x'] + 228, MENU['x'] + 228, MENU['x'] + 236, MENU['x'] + 236, MENU['x'] + 226, MENU['x'] + 228, MENU['x'] + 232, PILL['right'] - 30]
curY = [PILL['cy'] + 150, PILL['cy'] + 6, PILL['cy'] + 8, itemY(1) + 70, itemY(1) + 34, itemY(1) + 34, itemY(2) + 32, itemY(2) + 32, itemY(3) + 34, itemY(3) + 34, itemY(4) + 32, itemY(4) + 32, itemY(4) + 30, PILL['cy'] + 40]
press = lambda t: bump(u(t), 4.8, 4.835, 4.92) + bump(u(t), 6.27, 6.3, 6.38)
ARROW = 'M 0 0 L 16.9 11.5 L 9.3 13.0 L 13.8 21.5 L 10.5 23.3 L 6.0 14.6 L 0 19.8 Z'
cur = contour('Pointer', 4.5 - UI0, 6.92 - UI0, ARROW, lambda t: (mono(u(t), curT, curX), mono(u(t), curT, curY)), '#FFFFFF',
              opacity=lambda t: E['soft'](seg(u(t), 4.5, 4.62)) * (1 - E['soft'](seg(u(t), 6.75, 6.9))), scale=lambda t: (1 - 0.12 * press(t),) * 2)
cur.decor += [f'<border direction="centered" color="#FF0B1013" size="1.600000"/>', '<shadow direction="outside" color="#000000" opacity="0.600000" size="6.000000" hardness="0.400000" offset="0.000000,3.000000"/>']
ui.append(cur)

def nested(label, t0, t1, inner, loc, scale, mblur=None):
    L = Layer('embedScene', label, t0, t1)
    L.anim('location', loc, 0.2); L.anim('scale', scale, 0.0008)
    if mblur:
        L.effects.append(('com.alightcreative.effects.motionblur4', {'tune': ('float', mblur, 0.01)}))
    body = (f'    <scene title="{esc(label)}" width="{W}" height="{H}" exportWidth="{W}" exportHeight="{H}" bgcolor="#00000000" '
            f'totalTime="{round((t1 - t0) * 1000)}" fps="60" ffver="106" amver="1028425" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android">\n'
            + '\n'.join(x.xml('      ') for x in inner) + '\n    </scene>')
    L.body = body
    return L
UC = REF['UI_CAM']
layers.append(nested('Chat UI (camera)', UI0, UI1, ui,
                     lambda t: (mono(t, UC['t'], UC['cx'], True) * W, mono(t, UC['t'], UC['cy'], True) * H),
                     lambda t: (mono(t, UC['t'], UC['s'], True),) * 2, mblur=0.6))

# ================================================================= 4 · code (nested scene, scaled about the frame centre)
C0, C1 = 7.05, 8.583
code = []
CODE = open(os.path.join(ROOT, 'src', 'AstraV3.tsx')).read()
CODE = [eval(s) for s in re.findall(r"^\s+('(?:[^'\\]|\\.)*'),\s*$", CODE[CODE.index('const CODE = ['):CODE.index('\n];', CODE.index('const CODE = ['))], re.M)]
CL = dict(logoCX=267, logoCY=196.5, logo=48, x=307.5, firstCY=195, pitch=24.4, size=20.5, promptRight=1606.5, promptCY=135, promptSize=38)
vis = lambda t: E['soft'](seg(t + C0, 7.14, 7.2))
pw = f400.width(PROMPT, CL['promptSize'])
code.append(text('Prompt', 0.09, C1 - C0, PROMPT, f400, 400, CL['promptSize'], (CL['promptRight'] - pw / 2, f400.centre_y(CL['promptCY'] + f400.ink_top('Hp', 38) / 2, 38)), opacity=vis))
code.append(media_layer('Logo (reply)', 0.09, C1 - C0, LOGO_SIG, CL['logo'], (CL['logoCX'], CL['logoCY']), opacity=vis))
glow(code[-1], 0.6, 14)
for i, line in enumerate(CODE):
    if not line: continue
    a, d = 7.167 + i * 0.0156, 7.6 + i * 0.021
    o = lambda t, a=a: E['out'](seg(t + C0, a, a + 0.1)) * vis(t)
    lit = lambda t, d=d: 1 - E['soft'](seg(t + C0, d, d + 0.12))
    lw = f400.width(line, CL['size'])
    comment = line.strip().startswith('//')
    L = text(f'Code line {i + 1}', a - C0, C1 - C0, line, f400, 400, CL['size'], (CL['x'] + lw / 2, f400.centre_y(CL['firstCY'] + i * CL['pitch'] + f400.ink_top('Hd', CL['size']) / 2, CL['size'])),
             alpha=0.68 if comment else 1.0, opacity=o)
    glow(L, lambda t, lit=lit: 0.95 * lit(t), 14)
    code.append(L)
CC = REF['CODE_CAM']
layers.append(nested('Code (camera)', C0, C1, code, (CX, CY), lambda t: (mono(t, CC['t'], CC['s']),) * 2, mblur=0.6))

# ================================================================= 5 · capability words (main scene; letter positions include the measured scale)
WRITING_W, ANALYSIS_W, CODING_W, RESEARCH_W = 0.1773 * W, 0.2039 * W, 0.1688 * W, 0.2859 * W
SW = size_for('Writing', WRITING_W, f400)
second = '& analysis'
extra = f400.width(second, SW) - ANALYSIS_W
lineCY = 0.4979 * H
WSc, WX0, AX0 = REF['WRITING_SCALE'], REF['WRITING_X0'], REF['ANALYSIS_X0']
ws = lambda t: mono(t, WSc['t'], WSc['s'])
pshift = lambda t: clamp((WX0['x'][10] * W - mono(t, WX0['t'], WX0['x']) * W) / ((WX0['x'][10] - WX0['x'][22]) * W))
wx0 = lambda t: (0.503 * W - ws(t) * WRITING_W / 2 if t < 8.867 else mono(t, WX0['t'], WX0['x']) * W) - extra / 2 * pshift(t) * ws(t)
ax0 = lambda t: mono(t, AX0['t'], AX0['x']) * W - extra / 2 * pshift(t) * ws(t)
wbase = lineCY + (f400.ink_top('Writing', SW) - f400.ink_bottom('Writing', SW)) / 2
wy = f400.centre_y(wbase, SW)
pen = 0
WT = [8.555, 8.565, 8.633, 8.667, 8.7, 8.733, 8.767]
for i, ch in enumerate('Writing'):
    adv = f400.width(ch, SW); c_ = pen + adv / 2; pen += adv
    a = WT[i]
    L = text(f'Writing {ch}{i}', max(8.583, a), 9.95, ch, f400, 400, SW,
             lambda t, c_=c_: (wx0(t) + ws(t) * c_, lineCY + ws(t) * (wy - lineCY)), scale=lambda t: (ws(t), ws(t)),
             opacity=lambda t, a=a: E['out'](seg(t - a, 0, 0.03)))
    blur(L, lambda t, a=a: 4 * (1 - E['out'](seg(t - a, 0, 0.1))) * ws(t))
    glow(L, lambda t, a=a: clamp(1.3 * math.exp(-max(0, t - a) / 0.12)), 36)
    layers.append(L)
aw = f400.width(second, SW)
L = text('& analysis', 9.267, 9.95, second, f400, 400, SW, lambda t: (ax0(t) + ws(t) * aw / 2, lineCY + ws(t) * (wy - lineCY)), scale=lambda t: (ws(t), ws(t)))
blur(L, lambda t: 3 * (1 - E['out'](seg(t - 9.267, 0, 0.08))))
glow(L, lambda t: clamp(1.1 * math.exp(-(t - 9.267) / 0.1)), 36)
layers.append(L)
SC = size_for('Coding', CODING_W, f400)
CX0, CZ = REF['CODING_X0'], REF['CODING_ZOOM']
cx0 = lambda t: mono(t, CX0['t'], CX0['x']) * W
cz = lambda t: (mono(t, CZ['t'], CZ['s'], True) * (1 + 1.2 * (t - 10.7)) if t > 10.7 else mono(t, CZ['t'], CZ['s'], True))
cyC = f400.centre_y(0.5 * H + (f400.ink_top('Coding', SC) - f400.ink_bottom('Coding', SC)) / 2, SC)
order = [2, 5, 0, 3, 1, 4]
pen = 0
for i, ch in enumerate('Coding'):
    adv = f400.width(ch, SC); c_ = pen + adv / 2; pen += adv
    d = 10.63 + order.index(i) * 0.022
    centre = lambda t: cx0(t) + CODING_W / 2
    L = text(f'Coding {ch}{i}', 9.95, min(10.78, d + 0.07), ch, f400, 400, SC,
             lambda t, c_=c_: (centre(t) + cz(t) * (cx0(t) + c_ - centre(t)), 0.5 * H + cz(t) * (cyC - 0.5 * H)), scale=lambda t: (cz(t), cz(t)),
             opacity=lambda t, d=d: 1 - seg(t, d, d + 0.06))
    blur(L, lambda t, d=d: 6 * seg(t, d, d + 0.06))
    layers.append(L)
SR_ = size_for('Research', RESEARCH_W, f400)
rx0, rcy = 0.357 * W, 0.4889 * H
RSH = REF['RESEARCH_SHRINK']
rs = lambda t: mono(t, RSH['t'], RSH['s'])
rcen = rx0 + RESEARCH_W / 2
ry = f400.centre_y(rcy + (f400.ink_top('Research', SR_) - f400.ink_bottom('Research', SR_)) / 2, SR_)
R_APPEAR = [10.78, 10.81, 10.875, 10.875, 10.78, 10.845, 10.845, 10.845]
pen = 0
for i, ch in enumerate('Research'):
    adv = f400.width(ch, SR_); c_ = rx0 + pen + adv / 2; pen += adv
    a = R_APPEAR[i]
    dx = lambda t, a=a: 0.0086 * W * (1 - E['out'](seg(t - a, 0, 0.15)))
    L = text(f'Research {ch}{i}', a, 11.717, ch, f400, 400, SR_,
             lambda t, c_=c_, dx=dx: (rcen + rs(t) * (c_ + dx(t) - rcen), rcy + rs(t) * (ry - rcy)), scale=lambda t: (rs(t), rs(t)),
             opacity=lambda t, a=a: E['out'](seg(t - a, 0, 0.035)))
    blur(L, lambda t, a=a: 6 * (1 - E['out'](seg(t - a, 0, 0.12))))
    glow(L, lambda t, a=a: clamp(1.35 * math.exp(-max(0, t - a) / 0.11)), 36)
    layers.append(L)

# ================================================================= 6 · logo flash → measured shrink (11.717 – 12.983)
EL = REF['END_LOGO']
esz = lambda t: max(0.0, mono(t, [11.717] + EL['t'], [0.25] + EL['size']) * W * 1.035)
ebloom = lambda t: 1 - E['soft'](seg(t, 11.717, 11.96))
BASE = 0.25 * W * 1.035
layers.append(shape('End logo bloom', 11.717, 12.0, 'circle', (2.2 * BASE, 2.2 * BASE), (CX, 0.496 * H), opacity=ebloom, scale=lambda t: (esz(t) / BASE,) * 2,
                    gradient=radial('A7F3D0', 0.5, '10B981', 0.0)))
L = media_layer('End logo', 11.717, 12.983, LOGO_SIG, BASE, (CX, 0.496 * H), scale=lambda t: (max(0.001, esz(t) / BASE),) * 2)
glow(L, lambda t: clamp(0.2 + 0.8 * ebloom(t)), lambda t: BASE * 0.15 * (0.3 + ebloom(t)))
layers.append(L)

# ================================================================= 7 · outro (12.983 – end): measured end-card scale; credit with a soft entrance
ECd = REF['END_CARD']
es = lambda t: mono(t, ECd['t'], ECd['s'])
oc = (CX, 0.47 * H)
grp = lambda p: (lambda t: (oc[0] + es(t) * (p[0] - oc[0]), oc[1] + es(t) * (p[1] - oc[1])))
L = media_layer('Outro logo', 12.983, DUR, LOGO_SIG, 150, grp((CX, 0.47 * H - 75)), scale=lambda t: (es(t), es(t)))
glow(L, 0.35, 22)
layers.append(L)
title_base = 0.47 * H + 34 + (66 - (FRAUN.asc + FRAUN.desc) / FRAUN.upm * 66) / 2 + FRAUN.asc / FRAUN.upm * 66
layers.append(text('GPT Astra 6', 12.983, DUR, 'GPT Astra 6', FRAUN, 400, 66, grp((CX, FRAUN.centre_y(title_base, 66))), scale=lambda t: (es(t), es(t))))
credit = lambda t: E['out'](seg(t, 13.2, 13.5))
cb = 0.47 * H + 138 + (26 - (f500.asc + f500.desc) / f500.upm * 26) / 2 + f500.asc / f500.upm * 26
L = text('Created by @h81t6', 12.983, DUR, 'Created by @h81t6', f500, 500, 26, lambda t: (CX, f500.centre_y(cb, 26) + 12 * (1 - credit(t))), alpha=0.78, opacity=credit)
blur(L, lambda t: 4 * (1 - credit(t)))
layers.append(L)
fm = f400.width('FAN-MADE CONCEPT', 16)
layers.append(text('Fan-made label', 0, 0.95, 'FAN-MADE CONCEPT', f400, 400, 16, (W - 40 - fm / 2, f400.centre_y(H - 32 - 4, 16)), alpha=0.42, opacity=lambda t: 1 - seg(t, 0.7, 0.95)))

# ================================================================= audio + document
media = [f'  <media uri="am-internal:///{LOGO_SIG}.png" filename="{LOGO_SIG}.png" title="chatgpt_logo_white" type="image/png" size="{len(png)}" sig="{LOGO_SIG}" width="1024" height="1024"/>']
if AUDIO_SIG:
    media.append(f'  <media uri="am-internal:///{AUDIO_SIG}.wav" filename="{AUDIO_SIG}.wav" title="reference_audio" type="audio/wav" size="{os.path.getsize(AUDIO)}" duration="14017" sig="{AUDIO_SIG}"/>')
    au = Layer('audio', 'Reference audio (original song)', 0, 14.017, src=f'am-internal:///{AUDIO_SIG}.wav', inTime='0', outTime='14017')
    layers.insert(0, au)
total_ms = round(DUR * 1000)
doc = ['<?xml version=\'1.0\' encoding=\'UTF-8\' ?>',
       '<!-- GPT Astra 6 (fan-made concept) v3. Generated by gpt-astra/alight/build_alight_xml.py from the measured timing map. -->',
       f'<scene title="GPT Astra 6 v3" width="{W}" height="{H}" exportWidth="{W}" exportHeight="{H}" precompose="dynamicResolution" bgcolor="#FF010303" '
       f'totalTime="{total_ms}" fps="60" modifiedTime="1792000000000" amver="1028425" ffver="106" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android">']
doc += media + [l.xml('  ') for l in layers] + ['</scene>']
xml = '\n'.join(doc) + '\n'
open(os.path.join(OUT, 'GPT_Astra_6_v3.xml'), 'w').write(xml)
def count(ls): return sum(1 + (count(getattr(l, 'inner', [])) if False else 0) for l in ls)
print(f'layers: main {len(layers)}, ui {len(ui)}, code {len(code)}; keyframes {xml.count("<kf ")}; {len(xml) / 1e6:.2f} MB')
