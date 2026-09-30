/* AartiMusic 16:9 promo compositor.
   Every beat is anchored to a word the narrator says (vo.json, force-aligned),
   and the sound cues exported in TIMELINE come from the same anchors. */
(async function () {
'use strict';
const RECTS = await (await fetch('cap/rects.json')).json();
const VO = await (await fetch('vo.json')).json();

// ---------------------------------------------------------------- anchors
const LINE = (id) => VO.lines.find((l) => l.id === id);
const S = (id) => LINE(id).start, E = (id) => LINE(id).end;
const W = (id, w, n = 0) => LINE(id).words.filter((x) => x.w === w)[n].start;
const FPS = 30;
const END = Math.ceil((E('end') + 1.25) * FPS) / FPS;
const SC = {
  hook: 0, meet: S('meet') - 0.12, mood: S('mood') - 0.35, search: S('search') - 0.3,
  play: W('play', 'and') - 0.05, lists: S('lists') - 0.35, tg: S('tg') - 0.35, themes: S('themes') - 0.4, end: S('end') - 0.55,
};
const T0 = {
  sound: W('hook', 'sound'), aarti: W('meet', 'aarti'), music: W('meet', 'music'),
  flipIn: E('meet') + 0.12,
  typeStart: W('search', 'search') + 0.12, keyStep: 0.1, submit: W('search', 'song') + 0.16,
  find: W('play', 'find'), tap: W('play', 'tap'), press: W('play', 'press'), playW: W('play', 'play'),
  build: W('lists', 'build'), pls: W('lists', 'playlists'), moodW: W('lists', 'mood'), keep: W('lists', 'keep'), favs: W('lists', 'favourites'), close: W('lists', 'close'),
  connect: W('tg', 'connect'), telegram: W('tg', 'telegram'), tgAnd: W('tg', 'and'), tgFavs: W('tg', 'favourites'), follow: W('tg', 'follow'), phone: W('tg', 'phone'),
  seven: W('themes', 'seven'), themesW: W('themes', 'themes'), make: W('themes', 'make'),
  endAarti: W('end', 'aarti'), your: W('end', 'your'), daily: W('end', 'daily'), sound2: W('end', 'sound'),
  fade: END - 0.45,
};
T0.wipes = [0, 1, 2, 3, 4, 5].map((i) => T0.themesW + 0.02 + i * 0.17);
T0.wipeBack = SC.end + 0.25;

const THEMES = ['amber', 'green', 'teal', 'violet', 'indigo', 'neon', 'ruby'];
const PAL = {
  amber: { bg: '#0A0908', flame: '#E0A253', ember: '#B0553C', hot: '#F7DCA8' },
  green: { bg: '#070A08', flame: '#5FD68F', ember: '#2C8F62', hot: '#C9F6DC' },
  teal: { bg: '#08171d', flame: '#77ccdb', ember: '#32849b', hot: '#d3f6fb' },
  violet: { bg: '#10091c', flame: '#d1a0ff', ember: '#8b52cc', hot: '#efddff' },
  indigo: { bg: '#0c1026', flame: '#a6a2ff', ember: '#6057d8', hot: '#dedcff' },
  neon: { bg: '#100d1d', flame: '#ff70c6', ember: '#c62a91', hot: '#ffd7f0' },
  ruby: { bg: '#1a090e', flame: '#ff9aaa', ember: '#bb4057', hot: '#ffdae1' },
};

// ---------------------------------------------------------------- cues (for audio)
const CUES = [];
const cue = (t, k, extra) => CUES.push(Object.assign({ t: +t.toFixed(4), k }, extra || {}));
LINE('hook').words.forEach((w, i) => cue(w.start - 0.02, 'tick', { n: i }));
cue(T0.sound, 'pop'); cue(SC.meet - 0.35, 'reverse', { d: 0.5 });
cue(T0.aarti - 0.55, 'riser', { d: 0.55 }); cue(T0.aarti, 'impact_big'); cue(T0.music, 'shimmer');
cue(T0.flipIn, 'whoosh', { d: 0.5 });
LINE('mood').words.forEach((w) => ['made', 'mood'].includes(w.w) && cue(w.start, 'tick'));
for (let i = 0; i < 4; i++) cue(W('mood', 'picks') + 0.05 + i * 0.08, 'blip', { n: i });
cue(SC.search - 0.08, 'whip', { d: 0.4 });
cue(W('search', 'search') - 0.08, 'tap');
for (let i = 0; i < 6; i++) cue(T0.typeStart + i * T0.keyStep, 'key');
cue(W('search', 'any'), 'select', { d: W('search', 'song') + 0.25 - W('search', 'any') });
cue(T0.submit, 'tap'); for (let i = 0; i < 3; i++) cue(T0.submit + 0.08 + i * 0.08, 'blip', { n: 2 + i });
cue(T0.find, 'tick'); cue(T0.tap, 'tap');
cue(SC.play, 'swoosh', { d: 0.45 }); cue(T0.press - 0.05, 'whoosh', { d: 0.4 });
cue(T0.playW, 'tap'); cue(T0.playW + 0.04, 'impact');
cue(SC.lists, 'whip', { d: 0.4 }); cue(T0.build, 'pop'); cue(T0.pls + 0.1, 'tap');
for (let i = 0; i < 3; i++) cue(T0.pls + 0.3 + i * 0.1, 'blip', { n: 4 + i });
cue(T0.keep - 0.1, 'swoosh', { d: 0.4 }); for (let i = 0; i < 3; i++) cue(T0.favs + i * 0.09, 'heart', { n: i });
cue(SC.tg, 'whoosh', { d: 0.45 }); cue(T0.connect + 0.1, 'tap'); cue(T0.connect + 0.25, 'swoosh', { d: 0.35 });
cue(T0.telegram, 'pop'); cue(T0.telegram + 0.1, 'line', { d: 0.4 }); cue(T0.tgAnd + 0.02, 'whoosh', { d: 0.4 }); cue(T0.tgAnd + 0.1, 'line', { d: 0.4 });
cue(T0.tgFavs, 'heart', { n: 0 }); cue(T0.follow, 'heart', { n: 2 }); cue(T0.phone, 'chime');
cue(SC.themes, 'whoosh', { d: 0.5 }); cue(T0.seven, 'tick');
T0.wipes.forEach((w, i) => cue(w, 'digital', { n: i })); cue(T0.make, 'pop');
cue(SC.end - 0.1, 'dip', { d: 0.55 }); cue(T0.wipeBack, 'reverse', { d: 0.45 });
cue(T0.endAarti, 'impact_big'); cue(T0.endAarti + 0.1, 'shimmer');
for (let i = 0; i < 16; i++) cue(T0.your + i * 0.075, 'key', { soft: 1 });
cue(END - 0.6, 'end');
window.TIMELINE = { fps: FPS, duration: END, scenes: SC, times: T0, cues: CUES, vo: VO };

// ---------------------------------------------------------------- maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eIO3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOut3 = (x) => 1 - Math.pow(1 - x, 3);
const eIn3 = (x) => x * x * x;
const eOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const eInExpo = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const eOutBack = (x, s = 1.25) => { const c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const spring = (x, z = 0.62, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, x) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], x))).join(',') + ')'; };
const mixArr = (a, b, x) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], x))); };
const rgba = (arr, a) => `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`;
function lerpObj(A, B, x) { const o = {}; for (const k in A) o[k] = typeof A[k] === 'number' && typeof B[k] === 'number' ? lerp(A[k], B[k], x) : (x < 0.5 ? A[k] : B[k]); for (const k in B) if (!(k in o)) o[k] = B[k]; return o; }

// ---------------------------------------------------------------- assets
const cap = (n) => 'cap/' + n + '.png';
const PRE = ['home_content', 'nav_home', 'search_idle', 'search_focus', 'search_q1', 'search_q2', 'search_q3', 'search_q4', 'search_q5', 'search_q6',
  'search_results', 'search_tapped', 'now_paused', 'now_playing0', 'now_playing1', 'now_playing2', 'lib', 'lib_scroll', 'create_typed', 'lib_after', 'link',
  ...THEMES.map((t) => 'home_' + t)];
const TOP = {}; const keep = [];
for (const n of PRE) {
  const im = new Image(); im.src = cap(n);
  for (let k = 0; ; k++) { try { await im.decode(); break; } catch (e) { if (k > 3) throw new Error('decode ' + n); im.src = cap(n) + '?r=' + k; } }
  keep.push(im);
  const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d');
  g.drawImage(im, 8, 4, 8, 8, 0, 0, 8, 8); const d = g.getImageData(4, 4, 1, 1).data; TOP[n] = `rgb(${d[0]},${d[1]},${d[2]})`;
}
for (const s of ['art/cover00.jpg', 'brand/logo.png']) { const im = new Image(); im.src = s; await im.decode(); keep.push(im); }
await document.fonts.load('800 100px Sora'); await document.fonts.load('400 100px Sora'); await document.fonts.load('600 100px Sora');

