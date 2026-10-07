/* AartiMusic teaser — light, a spark, the real search, a flash, the results.
   Same timeline renders 16:9 (?w=1920&h=1080) and 9:16 (?w=1080&h=1920). */
(async function () {
'use strict';
const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 1920), H = +(qs.get('h') || 1080);
const R = await (await fetch('cap3/rects.json')).json();
const FPS = 30, END = 13.8;

// ------------------------------------------------------------ timeline
const T = {
  land: 0.55, icon: 0.68, word: 1.05, lockOut: 1.85, arcs: 1.95,
  greet: [2.45, 2.62, 2.82], greetUp: 3.1, field: 3.5, typeStart: 4.2, keyStep: 0.09,
  toBtn: 6.0, click: 6.45, bloom: 6.5, results: 7.0, rowStep: 0.15, zoomOut: 8.9, wave: 9.3,
  words: [9.85, 10.55, 11.25], spark: 12.0, end: 12.45, fade: END - 0.5,
};
const Q = 'om jai jagdish hare';
const keyT = (i) => T.typeStart + i * T.keyStep;          // letter i (1-based) lands at keyT(i-1)
const CUES = [];
const cue = (t, k, x) => CUES.push(Object.assign({ t: +t.toFixed(4), k }, x || {}));
cue(0, 'comet', { d: T.land }); cue(T.land, 'land'); cue(T.icon, 'shimmer');
for (let i = 0; i < 10; i++) cue(T.word + i * 0.07, 'type', { soft: 1 });
cue(T.lockOut, 'swoosh', { d: 0.6 }); T.greet.forEach((g) => cue(g, 'word'));
cue(T.field - 0.05, 'rise', { d: 0.5 }); cue(T.field + 0.2, 'sweep', { d: 0.7 });
for (let i = 0; i < Q.length; i++) cue(keyT(i), 'key');
cue(T.toBtn, 'move', { d: 0.4 }); cue(T.click, 'click'); cue(T.bloom - 0.35, 'riser', { d: 0.35 }); cue(T.bloom, 'bloom');
for (let i = 0; i < 5; i++) cue(T.results + 0.05 + i * T.rowStep, 'row', { n: i });
cue(T.zoomOut, 'whoosh', { d: 0.6 }); cue(T.wave, 'wave', { d: 0.5 });
T.words.forEach((w, j) => { for (let i = 0; i < 8; i++) cue(w + i * 0.05, 'type', { soft: 1, n: j }); cue(w, 'beat', { n: j }); });
cue(T.spark, 'collapse', { d: 0.4 }); cue(T.end, 'end_chime');
window.TIMELINE = { fps: FPS, duration: END, times: T, cues: CUES, w: W, h: H };

// ------------------------------------------------------------ maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eIO3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOut3 = (x) => 1 - Math.pow(1 - x, 3);
const eIn3 = (x) => x * x * x;
const eOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const spring = (x, z = 0.65, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); };

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

// element pool in world space
const items = {};
function el(id, make) { let e = items[id]; if (!e) { e = items[id] = make(); } e.used = true; e.style.display = 'block'; return e; }
const icon = (id) => el(id, () => { const e = mk('img', 'el', world); e.src = 'app/icons/teal.svg'; return e; });
const txt = (id) => el(id, () => mk('div', 'txt', world));
const lay = (id) => el(id, () => { const e = mk('div', 'lay', world); e.img = mk('img', '', e); return e; });
function crop(id, src, r, x, y, k, extra = {}) {   // region r (CSS px of the 412-wide screen) of a 12x capture, top-left at world (x,y)
  const e = lay(id); if (e._src !== src) { e.img.src = src; e._src = src; }
  const top = extra.srcTop ?? 0;
  Object.assign(e.style, { left: x + 'px', top: y + 'px', width: r[2] * k + 'px', height: r[3] * k + 'px', borderRadius: (extra.rad ?? 0) + 'px', opacity: extra.op ?? 1,
    filter: extra.filter || '', transform: extra.tf || '', boxShadow: extra.shadow || '' });
  e.img.style.width = 412 * k + 'px'; e.img.style.left = -r[0] * k + 'px'; e.img.style.top = -(r[1] - top) * k + 'px';
  return e;
}
const hand = mk('div', 'hand', stage, '<svg viewBox="0 0 24 26" width="64" height="64"><path d="M9 2.2a1.9 1.9 0 0 1 1.9 1.9v6.7h.6V8.4a1.9 1.9 0 0 1 3.8 0v2.6h.6V9.6a1.9 1.9 0 0 1 3.8 0v2.1h.4a1.9 1.9 0 0 1 1.9 1.9v3.2c0 4.3-3 7.9-7.4 7.9h-1.6c-2.4 0-3.9-.9-5.4-2.9l-3.4-4.6a1.9 1.9 0 0 1 3-2.4l.9 1.1V4.1A1.9 1.9 0 0 1 9 2.2z" fill="#fff" stroke="#05070c" stroke-width="1.3" stroke-linejoin="round"/></svg>');

