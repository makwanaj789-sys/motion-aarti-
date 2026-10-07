/* AartiMusic promo compositor.
   One timeline drives everything: renderAt(t) poses every element for time t,
   and CUES (exported for the audio engine) is derived from the same constants. */
(async function () {
'use strict';
const RECTS = await (await fetch('cap/rects.json')).json();

// ---------------------------------------------------------------- timeline
const FPS = 30, END = 24.5;
const SC = { hook: 0, discover: 2.75, search: 5.75, player: 9.25, library: 12.25, telegram: 15.25, themes: 18.25, hero: 21.25, end: END };
const TT = {
  yourWay: 0.75, hookOut: 1.4, logo: 1.5, word: 1.62, push: 2.35,
  scroll1: [3.2, 4.0], lift: [3.25, 3.75, 3.95, 4.35], scroll2: [4.4, 5.3], dOut: 5.45,
  sIn: 5.72, tapSearch: 6.05, keys: [6.35, 6.5, 6.65, 6.8, 6.95, 7.1], submit: 7.35, rows: 7.4, pan: [7.35, 8.15], rowTap: 8.3, tapped: 8.42,
  expand: [8.85, 9.5], playTap: 10.35, playOn: 10.45, prog1: 11.25, prog2: 11.9, macro: [10.95, 11.8], pOut: 11.95,
  lIn: 12.2, lift2: [12.6, 13.0, 13.3, 13.65], tapCreate: 13.75, dialog: 13.9, keys2: 14.1, keyStep: 0.065, typed: 14.72, tapCreateBtn: 14.85, newCard: 15.0,
  gText: 15.3, strip: [15.45, 15.85, 16.0, 16.3], tapConnect: 16.02, sheet: 16.15, toIcon: [16.75, 17.2], botHead: 16.9, bot: 17.2, beam: 17.35, hearts: [17.5, 17.72, 17.92], gOut: 17.95,
  thIn: 18.12, wipes: [18.85, 19.15, 19.45, 19.75, 20.05, 20.35, 20.8], wipeDur: 0.26,
  sweep: 21.15, heroLogo: 21.3, heroWord: 21.45, tag: [21.95, 22.25, 22.55], cta: 22.95, fade: 24.1,
};
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

// Sound cues, from the same constants the picture uses.
const CUES = [];
const cue = (t, k, extra) => CUES.push(Object.assign({ t: +t.toFixed(4), k }, extra || {}));
cue(0.3, 'riser', { d: TT.logo - 0.3 }); cue(0, 'swell');
cue(TT.yourWay, 'pop'); cue(TT.logo, 'impact_big'); cue(TT.word, 'shimmer');
cue(TT.push, 'whoosh', { d: 0.5 }); cue(SC.discover, 'pop'); cue(TT.lift[0], 'lift'); cue(TT.lift[2], 'settle');
cue(TT.dOut - 0.05, 'whoosh', { d: 0.45 });
cue(TT.tapSearch, 'tap'); TT.keys.forEach((k) => cue(k, 'key')); cue(TT.submit, 'tap');
for (let i = 0; i < 6; i++) cue(TT.rows + i * 0.07, 'blip', { n: i });
cue(TT.pan[0] + 0.05, 'swoosh', { d: 0.6 }); cue(TT.rowTap, 'tap'); cue(TT.expand[0], 'swell_whoosh', { d: 0.6 });
cue(TT.playTap, 'tap'); cue(TT.playOn, 'impact'); cue(TT.macro[0], 'swoosh', { d: 0.8 }); cue(TT.pOut, 'whoosh', { d: 0.4 });
cue(TT.lift2[0], 'lift'); cue(TT.lift2[2], 'settle'); cue(TT.tapCreate, 'tap'); cue(TT.dialog, 'pop');
for (let i = 0; i < 9; i++) cue(TT.keys2 + i * TT.keyStep, 'key');
cue(TT.tapCreateBtn, 'tap'); cue(TT.newCard, 'chime');
cue(SC.telegram, 'whoosh', { d: 0.35 }); cue(TT.strip[0], 'lift'); cue(TT.tapConnect, 'tap'); cue(TT.sheet, 'swoosh', { d: 0.35 });
cue(TT.toIcon[0], 'whoosh', { d: 0.5 }); cue(TT.toIcon[1] - 0.2, 'impact'); cue(TT.bot, 'pop');
TT.hearts.forEach((h, i) => cue(h, 'blip', { n: 3 + i * 2 }));
cue(TT.gOut, 'whoosh', { d: 0.45 });
TT.wipes.forEach((w, i) => cue(w, 'digital', { n: i }));
cue(20.25, 'riser', { d: SC.hero - 20.25 }); cue(SC.hero, 'impact_big'); cue(TT.heroWord, 'shimmer');
TT.tag.forEach((w) => cue(w, 'pop')); cue(TT.cta, 'chime'); cue(TT.fade, 'end');
window.TIMELINE = { fps: FPS, duration: END, scenes: SC, times: TT, cues: CUES };

// ---------------------------------------------------------------- maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eIO3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOut3 = (x) => 1 - Math.pow(1 - x, 3);
const eIn3 = (x) => x * x * x;
const eOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const eOutBack = (x, s = 1.25) => { const c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const spring = (x, z = 0.62, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, x) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], x))).join(',') + ')'; };
const mixArr = (a, b, x) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], x))); };
const rgba = (arr, a) => `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`;
function lerpObj(A, B, x) { const o = {}; for (const k in A) o[k] = typeof A[k] === 'number' && typeof B[k] === 'number' ? lerp(A[k], B[k], x) : (x < 0.5 ? A[k] : B[k]); for (const k in B) if (!(k in o)) o[k] = B[k]; return o; }

// ---------------------------------------------------------------- assets
const cap = (n) => 'cap/' + n + '.png';
const PRE = ['home', 'home_content', 'nav_home', 'search_idle', 'search_focus', 'search_q1', 'search_q2', 'search_q3', 'search_q4', 'search_q5', 'search_q6',
  'search_results', 'search_tapped', 'now_paused', 'now_playing0', 'now_playing1', 'now_playing2', 'lib', 'create_0', 'create_1', 'create_2', 'create_3', 'create_4',
  'create_5', 'create_6', 'create_7', 'create_8', 'create_9', 'create_typed', 'lib_after', 'link', ...THEMES.map((t) => 'home_' + t)];