// ---------------------------------------------------------------- DOM
const $ = (id) => document.getElementById(id);
const mk = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
function pool(parent) {
  const lists = new Map(), used = new Map();
  return {
    begin() { used.clear(); },
    next(make) { let items = lists.get(make); if (!items) { items = []; lists.set(make, items); } const u = used.get(make) || 0; let e = items[u]; if (!e) { e = make(parent); items.push(e); } used.set(make, u + 1); e.style.display = 'block'; return e; },
    end() { for (const [m, items] of lists) for (let i = used.get(m) || 0; i < items.length; i++) items[i].style.display = 'none'; },
  };
}
const makeLay = (p) => { const e = mk('div', 'lay', p); e.img = mk('img', '', e); e.img.decoding = 'sync'; return e; };
function lay(P, L) {
  const e = P.next(makeLay);
  const sw = L.sw ?? 412, sh = L.sh ?? 892, dw = L.dw ?? sw, dh = L.dh ?? sh, k = dw / sw, srcW = L.srcW ?? 412;
  if (e._src !== L.src) { e.img.src = L.src; e._src = L.src; }
  const st = e.style;
  st.left = (L.dx ?? 0) + 'px'; st.top = (L.dy ?? 0) + 'px'; st.width = dw + 'px'; st.height = dh + 'px';
  e.img.style.width = srcW * k + 'px'; e.img.style.left = -(L.sx ?? 0) * k + 'px'; e.img.style.top = -(L.sy ?? 0) * (dh / sh) + 'px';
  st.opacity = L.op ?? 1; st.transform = L.tf || ''; st.borderRadius = (L.rad ?? 0) + 'px'; st.boxShadow = L.shadow || '';
  st.clipPath = L.clip || ''; st.filter = L.filter || ''; st.zIndex = L.z ?? 0; st.outline = L.outline || '';
  return e;
}
const full = (P, name, op = 1, extra = {}) => lay(P, Object.assign({ src: cap(name), op }, extra));
const crop = (P, name, r, extra = {}) => lay(P, Object.assign({ src: cap(name), sx: r[0], sy: r[1], sw: r[2], sh: r[3], dx: r[0], dy: r[1], dw: r[2], dh: r[3] }, extra));
// a floating card on the stage, cut from a real screen, scaled k and placed with its top-left at (x, y)
const card = (P, name, r, x, y, k, extra = {}) => lay(P, Object.assign({ src: cap(name), sx: r[0], sy: r[1], sw: r[2], sh: r[3], dx: x, dy: y, dw: r[2] * k, dh: r[3] * k }, extra));

const cam = $('cam');
const behind = document.createElement('div'); behind.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px'; cam.parentNode.insertBefore(behind, cam);
const cardsBack = mk('div', 'cards', cam);
const ZM = 2.4;
const STATUS = '<span>7:30</span><span style="display:flex;align-items:center"><svg viewBox="0 0 18 12"><path d="M0 11h3v1H0zM5 8h3v4H5zM10 5h3v7h-3zM15 1h3v11h-3z"/></svg><svg viewBox="0 0 16 12"><path d="M8 12L0 3.5a11.5 11.5 0 0116 0z"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2" y="2" width="15" height="8" rx="1.6"/><rect x="23.5" y="4" width="2" height="4" rx="1"/></svg></span>';
function makePhone() {
  const phw = mk('div', 'phwrap', cam); const phone = mk('div', 'phone', phw); phone.style.zoom = ZM;
  mk('div', 'body', phone);
  mk('div', 'btn', phone).style.cssText = 'top:190px;height:70px'; mk('div', 'btn', phone).style.cssText = 'top:290px;height:120px';
  const screen = mk('div', 'screen', phone);
  const status = mk('div', 'status', screen, STATUS); mk('div', 'punch', screen);
  const vp = mk('div', 'vp', screen); const ov = mk('div', 'ov', screen); ov.style.top = '28px'; ov.style.height = '892px';
  const glare = mk('div', 'glare', screen); const pops = mk('div', 'pops', phone);
  const shadow = mk('div', 'shadow', $('floor'));
  const P = { phw, status, glare, shadow, vp: pool(vp), ov: pool(ov), pops: pool(pops), f: null };
  P.begin = () => { P.vp.begin(); P.ov.begin(); P.pops.begin(); P.f = null; };
  P.end = () => {
    P.vp.end(); P.ov.end(); P.pops.end();
    const f = P.f;
    if (!f || (f.op ?? 1) <= 0.001) { phw.style.display = 'none'; shadow.style.display = 'none'; return; }
    const x = f.X - (f.ax - 206) * f.s, y = f.Y - (f.ay - 432) * f.s;
    phw.style.display = 'block';
    phw.style.transform = `translate3d(${x}px,${y}px,${f.z || 0}px) rotateX(${f.rx || 0}deg) rotateY(${f.ry || 0}deg) rotateZ(${f.rz || 0}deg) scale3d(${f.s / ZM},${f.s / ZM},${1 / ZM})`;
    phw.style.opacity = f.op ?? 1; phw.style.filter = f.blur > 0.05 ? `blur(${f.blur}px)` : '';
    glare.style.transform = `translateX(${(f.ry || 0) * 4}px)`;
    // a soft floor shadow so the phone sits in the space
    const w = 520 * f.s * Math.max(0.35, Math.cos((f.ry || 0) * Math.PI / 180));
    Object.assign(shadow.style, { display: 'block', left: x - w / 2 + 'px', top: y + 474 * f.s - 34 * f.s + 'px', width: w + 'px', height: 90 * f.s + 'px', opacity: 0.85 * (f.op ?? 1) * (1 - clamp((f.blur || 0) / 20)) });
  };
  return P;
}
const P0 = makePhone(), P1 = makePhone(), P2 = makePhone();
const PH = [P0, P1, P2];
const cards = mk('div', 'cards', cam);
const cardP = pool(cards), backP = pool(cardsBack), fxP = pool($('fx')), behindP = pool(behind);
// screen point -> stage point for a phone frame (rotation ignored: used for launch points)
const toStage = (f, px, py) => [f.X + (px - f.ax) * f.s, f.Y + (py - f.ay) * f.s];
const F_STD = { X: 960, Y: 540, ax: 206, ay: 432, s: 0.96, rx: 4, ry: 0, rz: 0, blur: 0, op: 1 };