// ------------------------------------------------------------ geometry
const FW = W < H ? W * 0.88 : Math.min(W * 0.74, 1250);                 // search field width on screen at zoom 1
const sb = R.searchbar, FK = FW / sb[2], FH = sb[3] * FK; // scale from app px to world px
const fieldX = -FW / 2, fieldY = -FH / 2;
const fieldPt = (px, py) => [fieldX + (px - sb[0]) * FK, fieldY + (py - sb[1]) * FK];
const RW = W < H ? W * 0.88 : Math.min(W * 0.62, 1000), RK = RW / 380, RH = 66 * RK, RGAP = 14;

// light trails drawn on the canvas, in screen space
function streak(pts, head, width, color, glow) {
  if (pts.length < 2) return;
  g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 1; i < pts.length; i++) {
    const a = i / pts.length; g.strokeStyle = color.replace('A', (a * a * 0.9).toFixed(3)); g.lineWidth = width * (0.25 + 0.75 * a);
    g.shadowColor = glow; g.shadowBlur = 18 * a; g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
  }
  if (head) { const [x, y] = pts[pts.length - 1]; const rg = g.createRadialGradient(x, y, 0, x, y, head); rg.addColorStop(0, 'rgba(235,252,255,1)'); rg.addColorStop(0.3, 'rgba(120,230,255,.6)'); rg.addColorStop(1, 'rgba(63,160,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, head, 0, 6.283); g.fill(); }
  g.restore();
}
function glowDot(x, y, r, a) { g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(240,253,255,${a})`); rg.addColorStop(0.25, `rgba(110,225,255,${0.6 * a})`); rg.addColorStop(1, 'rgba(47,123,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.restore(); }
function ringGlow(x, y, r, w, a) { g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(x, y, Math.max(0, r - w), x, y, r + w); rg.addColorStop(0, 'rgba(63,224,255,0)'); rg.addColorStop(0.5, `rgba(170,240,255,${a})`); rg.addColorStop(1, 'rgba(47,123,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r + w, 0, 6.283); g.fill(); g.restore(); }
const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };

// ================================================================ frame
window.renderAt = function (t) {
  for (const k in items) items[k].used = false;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  const cx = W / 2, cy = H / 2;
  // background: near-black with the faintest blue breath
  stage.style.background = `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(10,30,70,${0.35 + 0.15 * Math.sin(t * 0.7)}) 0%, #000 70%)`;
  let cam = { x: 0, y: 0, z: 1 }, flash = 0, fade = 0, handOn = null;

  // ---------- camera: still → follow the typing → the button → reset → pull out
  if (t >= T.typeStart - 0.3 && t < T.bloom + 0.15) {
    const n = clamp(Math.floor((t - T.typeStart) / T.keyStep) + 1, 0, Q.length);
    const caretX = fieldPt(R.caret[Math.min(n, Q.length)], 0)[0];
    const zin = eIO3(seg(t, T.typeStart - 0.3, T.typeStart + 0.6));
    const follow = lerp(0, caretX + 60 * (W < H ? 0.4 : 1), zin);
    cam = { x: follow, y: 0, z: lerp(1, W < H ? 1.6 : 1.85, zin) };
    const tb = eIO3(seg(t, T.toBtn, T.click - 0.05));
    const [bx, by] = fieldPt(R.searchbtn[0] + R.searchbtn[2] / 2, R.searchbtn[1] + R.searchbtn[3] / 2);
    cam = { x: lerp(cam.x, bx, tb), y: lerp(cam.y, by, tb), z: lerp(cam.z, 3.4, tb) };
    const push = eIn3(seg(t, T.click, T.bloom + 0.15)); cam.z *= 1 + 0.6 * push;
  }
  if (t >= T.results && t < T.words[0]) {
    const zo = eIO3(seg(t, T.zoomOut, T.zoomOut + 0.55));
    cam = { x: 0, y: 0, z: lerp(1 + 0.06 * seg(t, T.results, T.zoomOut), 0.12, zo) };
  }
  const toScreen = (x, y) => [cx + (x - cam.x) * cam.z, cy + (y - cam.y) * cam.z];
  world.style.transform = `translate(${cx}px,${cy}px) scale(${cam.z}) translate(${-cam.x}px,${-cam.y}px)`;

  // ============ 1. a streak of light lands as a spark, the spark becomes the icon
  if (t < T.lockOut + 0.5) {
    const p0 = [-W * 0.55, H * 0.45], p1 = [-W * 0.3, H * 0.32], p2 = [-W * 0.12, H * 0.08], p3 = [0, 0];
    const u = seg(t, 0, T.land), ue = eOut3(u);
    if (u < 1) { const pts = []; for (let i = 0; i <= 40; i++) { const s = Math.max(0, ue - 0.45 + 0.45 * i / 40); pts.push(bez(p0, p1, p2, p3, s)); } streak(pts.map(([x, y]) => toScreen(x, y)), 26, 5, 'rgba(150,235,255,A)', 'rgba(63,224,255,.9)'); }
    if (t >= T.land) {
      const b = seg(t, T.land, T.land + 0.6);
      glowDot(cx, cy, 60 + 260 * eOut3(b), (1 - b) * 1.0);
      ringGlow(cx, cy, 30 + 420 * eOut3(b), 26, 0.55 * (1 - b));
      flash = Math.max(flash, 0.25 * Math.exp(-(t - T.land) * 8));
    }
    if (t >= T.icon - 0.05) {
      const p = seg(t, T.icon - 0.05, T.icon + 0.7), lockOut = eIO3(seg(t, T.lockOut, T.lockOut + 0.35));
      const name = 'AartiMusic', size = 96, wName = measure(name, size, 700, -0.01), IS = 116, gap = 34, total = IS + gap + wName;
      const slide = eIO3(seg(t, T.word - 0.15, T.word + 0.35));
      const ix = lerp(0, -total / 2 + IS / 2, slide);
      const e = icon('ic');
      Object.assign(e.style, { left: ix - IS / 2 + 'px', top: -IS / 2 + 'px', width: IS + 'px', height: IS + 'px', opacity: clamp(p * 4) * (1 - lockOut),
        transform: `scale(${lerp(0.15, 1, spring(p * 0.85, 0.6, 12))})`, filter: `drop-shadow(0 0 ${30 + 40 * (1 - p)}px rgba(63,224,255,.65)) blur(${14 * lockOut}px)` });
      // the name types on, a letter at a time, each one blurring into focus
      const x0 = -total / 2 + IS + gap;
      let x = x0;
      [...name].forEach((ch, i) => {
        const lp = seg(t, T.word + i * 0.07, T.word + i * 0.07 + 0.25); const w = measure(ch, size, 700, -0.01);
        if (lp > 0) { const c = txt('n' + i); c.textContent = ch;
          Object.assign(c.style, { left: x + 'px', top: -size * 0.62 + 'px', fontSize: size + 'px', fontWeight: 700, letterSpacing: '-0.01em', opacity: eOut3(lp) * (1 - lockOut), color: '#F2F8FF',
            filter: `blur(${10 * (1 - eOutExpo(lp)) + 16 * lockOut}px)`, textShadow: '0 0 30px rgba(63,224,255,.35)', transform: `translateY(${(1 - eOutExpo(lp)) * 18}px) scale(${1 + 0.08 * lockOut})` }); }
        x += w;
      });
    }
  }
  // two arcs of light sweep through as the name dissolves
  if (t >= T.arcs && t < T.arcs + 0.7) {
    [[1, 0], [-1, 0.12]].forEach(([sgn, dl]) => {
      const u = seg(t, T.arcs + dl, T.arcs + dl + 0.5); if (u <= 0 || u >= 1) return;
      const pts = []; const R0 = Math.min(W, H) * 0.32;
      for (let i = 0; i <= 30; i++) { const s = Math.max(0, eOut3(u) - 0.35 + 0.35 * i / 30); const a = sgn * (-1.2 + 3.2 * s); pts.push([cx + Math.cos(a) * R0 * (1.2 - 0.3 * s) * sgn, cy + Math.sin(a) * R0 * 0.75 + 40 * sgn]); }
      streak(pts, 10, 3.5, 'rgba(150,235,255,A)', 'rgba(63,224,255,.9)');
    });
  }

  // ============ 2. the greeting the app opens with
  if (t >= T.greet[0] - 0.1 && t < T.typeStart + 0.8) {
    const up = eIO3(seg(t, T.greetUp, T.greetUp + 0.42));
    const words = ['Good', 'evening,', 'Priya'], size = W < H ? 64 : 76, sp = measure(' ', size, 700);
    const ws = words.map((w) => measure(w, size, 700, -0.01)), IS = size * 0.95, gap = size * 0.4;
    const total = IS + gap + ws.reduce((a, b) => a + b, 0) + sp * 2;
    const yy = lerp(0, -FH * 1.15 - size * 0.4, up), sc = lerp(1, 0.78, up), fadeOut = seg(t, T.typeStart + 0.1, T.typeStart + 0.5);
    const ig = icon('gi'); const ip = seg(t, T.greet[0] - 0.1, T.greet[0] + 0.3);
    const left = -total / 2 * sc;
    Object.assign(ig.style, { left: left + 'px', top: yy - IS * sc / 2 + 'px', width: IS * sc + 'px', height: IS * sc + 'px', opacity: eOut3(ip) * (1 - fadeOut), transform: '', filter: 'drop-shadow(0 0 22px rgba(63,224,255,.5))' });
    let x = left + (IS + gap) * sc;
    words.forEach((w, i) => {
      const p = seg(t, T.greet[i] - 0.03, T.greet[i] + 0.35);
      if (p > 0) { const c = txt('g' + i); c.textContent = w;
        Object.assign(c.style, { left: x + 'px', top: yy - size * sc * 0.62 + 'px', fontSize: size * sc + 'px', fontWeight: 700, letterSpacing: '-0.01em', color: i === 2 ? '#BFF2FF' : '#F2F8FF',
          opacity: eOut3(p) * (1 - fadeOut), filter: `blur(${12 * (1 - eOutExpo(p))}px)`, textShadow: `0 0 ${24 + 30 * (1 - p)}px rgba(63,224,255,${0.25 + 0.4 * (1 - p)})`, transform: `translateY(${(1 - eOutExpo(p)) * 14}px)` }); }
      x += (ws[i] + sp) * sc;
    });
  }

  // ============ 3. the real search field: it rises, glows, and takes the typing
  if (t >= T.field - 0.05 && t < T.bloom + 0.2) {
    const rp = eOutExpo(seg(t, T.field, T.field + 0.6));
    const n = clamp(Math.floor((t - T.typeStart) / T.keyStep) + 1, 0, Q.length);
    const name = `cap3/sq${String(t < T.typeStart ? 0 : n).padStart(2, '0')}.png`;
    const press = t >= T.click ? Math.exp(-(t - T.click) * 10) : 0;
    crop('field', name, [sb[0], sb[1], sb[2], sb[3]], fieldX, fieldY + 60 * (1 - rp), FK, { rad: 12 * FK, op: rp,
      shadow: `0 ${30 * rp}px ${80 * rp}px rgba(47,123,255,${0.35 * rp}), 0 0 ${40 + 30 * Math.sin(t * 3)}px rgba(63,224,255,${0.18 * rp})`, filter: rp < 1 ? `blur(${10 * (1 - rp)}px)` : '' });
    // the bloom under the field, like light spilling from it
    const [bx, by] = toScreen(0, FH / 2 + 10);
    glowDot(bx, by, FW * 0.55 * cam.z, 0.22 * rp);
    // a highlight runs around the edge once
    const sw = seg(t, T.field + 0.2, T.field + 0.9);
    if (sw > 0 && sw < 1) {
      const per = 2 * (FW + FH), d = per * eIO3(sw); let px, py;
      if (d < FW) { px = fieldX + d; py = fieldY; } else if (d < FW + FH) { px = fieldX + FW; py = fieldY + d - FW; } else if (d < 2 * FW + FH) { px = fieldX + FW - (d - FW - FH); py = fieldY + FH; } else { px = fieldX; py = fieldY + FH - (d - 2 * FW - FH); }
      const [sx, sy] = toScreen(px, py); glowDot(sx, sy, 90, 0.9 * Math.sin(Math.PI * sw));
    }
    // the hand comes in and presses search
    if (t >= T.toBtn + 0.05) {
      const [bx2, by2] = toScreen(...fieldPt(R.searchbtn[0] + R.searchbtn[2] / 2, R.searchbtn[1] + R.searchbtn[3] / 2));
      const hp = eOut3(seg(t, T.toBtn + 0.05, T.click - 0.05));
      handOn = { x: lerp(W * 0.92, bx2 - 8, hp), y: lerp(H * 1.05, by2 - 4, hp), s: 1 - 0.18 * Math.sin(Math.PI * seg(t, T.click - 0.06, T.click + 0.12)), op: 1 - seg(t, T.bloom + 0.05, T.bloom + 0.2) };
      if (press > 0.01) ringGlow(bx2, by2, 30 + 90 * (1 - press), 14, 0.6 * press);
    }
  }
  // ============ 4. BLOOM — the press fills the frame with light
  if (t >= T.bloom - 0.05 && t < T.results + 0.5) {
    const b = seg(t, T.bloom, T.bloom + 0.55);
    const R0 = Math.hypot(W, H) * 0.65;
    ringGlow(cx, cy, R0 * eOut3(b), 120 * (1 - b) + 30, 0.9 * (1 - b));
    glowDot(cx, cy, R0 * eOut3(b) * 0.8, 0.8 * (1 - b));
    flash = Math.max(flash, 0.9 * Math.sin(Math.PI * seg(t, T.bloom - 0.02, T.bloom + 0.42)));
  }

  // ============ 5. the answer: real results stream in, each one glowing as it lands
  if (t >= T.results && t < T.words[0]) {
    const rows = R.rows.slice(0, 5), y0 = -(rows.length * (RH + RGAP) - RGAP) / 2;
    rows.forEach((r, i) => {
      const t0 = T.results + 0.05 + i * T.rowStep, p = seg(t, t0, t0 + 0.45); if (p <= 0) return;
      const hot = Math.exp(-Math.max(0, t - t0) * 2.2);
      const zo = seg(t, T.zoomOut, T.zoomOut + 0.55);
      crop('row' + i, 'cap3/results.png', r, -RW / 2, y0 + i * (RH + RGAP) + 30 * (1 - eOutExpo(p)), RK, { rad: 16 * RK,
        op: eOut3(p) * (1 - seg(t, T.wave - 0.1, T.wave + 0.25)), filter: `blur(${8 * (1 - eOutExpo(p)) + 6 * zo}px) drop-shadow(0 0 ${30 * hot}px rgba(63,224,255,${0.7 * hot})) brightness(${1 + 0.35 * hot})` });
    });
    // they collapse into a line of sound
    const wv = seg(t, T.wave, T.wave + 0.45), wOut = seg(t, T.words[0] - 0.3, T.words[0] + 0.05);
    if (wv > 0) {
      const L = Math.min(W, H) * 0.7 * eOut3(wv), pts = [];
      for (let i = 0; i <= 120; i++) { const u = i / 120, env = Math.sin(Math.PI * u) ** 1.4; pts.push([cx - L / 2 + u * L, cy + 46 * env * (1 - wOut) * (Math.sin(u * 34 + t * 10) * 0.6 + Math.sin(u * 77 - t * 14) * 0.4)]); }
      g.save(); g.setTransform(2, 0, 0, 2, 0, 0); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(150,235,255,${0.95 * (1 - wOut)})`; g.lineWidth = 3; g.shadowColor = 'rgba(63,224,255,.9)'; g.shadowBlur = 16;
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
    }
  }

  // ============ 6. Find it. Play it. Love it. — typed one word at a time
  if (t >= T.words[0] - 0.05 && t < T.end + 0.3) {
    const ws = ['Find it.', 'Play it.', 'Love it.'], size = W < H ? 132 : 150;
    ws.forEach((w, j) => {
      const t0 = T.words[j], t1 = j < 2 ? T.words[j + 1] - 0.08 : T.spark;
      if (t < t0 || t > t1 + 0.4) return;
      const out = j < 2 ? eIO3(seg(t, t1 - 0.12, t1 + 0.1)) : 0, collapse = j === 2 ? eIn3(seg(t, T.spark, T.spark + 0.4)) : 0;
      const wAll = measure(w, size, 700, -0.01); let x = -wAll / 2;
      [...w].forEach((ch, i) => {
        const lp = seg(t, t0 + i * 0.05, t0 + i * 0.05 + 0.22), cw = measure(ch, size, 700, -0.01);
        if (lp > 0) { const c = txt(`w${j}_${i}`); c.textContent = ch;
          const gold = j === 2 ? '#BFF2FF' : '#F2F8FF';
          Object.assign(c.style, { left: lerp(x, -cw / 2, collapse) + 'px', top: -size * 0.62 + 'px', fontSize: size + 'px', fontWeight: 700, letterSpacing: '-0.01em', color: gold,
            opacity: eOut3(lp) * (1 - out) * (1 - collapse), filter: `blur(${10 * (1 - eOutExpo(lp)) + 18 * out + 10 * collapse}px)`, textShadow: '0 0 34px rgba(63,224,255,.4)',
            transform: `translateY(${(1 - eOutExpo(lp)) * 20 - 30 * out}px) scale(${1 - 0.9 * collapse})` }); }
        x += cw;
      });
    });
    if (t >= T.spark + 0.25) { const s = seg(t, T.spark + 0.25, T.end + 0.1); glowDot(cx, cy, 40 + 160 * Math.sin(Math.PI * s), 0.9 * Math.sin(Math.PI * s)); }
  }

  // ============ 7. the spark settles as the app icon
  if (t >= T.end - 0.05) {
    const p = seg(t, T.end - 0.05, T.end + 0.6), IS = W < H ? 150 : 132;
    const e = icon('fin');
    Object.assign(e.style, { left: -IS / 2 + 'px', top: -IS / 2 - 30 + 'px', width: IS + 'px', height: IS + 'px', opacity: clamp(p * 4), transform: `scale(${lerp(0.2, 1, spring(p * 0.85, 0.62, 12)) * (1 + 0.02 * seg(t, T.end, END))})`,
      filter: `drop-shadow(0 0 ${30 + 40 * (1 - p)}px rgba(63,224,255,.6))` });
    ringGlow(cx, cy - 30, 40 + 300 * eOut3(seg(t, T.end, T.end + 0.8)), 18, 0.5 * (1 - seg(t, T.end, T.end + 0.8)));
    const tp = seg(t, T.end + 0.35, T.end + 0.85), c = txt('fname'); c.textContent = 'AartiMusic';
    const size = 44, w = measure('AartiMusic', size, 600, 0.04);
    Object.assign(c.style, { left: -w / 2 + 'px', top: IS / 2 + 20 - 30 + 'px', fontSize: size + 'px', fontWeight: 600, letterSpacing: '0.04em', color: '#DDF6FF', opacity: eOut3(tp), filter: `blur(${8 * (1 - tp)}px)`, transform: '', textShadow: '0 0 24px rgba(63,224,255,.35)' });
    fade = eIO3(seg(t, T.fade, END - 1 / FPS));
  }

  // ---------- commit
  for (const k in items) if (!items[k].used) items[k].style.display = 'none';
  if (handOn && handOn.op > 0.01) { Object.assign(hand.style, { display: 'block', left: handOn.x + 'px', top: handOn.y + 'px', opacity: handOn.op, transform: `scale(${handOn.s})` }); } else hand.style.display = 'none';
  $('flash').style.background = `radial-gradient(circle at 50% 50%, rgba(225,250,255,${flash}), rgba(90,200,255,${flash * 0.6}) 40%, rgba(20,60,140,${flash * 0.2}) 75%)`;
  $('fade').style.opacity = fade;
  const fr = Math.round(t * FPS); $('grain').style.backgroundPosition = `${(fr * 73) % 256}px ${(fr * 151) % 256}px`;
};
window.READY = true;
})().catch((e) => { window.READY_ERR = String(e && e.stack || e); });