const TOP = {};
const keep = [];
for (const n of PRE) await (async () => {
  const im = new Image(); im.src = cap(n); for (let k = 0; ; k++) { try { await im.decode(); break; } catch (e) { if (k > 3) throw new Error('decode ' + n); im.src = cap(n) + '?r=' + k; } } keep.push(im);
  const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d');
  g.drawImage(im, 8, 4, 8, 8, 0, 0, 8, 8); const d = g.getImageData(4, 4, 1, 1).data; TOP[n] = `rgb(${d[0]},${d[1]},${d[2]})`;
})();
for (const s of ['art/cover00.jpg', 'brand/logo.png']) { const im = new Image(); im.src = s; await im.decode(); keep.push(im); }
await document.fonts.load('800 100px Sora'); await document.fonts.load('400 100px Sora');

// ---------------------------------------------------------------- DOM
const $ = (id) => document.getElementById(id);
const mk = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
const cam = $('cam');
const phw = mk('div', 'phwrap', cam);
const phone = mk('div', 'phone', phw); const ZM = 2.4; phone.style.zoom = ZM;
const body = mk('div', 'body', phone);
mk('div', 'btn', phone).style.cssText = 'top:190px;height:70px';
mk('div', 'btn', phone).style.cssText = 'top:290px;height:120px';
const screen = mk('div', 'screen', phone);
const status = mk('div', 'status', screen, '<span>7:30</span><span style="display:flex;align-items:center">' +
  '<svg viewBox="0 0 18 12"><path d="M0 11h3v1H0zM5 8h3v4H5zM10 5h3v7h-3zM15 1h3v11h-3z"/></svg>' +
  '<svg viewBox="0 0 16 12"><path d="M8 12L0 3.5a11.5 11.5 0 0116 0z"/></svg>' +
  '<svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2" y="2" width="15" height="8" rx="1.6"/><rect x="23.5" y="4" width="2" height="4" rx="1"/></svg></span>');
mk('div', 'punch', screen);
const vp = mk('div', 'vp', screen);
const ov = mk('div', 'ov', screen); ov.style.top = '28px'; ov.style.height = '892px';
const glare = mk('div', 'glare', screen);
const pops = mk('div', 'pops', phone);

function pool(parent) {
  const lists = new Map(); const used = new Map();
  return {
    begin() { used.clear(); },
    next(make) {
      let items = lists.get(make); if (!items) { items = []; lists.set(make, items); }
      const u = used.get(make) || 0; let e = items[u]; if (!e) { e = make(parent); items.push(e); }
      used.set(make, u + 1); e.style.display = 'block'; return e;
    },
    end() { for (const [m, items] of lists) for (let i = used.get(m) || 0; i < items.length; i++) items[i].style.display = 'none'; },
  };
}
const makeLay = (p) => { const e = mk('div', 'lay', p); e.img = mk('img', '', e); e.img.decoding = 'sync'; return e; };
const vpPool = pool(vp), popPool = pool(pops), ovPool = pool(ov), fxPool = pool($('fx'));

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

