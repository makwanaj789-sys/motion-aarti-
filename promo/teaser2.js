/* AartiMusic teaser v2 — retimed frame-for-frame to the supplied reference cut,
   so its soundtrack lands on the same beats. Times are written in frames (30 fps).
   Renders 16:9 (?w=1920&h=1080) and 9:16 (?w=1080&h=1920). */
(async function () {
'use strict';
const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 1920), H = +(qs.get('h') || 1080), V = W < H;
const R = await (await fetch('cap3/rects.json')).json();
const FPS = 30, END = 340 / FPS;
const f = (n) => n / FPS;   // frame number -> seconds
const Q = 'om jai jagdish hare';
// letter i (0-based) lands at keyAt(i)
const keyAt = (i) => (i < 10 ? f(113 + i * 1.8) : f(138 + (i - 10) * 1.6));
// stretches where the camera whips: the renderer opens the shutter wider here
const BLUR = [[f(1), f(5), 2.2], [f(48), f(53), 1.6], [f(101), f(107), 3.0], [f(130), f(138), 3.0], [f(151), f(170), 2.2], [f(189), f(199), 1.6], [f(245), f(278), 1.5]];
window.TIMELINE = { fps: FPS, duration: END, blur: BLUR, w: W, h: H, audio: 'reference soundtrack (supplied)' };

// ------------------------------------------------------------ maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sf = (t, a, b) => seg(t, f(a), f(b));          // segment in frames
const eIO3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eIO5 = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
const eOut3 = (x) => 1 - Math.pow(1 - x, 3);
const eIn3 = (x) => x * x * x;
const eOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const eInExpo = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const spring = (x, z = 0.6, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); };

// ------------------------------------------------------------ assets
const keep = [];
async function load(src) { const im = new Image(); im.src = src; for (let k = 0; ; k++) { try { await im.decode(); break; } catch (e) { if (k > 3) throw new Error('decode ' + src); im.src = src + '?r=' + k; } } keep.push(im); return im; }
for (let i = 0; i <= Q.length; i++) await load(`cap3/sq${String(i).padStart(2, '0')}.png`);
await load('cap3/results.png'); await load('app/icons/teal.svg');
await document.fonts.load('700 100px Sora'); await document.fonts.load('400 100px Sora'); await document.fonts.load('600 100px Sora');