// overlay helpers
const MK_TOUCH = (P) => mk('div', 'touch', P);
const MK_RIPPLE = (P) => { const w = mk('div', '', P); w.style.cssText = 'position:absolute;overflow:hidden'; w.c = mk('div', '', w); w.c.style.cssText = 'position:absolute;border-radius:50%'; return w; };
const MK_RING = (P) => mk('div', 'ring', P);
function touch(P, x, y, t0, t, k = 1) {
  const p = (t - t0) / 0.42; if (p < -0.25 || p > 1) return;
  const e = P.next(MK_TOUCH);
  const a = p < 0 ? eOut3(clamp((p + 0.25) / 0.25)) : 1 - eIO3(clamp((p - 0.25) / 0.75));
  const s = (p < 0 ? lerp(1.35, 0.92, eOut3(clamp((p + 0.25) / 0.25))) : lerp(0.92, 1.25, eOut3(clamp(p)))) * k;
  e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.opacity = a; e.style.transform = `scale(${s})`;
}
function ripple(P, r, x, y, t0, t, color) {
  const p = (t - t0) / 0.5; if (p < 0 || p > 1) return;
  const e = P.next(MK_RIPPLE);
  Object.assign(e.style, { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px', borderRadius: (r[4] ?? 12) + 'px', opacity: 1 });
  const R = Math.hypot(r[2], r[3]) * eOut3(p);
  Object.assign(e.c.style, { left: x - r[0] - R + 'px', top: y - r[1] - R + 'px', width: 2 * R + 'px', height: 2 * R + 'px', background: color, opacity: 0.32 * (1 - eIn3(p)) });
}
function ring(P, cx, cy, t0, t, color, r0, r1, dur = 0.7, w = 3) {
  const p = (t - t0) / dur; if (p < 0 || p > 1) return;
  const e = P.next(MK_RING); const r = lerp(r0, r1, eOut3(p));
  Object.assign(e.style, { left: cx - r + 'px', top: cy - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px', borderColor: color, borderWidth: w + 'px', opacity: 0.85 * (1 - p), transform: '' });
}

// ---------------------------------------------------------------- text
const texts = $('texts'); const TX = {};
const mctx = document.createElement('canvas').getContext('2d');
function measure(str, size, weight = 800, ls = -0.01) { mctx.font = `${weight} ${size}px Sora`; mctx.letterSpacing = ls * size + 'px'; return mctx.measureText(str).width; }
function T(id, str, o, parent) {
  let e = TX[id];
  if (!e) { e = TX[id] = mk('div', 'tw', parent || texts); e.ti = mk('span', 'ti', e); e._fit = {}; }
  if (e.ti.textContent !== str) e.ti.textContent = str;
  e.used = true;
  const size = o.size || 110, st = e.style, ti = e.ti.style;
  st.fontWeight = o.weight || 800; st.letterSpacing = (o.ls ?? -0.01) + 'em'; st.lineHeight = 1.08;
  let fs = size; const maxW = o.maxW ?? 1680;
  const key = str + '|' + size + '|' + st.letterSpacing + '|' + st.fontWeight;
  if (!(key in e._fit)) { const w = measure(str, size, o.weight || 800, o.ls ?? -0.01); e._fit[key] = w > maxW ? size * maxW / w : size; }
  fs = e._fit[key];
  st.fontSize = fs + 'px'; st.display = 'block'; st.overflow = o.nomask ? 'visible' : 'hidden';
  const align = o.align || 'center';
  st.left = o.x + 'px'; st.top = o.y + 'px';
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  st.transform = `translate(${tx},-50%) translate(${o.dx || 0}px,${o.dy || 0}px) scale(${o.scale ?? 1})`;
  st.transformOrigin = align === 'left' ? '0% 50%' : align === 'right' ? '100% 50%' : '50% 50%';
  st.opacity = o.op ?? 1; st.filter = o.blur > 0.05 ? `blur(${o.blur}px)` : '';
  const p = o.p ?? 1, out = o.out ?? 0;
  ti.transform = `translateY(${(1 - eOutExpo(p)) * 110 - eIn3(out) * 110}%)`;
  if (o.grad) { e.ti.className = 'ti grad'; ti.backgroundImage = o.grad; ti.backgroundSize = '200% 100%'; ti.backgroundPosition = (o.shine ?? 0) * 100 + '% 0'; ti.color = ''; }
  else { e.ti.className = 'ti'; ti.backgroundImage = ''; ti.color = o.color || '#F7F1E8'; }
  ti.textShadow = o.glow || '';
  st.zIndex = o.z ?? 1;
  return e;
}
// Word-by-word kinetic line: each word blurs up into place on the word it is spoken.
function KW(id, words, o, t) {
  const size = o.size, ls = o.ls ?? -0.01, weight = o.weight || 800, gap = size * (o.gap ?? 0.28);
  const ws = words.map((w) => measure(w.s, size, weight, ls));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = o.align === 'left' ? o.x : o.x - total / 2;
  const out = o.out ?? 0;
  words.forEach((w, i) => {
    const p = seg(t, w.t - 0.04, w.t + 0.36);
    if (p > 0 && out < 1) {
      const hit = w.hit ? 1 + 0.18 * (1 - eOut3(p)) : 1;
      T(id + i, w.s, { x: x + ws[i] / 2, y: o.y + (1 - eOutExpo(p)) * size * 0.34 + (o.dyOut || 0) * eIn3(out), size, weight, ls, nomask: true,
        op: eOut3(Math.min(1, p * 1.6)) * (1 - out) * (o.op ?? 1), blur: 14 * (1 - eOutExpo(p)) + 16 * out, grad: w.grad ? o.grad : null, color: w.color || o.color,
        scale: hit * (1 + 0.06 * out), maxW: 4000, glow: w.glow || '' });
    }
    x += ws[i] + gap;
  });
  return { total, left: o.align === 'left' ? o.x : o.x - total / 2 };
}

// ---------------------------------------------------------------- fixed fx
const logoWrap = mk('div', '', $('fx')); logoWrap.id = 'logoWrap';
const logoGlow = mk('div', '', logoWrap); logoGlow.id = 'logoGlow';
const logoImg = mk('img', '', logoWrap); logoImg.id = 'logoImg'; logoImg.src = 'brand/logo.png';
const eq = mk('div', '', $('fx')); eq.id = 'eq'; for (let i = 0; i < 7; i++) mk('i', '', eq);
const botc = mk('div', '', $('fx')); botc.id = 'botc';
botc.innerHTML = '<svg viewBox="0 0 24 24" style="position:absolute;left:22%;top:22%;width:56%;height:56%"><path fill="#F7F1E8" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>';
const HEART = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#E0A253" stroke="#F7DCA8" stroke-width="1" d="M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z"/></svg>';
const MK_TOKEN = (P) => { const d = mk('div', 'token', P); d.innerHTML = HEART; return d; };
const MK_LINE = (P) => mk('div', 'line', P);
const MK_BAR = (P) => mk('div', 'vbar', P);
const sel = mk('div', 'sel', $('fx')); const hTop = mk('div', 'handle top', $('fx')); const hBot = mk('div', 'handle bot', $('fx'));
const caret = mk('div', 'caret', texts);
const pcv = $('particles'), pg = pcv.getContext('2d');
let seed = 1234567; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const PARTS = Array.from({ length: 120 }, () => ({ x: rnd() * 1920, y: rnd() * 1080, z: 0.3 + rnd() * 0.9, r: 0.8 + rnd() * 2.2, ph: rnd() * 6.28, sp: 0.4 + rnd() }));
{ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`; }

// which theme is on screen
function themeAt(t) {
  const w = T0.wipes;
  if (t < w[0]) return { a: 'amber', b: 'amber', x: 0, cur: 'amber', prev: 'amber', idx: -1 };
  if (t >= T0.wipeBack) { const x = eIO3(seg(t, T0.wipeBack, T0.wipeBack + 0.3)); return { a: 'ruby', b: 'amber', x, cur: 'amber', prev: 'ruby', idx: 6, p: x }; }
  let i = 0; while (i < 5 && t >= w[i + 1]) i++;
  const x = eIO3(seg(t, w[i], w[i] + 0.16));
  return { a: THEMES[i], b: THEMES[i + 1], x, cur: THEMES[i + 1], prev: THEMES[i], idx: i, p: x };
}

// ================================================================ frame
window.renderAt = function (t) {
  PH.forEach((P) => P.begin()); cardP.begin(); backP.begin(); fxP.begin(); behindP.begin();
  for (const k in TX) TX[k].used = false;
  const th = themeAt(t);
  const pa = PAL[th.a], pb = PAL[th.b];
  const flame = mix(pa.flame, pb.flame, th.x), hotc = mix(pa.hot, pb.hot, th.x), emberc = mix(pa.ember, pb.ember, th.x);
  const glowArr = mixArr(pa.flame, pb.flame, th.x), emberArr = mixArr(pa.ember, pb.ember, th.x);
  const accent = `linear-gradient(100deg,${hotc} 0%,${flame} 35%,${emberc} 60%,${flame} 80%,${hotc} 100%)`;
  const GOLD = 'linear-gradient(100deg,#F7DCA8 0%,#E0A253 35%,#B0553C 60%,#E0A253 80%,#F7DCA8 100%)';
  const bgc = mix(pa.bg, pb.bg, th.x);
  const ink = '#F7F1E8', mist = '#bfb3a8';

  // ---------- background: warm light that drifts, dust, grain
  $('stage').style.background = bgc;
  const glowA = t < SC.mood ? 0.26 + 0.2 * seg(t, T0.aarti - 0.1, T0.aarti + 0.2) * (1 - seg(t, T0.flipIn, T0.flipIn + 1)) : t > SC.end ? 0.34 : 0.22;
  const bx = [560 + 260 * Math.sin(t * 0.33), 1380 + 220 * Math.cos(t * 0.27), 960 + 300 * Math.sin(t * 0.2 + 1)];
  const by = [330 + 120 * Math.cos(t * 0.31), 760 + 120 * Math.sin(t * 0.26), 540 + 140 * Math.cos(t * 0.22)];
  [[glowArr, glowA], [emberArr, 0.18], [mixArr(pa.hot, pb.hot, th.x), 0.05]].forEach(([c, a], i) => {
    const b = $('b' + i); b.style.background = `radial-gradient(circle, ${rgba(c, a)} 0%, ${rgba(c, a * 0.35)} 35%, transparent 68%)`; b.style.transform = `translate(${bx[i]}px,${by[i]}px)`;
  });
  pg.setTransform(2, 0, 0, 2, 0, 0); pg.clearRect(0, 0, 1920, 1080);
  for (const q of PARTS) {
    const y = ((q.y - t * 16 * q.z * q.sp) % 1080 + 1080) % 1080, x = ((q.x + t * 10 * q.z + 16 * Math.sin(t * 0.6 * q.sp + q.ph)) % 1920 + 1920) % 1920;
    const a = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1 * q.sp + q.ph))) * q.z * 0.75;
    pg.beginPath(); pg.fillStyle = rgba(mixArr(pa.hot, pb.hot, th.x), a); pg.arc(x, y, q.r * q.z, 0, 6.2832); pg.fill();
  }
  const fr = Math.round(t * FPS);
  $('grain').style.backgroundPosition = `${(fr * 73) % 256}px ${(fr * 151) % 256}px`;

  let flash = 0, fade = 0, sweepX = -1;
  logoWrap.style.display = 'none'; eq.style.display = 'none'; botc.style.display = 'none';
  sel.style.display = 'none'; hTop.style.display = 'none'; hBot.style.display = 'none'; caret.style.display = 'none';

  // ============ 1. HOOK: the question, word by word
  if (t < SC.meet + 0.45) {
    const out = eIO3(seg(t, SC.meet - 0.12, SC.meet + 0.2));
    const words = LINE('hook').words.map((w, i) => ({ s: ['WHAT', 'DOES', 'YOUR', 'DAY', 'SOUND', 'LIKE?'][i], t: i === 0 ? -0.3 : w.start, grad: i === 4, hit: i === 4 }));
    KW('hk', words.slice(0, 4), { x: 960, y: 420, size: 132, grad: GOLD, out, dyOut: -30 }, t);
    const L = KW('hl', words.slice(4), { x: 960, y: 575, size: 132, grad: GOLD, out, dyOut: -30 }, t);
    // the app's own boot equaliser rises under SOUND, then carries into the logo
    const sx = L.left + measure('SOUND', 132) / 2;
    const ep = eOutBack(seg(t, T0.sound, T0.sound + 0.45), 1.3);
    if (ep > 0) {
      eq.style.display = 'flex';
      const mv = eIO3(seg(t, SC.meet - 0.1, T0.aarti));
      const ex = lerp(sx, 560, mv), ey = lerp(760, 590, mv), eh = lerp(90, 60, mv);
      eq.style.left = ex - (7 * 16 + 6 * 14) / 2 + 'px'; eq.style.top = ey - eh + 'px'; eq.style.height = eh + 'px';
      eq.style.opacity = clamp(ep) * (1 - seg(t, T0.aarti - 0.08, T0.aarti + 0.05));
      eq.style.transform = `scale(${lerp(1, 0.6, mv)})`;
      [...eq.children].forEach((b, i) => { const h = 16 + 70 * Math.abs(Math.sin(t * (3.1 + i * 0.45) + i * 1.3)) * (0.55 + 0.45 * Math.sin(t * 1.7 + i)); b.style.height = h * clamp(ep) * (eh / 90) + 'px'; });
    }
  }

  // ============ 2. MEET: the lockup lands on "Aarti"
  if (t >= SC.meet && t < SC.mood + 0.6) {
    const go = eIO3(seg(t, T0.flipIn - 0.1, T0.flipIn + 0.3));
    T('meet', 'MEET', { x: 700, y: 420, align: 'left', size: 40, weight: 600, ls: 0.34, grad: GOLD, p: seg(t, S('meet') - 0.03, S('meet') + 0.4), op: 1 - go, dx: -300 * eIn3(go) });
    if (t >= T0.aarti - 0.05) {
      const p = seg(t, T0.aarti, T0.aarti + 0.9);
      logoWrap.style.display = 'block';
      const Wd = 300; logoImg.style.width = Wd + 'px'; logoImg.style.left = -Wd / 2 + 'px'; logoImg.style.top = -Wd * 500 / 510 / 2 + 'px';
      logoWrap.style.left = lerp(560, 360, go) + 'px'; logoWrap.style.top = '540px';
      logoWrap.style.transform = `scale(${lerp(0.5, 1, spring(p * 0.9, 0.6, 12)) * lerp(1, 0.7, go)})`;
      logoWrap.style.opacity = eOut3(seg(t, T0.aarti - 0.04, T0.aarti + 0.12)) * (1 - seg(t, T0.flipIn - 0.05, T0.flipIn + 0.2));
      logoImg.style.filter = `drop-shadow(0 0 ${26 + 30 * (1 - p)}px rgba(224,162,83,.55))`;
      Object.assign(logoGlow.style, { width: '900px', height: '900px', left: '-450px', top: '-450px', background: 'radial-gradient(circle, rgba(224,162,83,.32), rgba(224,162,83,.07) 40%, transparent 65%)', opacity: 0.6 + 0.4 * (1 - p) });
      flash = 0.5 * Math.exp(-Math.max(0, t - T0.aarti) * 7) * (t >= T0.aarti ? 1 : 0);
      ring(fxP, 560, 540, T0.aarti, t, 'rgba(247,220,168,.9)', 110, 560, 0.8, 4);
      const wp = seg(t, T0.aarti + 0.06, T0.aarti + 0.7);
      T('wm', 'AARTIMUSIC', { x: 700, y: 548, align: 'left', size: 132, maxW: 980, grad: GOLD, shine: 1 - eOut3(seg(t, T0.music, T0.music + 1.0)),
        ls: lerp(0.22, 0.01, eOutExpo(wp)), op: eOut3(seg(t, T0.aarti + 0.05, T0.aarti + 0.3)) * (1 - seg(t, T0.flipIn - 0.05, T0.flipIn + 0.2)), blur: 10 * (1 - eOut3(wp)) + 14 * go,
        dx: -500 * eIn3(go), glow: '0 0 40px rgba(224,162,83,.22)' });
    }
  }

  // ============ 3. MOOD: phone flips in on the right, headline builds on the left
  if (t >= T0.flipIn - 0.05 && t < SC.search + 0.5) {
    const fp = seg(t, T0.flipIn + 0.08, T0.flipIn + 0.83);
    const out = eInExpo(seg(t, SC.search - 0.12, SC.search + 0.22));
    const d = seg(t, T0.flipIn, SC.search);
    const f = { ...F_STD, X: lerp(1380, 1340, d) - 2200 * out, Y: 540 + 8 * Math.sin(t * 1.5), ry: lerp(88, -16, spring(fp * 0.8, 0.7, 10)) + 6 * d, rx: 4, blur: 22 * out, op: clamp(fp * 6) };
    P0.f = f;
    const sc = 300 * eIO3(seg(t, S('mood') + 0.4, SC.search - 0.1));
    lay(P0.vp, { src: cap('home_content'), sy: sc, sh: 892 });
    lay(P0.vp, { src: cap('nav_home'), srcW: 376, sw: 376, sh: 60, dx: 18, dy: 820, dw: 376, dh: 60 });
    P0.status.style.background = TOP.home_content;
    const ox = -2200 * out;
    T('fp', 'FRESH PICKS', { x: 170, y: 300, align: 'left', size: 40, weight: 600, ls: 0.34, grad: GOLD, p: seg(t, W('mood', 'fresh') - 0.03, W('mood', 'fresh') + 0.4), dx: ox, blur: 18 * out });
    KW('md', [{ s: 'MADE', t: W('mood', 'made') }, { s: 'FOR', t: W('mood', 'for') }], { x: 170 + ox, y: 420, align: 'left', size: 132, op: 1 }, t);
    KW('ym', [{ s: 'YOUR', t: W('mood', 'your') }, { s: 'MOOD', t: W('mood', 'mood'), grad: true, hit: true }], { x: 170 + ox, y: 570, align: 'left', size: 132, grad: GOLD }, t);
    // the real mood chips float out of the screen into the layout
    const chips = RECTS.home_chips.slice(0, 5); let cx = 170;
    chips.forEach((r, i) => {
      const k = 1.75, t0 = W('mood', 'picks') + 0.05 + i * 0.08, p = seg(t, t0, t0 + 0.6);
      if (p <= 0) { cx += r[2] * k + 18; return; }
      const [sx0, sy0] = toStage(f, r[0], r[1]);
      const e = eOutExpo(p);
      const x = lerp(sx0, cx, e) + ox, y = lerp(sy0, 720, e);
      const on = i === 0 && t > W('mood', 'mood');
      card(cardP, 'home_content', r, x, y, k * lerp(0.55, 1, e), { rad: 19 * k, op: clamp(p * 4), tf: `translateZ(${lerp(-200, 0, e) + (on ? 30 * Math.exp(-(t - W('mood', 'mood')) * 5) : 0)}px)`,
        shadow: `0 18px 40px rgba(0,0,0,.45)${on ? `, 0 0 0 3px ${rgba(glowArr, 0.8 * Math.exp(-(t - W('mood', 'mood')) * 2))}` : ''}`, filter: out > 0 ? `blur(${18 * out}px)` : '' });
      cx += r[2] * k + 18;
    });
  }

  // ============ 4. SEARCH: phone left, the search as big type on the right
  if (t >= SC.search - 0.1 && t < SC.play + 0.6) {
    const inP = eOutExpo(seg(t, SC.search - 0.02, SC.search + 0.5));
    const away = eInExpo(seg(t, SC.play, SC.play + 0.34));
    const f = { ...F_STD, X: lerp(2500, 560, inP) - 1600 * away, Y: 540 + 8 * Math.sin(t * 1.4), ry: lerp(30, 12, inP) - 4 * seg(t, SC.search, SC.play), rx: 4, blur: 22 * (1 - inP) + 20 * away };
    if (t < T0.press - 0.12) P0.f = f;
    const ox = 2000 * (1 - inP) + 1800 * away;
    const mine = t < T0.press - 0.12;
    // screen states, from the real app
    let base = 'search_idle';
    if (t >= W('search', 'search') - 0.06) base = 'search_focus';
    for (let i = 0; i < 6; i++) if (t >= T0.typeStart + i * T0.keyStep) base = 'search_q' + (i + 1);
    const rows = RECTS.result_rows;
    if (!mine) { /* the player scene owns the phone now */ }
    else if (t < T0.submit) full(P0.vp, base);
    else {
      full(P0.vp, 'search_q6'); crop(P0.vp, 'search_results', [0, 0, 412, 436], { op: eOut3(seg(t, T0.submit, T0.submit + 0.15)) });
      for (let i = 0; i < 6; i++) { const r = rows[i], p = seg(t, T0.submit + 0.05 + i * 0.06, T0.submit + 0.55 + i * 0.06); if (p > 0) crop(P0.vp, 'search_results', i < 5 ? [0, r[1], 412, r[3]] : [0, r[1], 412, 892 - r[1]], { op: eOut3(Math.min(1, p * 2)), tf: `translateY(${(1 - eOutBack(p, 1.1)) * 34}px)` }); }
      if (t >= T0.tap + 0.1) full(P0.vp, 'search_tapped', eOut3(seg(t, T0.tap + 0.1, T0.tap + 0.22)));
    }
    base = t < T0.submit ? base : 'search_results';
    if (mine) P0.status.style.background = TOP[base];
    const sb = RECTS.searchbar; touch(P0.ov, sb[0] + 120, sb[1] + sb[3] / 2, W('search', 'search') - 0.06, t);
    // headline: SEARCH / ANY SONG. with a text-selection sweep, then FIND IT. / TAP IT.
    const hx = 1010 + ox, sOut = seg(t, T0.find - 0.12, T0.find + 0.1);
    if (sOut < 1) {
      T('s1', 'SEARCH', { x: hx, y: 250, align: 'left', size: 128, p: seg(t, W('search', 'search') - 0.04, W('search', 'search') + 0.4), out: sOut });
      T('s2', 'ANY SONG.', { x: hx, y: 395, align: 'left', size: 128, p: seg(t, W('search', 'any') - 0.04, W('search', 'any') + 0.4), out: sOut, grad: t > W('search', 'song') ? GOLD : null, z: 2 });
      const sp = eIO3(seg(t, W('search', 'any') + 0.05, W('search', 'song') + 0.3));
      if (sp > 0 && sOut < 0.5) {
        const wAll = measure('ANY SONG.', 128) + 20, h = 150, y0 = 395 - h / 2;
        Object.assign(sel.style, { display: 'block', left: hx - 6 + 'px', top: y0 + 'px', width: wAll * sp + 'px', height: h + 'px', opacity: 1 - sOut * 2 });
        Object.assign(hTop.style, { display: 'block', left: hx - 8 + 'px', top: y0 + 'px', height: h + 'px', opacity: 1 - sOut * 2 });
        Object.assign(hBot.style, { display: 'block', left: hx - 6 + wAll * sp + 'px', top: y0 + 'px', height: h + 'px', opacity: 1 - sOut * 2 });
      }
    }
    if (t >= T0.find - 0.05) {
      const tp = seg(t, T0.tap - 0.05, T0.tap + 0.1);
      T('f1', 'FIND IT.', { x: hx, y: 300, align: 'left', size: 150, p: seg(t, T0.find - 0.04, T0.find + 0.35), out: tp, op: 1 - away });
      if (t >= T0.tap - 0.05) T('f2', 'TAP IT.', { x: hx, y: 300, align: 'left', size: 150, grad: GOLD, p: seg(t, T0.tap - 0.03, T0.tap + 0.3), op: 1 - away, blur: 20 * away });
    }
    // macro search field, typing live
    const bp = eOutExpo(seg(t, W('search', 'search') - 0.05, W('search', 'search') + 0.45)), bOut = eIO3(seg(t, T0.submit + 0.3, T0.find));
    if (bp > 0 && bOut < 1) card(cardP, base === 'search_results' ? 'search_q6' : base, [sb[0] - 4, sb[1] - 4, sb[2] + 8, sb[3] + 8], hx, 520 + 30 * bOut, 2.0, { rad: 28, op: bp * (1 - bOut), tf: `translateZ(${lerp(-300, 40, bp)}px) rotateY(${-10 * (1 - bp)}deg)`, shadow: '0 30px 60px rgba(0,0,0,.5), 0 0 0 1.5px rgba(224,162,83,.35)' });
    // results arrive as cards
    for (let i = 0; i < 3; i++) {
      const r = rows[i], k = 1.55, t0 = T0.submit + 0.12 + i * 0.09, p = seg(t, t0, t0 + 0.6);
      if (p <= 0) continue;
      const e = eOutExpo(p), y = lerp(640, 560, eIO3(bOut)) + i * 112;
      const sel0 = i === 0 ? seg(t, T0.find, T0.find + 0.25) : 0;
      const press = i === 0 ? Math.exp(-Math.max(0, t - T0.tap) * 9) * (t >= T0.tap ? 1 : 0) : 0;
      const src = i === 0 && t >= T0.tap + 0.1 ? 'search_tapped' : 'search_results';
      // the first row's artwork leaves for the player, so its card keeps an empty slot
      const gone = i === 0 && t >= SC.play;
      card(cardP, src, r, hx + 260 * (1 - e), y, k, { rad: 16, op: clamp(p * 3) * (i === 0 ? 1 - eIO3(seg(t, SC.play + 0.2, SC.play + 0.4)) : 1),
        tf: `translateZ(${lerp(-250, 0, e) + 40 * sel0 - 20 * press}px) scale(${1 - 0.04 * press})`,
        shadow: `0 24px 50px rgba(0,0,0,.5)${sel0 ? `, 0 0 0 ${3 * sel0}px rgba(224,162,83,.9), 0 0 ${40 * sel0}px rgba(224,162,83,.45)` : ''}`,
        clip: gone ? `inset(0 0 0 ${76 * k}px round 16px)` : '' });
      if (i === 0) { touch(fxP, hx + 80 * k, y + 33 * k, T0.tap, t, 1.4); ripple(fxP, [hx, y, r[2] * k, r[3] * k, 16], hx + 80 * k, y + 33 * k, T0.tap, t, '#E0A253'); }
    }
  }

  // ============ 5. PLAY: the artwork becomes the player, PLAY lands behind the phone
  if (t >= SC.play - 0.05 && t < SC.lists + 0.7) {
    const rise = spring(seg(t, T0.press - 0.12, T0.press + 0.6) * 0.8, 0.72, 10);
    const leave = eIO3(seg(t, SC.lists, SC.lists + 0.55));
    const d = seg(t, T0.playW, SC.lists);
    const f = { ...F_STD, X: lerp(960, 1360, leave), Y: lerp(1650, 548, rise) + 6 * Math.sin(t * 1.4), ry: lerp(-4, 6, eIO3(d)) - 16 * leave, rx: lerp(18, 4, rise), op: clamp(rise * 4) };
    if (t >= T0.press - 0.12) P0.f = f;
    // screens
    const playing = t >= T0.playW + 0.05;
    let base = !playing ? 'now_paused' : t < T0.playW + 0.62 ? 'now_playing0' : 'now_playing1';
    const roll = eIO3(seg(t, SC.lists + 0.05, SC.lists + 0.45));
    const owns = t >= T0.press - 0.12;
    if (owns) full(P0.vp, base, 1, { tf: `translateY(${-892 * roll}px)` });
    if (owns && t >= T0.playW + 0.62 && t < T0.playW + 0.8) full(P0.vp, 'now_playing1', seg(t, T0.playW + 0.62, T0.playW + 0.8));
    if (roll > 0) full(P0.vp, 'lib', 1, { tf: `translateY(${892 * (1 - roll)}px)` });
    if (owns) P0.status.style.background = TOP[roll > 0.5 ? 'lib' : base];
    const pbx = RECTS.now_play, cxp = pbx[0] + pbx[2] / 2, cyp = pbx[1] + pbx[3] / 2;
    const press = seg(t, T0.playW - 0.02, T0.playW + 0.05), rel = seg(t, T0.playW + 0.05, T0.playW + 0.55);
    if (press > 0 && rel < 1 && roll === 0) { const s = rel > 0 ? lerp(0.9, 1, spring(rel, 0.45, 16)) : lerp(1, 0.9, eOut3(press)); crop(P0.vp, rel > 0 ? 'now_playing0' : 'now_paused', [pbx[0] - 6, pbx[1] - 6, pbx[2] + 12, pbx[3] + 12], { rad: 44, tf: `scale(${s})` }); }
    ring(P0.ov, cxp, cyp, T0.playW + 0.05, t, flame, 36, 200, 0.8, 3); ring(P0.ov, cxp, cyp, T0.playW + 0.2, t, hotc, 36, 150, 0.7, 2);
    touch(P0.ov, cxp, cyp, T0.playW - 0.02, t);
    if (playing && roll === 0) { const beat = ((t - 0.25) % 0.5) / 0.5, c = RECTS.now_cover; crop(P0.vp, base, [c[0] - 2, c[1] - 2, c[2] + 4, c[3] + 4], { tf: `scale(${1 + 0.012 * Math.exp(-beat * 6)})`, rad: 18 }); }
    // the tapped artwork flies out, grows, and lands in the player
    const cv = RECTS.now_cover;
    const fl = seg(t, SC.play, T0.press + 0.5);
    if (fl > 0 && fl < 1) {
      const hx = 1010, k = 1.55, rowY = 640, a0 = [hx + 20 * k, rowY + 8 * k, 50 * k];
      const mid = [960 - 230, 250, 460];
      const [lx, ly] = toStage(f, cv[0], cv[1]); const land = [lx, ly, cv[2] * f.s];
      const e1 = eIO3(seg(t, SC.play, T0.press - 0.05)), e2 = eIO3(seg(t, T0.press - 0.05, T0.press + 0.5));
      const x = e2 > 0 ? lerp(mid[0], land[0], e2) : lerp(a0[0], mid[0], e1), y = e2 > 0 ? lerp(mid[1], land[1], e2) : lerp(a0[1], mid[1], e1), w = e2 > 0 ? lerp(mid[2], land[2], e2) : lerp(a0[2], mid[2], e1);
      lay(fxP, { src: 'art/cover00.jpg', srcW: w, sw: w, sh: w, dx: x, dy: y, dw: w, dh: w, rad: lerp(8, 18, e1) - 4 * e2,
        op: 1 - eIO3(seg(t, T0.press + 0.35, T0.press + 0.5)), tf: `rotate(${-6 * Math.sin(Math.PI * e1) * (1 - e2)}deg)`,
        shadow: `0 40px 90px rgba(0,0,0,.6), 0 0 ${120 * (1 - e2)}px rgba(224,162,83,${0.45 * e1 * (1 - e2)})` });
    }
    // PLAY: a giant word behind the phone
    if (t >= T0.playW - 0.04) {
      const p = seg(t, T0.playW - 0.04, T0.playW + 0.28);
      const o = { y: 548, size: 400, maxW: 4000, grad: GOLD, nomask: true, ls: 0.02, op: eOut3(p) * 0.95 * (1 - leave), blur: 22 * (1 - eOutExpo(p)) + 20 * leave,
        scale: lerp(1.35, 1, eOutExpo(p)) * (1 + 0.03 * seg(t, T0.playW, SC.lists)), shine: 1 - eOut3(seg(t, T0.playW + 0.1, T0.playW + 1.2)) };
      const gap = 235 + 60 * (1 - eOutExpo(p));
      T('play1', 'PL', { ...o, x: 960 - gap - 900 * eIn3(leave), align: 'right' }, behind);
      T('play2', 'AY', { ...o, x: 960 + gap - 900 * eIn3(leave), align: 'left' }, behind);
    }
    // a soft visualiser along the floor, moving with the beat
    const vis = seg(t, T0.playW, T0.playW + 0.4) * (1 - leave);
    if (vis > 0) for (let i = 0; i < 40; i++) {
      const side = i < 20 ? -1 : 1, j = i % 20, x = 960 + side * (300 + j * 32);
      const beat = ((t - 0.25) % 0.5) / 0.5, env = 0.35 + 0.65 * Math.exp(-beat * 4);
      const h = (14 + 70 * Math.abs(Math.sin(t * (2.2 + (j % 5) * 0.5) + j * 1.7)) * env) * (1 - j / 26);
      const e = fxP.next(MK_BAR); Object.assign(e.style, { left: x - 5 + 'px', top: 1000 - h + 'px', height: h + 'px', bottom: '', opacity: 0.35 * vis * (1 - j / 22) });
    }
  }

  // ============ 6. LISTS: playlists fan out on the left, then favourites
  if (t >= SC.lists && t < SC.tg + 0.5) {
    const f = { ...F_STD, X: 1360, Y: 540 + 8 * Math.sin(t * 1.4), ry: lerp(-10, -16, seg(t, SC.lists, SC.tg)), rx: 4 };
    const tgGo = eIO3(seg(t, SC.tg - 0.05, SC.tg + 0.5));
    f.X = lerp(1360, 1450, tgGo); f.s = lerp(0.96, 0.8, tgGo); f.Y = lerp(f.Y, 610, tgGo);
    if (t >= SC.lists + 0.55) {
      P0.f = f;
      const sc = eIO3(seg(t, T0.keep - 0.1, T0.keep + 0.35));
      if (sc < 1) full(P0.vp, t >= T0.pls + 0.5 ? 'lib_after' : 'lib', 1, { tf: `translateY(${-120 * sc}px)`, op: 1 - sc });
      if (sc > 0) full(P0.vp, 'lib_scroll', sc, { tf: `translateY(${120 * (1 - sc)}px)` });
      P0.status.style.background = TOP.lib;
    }
    const hx = 170, hOut = seg(t, T0.keep - 0.15, T0.keep + 0.1);
    if (hOut < 1) {
      T('pl1', 'PLAYLISTS', { x: hx, y: 250, align: 'left', size: 132, p: seg(t, T0.pls - 0.04, T0.pls + 0.4), out: hOut });
      KW('pl2', [{ s: 'FOR', t: W('lists', 'for') }, { s: 'EVERY', t: W('lists', 'every') }, { s: 'MOOD', t: T0.moodW, grad: true, hit: true }], { x: hx, y: 380, align: 'left', size: 76, weight: 700, grad: GOLD, out: hOut, dyOut: -40 }, t);
    }
    // the create dialog, then the playlists it makes
    const dlg = RECTS.create_dialog, dk = 1.5;
    const dp = eOutBack(seg(t, T0.build - 0.05, T0.build + 0.4), 1.2), dOut = eIO3(seg(t, T0.pls + 0.25, T0.pls + 0.6));
    if (dp > 0 && dOut < 1) {
      card(cardP, 'create_typed', dlg, lerp(hx, 780, dOut), lerp(520, 640, dOut), dk * lerp(1, 0.4, dOut), { rad: 24 * dk, op: clamp(dp * 3) * (1 - dOut), tf: `translateZ(${lerp(-200, 0, clamp(dp))}px)`, shadow: '0 30px 70px rgba(0,0,0,.55), 0 0 0 1.5px rgba(224,162,83,.3)' });
      const cb = RECTS.create_btn; touch(fxP, hx + (cb[0] - dlg[0] + cb[2] / 2) * dk, 520 + (cb[1] - dlg[1] + cb[3] / 2) * dk, T0.pls + 0.1, t, 1.3);
    }
    const lc = RECTS.lib_cards_after, fanOut = eIO3(seg(t, T0.keep - 0.15, T0.keep + 0.25));
    lc.forEach((r, i) => {
      const t0 = T0.pls + 0.3 + i * 0.1, p = seg(t, t0, t0 + 0.6); if (p <= 0 || fanOut >= 1) return;
      const e = eOutBack(p, 1.3), k = 1.32, x = hx + i * 270, y = 530 + [10, -8, 14][i];
      card(cardP, 'lib_after', r, x - 60 * fanOut, y + 500 * eIn3(fanOut), k, { rad: 20 * k, op: clamp(p * 3) * (1 - fanOut),
        tf: `translateZ(${lerp(-300, 0, clamp(e))}px) rotate(${[-4, 1.5, 5][i] * clamp(e)}deg) scale(${lerp(0.7, 1, e)})`,
        shadow: `0 30px 60px rgba(0,0,0,.55)${i === 2 ? `, 0 0 ${40 * Math.exp(-(t - t0) * 2)}px rgba(224,162,83,.6)` : ''}` });
    });
    // favourites: keep them close
    if (t >= T0.keep - 0.1) {
      const tgOut = eIn3(seg(t, SC.tg - 0.1, SC.tg + 0.3));
      KW('kp', [{ s: 'KEEP', t: T0.keep }, { s: 'YOUR', t: W('lists', 'your') }], { x: hx, y: 215, align: 'left', size: 76, weight: 700, out: tgOut, dyOut: -40 }, t);
      KW('fv', [{ s: 'FAVOURITES', t: T0.favs, grad: true, hit: true }], { x: hx, y: 330, align: 'left', size: 132, grad: GOLD, out: tgOut, dyOut: -40 }, t);
      KW('cl', [{ s: 'CLOSE.', t: T0.close }], { x: hx, y: 445, align: 'left', size: 76, weight: 700, out: tgOut, dyOut: -40 }, t);
      RECTS.lib_rows.slice(0, 3).forEach((r, i) => {
        const t0 = T0.favs - 0.05 + i * 0.09, p = seg(t, t0, t0 + 0.55); if (p <= 0) return;
        const e = eOutExpo(p), k = 1.5, y = 560 + i * 118;
        card(cardP, 'lib', r, hx - 300 * (1 - e) - 1900 * tgOut, y, k, { rad: 16, op: clamp(p * 3), tf: `translateZ(${lerp(-200, 0, e)}px)`, shadow: '0 24px 50px rgba(0,0,0,.5)' });
        // the gold heart in each row gives a small beat
        const hxr = hx + 312 * k - 1900 * tgOut, hyr = y + 33 * k; ring(fxP, hxr, hyr, t0 + 0.15, t, 'rgba(224,162,83,.9)', 10, 46, 0.5, 2);
      });
    }
  }

  // ============ 7. TELEGRAM: phone → bot → another phone
  if (t >= SC.tg - 0.1 && t < SC.themes + 0.8) {
    const toTh = eIO3(seg(t, SC.themes, SC.themes + 0.6));
    // phone A (the one we have been using) on the right
    const fA = { ...F_STD, X: lerp(1450, 1400, toTh), Y: lerp(610, 600, toTh) + 6 * Math.sin(t * 1.3), s: lerp(0.8, 0.78, toTh), ry: lerp(-16, -22, toTh), rx: 4 };
    if (t >= SC.tg) P0.f = fA;
    const sh = t >= T0.connect + 0.2;
    if (t >= SC.tg && t < SC.themes + 0.2) {
      full(P0.vp, 'lib_scroll', 1 - eIO3(seg(t, SC.tg, SC.tg + 0.3)));
      full(P0.vp, 'lib', eIO3(seg(t, SC.tg, SC.tg + 0.3)));
      touch(P0.ov, 358, 84, T0.connect + 0.05, t);
      if (sh) {
        const ls = RECTS.link_sheet, p = spring(seg(t, T0.connect + 0.2, T0.connect + 0.8) * 0.8, 0.8, 11), fp = eOut3(seg(t, T0.connect + 0.2, T0.connect + 0.4));
        crop(P0.vp, 'link', [0, 0, 412, ls[1]], { op: fp }); crop(P0.vp, 'link', [0, ls[1], 412, 892 - ls[1]], { tf: `translateY(${(1 - p) * (892 - ls[1])}px)` });
      }
      P0.status.style.background = TOP.lib;
    }
    // phone B arrives from the left: "any phone"
    const bIn = eOutExpo(seg(t, T0.tgAnd - 0.05, T0.tgAnd + 0.5));
    const fB = { ...F_STD, X: lerp(-500, 470, bIn), Y: lerp(610, 600, toTh) + 6 * Math.sin(t * 1.2 + 1), s: lerp(0.8, 0.78, toTh), ry: lerp(30, 16, bIn) + 6 * toTh, rx: 4, blur: 16 * (1 - bIn) };
    if (bIn > 0) { P1.f = fB; if (t < SC.themes + 0.2) { full(P1.vp, 'lib_scroll'); P1.status.style.background = TOP.lib; } }
    const glowB = t >= T0.phone ? Math.exp(-(t - T0.phone) * 2.5) : 0;
    if (glowB > 0.01) ring(fxP, fB.X, fB.Y, T0.phone, t, flame, 240, 420, 0.9, 3);
    // the bot node, with the connecting lines
    const gp = spring(seg(t, T0.telegram - 0.05, T0.telegram + 0.6) * 0.8, 0.6, 12), gOut = eIO3(seg(t, SC.themes - 0.05, SC.themes + 0.35));
    if (gp > 0 && gOut < 1) {
      const BS = 190;
      botc.style.display = 'block';
      Object.assign(botc.style, { width: BS + 'px', height: BS + 'px', left: 960 - BS / 2 + 'px', top: 600 - BS / 2 + 'px', opacity: clamp(gp * 3) * (1 - gOut), transform: `scale(${lerp(0.4, 1, gp) * (1 - 0.4 * gOut)})` });
      T('bh', '@aartimusic_bot', { x: 960, y: 770, size: 40, weight: 600, ls: 0, p: seg(t, T0.telegram + 0.1, T0.telegram + 0.5), op: 1 - gOut });
      T('bs', 'Telegram bot', { x: 960, y: 825, size: 26, weight: 400, ls: 0.02, color: mist, p: seg(t, T0.telegram + 0.2, T0.telegram + 0.6), op: 1 - gOut });
      const lines = [[fA.X - 0.5 * 440 * fA.s * 0.9, 960 + BS / 2 + 12, T0.telegram + 0.1], [960 - BS / 2 - 12, fB.X + 0.5 * 440 * fB.s * 0.9, T0.tgAnd + 0.1]];
      lines.forEach(([x0, x1, t0]) => {
        const p = eOut3(seg(t, t0, t0 + 0.45)); if (p <= 0) return;
        const e = fxP.next(MK_LINE); Object.assign(e.style, { left: x0 + 'px', top: '600px', width: Math.abs(x1 - x0) * p + 'px', transform: 'scaleX(-1)', opacity: 0.8 * (1 - gOut) });
      });
      // favourites travel: phone A → bot → phone B
      [[T0.tgFavs, lines[0][0], lines[0][1]], [T0.tgFavs + 0.12, lines[0][0], lines[0][1]], [T0.follow, lines[1][0], lines[1][1]], [T0.follow + 0.12, lines[1][0], lines[1][1]], [T0.follow + 0.24, lines[1][0], lines[1][1]]].forEach(([t0, x0, x1]) => {
        const p = seg(t, t0, t0 + 0.55); if (p <= 0 || p >= 1) return;
        const e = fxP.next(MK_TOKEN); const s = 40 + 14 * Math.sin(p * Math.PI);
        Object.assign(e.style, { left: lerp(x0, x1, eIO3(p)) - s / 2 + 'px', top: 600 - s / 2 + 'px', width: s + 'px', height: s + 'px', opacity: Math.sin(p * Math.PI), filter: 'drop-shadow(0 0 12px rgba(224,162,83,.9))' });
      });
      ring(fxP, 960, 600, T0.tgFavs + 0.55, t, flame, 95, 160, 0.6, 3);
    }
    // headlines
    const hOut = seg(t, T0.tgFavs - 0.15, T0.tgFavs + 0.05), thOut = eIn3(seg(t, SC.themes - 0.1, SC.themes + 0.2));
    if (hOut < 1) KW('ct', [{ s: 'CONNECT', t: T0.connect }, { s: 'TELEGRAM', t: T0.telegram, grad: true }], { x: 960, y: 140, size: 84, grad: GOLD, out: hOut, dyOut: -30 }, t);
    if (t >= T0.tgFavs - 0.1) {
      KW('fl', [{ s: 'FAVOURITES', t: T0.tgFavs }, { s: 'THAT', t: T0.tgFavs + 0.25 }, { s: 'FOLLOW', t: T0.follow, grad: true, hit: true }, { s: 'YOU', t: W('tg', 'you'), grad: true }], { x: 960, y: 140, size: 84, grad: GOLD, out: thOut, dyOut: -30 }, t);
      if (t >= T0.phone - 0.05) T('ap', 'TO ANY PHONE', { x: 960, y: 960, size: 38, weight: 600, ls: 0.32, grad: GOLD, p: seg(t, W('tg', 'any') - 0.05, W('tg', 'any') + 0.35), op: 1 - thOut });
    }
  }

  // ============ 8. THEMES: three phones, one design, seven palettes
  if (t >= SC.themes) {
    const outE = eIO3(seg(t, SC.end, SC.end + 0.6));
    const cIn = spring(seg(t, SC.themes + 0.05, SC.themes + 0.8) * 0.8, 0.72, 10);
    const fC = { ...F_STD, X: lerp(960, 1330, outE), Y: lerp(1700, lerp(600, 548, outE), cIn) + 5 * Math.sin(t * 1.3), s: lerp(0.84, 0.96, outE), ry: lerp(0, -14, outE), rx: lerp(20, 4, cIn), op: clamp(cIn * 4) };
    P2.f = fC;
    const side = (P, name, fromX, toX, ry) => {
      const f = { ...F_STD, X: lerp(fromX, toX, outE), Y: 600 + 5 * Math.sin(t * 1.2 + fromX), s: 0.78, ry, rx: 4, z: -160 * eIO3(seg(t, SC.themes, SC.themes + 0.6)), op: 1 - clamp(outE * 1.4), blur: 10 * outE };
      if ((!P.f || t >= SC.themes + 0.6) && f.op > 0.001) P.f = f; else if (t >= SC.themes + 0.6) P.f = null;
      return f;
    };
    // side phones settle in behind the centre one and wear other themes
    if (t >= SC.themes) {
      const fL = side(P1, 'violet', 470, -700, 22), fR = side(P0, 'teal', 1400, 2600, -22);
      const sw = eIO3(seg(t, SC.themes + 0.2, SC.themes + 0.55));
      const lt = t < T0.wipes[2] ? 'violet' : t < T0.wipes[4] ? 'green' : 'indigo';
      const rt = t < T0.wipes[1] ? 'teal' : t < T0.wipes[3] ? 'neon' : 'ruby';
      full(P1.vp, 'lib_scroll', 1 - sw); full(P1.vp, 'home_' + lt, sw); P1.status.style.background = TOP['home_' + lt];
      full(P0.vp, 'link', 1 - sw); full(P0.vp, 'home_' + rt, sw); P0.status.style.background = TOP['home_' + rt];
    }
    // centre: the palette changes, the layout never moves
    const heroSwap = t >= SC.end + 0.3;
    if (!heroSwap) {
      if (th.idx < 0) full(P2.vp, 'home_amber');
      else { full(P2.vp, 'home_' + th.prev); if (th.p > 0) { full(P2.vp, 'home_' + th.cur, 1, { clip: `circle(${1000 * th.p}px at 370px 36px)` }); ring(P2.ov, 370, 36, t - th.p * 0.16, t, PAL[th.cur].flame, 10, 1000, 0.2, 4); } }
      P2.status.style.background = TOP['home_' + (th.p > 0.5 ? th.cur : th.prev)];
    } else { full(P2.vp, 'now_playing2'); P2.status.style.background = TOP.now_playing2; const beat = ((t - 0.25) % 0.5) / 0.5, c = RECTS.now_cover; crop(P2.vp, 'now_playing2', [c[0] - 2, c[1] - 2, c[2] + 4, c[3] + 4], { tf: `scale(${1 + 0.008 * Math.exp(-beat * 5)})`, rad: 18 }); }
    if (t >= SC.end + 0.1 && t < SC.end + 0.7) sweepX = seg(t, SC.end + 0.1, SC.end + 0.65);
    const xo = seg(t, SC.end - 0.1, SC.end + 0.15);
    if (xo < 1 && t < SC.end + 0.2) {
      KW('sv', [{ s: 'SEVEN', t: T0.seven }, { s: 'THEMES', t: T0.themesW, grad: true }], { x: 960, y: 118, size: 76, grad: accent, out: seg(t, T0.make - 0.15, T0.make + 0.05), dyOut: -30 }, t);
      if (t >= T0.make - 0.08) KW('my', [{ s: 'MAKE', t: T0.make }, { s: 'IT', t: W('themes', 'it') }, { s: 'YOURS', t: W('themes', 'yours'), grad: true, hit: true }], { x: 960, y: 118, size: 76, grad: accent, out: xo, dyOut: -30 }, t);
    }
  }

  // ============ 9. END: logo on "Aarti", the line typed out
  if (t >= SC.end + 0.2) {
    if (t >= T0.endAarti - 0.05) {
      const p = seg(t, T0.endAarti, T0.endAarti + 0.85);
      logoWrap.style.display = 'block';
      const Wd = 250; logoImg.style.width = Wd + 'px'; logoImg.style.left = -Wd / 2 + 'px'; logoImg.style.top = -Wd * 500 / 510 / 2 + 'px';
      logoWrap.style.left = '600px'; logoWrap.style.top = '330px';
      logoWrap.style.transform = `scale(${lerp(0.55, 1, spring(p * 0.85, 0.62, 12))})`; logoWrap.style.opacity = eOut3(seg(t, T0.endAarti - 0.04, T0.endAarti + 0.15));
      logoImg.style.filter = 'drop-shadow(0 0 26px rgba(224,162,83,.5))';
      Object.assign(logoGlow.style, { width: '760px', height: '760px', left: '-380px', top: '-380px', background: 'radial-gradient(circle, rgba(224,162,83,.28), rgba(224,162,83,.06) 40%, transparent 65%)', opacity: 1 });
      flash = Math.max(flash, 0.38 * Math.exp(-Math.max(0, t - T0.endAarti) * 6));
      ring(fxP, 600, 330, T0.endAarti, t, 'rgba(247,220,168,.85)', 100, 420, 0.8, 3);
      const wp = seg(t, T0.endAarti + 0.06, T0.endAarti + 0.7);
      T('ew', 'AARTIMUSIC', { x: 600, y: 540, size: 118, maxW: 860, grad: GOLD, shine: 1 - eOut3(seg(t, W('end', 'music'), W('end', 'music') + 1.1)), ls: lerp(0.22, 0.01, eOutExpo(wp)), op: eOut3(seg(t, T0.endAarti + 0.05, T0.endAarti + 0.3)), blur: 8 * (1 - eOut3(wp)), glow: '0 0 40px rgba(224,162,83,.22)' });
      // "Your daily sound" typed as it is spoken, the app's own tagline
      const line = 'Your daily sound', t0 = T0.your - 0.03, t1 = T0.sound2 + 0.32;
      const n = Math.round(line.length * clamp((t - t0) / (t1 - t0)));
      if (t >= t0) {
        const size = 50, wFull = measure(line, size, 500, 0.01), shown = line.slice(0, n), wNow = measure(shown, size, 500, 0.01);
        if (n > 0) T('tag', shown, { x: 600 - wFull / 2, y: 650, align: 'left', size, weight: 500, ls: 0.01, color: ink, nomask: true, maxW: 4000 });
        const blink = t < t1 + 0.1 || Math.floor((t - t1) * 2.2) % 2 === 0;
        Object.assign(caret.style, { display: blink ? 'block' : 'none', left: 600 - wFull / 2 + wNow + 8 + 'px', top: 650 - 30 + 'px', height: '60px' });
      }
      T('cap', 'Android app  ·  @aartimusic_bot on Telegram', { x: 600, y: 760, size: 26, weight: 400, ls: 0.04, color: mist, p: seg(t, T0.sound2 + 0.25, T0.sound2 + 0.7) });
    }
    fade = eIO3(seg(t, T0.fade, END - 1 / FPS));
  }

  // ---------- commit
  PH.forEach((P) => P.end());
  const sw = $('sweep');
  if (sweepX >= 0 && sweepX < 1) { sw.style.display = 'block'; sw.style.transform = `translateX(${lerp(-300, 2500, eIO3(sweepX))}px) rotate(20deg)`; sw.style.opacity = Math.sin(sweepX * Math.PI); } else sw.style.display = 'none';
  $('flash').style.opacity = flash; $('fade').style.opacity = fade;
  $('stage').style.transform = t > T0.endAarti ? `scale(${1 + 0.02 * eIO3(seg(t, T0.endAarti, END))})` : '';
  for (const k in TX) if (!TX[k].used) TX[k].style.display = 'none';
  cardP.end(); backP.end(); fxP.end(); behindP.end();
};
window.READY = true;
})().catch((e) => { window.READY_ERR = String(e && e.stack || e); });