// overlay helpers (inside the screen, above the UI)
const MK_TOUCH = (P) => mk('div', 'touch', P);
const MK_RIPPLE = (P) => { const w = mk('div', '', P); w.style.cssText = 'position:absolute;overflow:hidden'; w.c = mk('div', '', w); w.c.style.cssText = 'position:absolute;border-radius:50%'; return w; };
const MK_RING = (P) => mk('div', 'ring', P);
const MK_HEART = (P) => { const d = mk('div', 'pulse', P); d.innerHTML = HEART; return d; };
function touch(x, y, t0, t) {
  const p = (t - t0) / 0.42; if (p < -0.25 || p > 1) return;
  const e = ovPool.next(MK_TOUCH);
  const a = p < 0 ? eOut3(clamp((p + 0.25) / 0.25)) : 1 - eIO3(clamp((p - 0.25) / 0.75));
  const s = p < 0 ? lerp(1.35, 0.92, eOut3(clamp((p + 0.25) / 0.25))) : lerp(0.92, 1.25, eOut3(clamp(p)));
  e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.opacity = a; e.style.transform = `scale(${s})`;
}
function ripple(r, x, y, t0, t, color) {
  const p = (t - t0) / 0.5; if (p < 0 || p > 1) return;
  const e = ovPool.next(MK_RIPPLE);
  e.style.left = r[0] + 'px'; e.style.top = r[1] + 'px'; e.style.width = r[2] + 'px'; e.style.height = r[3] + 'px'; e.style.borderRadius = (r[4] ?? 12) + 'px'; e.style.opacity = 1;
  const R = Math.hypot(r[2], r[3]) * eOut3(p);
  Object.assign(e.c.style, { left: x - r[0] - R + 'px', top: y - r[1] - R + 'px', width: 2 * R + 'px', height: 2 * R + 'px', background: color, opacity: 0.32 * (1 - eIn3(p)) });
}
function ring(P, cx, cy, t0, t, color, r0, r1, dur = 0.7, w = 3) {
  const p = (t - t0) / dur; if (p < 0 || p > 1) return;
  const e = P.next(MK_RING);
  const r = lerp(r0, r1, eOut3(p));
  Object.assign(e.style, { left: cx - r + 'px', top: cy - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px', borderColor: color, borderWidth: w + 'px', opacity: 0.85 * (1 - p), transform: '' });
}

// ---------------------------------------------------------------- text
const texts = $('texts'); const TX = {};
function T(id, str, o) {
  let e = TX[id];
  if (!e) { e = TX[id] = mk('div', 'tw', texts); e.ti = mk('span', 'ti', e); e.ti.textContent = str; e._fit = {}; }
  e.used = true;
  const size = o.size || 110;
  const st = e.style, ti = e.ti.style;
  st.fontWeight = o.weight || 800; st.letterSpacing = (o.ls ?? -0.01) + 'em'; st.lineHeight = 1.08;
  let fs = size;
  const key = size + '|' + st.letterSpacing + '|' + st.fontWeight;
  if (!o.maxW) o.maxW = 880;
  if (o.maxW) { if (!(key in e._fit)) { st.fontSize = size + 'px'; st.display = 'block'; const w = e.ti.getBoundingClientRect().width; e._fit[key] = w > o.maxW ? size * o.maxW / w : size; } fs = e._fit[key]; }
  st.fontSize = fs + 'px';
  st.display = 'block';
  const align = o.align || 'center';
  st.left = o.x + 'px'; st.top = o.y + 'px';
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  st.transform = `translate(${tx},-50%) translateY(${o.dy || 0}px) scale(${o.scale ?? 1})`;
  st.transformOrigin = align === 'left' ? '0% 50%' : '50% 50%';
  st.opacity = o.op ?? 1; st.filter = o.blur ? `blur(${o.blur}px)` : '';
  const p = o.p ?? 1; const out = o.out ?? 0;
  ti.transform = `translateY(${(1 - eOutExpo(p)) * 110 - eIn3(out) * 110}%)`;
  if (o.grad) { e.ti.className = 'ti grad'; ti.backgroundImage = o.grad; ti.backgroundSize = '200% 100%'; ti.backgroundPosition = (o.shine ?? 0) * 100 + '% 0'; ti.color = ''; }
  else { e.ti.className = 'ti'; ti.backgroundImage = ''; ti.color = o.color || '#F7F1E8'; }
  ti.textShadow = o.glow ? o.glow : '';
  return e;
}

// ---------------------------------------------------------------- fixed fx elements
const logoWrap = mk('div', '', $('fx')); logoWrap.id = 'logoWrap';
const logoGlow = mk('div', '', logoWrap); logoGlow.id = 'logoGlow';
const logoImg = mk('img', '', logoWrap); logoImg.id = 'logoImg'; logoImg.src = 'brand/logo.png';
const eq = mk('div', '', $('fx')); eq.id = 'eq'; for (let i = 0; i < 7; i++) mk('i', '', eq);
const scrim = mk('div', '', $('fx')); scrim.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:760px';
const tile = mk('div', 'tile', $('fx')); const tileImg = mk('img', '', tile); tileImg.src = 'brand/logo.png';
const beam = mk('div', '', $('fx')); beam.id = 'beam';
const botc = mk('div', '', $('fx')); botc.id = 'botc';
botc.innerHTML = '<svg viewBox="0 0 24 24" style="position:absolute;left:22%;top:22%;width:56%;height:56%"><path fill="#F7F1E8" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>';
const HEART = '<svg viewBox="0 0 24 24" width="44" height="44"><path fill="#E0A253" stroke="#F7DCA8" stroke-width="1" d="M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z"/></svg>';
const swatches = THEMES.map(() => mk('div', 'sw', $('fx')));
const cta = mk('div', 'pill', $('fx')); cta.textContent = 'NOW ON ANDROID';
const pcv = $('particles'), pg = pcv.getContext('2d');
let seed = 1234567; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const PARTS = Array.from({ length: 90 }, () => ({ x: rnd() * 1080, y: rnd() * 1920, z: 0.3 + rnd() * 0.9, r: 0.8 + rnd() * 2.4, ph: rnd() * 6.28, sp: 0.4 + rnd() }));
{ // grain tile
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

// ---------------------------------------------------------------- phone
const F_STD = { X: 540, Y: 1180, ax: 206, ay: 432, s: 1.38, rx: 5, ry: 0, rz: 0, blur: 0, op: 1 };
function placePhone(f) {
  const x = f.X - (f.ax - 206) * f.s, y = f.Y - (f.ay - 432) * f.s;
  phw.style.transform = `translate3d(${x}px,${y}px,0) rotateX(${f.rx}deg) rotateY(${f.ry}deg) rotateZ(${f.rz || 0}deg) scale3d(${f.s / ZM},${f.s / ZM},${1 / ZM})`;
  phw.style.opacity = f.op ?? 1; phw.style.display = (f.op ?? 1) <= 0.001 ? 'none' : 'block';
  phw.style.filter = f.blur > 0.05 ? `blur(${f.blur}px)` : '';
  glare.style.transform = `translateX(${(f.ry || 0) * 4}px)`;
}

// ---------------------------------------------------------------- per-frame
function theme(t) {
  if (t < TT.wipes[0] || t > TT.wipes[6] + TT.wipeDur + 0.01) return { a: 'amber', b: 'amber', x: 0, i: 0 };
  let i = 0; while (i < 6 && t >= TT.wipes[i + 1]) i++;
  const from = i === 0 ? 'amber' : THEMES[i]; const to = i === 6 ? 'amber' : THEMES[i + 1];
  // i: index of the wipe in progress or last completed
  const x = eIO3(seg(t, TT.wipes[i], TT.wipes[i] + TT.wipeDur));
  const fromName = i === 0 ? 'amber' : THEMES[i], toName = i === 6 ? 'amber' : THEMES[i + 1];
  return { a: fromName, b: toName, x, i: x > 0.5 ? (i === 6 ? 0 : i + 1) : i };
}

window.renderAt = function (t) {
  vpPool.begin(); popPool.begin(); ovPool.begin(); fxPool.begin();
  for (const k in TX) TX[k].used = false;
  const th = theme(t);
  const pa = PAL[th.a], pb = PAL[th.b];
  const flame = mix(pa.flame, pb.flame, th.x), hotc = mix(pa.hot, pb.hot, th.x), emberc = mix(pa.ember, pb.ember, th.x);
  const glowArr = mixArr(pa.flame, pb.flame, th.x), emberArr = mixArr(pa.ember, pb.ember, th.x);
  const accent = `linear-gradient(100deg,${hotc} 0%,${flame} 35%,${emberc} 60%,${flame} 80%,${hotc} 100%)`;
  const bgc = mix(pa.bg, pb.bg, th.x);

  // ---------- background
  $('stage').style.background = bgc;
  const heroGlow = t < SC.discover ? 0.3 + 0.25 * seg(t, 1.4, 1.7) : t > SC.hero ? 0.4 : 0.22;
  const bx = [300 + 160 * Math.sin(t * 0.35), 820 + 140 * Math.cos(t * 0.29), 540 + 200 * Math.sin(t * 0.21 + 1)];
  const by = [520 + 120 * Math.cos(t * 0.31), 1450 + 160 * Math.sin(t * 0.27), 900 + 180 * Math.cos(t * 0.23)];
  const blobs = [[glowArr, heroGlow], [emberArr, 0.2], [mixArr(pa.hot, pb.hot, th.x), 0.06]];
  blobs.forEach(([c, a], i) => { const b = $('b' + i); b.style.background = `radial-gradient(circle, ${rgba(c, a)} 0%, ${rgba(c, a * 0.35)} 35%, transparent 68%)`; b.style.transform = `translate(${bx[i]}px,${by[i]}px)`; });
  // particles
  pg.setTransform(2, 0, 0, 2, 0, 0); pg.clearRect(0, 0, 1080, 1920);
  for (const q of PARTS) {
    const y = ((q.y - t * 22 * q.z * q.sp) % 1920 + 1920) % 1920, x = q.x + 18 * Math.sin(t * 0.6 * q.sp + q.ph);
    const a = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1 * q.sp + q.ph))) * q.z * 0.8;
    pg.beginPath(); pg.fillStyle = rgba(mixArr(pa.hot, pb.hot, th.x), a); pg.arc(x, y, q.r * q.z, 0, 6.2832); pg.fill();
  }
  const fr = Math.round(t * FPS);
  $('grain').style.backgroundPosition = `${(fr * 73) % 256}px ${(fr * 151) % 256}px`;

  // ---------- defaults
  let F = null; // phone frame
  let sweepX = -1, flash = 0, fade = 0;
  logoWrap.style.display = 'none'; eq.style.display = 'none'; tile.style.display = 'none'; beam.style.display = 'none'; botc.style.display = 'none'; cta.style.display = 'none';
  swatches.forEach((s) => (s.style.display = 'none'));
  let scrimOp = 0;
  const ink = '#F7F1E8';

  // ================= HOOK
  if (t < SC.discover + 0.01) {
    const a1 = eOut3(seg(t, 0, 0.8));
    const up = eOut3(seg(t, TT.yourWay, TT.yourWay + 0.45));
    const out = seg(t, TT.hookOut, TT.hookOut + 0.16);
    if (out < 1) {
      T('h1', 'YOUR MUSIC.', { x: 540, y: 850 - 110 * up, size: 128, scale: lerp(1.06, 1, a1) * (1 + 0.15 * out), op: (1 - 0.45 * up) * (1 - out), blur: out * 16, ls: lerp(0.02, -0.01, a1) });
      if (t >= TT.yourWay) T('h2', 'YOUR WAY.', { x: 540, y: 860, size: 128, p: seg(t, TT.yourWay, TT.yourWay + 0.5), grad: accent, scale: 1 + 0.15 * out, op: 1 - out, blur: out * 16 });
      // the app's own boot equaliser, as a musical motif
      eq.style.display = 'flex'; const eqOp = lerp(0.55, 1, eOut3(seg(t, 0, 0.3))) * (1 - out);
      eq.style.opacity = eqOp; eq.style.left = (540 - (7 * 16 + 6 * 14) / 2) + 'px'; eq.style.top = '1010px'; eq.style.height = '110px';
      [...eq.children].forEach((b, i) => { const h = 22 + 80 * Math.abs(Math.sin(t * (3.1 + i * 0.45) + i * 1.3)) * (0.55 + 0.45 * Math.sin(t * 1.7 + i)); b.style.height = h * (1 - out) + 'px'; b.style.opacity = 0.9; });
      eq.style.transform = `translateY(${lerp(30, 0, a1) + 60 * up}px)`;
    }
    if (t >= TT.logo - 0.05) {
      const p = seg(t, TT.logo, TT.logo + 0.9);
      const push = eIO3(seg(t, TT.push, TT.push + 0.4));
      const sc = lerp(0.5, 1, spring(p * 0.9, 0.6, 11)) * lerp(1, 0.55, push);
      logoWrap.style.display = 'block';
      const W = 470; logoImg.style.width = W + 'px'; logoImg.style.left = -W / 2 + 'px'; logoImg.style.top = -W * 500 / 510 / 2 + 'px';
      logoWrap.style.left = '540px'; logoWrap.style.top = lerp(760, 470, push) + 'px';
      logoWrap.style.transform = `scale(${sc})`; logoWrap.style.opacity = eOut3(seg(t, TT.logo - 0.04, TT.logo + 0.15)) * (1 - seg(t, TT.push + 0.1, TT.push + 0.38));
      logoImg.style.filter = `drop-shadow(0 0 ${30 + 30 * (1 - p)}px rgba(224,162,83,.55))`;
      Object.assign(logoGlow.style, { width: '900px', height: '900px', left: '-450px', top: '-450px', background: 'radial-gradient(circle, rgba(224,162,83,.35), rgba(224,162,83,.08) 40%, transparent 65%)', opacity: 0.6 + 0.4 * (1 - p) });
      flash = 0.6 * Math.exp(-Math.max(0, t - TT.logo) * 7) * (t >= TT.logo ? 1 : 0);
      ring(fxPool, 540, 760, TT.logo, t, 'rgba(247,220,168,.9)', 120, 620, 0.8, 4);
      ring(fxPool, 540, 760, TT.logo + 0.1, t, 'rgba(224,162,83,.7)', 100, 460, 0.8, 2);
      const wp = seg(t, TT.word, TT.word + 0.7);
      if (t >= TT.word) T('wm', 'AARTIMUSIC', { x: 540, y: lerp(1060, 690, push), size: 128, maxW: 880, grad: accent, shine: 1 - eOut3(seg(t, TT.word + 0.2, TT.word + 1.1)), ls: lerp(0.3, 0.02, eOutExpo(wp)), op: eOut3(seg(t, TT.word, TT.word + 0.3)) * (1 - seg(t, TT.push + 0.05, TT.push + 0.35)), blur: 10 * (1 - eOut3(wp)), scale: lerp(1, 0.6, push), glow: '0 0 40px rgba(224,162,83,.25)' });
    }
    if (t >= TT.push) {
      const p = eOut3(seg(t, TT.push, TT.push + 0.62));
      F = lerpObj({ ...F_STD, Y: 2900, s: 1.2, rx: 30, ry: -20, blur: 16 }, { ...F_STD, rx: 7, ry: -14 }, p);
    }
  }

  // ================= DISCOVER
  if (t >= SC.discover - 0.4 && t < SC.search) {
    if (t >= SC.discover) {
      const d = seg(t, SC.discover, SC.search);
      F = { ...F_STD, rx: lerp(7, 3, eIO3(d)), ry: lerp(-14, -4, eIO3(d)), Y: 1180 + 10 * Math.sin(t * 1.6) };
      const out = eIn3(seg(t, TT.dOut, TT.dOut + 0.28));
      if (out > 0) { F.Y -= 1500 * out; F.blur = 22 * out; F.rx += 10 * out; }
      T('d1', 'DISCOVER', { x: 540, y: 290, size: 128, p: seg(t, SC.discover - 0.03, SC.discover + 0.45), dy: -140 * out, op: 1 - out });
      T('d2', 'WHAT’S NEXT', { x: 540, y: 408, size: 44, weight: 600, ls: 0.32, grad: accent, p: seg(t, SC.discover + 0.15, SC.discover + 0.6), dy: -140 * out, op: 1 - out });
    }
    const sc = 250 * eIO3(seg(t, ...TT.scroll1)) + 310 * eIO3(seg(t, ...TT.scroll2));
    lay(vpPool, { src: cap('home_content'), sy: sc, sh: 892 });
    lay(vpPool, { src: cap('nav_home'), srcW: 376, sw: 376, sh: 60, dx: 18, dy: 820, dw: 376, dh: 60 });
    status.style.background = TOP.home;
    // discovery cards lift out of the screen
    const L = TT.lift, e = eOut3(seg(t, L[0], L[1])) * (1 - eIO3(seg(t, L[2], L[3])));
    if (e > 0.001) {
      RECTS.home_cards.slice(0, 2).forEach((r, i) => {
        const dir = i ? 1 : -1;
        lay(popPool, { src: cap('home_content'), sx: r[0], sy: r[1], sw: r[2], sh: r[3], dx: r[0], dy: r[1] - sc, dw: r[2], dh: r[3], rad: 16,
          tf: `translateZ(${90 * e}px) translateX(${dir * 10 * e}px) translateY(${-8 * e}px) rotateY(${-dir * 9 * e}deg)`,
          shadow: `0 ${40 * e}px ${80 * e}px rgba(0,0,0,${0.55 * e})` });
      });
    }
  }

  // ================= SEARCH
  if (t >= SC.search - 0.05 && t < SC.player) {
    const A = { X: 540, Y: 740, ax: 206, ay: 42, s: 1.9, rx: 4, ry: 6, rz: 0, blur: 0, op: 1 };
    const B = { X: 540, Y: 1150, ax: 206, ay: 580, s: 2.0, rx: 3, ry: -3, rz: 0, blur: 0, op: 1 };
    const inP = eOutExpo(seg(t, TT.sIn, TT.sIn + 0.4));
    let f = lerpObj({ ...A, Y: A.Y + 1500, blur: 22, rx: -8 }, A, inP);
    f.ry = lerp(6, 2, eIO3(seg(t, TT.sIn, TT.pan[0])));
    f = lerpObj(f, B, eIO3(seg(t, ...TT.pan)));
    if (t >= TT.expand[0]) f = lerpObj(f, { ...F_STD, rx: 5, ry: -5 }, eIO3(seg(t, ...TT.expand)));
    if (t >= TT.sIn) F = f;
    scrimOp = eIO3(seg(t, TT.pan[0], TT.pan[0] + 0.5)) * (1 - seg(t, TT.expand[0], TT.expand[0] + 0.4));
    // text beats
    const words = [['s1', 'SEARCH.', TT.tapSearch - 0.1], ['s2', 'FIND.', TT.submit], ['s3', 'PLAY.', TT.rowTap - 0.05]];
    const xo = eIO3(seg(t, TT.expand[0] - 0.1, TT.expand[0] + 0.12));
    words.forEach(([id, w, t0], i) => {
      if (t < t0) return;
      const active = i === 2 ? true : t < words[i + 1][2];
      const dim = active ? 1 : 0.38;
      T(id, w, { x: 90, y: 250 + i * 122, align: 'left', size: 112, p: seg(t, t0, t0 + 0.45), grad: active ? accent : null, color: ink, op: dim * (1 - xo), dy: -100 * xo });
    });
    // screen
    let base = 'search_idle';
    if (t >= TT.tapSearch + 0.06) base = 'search_focus';
    TT.keys.forEach((k, i) => { if (t >= k) base = 'search_q' + (i + 1); });
    if (t < TT.submit) { full(vpPool, base); status.style.background = TOP[base]; }
    else {
      full(vpPool, 'search_q6');
      const topFade = eOut3(seg(t, TT.submit, TT.submit + 0.15));
      const tap = t >= TT.tapped ? eOut3(seg(t, TT.tapped, TT.tapped + 0.12)) : 0;
      crop(vpPool, 'search_results', [0, 0, 412, 436], { op: topFade });
      const rows = RECTS.result_rows;
      for (let i = 0; i < 5; i++) {
        const r = rows[i], p = seg(t, TT.rows + i * 0.07, TT.rows + i * 0.07 + 0.5);
        if (p <= 0) continue;
        crop(vpPool, 'search_results', [0, r[1], 412, r[3]], { op: eOut3(Math.min(1, p * 2)), tf: `translateY(${(1 - eOutBack(p, 1.1)) * 34}px)` });
      }
      const pr = seg(t, TT.rows + 5 * 0.07, TT.rows + 5 * 0.07 + 0.4);
      crop(vpPool, 'search_results', [0, rows[5][1], 412, 892 - rows[5][1]], { op: eOut3(pr) });
      if (tap > 0) full(vpPool, 'search_tapped', tap);
      status.style.background = TOP.search_results;
      const r0 = rows[0];
      ripple([r0[0], r0[1], r0[2], r0[3], 14], 80, r0[1] + 33, TT.rowTap, t, flame);
      touch(80, r0[1] + 33, TT.rowTap, t);
    }
    const sb = RECTS.searchbar;
    touch(sb[0] + 120, sb[1] + sb[3] / 2, TT.tapSearch, t);
    // artwork expands into the full player
    if (t >= TT.expand[0]) {
      const p = seg(t, ...TT.expand);
      const sp = spring(p * 0.75, 0.75, 11);
      full(vpPool, 'now_paused', eOut3(seg(t, TT.expand[0], TT.expand[0] + 0.3)), { tf: `translateY(${(1 - sp) * 892}px)`, z: 2 });
      const a = RECTS.result_thumb0, b = RECTS.now_cover, e = eIO3(clamp(p * 1.25));
      const r = [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e), lerp(a[3], b[3], e)];
      lay(vpPool, { src: 'art/cover00.jpg', srcW: 50, sw: 50, sh: 50, dx: r[0], dy: r[1], dw: r[2], dh: r[3], rad: lerp(8, 16, e),
        op: 1 - eIO3(seg(p, 0.72, 1)), shadow: `0 ${24 * e}px ${60 * e}px rgba(0,0,0,.5)`, z: 3 });
      status.style.background = TOP.now_paused;
    }
  }

  // ================= PLAYER
  if (t >= SC.player && t < SC.library) {
    let f = { ...F_STD, rx: 5, ry: lerp(-5, 3, eIO3(seg(t, SC.player, TT.macro[0]))), Y: 1180 + 8 * Math.sin(t * 1.5) };
    f = lerpObj(f, { X: 540, Y: 1240, ax: 206, ay: 760, s: 2.3, rx: 10, ry: 8, rz: 0, blur: 0, op: 1 }, eIO3(seg(t, ...TT.macro)));
    const out = eIn3(seg(t, TT.pOut, TT.pOut + 0.25));
    if (out > 0) { f.X -= 1500 * out; f.blur = 20 * out; f.ry -= 25 * out; }
    F = f;
    const tx = eIO3(seg(t, TT.macro[0], TT.macro[0] + 0.35));
    T('p1', 'JUST PRESS', { x: 540, y: 245, size: 110, p: seg(t, SC.player + 0.1, SC.player + 0.55), op: 1 - tx, dy: -80 * tx });
    T('p2', 'PLAY', { x: 540, y: 385, size: 158, grad: accent, p: seg(t, SC.player + 0.25, SC.player + 0.7), op: 1 - tx, dy: -80 * tx, shine: 1 - eOut3(seg(t, TT.playOn, TT.playOn + 0.9)) });
    let base = t < TT.playOn ? 'now_paused' : t < TT.prog1 ? 'now_playing0' : t < TT.prog2 ? 'now_playing1' : 'now_playing2';
    full(vpPool, base);
    if (t >= TT.prog1 && t < TT.prog1 + 0.2) full(vpPool, 'now_playing1', seg(t, TT.prog1, TT.prog1 + 0.2));
    status.style.background = TOP[base];
    const pb = RECTS.now_play, cx = pb[0] + pb[2] / 2, cy = pb[1] + pb[3] / 2;
    // play press: squash, swap, spring back, rings of light
    const press = seg(t, TT.playTap - 0.02, TT.playOn), rel = seg(t, TT.playOn, TT.playOn + 0.5);
    if (press > 0 && rel < 1) {
      const s = rel > 0 ? lerp(0.9, 1, spring(rel, 0.45, 16)) : lerp(1, 0.9, eOut3(press));
      crop(vpPool, rel > 0 ? 'now_playing0' : 'now_paused', [pb[0] - 6, pb[1] - 6, pb[2] + 12, pb[3] + 12], { rad: 44, tf: `scale(${s})` });
    }
    ring(ovPool, cx, cy, TT.playOn, t, flame, 36, 170, 0.8, 3);
    ring(ovPool, cx, cy, TT.playOn + 0.14, t, hotc, 36, 130, 0.7, 2);
    touch(cx, cy, TT.playTap, t);
    // the cover breathes with the beat once playing
    if (t >= TT.playOn) {
      const beat = ((t - 0.25) % 0.5) / 0.5, br = 1 + 0.012 * Math.exp(-beat * 6) * seg(t, TT.playOn, TT.playOn + 0.3);
      const c = RECTS.now_cover; crop(vpPool, base, [c[0] - 2, c[1] - 2, c[2] + 4, c[3] + 4], { tf: `scale(${br})`, rad: 18 });
    }
  }

  // ================= LIBRARY + TELEGRAM (same phone)
  if (t >= TT.lIn && t < TT.toIcon[1] + 0.05) {
    let f = { ...F_STD, rx: 5, ry: lerp(8, -4, eIO3(seg(t, TT.lIn, SC.telegram + 1))), Y: 1180 + 8 * Math.sin(t * 1.5) };
    const inP = eOutExpo(seg(t, TT.lIn, TT.lIn + 0.45));
    f.X = lerp(1700, 540, inP); f.blur = 20 * (1 - inP); f.ry += 25 * (1 - inP);
    // phone collapses into the app icon
    const ic = eIO3(seg(t, ...TT.toIcon));
    if (ic > 0) { f = lerpObj(f, { X: 540, Y: 700, ax: 206, ay: 432, s: 0.2, rx: 0, ry: 0, rz: 0, blur: 0, op: 0 }, ic); f.op = 1 - eIn3(seg(t, TT.toIcon[0] + 0.15, TT.toIcon[1])); }
    F = f;
    if (t < SC.telegram + 0.3) {
      const out = seg(t, SC.telegram, SC.telegram + 0.25);
      T('l1', 'BUILD YOUR', { x: 540, y: 245, size: 110, p: seg(t, TT.lIn + 0.15, TT.lIn + 0.6), out });
      T('l2', 'MOOD', { x: 540, y: 385, size: 158, grad: accent, p: seg(t, TT.lIn + 0.3, TT.lIn + 0.75), out });
    }
    if (t >= TT.gText && t < TT.botHead + 0.3) {
      const out = seg(t, TT.botHead - 0.05, TT.botHead + 0.2);
      T('g1', 'MORE THAN', { x: 540, y: 245, size: 110, p: seg(t, TT.gText, TT.gText + 0.45), out });
      T('g2', 'AN APP', { x: 540, y: 385, size: 150, grad: accent, p: seg(t, TT.gText + 0.12, TT.gText + 0.57), out });
    }
    // screen
    const k2 = (i) => TT.keys2 + i * TT.keyStep;
    let base = 'lib';
    if (t >= TT.dialog) base = 'create_0';
    for (let i = 0; i < 9; i++) if (t >= k2(i)) base = 'create_' + (i + 1);
    if (t >= TT.typed) base = 'create_typed';
    if (t >= TT.newCard) base = 'lib_after';
    if (t < TT.dialog + 0.12 && t >= TT.dialog) { full(vpPool, 'lib'); full(vpPool, 'create_0', eOut3(seg(t, TT.dialog, TT.dialog + 0.12))); }
    else if (t >= TT.newCard && t < TT.newCard + 0.12) { full(vpPool, 'create_typed'); full(vpPool, 'lib_after', eOut3(seg(t, TT.newCard, TT.newCard + 0.12))); }
    else full(vpPool, base);
    status.style.background = TOP[base];
    // the dialog springs in
    if (t >= TT.dialog && t < TT.dialog + 0.45) {
      const d = RECTS.create_dialog, p = seg(t, TT.dialog, TT.dialog + 0.4);
      crop(vpPool, 'create_0', d, { rad: 24, tf: `scale(${lerp(0.9, 1, eOutBack(p, 1.3))})`, op: eOut3(clamp(p * 2.5)) });
    }
    // playlist cards lift
    const L = TT.lift2, e = eOut3(seg(t, L[0], L[1])) * (1 - eIO3(seg(t, L[2], L[3])));
    if (e > 0.001) RECTS.lib_cards.forEach((r, i) => {
      const dir = i ? 1 : -1;
      crop(popPool, 'lib', r, { rad: 20, tf: `translateZ(${90 * e}px) translateX(${dir * 12 * e}px) translateY(${-8 * e}px) rotateY(${-dir * 10 * e}deg)`, shadow: `0 ${40 * e}px ${80 * e}px rgba(0,0,0,${0.55 * e})` });
    });
    // the new playlist lands
    if (t >= TT.newCard) {
      const r = RECTS.lib_cards_after[2], p = seg(t, TT.newCard, TT.newCard + 0.55);
      crop(vpPool, 'lib_after', r, { rad: 20, tf: `scale(${lerp(0.7, 1, eOutBack(p, 1.4))})`, op: eOut3(clamp(p * 3)), shadow: `0 0 ${40 * (1 - p)}px ${rgba(glowArr, 0.8 * (1 - p))}` });
      ring(ovPool, r[0] + r[2] / 2, r[1] + 92, TT.newCard, t, flame, 40, 160, 0.7, 3);
    }
    const cr = RECTS.lib_create; touch(cr[0] + cr[2] / 2, cr[1] + cr[3] / 2, TT.tapCreate, t);
    const cb = RECTS.create_btn; touch(cb[0] + cb[2] / 2, cb[1] + cb[3] / 2, TT.tapCreateBtn, t);
    ripple([cb[0], cb[1], cb[2], cb[3], 12], cb[0] + cb[2] / 2, cb[1] + cb[3] / 2, TT.tapCreateBtn, t, '#fff');
    // Telegram: the account strip lifts, Connect is tapped, the sheet rises
    const S = TT.strip, se = eOut3(seg(t, S[0], S[1])) * (1 - eIO3(seg(t, S[2], S[3])));
    if (se > 0.001) {
      crop(popPool, 'lib_after', RECTS.lib_account, { rad: 16, tf: `translateZ(${90 * se}px) translateY(${16 * se}px)`, shadow: `0 ${40 * se}px ${80 * se}px rgba(0,0,0,${0.6 * se}), 0 0 0 ${2 * se}px ${rgba(glowArr, 0.7 * se)}, 0 0 ${50 * se}px ${rgba(glowArr, 0.35 * se)}` });
    }
    touch(358, 84, TT.tapConnect, t);
    if (t >= TT.sheet) {
      const ls = RECTS.link_sheet, p = spring(seg(t, TT.sheet, TT.sheet + 0.6) * 0.8, 0.8, 11), fp = eOut3(seg(t, TT.sheet, TT.sheet + 0.2));
      crop(vpPool, 'link', [0, 0, 412, ls[1]], { op: fp });
      crop(vpPool, 'link', [0, ls[1], 412, 892 - ls[1]], { tf: `translateY(${(1 - p) * (892 - ls[1])}px)` });
      status.style.background = TOP.link;
    }
  }

  // ================= BOT
  if (t >= TT.toIcon[0] + 0.1 && t < SC.themes + 0.1) {
    const out = eIO3(seg(t, TT.gOut, TT.gOut + 0.22));
    const tp = seg(t, TT.toIcon[1] - 0.25, TT.toIcon[1] + 0.35);
    tile.style.display = 'block';
    const TS = 250, gw = 300;
    Object.assign(tile.style, { width: TS + 'px', height: TS + 'px', left: 540 - TS / 2 + 'px', top: 700 - TS / 2 + 'px', opacity: eOut3(clamp(tp * 3)) * (1 - out), transform: `translateY(${-60 * out}px) scale(${lerp(0.35, 1, spring(tp * 0.8, 0.6, 12)) * (1 - 0.1 * out)})` });
    Object.assign(tileImg.style, { width: gw + 'px', left: (TS - gw) / 2 + 'px', top: (TS - gw * 500 / 510) / 2 + 'px' });
    const bp = seg(t, TT.bot, TT.bot + 0.6), BS = 230;
    if (t >= TT.bot) {
      botc.style.display = 'block';
      Object.assign(botc.style, { width: BS + 'px', height: BS + 'px', left: 540 - BS / 2 + 'px', top: 1270 - BS / 2 + 'px', opacity: eOut3(clamp(bp * 3)) * (1 - out), transform: `translateY(${60 * out}px) scale(${lerp(0.4, 1, spring(bp * 0.8, 0.6, 12)) * (1 - 0.1 * out)})` });
    }
    const bm = eOut3(seg(t, TT.beam, TT.beam + 0.3));
    if (bm > 0) {
      beam.style.display = 'block';
      const y0 = 700 + TS / 2 + 14, y1 = 1270 - BS / 2 - 14;
      Object.assign(beam.style, { left: '540px', top: y0 + 'px', height: (y1 - y0) * bm + 'px', opacity: 0.85 * (1 - out) });
      TT.hearts.forEach((h, i) => {
        const p = seg(t, h, h + 0.5); if (p <= 0 || p >= 1) return;
        const e = fxPool.next(MK_HEART);
        const down = i !== 1, y = down ? lerp(y0, y1, eIO3(p)) : lerp(y1, y0, eIO3(p));
        Object.assign(e.style, { left: '540px', top: y + 'px', opacity: Math.sin(p * Math.PI) * (1 - out), transform: `scale(${0.8 + 0.4 * Math.sin(p * Math.PI)})`, filter: 'drop-shadow(0 0 12px rgba(224,162,83,.9))', width: '44px', height: '44px' });
      });
      if (out < 0.05) {
        ring(fxPool, 540, 1270, TT.hearts[0] + 0.5, t, flame, 115, 190, 0.6, 3);
        ring(fxPool, 540, 1270, TT.hearts[2] + 0.5, t, flame, 115, 190, 0.6, 3);
        ring(fxPool, 540, 700, TT.hearts[1] + 0.5, t, flame, 125, 200, 0.6, 3);
      }
    }
    T('b1', 'AARTIMUSIC', { x: 540, y: 245, size: 112, maxW: 860, p: seg(t, TT.botHead + 0.2, TT.botHead + 0.62), out });
    T('b2', 'BOT', { x: 540, y: 385, size: 150, grad: accent, p: seg(t, TT.botHead + 0.3, TT.botHead + 0.75), out });
    T('bh', '@AartiMusic_bot', { x: 540, y: 1465, size: 52, weight: 600, ls: 0, p: seg(t, TT.bot + 0.2, TT.bot + 0.6), op: 1 - out });
    T('bs', 'Favourites that follow you', { x: 540, y: 1545, size: 38, weight: 400, ls: 0, color: '#bfb3a8', p: seg(t, TT.bot + 0.35, TT.bot + 0.75), op: 1 - out });
  }

  // ================= THEMES
  if (t >= TT.thIn && t < SC.hero + 0.6) {
    const inP = eOutExpo(seg(t, TT.thIn, TT.thIn + 0.5));
    let f = { ...F_STD, Y: lerp(2900, 1235, inP), s: 1.32, rx: lerp(24, 4, inP), ry: 3 * Math.sin((t - TT.thIn) * 1.4), blur: 18 * (1 - inP) };
    // continue into the hero frame
    const hp = eIO3(seg(t, TT.sweep - 0.05, SC.hero + 0.45));
    f = lerpObj(f, { ...F_STD, Y: 1398, s: 1.08, rx: 6, ry: -8 }, hp);
    if (t < SC.hero + 0.1) F = f;
    const xo = seg(t, TT.sweep - 0.1, TT.sweep + 0.1);
    T('m1', 'MAKE IT', { x: 540, y: 245, size: 110, p: seg(t, SC.themes + 0.1, SC.themes + 0.55), op: 1 - xo, blur: 12 * xo });
    T('m2', 'YOURS', { x: 540, y: 385, size: 158, grad: accent, p: seg(t, SC.themes + 0.25, SC.themes + 0.7), op: 1 - xo, blur: 12 * xo });
    const w = TT.wipes;
    let cur = 'amber'; let i = -1; while (i + 1 < w.length && t >= w[i + 1]) i++;
    const seqName = (k) => (k < 0 ? 'amber' : k === 6 ? 'amber' : THEMES[k + 1]);
    const prevName = seqName(i - 1), curName = seqName(i);
    if (i < 0) full(vpPool, 'home_amber');
    else {
      const p = eIO3(seg(t, w[i], w[i] + TT.wipeDur));
      full(vpPool, 'home_' + prevName);
      if (p > 0) { const r = 1000 * p; full(vpPool, 'home_' + curName, 1, { clip: `circle(${r}px at 370px 36px)` }); ring(ovPool, 370, 36, w[i], t, PAL[curName].flame, 10, 1000, TT.wipeDur + 0.05, 4); }
      cur = p > 0.5 ? curName : prevName;
    }
    status.style.background = TOP['home_' + cur];
    // swatches
    const active = i < 0 ? 0 : i === 6 ? 0 : i + 1;
    swatches.forEach((s, k) => {
      const ap = eOutBack(seg(t, SC.themes + 0.45 + k * 0.035, SC.themes + 0.8 + k * 0.035), 1.4);
      if (ap <= 0 || xo >= 1) return;
      const on = k === active;
      Object.assign(s.style, { display: 'block', left: 540 + (k - 3) * 64 + 'px', top: '498px', background: PAL[THEMES[k]].flame, opacity: (1 - xo) * clamp(ap * 2),
        transform: `scale(${ap * (on ? 1.28 : 0.86)})`, boxShadow: on ? `0 0 0 4px ${PAL[THEMES[k]].bg}, 0 0 0 6.5px ${PAL[THEMES[k]].flame}, 0 0 26px ${PAL[THEMES[k]].flame}` : 'none' });
    });
    // swap to the player under the sweep
    if (t >= TT.sweep + 0.12) { full(vpPool, 'now_playing2'); status.style.background = TOP.now_playing2; }
  }

  // ================= HERO
  if (t >= TT.sweep - 0.2) {
    sweepX = seg(t, TT.sweep - 0.1, TT.sweep + 0.45);
    if (t >= SC.hero) {
      const d = seg(t, SC.hero, END);
      F = { ...F_STD, Y: 1398 + 6 * Math.sin(t * 1.3), s: 1.08, rx: lerp(6, 4, d), ry: lerp(-8, 6, eIO3(d)) };
      full(vpPool, 'now_playing2'); status.style.background = TOP.now_playing2;
      const beat = ((t - 0.25) % 0.5) / 0.5, c = RECTS.now_cover;
      crop(vpPool, 'now_playing2', [c[0] - 2, c[1] - 2, c[2] + 4, c[3] + 4], { tf: `scale(${1 + 0.008 * Math.exp(-beat * 5)})`, rad: 18 });
    }
    if (t >= TT.heroLogo - 0.05) {
      const p = seg(t, TT.heroLogo, TT.heroLogo + 0.8);
      logoWrap.style.display = 'block';
      const W = 330; logoImg.style.width = W + 'px'; logoImg.style.left = -W / 2 + 'px'; logoImg.style.top = -W * 500 / 510 / 2 + 'px';
      logoWrap.style.left = '540px'; logoWrap.style.top = 330 + 'px';
      logoWrap.style.transform = `scale(${lerp(0.6, 1, spring(p * 0.85, 0.62, 12))})`; logoWrap.style.opacity = eOut3(seg(t, TT.heroLogo - 0.04, TT.heroLogo + 0.2));
      logoImg.style.filter = 'drop-shadow(0 0 26px rgba(224,162,83,.5))';
      Object.assign(logoGlow.style, { width: '700px', height: '700px', left: '-350px', top: '-350px', background: 'radial-gradient(circle, rgba(224,162,83,.28), rgba(224,162,83,.06) 40%, transparent 65%)', opacity: 1 });
    }
    if (t >= TT.heroWord) {
      const wp = seg(t, TT.heroWord, TT.heroWord + 0.7);
      T('hw', 'AARTIMUSIC', { x: 540, y: 548, size: 112, maxW: 820, grad: accent, shine: 1 - eOut3(seg(t, TT.heroWord + 0.2, TT.heroWord + 1.2)), ls: lerp(0.25, 0.02, eOutExpo(wp)), op: eOut3(seg(t, TT.heroWord, TT.heroWord + 0.3)), blur: 8 * (1 - eOut3(wp)), glow: '0 0 40px rgba(224,162,83,.22)' });
    }
    [['ta', 'FIND IT.', 262], ['tb', 'PLAY IT.', 540], ['tc', 'LOVE IT.', 818]].forEach(([id, w, x], i) => {
      if (t >= TT.tag[i]) T(id, w, { x, y: 652, size: 46, weight: 700, ls: 0.1, p: seg(t, TT.tag[i], TT.tag[i] + 0.4), grad: i === 2 ? accent : null, color: ink });
    });
    if (t >= TT.cta) {
      const p = seg(t, TT.cta, TT.cta + 0.6);
      Object.assign(cta.style, { display: 'flex', left: '330px', top: '724px', width: '420px', height: '72px', fontSize: '28px', color: '#160d05',
        background: `linear-gradient(100deg,${hotc},${flame})`, boxShadow: `0 10px 40px ${rgba(glowArr, 0.35)}`, opacity: eOut3(clamp(p * 3)), transform: `scale(${lerp(0.8, 1, eOutBack(p, 1.3))})` });
    }
    flash = Math.max(flash, 0.35 * Math.exp(-Math.max(0, t - SC.hero) * 6) * (t >= SC.hero ? 1 : 0));
    fade = eIO3(seg(t, TT.fade, END - 1 / FPS));
  }

  // ---------- commit
  if (F) placePhone(F); else placePhone({ ...F_STD, op: 0 });
  scrim.style.background = `linear-gradient(${bgc} 0%, ${bgc} 55%, transparent 100%)`; scrim.style.opacity = scrimOp; scrim.style.display = scrimOp > 0 ? 'block' : 'none';
  const sw = $('sweep');
  if (sweepX >= 0 && sweepX < 1) { sw.style.display = 'block'; sw.style.transform = `translateX(${lerp(-200, 2000, eIO3(sweepX))}px) rotate(18deg)`; sw.style.opacity = Math.sin(sweepX * Math.PI); } else sw.style.display = 'none';
  $('flash').style.opacity = flash; $('fade').style.opacity = fade;
  $('stage').style.transform = fade > 0 ? `scale(${1 - 0.015 * fade})` : '';
  for (const k in TX) if (!TX[k].used) TX[k].style.display = 'none';
  vpPool.end(); popPool.end(); ovPool.end(); fxPool.end();
};
window.READY = true;
})().catch((e) => { window.READY_ERR = String(e && e.stack || e); });