// ------------------------------------------------------------ DOM
const $ = (id) => document.getElementById(id);
const stage = $('stage'); stage.style.width = W + 'px'; stage.style.height = H + 'px';
const world = $('world');
const cv = $('fx'); cv.width = W * 2; cv.height = H * 2; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const g = cv.getContext('2d');
const mk = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; parent.appendChild(e); return e; };
const mctx = document.createElement('canvas').getContext('2d');
const measure = (s, size, wt = 700, ls = 0) => { mctx.font = `${wt} ${size}px Sora`; mctx.letterSpacing = ls * size + 'px'; return mctx.measureText(s).width; };
{ const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const d = x.createImageData(256, 256); let s = 5;
  for (let i = 0; i < d.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s / 0x7fffffff) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`; }
const items = {};
function el(id, make) { let e = items[id]; if (!e) { e = items[id] = make(); } e.used = true; e.style.display = 'block'; return e; }
const icon = (id) => el(id, () => { const e = mk('img', 'el', world); e.src = 'app/icons/teal.svg'; return e; });
const txt = (id) => el(id, () => mk('div', 'txt', world));
const box = (id) => el(id, () => mk('div', 'el', world));
const lay = (id) => el(id, () => { const e = mk('div', 'lay', world); e.img = mk('img', '', e); return e; });
function crop(id, src, r, x, y, k, extra = {}) {
  const e = lay(id); if (e._src !== src) { e.img.src = src; e._src = src; }
  Object.assign(e.style, { left: x + 'px', top: y + 'px', width: r[2] * k + 'px', height: r[3] * k + 'px', borderRadius: (extra.rad ?? 0) + 'px', opacity: extra.op ?? 1,
    filter: extra.filter || '', transform: extra.tf || '', transformOrigin: extra.origin || '50% 50%', boxShadow: extra.shadow || '' });
  e.img.style.width = 412 * k + 'px'; e.img.style.left = -r[0] * k + 'px'; e.img.style.top = -r[1] * k + 'px';
  return e;
}
function word(id, s, x, y, size, o = {}) {   // text in world space, x = left edge, y = vertical centre
  const c = txt(id); if (c.textContent !== s) c.textContent = s;
  Object.assign(c.style, { left: x + 'px', top: y - size * 0.62 + 'px', fontSize: size + 'px', fontWeight: o.wt || 700, letterSpacing: (o.ls ?? -0.01) + 'em', color: o.color || '#F2F8FF',
    opacity: o.op ?? 1, filter: o.blur > 0.05 ? `blur(${o.blur}px)` : '', textShadow: o.glow || '0 0 28px rgba(63,224,255,.35)', transform: o.tf || '', transformOrigin: o.origin || '0 50%' });
  return c;
}
const hand = mk('div', 'hand', stage, '<svg viewBox="0 0 24 26" width="64" height="64"><path d="M9 2.2a1.9 1.9 0 0 1 1.9 1.9v6.7h.6V8.4a1.9 1.9 0 0 1 3.8 0v2.6h.6V9.6a1.9 1.9 0 0 1 3.8 0v2.1h.4a1.9 1.9 0 0 1 1.9 1.9v3.2c0 4.3-3 7.9-7.4 7.9h-1.6c-2.4 0-3.9-.9-5.4-2.9l-3.4-4.6a1.9 1.9 0 0 1 3-2.4l.9 1.1V4.1A1.9 1.9 0 0 1 9 2.2z" fill="#fff" stroke="#05070c" stroke-width="1.3" stroke-linejoin="round"/></svg>');

// ------------------------------------------------------------ geometry
const FW = V ? W * 0.88 : Math.min(W * 0.74, 1250);
const sb = R.searchbar, FK = FW / sb[2], FH = sb[3] * FK;
const fieldX = -FW / 2, fieldY = -FH / 2;
const fieldPt = (px, py) => [fieldX + (px - sb[0]) * FK, fieldY + (py - sb[1]) * FK];
const RW = V ? W * 0.88 : Math.min(W * 0.62, 1000), RK = RW / 380, RH = 66 * RK, RGAP = 12;
const U = V ? 1.15 : 1;   // type scale for the vertical cut

// canvas light
function streak(pts, head, width) {
  if (pts.length < 2) return;
  g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 1; i < pts.length; i++) {
    const a = i / pts.length; g.strokeStyle = `rgba(160,236,255,${(a * a * 0.95).toFixed(3)})`; g.lineWidth = width * (0.2 + 0.8 * a);
    g.shadowColor = 'rgba(63,224,255,.95)'; g.shadowBlur = 22 * a; g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
  }
  if (head) { const [x, y] = pts[pts.length - 1]; glowDot(x, y, head, 1); }
  g.restore();
}
function glowDot(x, y, r, a) { g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(240,253,255,${a})`); rg.addColorStop(0.25, `rgba(110,225,255,${0.6 * a})`); rg.addColorStop(1, 'rgba(47,123,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.restore(); }
function ringGlow(x, y, r, w, a) { g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(x, y, Math.max(0, r - w), x, y, r + w); rg.addColorStop(0, 'rgba(63,224,255,0)'); rg.addColorStop(0.5, `rgba(185,242,255,${a})`); rg.addColorStop(1, 'rgba(47,123,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r + w, 0, 6.283); g.fill(); g.restore(); }
function ellipseGlow(x, y, rx, ry, a) { g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.scale(1, ry / rx); const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, `rgba(225,250,255,${a})`); rg.addColorStop(0.45, `rgba(110,215,255,${0.55 * a})`); rg.addColorStop(1, 'rgba(47,123,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, 6.283); g.fill(); g.restore(); }
const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };

// ================================================================ frame
window.renderAt = function (t) {
  for (const k in items) items[k].used = false;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  const cx = W / 2, cy = H / 2;
  stage.style.background = `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(8,26,64,${0.3 + 0.12 * Math.sin(t * 0.8)}) 0%, #000 70%)`;
  let cam = { x: 0, y: 0, z: 1 }, flash = 0, handOn = null;

  // ---------- camera through the field: whip-zoom in, follow the typing, whip-pan, then lift away
  if (t >= f(101) && t < f(171)) {
    const zin = eIO5(sf(t, 101, 107));
    const caretAt = (n) => fieldPt(R.caret[clamp(n, 0, Q.length)], 0)[0];
    let n = 0; for (let i = 0; i < Q.length; i++) if (t >= keyAt(i)) n = i + 1;
    const leftFocus = V ? fieldX + W / (2 * 1.8) - W * 0.035 : fieldX + FW * 0.3;
    const pan = eIO5(sf(t, 130, 137));            // whip-pan as the line runs out of room
    const followA = leftFocus, followB = Math.max(leftFocus, caretAt(n) - (V ? 120 : 260));
    const drift = t > f(137) ? caretAt(n) - (V ? 120 : 260) : followB;
    cam = { x: lerp(0, lerp(followA, Math.max(followA, drift), pan), zin), y: 0, z: lerp(1, V ? 1.8 : 2.3, zin) };
    const lift = eInExpo(sf(t, 152, 166));         // everything rises out of frame
    cam.y = lerp(0, H * 0.9 / cam.z, lift);
  }
  if (t >= f(213) && t < f(278)) cam = { x: 0, y: 0, z: lerp(1, 0.42, eIO3(sf(t, 246, 276))) };
  const toScreen = (x, y) => [cx + (x - cam.x) * cam.z, cy + (y - cam.y) * cam.z];
  world.style.transform = `translate(${cx}px,${cy}px) scale(${cam.z}) translate(${-cam.x}px,${-cam.y}px)`;

  // ============ f1–f19: a streak lands, a spark, a ring, the icon swells and settles
  if (t < f(53)) {
    const p0 = [-W * 0.62, H * 0.62], p1 = [-W * 0.35, H * 0.42], p2 = [-W * 0.12, H * 0.12], p3 = [0, 0];
    const u = sf(t, 1, 5);
    if (u > 0 && u < 1) { const ue = eOut3(u); const pts = []; for (let i = 0; i <= 40; i++) pts.push(bez(p0, p1, p2, p3, Math.max(0, ue - 0.55 + 0.55 * i / 40))); streak(pts.map(([x, y]) => toScreen(x, y)), 30, 9); }
    if (t >= f(5) && t < f(12)) glowDot(cx, cy, lerp(10, 26, sf(t, 5, 10)), 1);
    if (t >= f(9)) {
      const b = sf(t, 10, 15);
      ringGlow(cx, cy, lerp(40, 190, eOut3(b)) * U, 22, 0.75 * Math.sin(Math.PI * clamp(b * 1.05)));
      glowDot(cx, cy, 120 * U, 0.55 * (1 - sf(t, 12, 20)));
    }
    const exit = eIn3(sf(t, 48, 53));
    if (t >= f(9)) {
      const name = 'AartiMusic', size = 92 * U, IS = 104 * U, gap = 30 * U, wName = measure(name, size, 700, -0.01), total = IS + gap + wName;
      const swell = t < f(15) ? lerp(0.25, 1.55, eOutExpo(sf(t, 9, 14))) : lerp(1.55, 1, eOut3(sf(t, 14, 20)));
      const slide = eOutExpo(sf(t, 24, 33));
      const ix = lerp(0, -total / 2 + IS / 2, slide);
      const e = icon('ic');
      Object.assign(e.style, { left: ix - IS / 2 + 'px', top: -IS / 2 + 20 * exit + 'px', width: IS + 'px', height: IS + 'px', opacity: clamp(sf(t, 9, 11)) * (1 - exit),
        transform: `scale(${swell * (1 + 0.15 * exit)})`, filter: `drop-shadow(0 0 ${28 + 50 * (1 - sf(t, 10, 22))}px rgba(63,224,255,.7)) blur(${18 * exit}px)` });
      let x = -total / 2 + IS + gap;
      [...name].forEach((ch, i) => {
        const lp = sf(t, 25 + i * 0.9, 25 + i * 0.9 + 4), w = measure(ch, size, 700, -0.01);
        if (lp > 0) word('n' + i, ch, x + 30 * (1 - eOutExpo(lp)), 20 * exit, size, { op: eOut3(lp) * (1 - exit), blur: 12 * (1 - eOutExpo(lp)) + 18 * exit,
          tf: `scale(${1 + 0.15 * exit})`, glow: `0 0 ${26 + 20 * (1 - lp)}px rgba(63,224,255,.4)` });
        x += w;
      });
    }
  }
  // ============ f53–f61: arcs of light, gathering into the greeting
  if (t >= f(52) && t < f(64)) {
    [[1, 0, 0.36], [-1, 1, 0.3], [1, 2.5, 0.22]].forEach(([sgn, dl, rr]) => {
      const u = sf(t, 52 + dl, 61 + dl); if (u <= 0 || u >= 1) return;
      const R0 = Math.min(W, H) * rr * (1.5 - 0.5 * u), pts = [];
      for (let i = 0; i <= 30; i++) { const s = Math.max(0, eOut3(u) - 0.3 + 0.3 * i / 30); const a = sgn * (-2.2 + 3.6 * s); pts.push([cx + Math.cos(a) * R0 * sgn, cy + Math.sin(a) * R0 * 0.7]); }
      streak(pts, 8, 4);
    });
  }
  // ============ f61–f90: "Good evening, Ajay" assembles, rises; light becomes the search field
  if (t >= f(60) && t < f(171)) {
    const words = ['Good', 'evening,', 'Ajay'], size = (V ? 58 : 64), sp = measure(' ', size, 700);
    const asm = eOutExpo(sf(t, 61, 67));
    const ls = lerp(0.45, 0.0, asm) - 0.012 * sf(t, 67, 80);
    const ws = words.map((w) => measure(w, size, 700, ls)), IS = size * 0.95, gap = size * 0.38;
    const total = IS + gap + ws.reduce((a, b) => a + b, 0) + sp * 2;
    const up = eIO3(sf(t, 80, 88)), yy = lerp(0, -FH * 1.05 - size * 0.55, up), sc = lerp(1, 0.8, up);
    const left = -total / 2 * sc;
    const ig = icon('gi');
    Object.assign(ig.style, { left: left + 'px', top: yy - IS * sc / 2 + 'px', width: IS * sc + 'px', height: IS * sc + 'px', opacity: eOut3(sf(t, 61, 64)), transform: '', filter: 'drop-shadow(0 0 22px rgba(63,224,255,.5))' });
    let x = left + (IS + gap) * sc;
    words.forEach((w, i) => {
      const p = sf(t, 61 + i * 1.2, 66 + i * 1.2);
      word('g' + i, w, x, yy, size * sc, { ls, op: eOut3(p), blur: 10 * (1 - eOutExpo(p)), color: i === 2 ? '#BFF2FF' : '#F2F8FF', glow: `0 0 ${24 + 30 * (1 - p)}px rgba(63,224,255,${0.25 + 0.4 * (1 - p)})` });
      x += (ws[i] + sp) * sc;
    });
    // a soft blob of light grows under the greeting, flares into a bright slab, then settles into the real field
    const blob = sf(t, 81, 86), slab = sf(t, 84, 87), settle = eOut3(sf(t, 87, 92));
    if (blob > 0 && t < f(92)) { const [bx, by] = toScreen(0, 0); ellipseGlow(bx, by, FW * 0.5 * cam.z * lerp(0.3, 1, eOut3(blob)), FH * 0.9 * cam.z * lerp(0.3, 1, eOut3(blob)), 0.9 * (1 - settle)); }
    if (slab > 0) {
      let n = 0; for (let i = 0; i < Q.length; i++) if (t >= keyAt(i)) n = i + 1;
      const name = `cap3/sq${String(n).padStart(2, '0')}.png`;
      crop('field', name, [sb[0], sb[1], sb[2], sb[3]], fieldX, fieldY, FK, { rad: 12 * FK,
        filter: `brightness(${lerp(4.5, 1, settle)}) saturate(${lerp(0.2, 1, settle)}) blur(${lerp(10, 0, eOut3(slab))}px)`,
        shadow: `0 ${30}px ${90}px rgba(47,123,255,.4), 0 0 ${50 + 20 * Math.sin(t * 3)}px rgba(63,224,255,.22)` });
      const [bx, by] = toScreen(0, FH / 2 + 8); ellipseGlow(bx, by, FW * 0.55 * cam.z, FH * 0.7 * cam.z, 0.32);
    }
  }
  // ============ f170–f209: the search button, the hand, the press, a ring that fills the frame
  if (t >= f(169) && t < f(213)) {
    const sbtn = R.searchbtn, BK = (V ? 5.2 : 4.6), bw = sbtn[2] * BK, bh = sbtn[3] * BK;
    const appear = eOut3(sf(t, 170, 175)), pale = eOut3(sf(t, 192, 198)), gone = eIn3(sf(t, 204, 210));
    const press = Math.sin(Math.PI * sf(t, 189, 194));
    crop('btn', 'cap3/sq19.png', [sbtn[0], sbtn[1], sbtn[2], sbtn[3]], -bw / 2, -bh / 2, BK, { rad: 22, op: appear * (1 - gone),
      filter: `brightness(${lerp(0.6, 1.7, sf(t, 170, 179)) + 1.6 * pale * (1 - sf(t, 203, 207))}) saturate(${1.3 - 0.8 * pale})`,
      tf: `scale(${(1 - 0.1 * press) * lerp(1, 0.3, gone)})`, shadow: `0 0 ${40 + 60 * pale}px rgba(63,224,255,${0.35 + 0.4 * pale})` });
    const [bx, by] = toScreen(0, 0);
    const hp = eOutExpo(sf(t, 173, 181)), away = eIn3(sf(t, 206, 212));
    handOn = { x: bx - 4 + 10 * Math.sin(t * 2) * (1 - press), y: lerp(H * 1.02, by + 6, hp) + 160 * away, s: 1 - 0.16 * press, op: hp * (1 - away) };
    // the press ring: it grows until it fills the frame, its edges bright and soft
    const rp = sf(t, 190, 200);
    if (rp > 0 && rp < 1) { const Rr = Math.hypot(W, H) * 0.62 * eOut3(rp); ringGlow(bx, by, 60 + Rr, 50 + 120 * rp, 0.95 * Math.sin(Math.PI * clamp(rp * 0.95 + 0.05))); }
    flash = 0.35 * Math.sin(Math.PI * sf(t, 194, 202));
  }
  // ============ f213–f277: the results stream in, each glowing as it lands; zoom out; squiggles
  if (t >= f(213) && t < f(278)) {
    const rows = R.rows.slice(0, 6), y0 = -(rows.length * (RH + RGAP) - RGAP) / 2;
    const squash = sf(t, 274, 277.5);
    rows.forEach((r, i) => {
      const t0 = 213 + i * 5.5, p = sf(t, t0, t0 + 6); if (p <= 0) return;
      const hot = Math.exp(-Math.max(0, t - f(t0)) * 2.4);
      if (squash < 0.5) crop('row' + i, 'cap3/results.png', r, -RW / 2, y0 + i * (RH + RGAP) + 22 * (1 - eOutExpo(p)), RK, { rad: 16 * RK,
        op: eOut3(p) * (1 - squash * 2), origin: '50% 50%', tf: `scaleY(${1 - 0.8 * squash})`,
        filter: `blur(${8 * (1 - eOutExpo(p))}px) drop-shadow(0 0 ${34 * hot}px rgba(63,224,255,${0.75 * hot})) brightness(${1 + 0.45 * hot})` });
    });
    if (squash > 0) {   // the list collapses to wavy lines of sound
      const pts0 = rows.length;
      g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(200,240,255,${0.9 * (1 - sf(t, 277, 278))})`; g.lineWidth = 2.2; g.shadowColor = 'rgba(63,224,255,.9)'; g.shadowBlur = 10;
      for (let i = 0; i < pts0 * 2; i++) {
        const yy = y0 + (i / (pts0 * 2 - 1)) * (rows.length * (RH + RGAP)), [sx0, sy] = toScreen(-RW / 2, yy), [sx1] = toScreen(RW / 2 * (0.6 + 0.4 * ((i * 37) % 10) / 10), yy);
        g.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40, x = lerp(sx0, sx1, u), y = sy + 4 * Math.sin(u * 18 + i * 1.7 + t * 30); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      }
      g.restore();
    }
  }
  // ============ f278–f315: a note flashes, "Daily" types itself, "sound." answers
  if (t >= f(278) && t < f(320)) {
    if (t < f(281)) { const s = 150 * U; word('note', '♪', -measure('♪', s, 700) / 2, 0, s, { glow: '0 0 50px rgba(63,224,255,.8)' }); glowDot(cx, cy, 160 * U, 0.4); }
    if (t >= f(281) && t < f(301)) {
      const s = 132 * U, letters = [['D', 281], ['a', 286], ['i', 289], ['l', 290.5], ['y', 295]];
      const shown = letters.filter(([, fr]) => t >= f(fr)).map(([c]) => c).join('');
      const wNow = measure(shown, s, 700, -0.01);
      let x = -wNow / 2;
      letters.forEach(([c, fr], i) => {
        if (t < f(fr)) return; const lp = sf(t, fr, fr + 3), w = measure(c, s, 700, -0.01);
        word('d' + i, c, x, (1 - eOutExpo(lp)) * 18, s, { op: eOut3(lp), blur: 6 * (1 - lp), tf: `scale(${lerp(0.6, 1, eOutExpo(lp))})`, origin: '50% 100%', glow: '0 0 40px rgba(63,224,255,.5)' });
        x += w;
      });
      glowDot(cx, cy, 220 * U, 0.22);
    }
    if (t >= f(301)) {
      const s = 96 * U, w = measure('sound.', s, 700, -0.01), out = sf(t, 315, 319);
      word('snd', 'sound.', -w / 2, 0, s, { color: '#CFF4FF', op: 1 - out, blur: 8 * out, tf: `scale(${1 - 0.5 * out})`, origin: '50% 50%', glow: '0 0 36px rgba(63,224,255,.5)' });
      glowDot(cx, cy, 200 * U, 0.2 * (1 - out));
    }
  }
  // ============ f316–end: the icon arrives over the word, pops, settles
  if (t >= f(316)) {
    const IS = 92 * U, pop = t < f(320) ? lerp(0.3, 1, eOut3(sf(t, 316, 320))) : t < f(323) ? lerp(1, 1.45, eOut3(sf(t, 320, 323))) : lerp(1.45, 1, eOut3(sf(t, 323, 328)));
    const e = icon('fin');
    Object.assign(e.style, { left: -IS / 2 + 'px', top: -IS / 2 + 'px', width: IS + 'px', height: IS + 'px', opacity: clamp(sf(t, 316, 318)), transform: `scale(${pop})`, filter: `drop-shadow(0 0 ${30 + 40 * Math.max(0, pop - 1)}px rgba(63,224,255,.7))` });
    glowDot(cx, cy, 140 * U * pop, 0.25);
  }

  // ---------- commit
  for (const k in items) if (!items[k].used) items[k].style.display = 'none';
  if (handOn && handOn.op > 0.01) Object.assign(hand.style, { display: 'block', left: handOn.x + 'px', top: handOn.y + 'px', opacity: handOn.op, transform: `scale(${handOn.s * 1.5})`, transformOrigin: "20% 10%" }); else hand.style.display = 'none';
  $('flash').style.background = `radial-gradient(circle at 50% 50%, rgba(225,250,255,${flash}), rgba(90,200,255,${flash * 0.6}) 40%, rgba(20,60,140,${flash * 0.2}) 75%)`;
  $('fade').style.opacity = 0;
  const fr = Math.round(t * FPS); $('grain').style.backgroundPosition = `${(fr * 73) % 256}px ${(fr * 151) % 256}px`;
};
window.READY = true;
})().catch((e) => { window.READY_ERR = String(e && e.stack || e); });
