/* AartiMusic promo v2.0 (16:9) — one continuous motion system.
   All timing comes from the narrator's force-aligned words (vo2.json); the
   sound cues exported in TIMELINE are derived from the same anchors. */
(async function () {
'use strict';
const RECTS = await (await fetch('cap2/rects.json')).json();
const VO = await (await fetch('vo2.json')).json();

// ---------------------------------------------------------------- anchors
const LINE = (id) => VO.lines.find((l) => l.id === id);
const S = (id) => LINE(id).start, E = (id) => LINE(id).end;
const W = (id, w, n = 0) => LINE(id).words.filter((x) => x.w === w)[n].start;
const FPS = 30;
const END = Math.ceil((E('end') + 1.2) * FPS) / FPS;
const SC = {
  hook: 0, look: S('hook2') - 0.14, both: S('both') - 0.32, mood: W('both', 'both') + 0.3, search: S('search') - 0.2,
  play: W('play', 'tap') + 0.05, lists: S('lists') - 0.5, bot: S('bot') - 0.28, themes: S('themes') - 0.4, ajay: S('ajay') - 0.45, end: S('end') - 0.55,
};
const K = {
  find: W('hook1', 'find'), you1: W('hook1', 'you'), others: W('hook2', 'others'), you2: W('hook2', 'you'), looking: W('hook2', 'looking'),
  aarti: W('both', 'aarti'), music: W('both', 'music'), does: W('both', 'does'), bothW: W('both', 'both'),
  fresh: W('mood', 'fresh'), disc: W('mood', 'discoveries'), tuned: W('mood', 'tuned'), moodW: W('mood', 'mood'),
  or: W('search', 'or'), search: W('search', 'search'), any: W('search', 'any'), song: W('search', 'song'),
  one: W('play', 'one'), tap: W('play', 'tap'), playing: W('play', 'playing'),
  build: W('lists', 'build'), playlist: W('lists', 'playlist'), every: W('lists', 'every'), moment: W('lists', 'moment'),
  keep: W('bot', 'keep'), favs: W('bot', 'favourites'), sync: W('bot', 'sync'), aarti2: W('bot', 'aarti'), bot: W('bot', 'bot'), telegram: W('bot', 'telegram'),
  make: W('themes', 'make'), yours: W('themes', 'yours'), seven: W('themes', 'seven'), themes: W('themes', 'themes'),
  made: W('ajay', 'made'), love: W('ajay', 'love'), ajay: W('ajay', 'ajay'), everyone: W('ajay', 'everyone'), lives: W('ajay', 'lives'), musicA: W('ajay', 'music'),
  endAarti: W('end', 'aarti'), endMusic: W('end', 'music'), your: W('end', 'your'), sound: W('end', 'sound'),
};
K.igIn = K.ajay + 6 / FPS; K.handle = K.ajay + 9 / FPS;
K.keys1 = [K.looking, K.looking + 0.2];                           // "o", "om" while she says "looking for"
K.keys2 = [K.search - 0.02, K.search + 0.14, K.any - 0.02, K.any + 0.1, K.song];  // "om " .. "om jai"
K.submit = K.song + 0.2;
K.wipes = [0, 1, 2, 3, 4, 5, 6].map((i) => K.yours + 0.08 + i * 0.235);
K.fade = END - 0.45;

// ---------------------------------------------------------------- palette
const C = { bg: '#03060F', blue: '#2F7BFF', cyan: '#3FE0FF', teal: '#19C3B0', emer: '#2BD98B', ink: '#EEF6FF', mute: '#8BA0BC' };
const CYAN = 'linear-gradient(100deg,#E9FCFF 0%,#8DEBFF 30%,#3FA8FF 58%,#8DEBFF 80%,#E9FCFF 100%)';
const EMER = 'linear-gradient(100deg,#E6FFF4 0%,#7CF5C0 32%,#1FC4A5 60%,#7CF5C0 82%,#E6FFF4 100%)';
const THEME_SEQ = ['teal', 'indigo', 'green', 'violet', 'neon', 'ruby', 'amber', 'teal'];
const THEME_GLOW = { teal: [63, 224, 255], indigo: [90, 110, 255], green: [43, 217, 139], violet: [110, 120, 255], neon: [80, 140, 255], ruby: [70, 150, 255], amber: [60, 190, 230] };
const THEME_BTN = { amber: 0, green: 1, teal: 2, violet: 3, indigo: 4, neon: 5, ruby: 6 };

// ---------------------------------------------------------------- cues
const CUES = [];
const cue = (t, k, x) => CUES.push(Object.assign({ t: +t.toFixed(4), k }, x || {}));
cue(0, 'swell'); cue(K.find - 0.35, 'rise', { d: 0.35 }); cue(K.find, 'card_land');
cue(SC.look, 'pass', { d: 0.45 }); cue(SC.look + 0.2, 'card_in');
cue(K.you2, 'click'); cue(K.you2 + 0.02, 'focus'); K.keys1.forEach((k) => cue(k, 'key'));
cue(K.aarti - 0.45, 'rise', { d: 0.45 }); cue(K.aarti, 'logo'); cue(K.music, 'shimmer'); cue(K.bothW, 'pulse');
cue(SC.mood - 0.05, 'circle_wipe', { d: 0.5 }); cue(K.disc + 0.35, 'pull', { d: 0.7 });
cue(K.tuned, 'click'); cue(K.tuned + 0.02, 'tab'); cue(K.moodW, 'click'); cue(K.moodW + 0.02, 'tab');
cue(K.or + 0.02, 'click'); cue(K.or + 0.1, 'morph', { d: 0.45 }); K.keys2.forEach((k) => cue(k, 'key'));
cue(K.any, 'select', { d: K.song + 0.25 - K.any }); cue(K.submit, 'enter'); for (let i = 0; i < 3; i++) cue(K.submit + 0.06 + i * 0.08, 'card_in', { n: i });
cue(K.one, 'hover'); cue(K.tap, 'click'); cue(K.tap + 0.03, 'tap_pop'); cue(K.tap + 0.12, 'expand', { d: 0.55 });
cue(K.playing, 'play'); cue(K.playing + 0.03, 'drop');
cue(SC.lists - 0.05, 'line', { d: 0.5 }); cue(K.build, 'card_in'); cue(K.playlist, 'click'); cue(K.playlist + 0.05, 'create');
[0.35, 1.0, 1.5].forEach((d) => cue(K.playlist + d, 'flow'));
cue(SC.bot, 'pass', { d: 0.4 }); cue(K.favs, 'click'); cue(K.favs + 0.03, 'heart');
cue(K.sync, 'swoosh', { d: 0.4 }); cue(K.sync + 0.1, 'line', { d: 0.45 }); cue(K.bot, 'bot'); cue(K.telegram + 0.1, 'line', { d: 0.4 }); cue(K.telegram + 0.45, 'chime');
cue(SC.themes, 'orbit', { d: 0.6 }); K.wipes.forEach((w, i) => cue(w, 'theme', { n: i })); cue(K.seven, 'tick');
cue(SC.ajay - 0.25, 'type_wipe', { d: 0.6 }); cue(SC.ajay + 0.25, 'dip', { d: K.made - SC.ajay - 0.2 });
cue(K.ajay, 'ajay'); cue(K.igIn, 'ig'); cue(K.handle + 0.05, 'tick');
cue(SC.end - 0.15, 'line', { d: 0.55 }); cue(SC.end + 0.1, 'rise', { d: K.endAarti - SC.end - 0.1 }); cue(K.endAarti, 'logo'); cue(K.endMusic, 'shimmer');
for (let i = 0; i < 16; i++) cue(K.your + i * 0.055, 'key', { soft: 1 });
window.TIMELINE = { fps: FPS, duration: END, scenes: SC, times: K, cues: CUES, vo: VO };

// ---------------------------------------------------------------- maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eIO3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOut3 = (x) => 1 - Math.pow(1 - x, 3);
const eIn3 = (x) => x * x * x;
const eOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const eInExpo = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const eOutBack = (x, s = 1.2) => { const c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const spring = (x, z = 0.7, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); };
const rgba = (a, o) => `rgba(${a[0]},${a[1]},${a[2]},${o})`;
const mixA = (a, b, x) => a.map((v, i) => Math.round(lerp(v, b[i], x)));
function lerpObj(A, B, x) { const o = {}; for (const k in A) o[k] = typeof A[k] === 'number' && typeof B[k] === 'number' ? lerp(A[k], B[k], x) : (x < 0.5 ? A[k] : B[k]); for (const k in B) if (!(k in o)) o[k] = B[k]; return o; }

// ---------------------------------------------------------------- assets
const cap = (n) => 'cap2/' + n + '.png', mac = (n) => 'cap2m/' + n + '.png';
const MCLIP = { home: [0, 0, 412, 240], home_chip1: [0, 0, 412, 240], home_chip2: [0, 0, 412, 240], search_focus: [0, 0, 412, 80],
  search_q1: [0, 0, 412, 80], search_q2: [0, 0, 412, 80], search_q3: [0, 0, 412, 80], search_q4: [0, 0, 412, 80], search_q5: [0, 0, 412, 80], search_q6: [0, 0, 412, 80],
  search_results: [0, 420, 412, 260], search_tapped: [0, 420, 412, 260], now_paused: [0, 150, 412, 742], now_playing0: [0, 150, 412, 742], now_playing1: [0, 150, 412, 742],
  lib: [0, 440, 412, 240], lib_footer: [0, 560, 412, 332] };
const PRE = ['home', 'home_chip1', 'home_chip2', 'home_content', 'nav_home', 'search_results', 'search_tapped', 'now_paused', 'now_playing0', 'now_playing1', 'now_playing2',
  'lib', 'lib_after', 'lib_scroll', 'create_typed', 'link', 'drawer', ...Object.keys(THEME_BTN).map((t) => 'home_' + t)];
const TOP = {}; const keep = [];
async function load(src) { const im = new Image(); im.src = src; for (let k = 0; ; k++) { try { await im.decode(); break; } catch (e) { if (k > 3) throw new Error('decode ' + src); im.src = src + '?r=' + k; } } keep.push(im); return im; }
for (const n of PRE) {
  const im = await load(cap(n));
  const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d');
  g.drawImage(im, 8, 4, 8, 8, 0, 0, 8, 8); const d = g.getImageData(4, 4, 1, 1).data; TOP[n] = `rgb(${d[0]},${d[1]},${d[2]})`;
}
for (const n of Object.keys(MCLIP)) await load(mac(n));
for (const s of ['art/cover00.jpg', 'app/icons/teal.svg']) await load(s);
await document.fonts.load('800 100px Sora'); await document.fonts.load('400 100px Sora'); await document.fonts.load('600 100px Sora');

// ---------------------------------------------------------------- DOM helpers
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
  st.opacity = L.op ?? 1; st.transform = L.tf || ''; st.transformOrigin = L.origin || '50% 50%'; st.borderRadius = (L.rad ?? 0) + 'px'; st.boxShadow = L.shadow || '';
  st.clipPath = L.clip || ''; st.filter = L.filter || ''; st.zIndex = L.z ?? 0;
  return e;
}
const full = (P, name, op = 1, extra = {}) => lay(P, Object.assign({ src: cap(name), op }, extra));
const crop = (P, name, r, extra = {}) => lay(P, Object.assign({ src: cap(name), sx: r[0], sy: r[1], sw: r[2], sh: r[3], dx: r[0], dy: r[1], dw: r[2], dh: r[3] }, extra));
const card = (P, name, r, x, y, k, extra = {}) => lay(P, Object.assign({ src: cap(name), sx: r[0], sy: r[1], sw: r[2], sh: r[3], dx: x, dy: y, dw: r[2] * k, dh: r[3] * k }, extra));
// macro card: region r (viewport CSS px) cut from an 8x capture
const mcard = (P, name, r, x, y, k, extra = {}) => { const c = MCLIP[name]; return lay(P, Object.assign({ src: mac(name), srcW: c[2], sx: r[0] - c[0], sy: r[1] - c[1], sw: r[2], sh: r[3], dx: x, dy: y, dw: r[2] * k, dh: r[3] * k }, extra)); };

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
    const w = 520 * f.s * Math.max(0.35, Math.cos((f.ry || 0) * Math.PI / 180));
    Object.assign(shadow.style, { display: f.noShadow ? 'none' : 'block', left: x - w / 2 + 'px', top: y + 440 * f.s + 'px', width: w + 'px', height: 90 * f.s + 'px', opacity: 0.85 * (f.op ?? 1) * (1 - clamp((f.blur || 0) / 20)) });
  };
  return P;
}
const P0 = makePhone(), P1 = makePhone(), P2 = makePhone();
const PH = [P0, P1, P2];
const cards = mk('div', 'cards', cam);
const cardP = pool(cards), backP = pool(cardsBack), fxP = pool($('fx')), behindP = pool(behind);
const toStage = (f, px, py) => [f.X + (px - f.ax) * f.s, f.Y + (py - f.ay) * f.s];
const F_STD = { X: 960, Y: 540, ax: 206, ay: 432, s: 0.96, rx: 4, ry: 0, rz: 0, blur: 0, op: 1 };
const phoneScreen = (P, name, op = 1, extra) => { full(P.vp, name, op, extra); if (op > 0.5) P.status.style.background = TOP[name] || '#07141a'; };

// overlays
const MK_TOUCH = (P) => mk('div', 'touch', P);
const MK_RIPPLE = (P) => { const w = mk('div', '', P); w.style.cssText = 'position:absolute;overflow:hidden'; w.c = mk('div', '', w); w.c.style.cssText = 'position:absolute;border-radius:50%'; return w; };
const MK_RING = (P) => mk('div', 'ring', P);
const MK_DIV = (P) => mk('div', '', P);
function touch(P, x, y, t0, t, k = 1) {
  const p = (t - t0) / 0.42; if (p < -0.25 || p > 1) return;
  const e = P.next(MK_TOUCH);
  const a = p < 0 ? eOut3(clamp((p + 0.25) / 0.25)) : 1 - eIO3(clamp((p - 0.25) / 0.75));
  const s = (p < 0 ? lerp(1.35, 0.92, eOut3(clamp((p + 0.25) / 0.25))) : lerp(0.92, 1.25, eOut3(clamp(p)))) * k;
  e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.opacity = a; e.style.transform = `scale(${s})`;
}
function ripple(P, r, x, y, t0, t, color, dur = 0.5) {
  const p = (t - t0) / dur; if (p < 0 || p > 1) return;
  const e = P.next(MK_RIPPLE);
  Object.assign(e.style, { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px', borderRadius: (r[4] ?? 12) + 'px', opacity: 1 });
  const R = Math.hypot(r[2], r[3]) * eOut3(p);
  Object.assign(e.c.style, { left: x - r[0] - R + 'px', top: y - r[1] - R + 'px', width: 2 * R + 'px', height: 2 * R + 'px', background: color, opacity: 0.3 * (1 - eIn3(p)) });
}
function ring(P, cx, cy, t0, t, color, r0, r1, dur = 0.7, w = 3) {
  const p = (t - t0) / dur; if (p < 0 || p > 1) return;
  const e = P.next(MK_RING); const r = lerp(r0, r1, eOut3(p));
  Object.assign(e.style, { left: cx - r + 'px', top: cy - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px', borderColor: color, borderWidth: w + 'px', opacity: 0.85 * (1 - p), transform: '', borderRadius: '50%', boxShadow: '' });
}
function box(P, x, y, w, h, style) { const e = P.next(MK_DIV); e.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;` + style; return e; }

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
  const maxW = o.maxW ?? 1680, key = str + '|' + size + '|' + st.letterSpacing + '|' + st.fontWeight;
  if (!(key in e._fit)) { const w = measure(str, size, o.weight || 800, o.ls ?? -0.01); e._fit[key] = w > maxW ? size * maxW / w : size; }
  st.fontSize = e._fit[key] + 'px'; st.display = 'block'; st.overflow = o.nomask ? 'visible' : 'hidden';
  const align = o.align || 'center';
  st.left = o.x + 'px'; st.top = o.y + 'px';
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  st.transform = `translate(${tx},-50%) translate(${o.dx || 0}px,${o.dy || 0}px) scale(${o.scale ?? 1})`;
  st.transformOrigin = o.origin || (align === 'left' ? '0% 50%' : align === 'right' ? '100% 50%' : '50% 50%');
  st.opacity = o.op ?? 1; st.filter = o.blur > 0.05 ? `blur(${o.blur}px)` : '';
  const p = o.p ?? 1, out = o.out ?? 0;
  ti.transform = `translateY(${(1 - eOutExpo(p)) * 110 - eIn3(out) * 110}%)`;
  if (o.grad) { e.ti.className = 'ti grad'; ti.backgroundImage = o.grad; ti.backgroundSize = '200% 100%'; ti.backgroundPosition = (o.shine ?? 0) * 100 + '% 0'; ti.color = ''; }
  else { e.ti.className = 'ti'; ti.backgroundImage = ''; ti.color = o.color || C.ink; }
  ti.textShadow = o.glow || '';
  st.zIndex = o.z ?? 1;
  return e;
}
function KW(id, words, o, t) {
  const size = o.size, ls = o.ls ?? -0.01, weight = o.weight || 800, gap = size * (o.gap ?? 0.28);
  const ws = words.map((w) => measure(w.s, size, weight, ls));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = o.align === 'left' ? o.x : o.align === 'right' ? o.x - total : o.x - total / 2;
  const out = o.out ?? 0;
  words.forEach((w, i) => {
    const p = seg(t, w.t - 0.04, w.t + 0.36);
    if (p > 0 && out < 1) {
      const hit = w.hit ? 1 + 0.16 * (1 - eOut3(p)) : 1;
      T(id + i, w.s, { x: x + ws[i] / 2 + (o.dxOut || 0) * eIn3(out), y: o.y + (1 - eOutExpo(p)) * size * 0.34 + (o.dyOut || 0) * eIn3(out), size, weight, ls, nomask: true,
        op: eOut3(Math.min(1, p * 1.6)) * (1 - out) * (o.op ?? 1), blur: 14 * (1 - eOutExpo(p)) + 16 * out + (o.blur || 0), grad: w.grad ? (w.g || o.grad) : null, color: w.color || o.color,
        scale: hit * (1 + 0.05 * out), maxW: 5000, glow: w.glow || '' });
    }
    x += ws[i] + gap;
  });
  return { total, left: o.align === 'left' ? o.x : o.x - total / 2 };
}

// ---------------------------------------------------------------- fixed elements
const cursor = mk('div', 'cursor', $('stage'), '<svg viewBox="0 0 30 40" width="44" height="44"><path d="M3 2 L3 31 L10.5 24 L16 37 L21.5 34.6 L16.2 22.2 L26.5 22 Z" fill="#fff" stroke="#0a1426" stroke-width="2" stroke-linejoin="round"/></svg>');
const iconTile = mk('img', 'icon2', $('fx')); iconTile.src = 'app/icons/teal.svg';
const iconGlow = mk('div', '', $('fx')); iconGlow.style.cssText = 'position:absolute;border-radius:50%';
const botc = mk('div', '', $('fx')); botc.id = 'botc';
botc.innerHTML = '<svg viewBox="0 0 24 24" style="position:absolute;left:22%;top:22%;width:56%;height:56%"><path fill="#EEF6FF" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>';
const HEART_P = 'M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z';
const MK_TOKEN = (P) => { const d = mk('div', 'token', P); d.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3FE0FF" stroke="#DFFAFF" stroke-width="1" d="${HEART_P}"/></svg>`; return d; };
const MK_HEARTFILL = (P) => { const d = mk('div', '', P); d.style.position = 'absolute'; d.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#77ccdb" stroke="#77ccdb" stroke-width="1.7" stroke-linejoin="round" d="${HEART_P}"/></svg>`; return d; };
const MK_LINE = (P) => mk('div', 'line', P);
const MK_BAR = (P) => mk('div', 'vbar', P);
const sel = mk('div', 'sel', $('fx')); sel.style.background = 'rgba(63,224,255,.26)';
const hTop = mk('div', 'handle top', $('fx')), hBot = mk('div', 'handle bot', $('fx'));
[hTop, hBot].forEach((h) => { h.style.background = C.cyan; });
const hStyle = document.createElement('style'); hStyle.textContent = '.handle::after{background:#3FE0FF!important}'; document.head.appendChild(hStyle);
const caret = mk('div', 'caret', texts);
// Instagram glyph (the app's own outline icon) on the recognisable gradient tile
const ig = mk('div', 'igtile', $('fx'), '<svg viewBox="0 0 24 24" width="100%" height="100%" style="position:absolute;inset:0"><g fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><rect class="igr" x="5" y="5" width="14" height="14" rx="4.2" pathLength="1"/><circle class="igc" cx="12" cy="12" r="3.3" pathLength="1"/></g><circle class="igd" cx="16.2" cy="7.8" r="1" fill="#fff"/></svg>');
const wave = mk('div', 'wave', $('fx'), '<svg width="1920" height="200" viewBox="0 0 1920 200" style="position:absolute;left:0;top:0;overflow:visible"><path id="wp" fill="none" stroke="#7fe8ff" stroke-width="3" stroke-linecap="round" style="filter:drop-shadow(0 0 10px rgba(63,224,255,.9))"/></svg>');
const pcv = $('particles'), pg = pcv.getContext('2d');
let seed = 97531; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const PARTS = Array.from({ length: 140 }, () => ({ x: rnd() * 1920, y: rnd() * 1080, z: 0.3 + rnd() * 0.9, r: 0.7 + rnd() * 2.0, ph: rnd() * 6.28, sp: 0.4 + rnd() }));
{ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`; }
// the hook's field of real UI tiles drifting through depth
const FIELD = [];
{ const src = [['home_content', RECTS.home_cards[0]], ['home_content', RECTS.home_cards[1]], ['home_content', RECTS.home_cards[2]], ['home_content', RECTS.home_songs[0]], ['home_content', RECTS.home_songs[1]],
  ['home_content', RECTS.home_songs[2]], ['home_content', RECTS.home_songs[3]], ['lib', RECTS.lib_cards[0]], ['lib', RECTS.lib_cards[1]], ['home_content', RECTS.home_chips[1]], ['home_content', RECTS.home_chips[2]], ['home_content', RECTS.home_songs[4]]];
  for (let i = 0; i < 22; i++) { const [n, r] = src[i % src.length]; FIELD.push({ n, r, x: (rnd() - 0.5) * 2600, y: (rnd() - 0.5) * 1300, z0: -2600 + rnd() * 2600, ry: (rnd() - 0.5) * 40, rx: (rnd() - 0.5) * 20, sp: 450 + rnd() * 250 }); } }

// cursor keyframes: [[t, x, y], ...] and clicks [t, ...]
function cursorAt(t, keys, clicks) {
  if (t < keys[0][0] || t > keys[keys.length - 1][0]) return null;
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, xa, ya] = keys[i], [tb, xb, yb] = keys[i + 1], e = eIO3(seg(t, ta, tb));
  let press = 0; for (const c of clicks) { const d = t - c; if (d > -0.08 && d < 0.2) press = Math.max(press, d < 0 ? 1 + d / 0.08 : 1 - d / 0.2); }
  const op = Math.min(seg(t, keys[0][0], keys[0][0] + 0.12), 1 - seg(t, keys[keys.length - 1][0] - 0.15, keys[keys.length - 1][0]));
  return { x: lerp(xa, xb, e), y: lerp(ya, yb, e), press, op };
}

// ================================================================ frame
window.renderAt = function (t) {
  PH.forEach((P) => P.begin()); cardP.begin(); backP.begin(); fxP.begin(); behindP.begin();
  for (const k in TX) TX[k].used = false;
  let cur = null;
  iconTile.style.display = 'none'; iconGlow.style.display = 'none'; botc.style.display = 'none'; ig.style.display = 'none'; wave.style.display = 'none';
  sel.style.display = hTop.style.display = hBot.style.display = caret.style.display = 'none';
  let flash = 0, fade = 0, sweepX = -1;

  // ---------- environment: navy depth, blue/cyan light, emerald accents
  let glow = [47, 123, 255], glow2 = [63, 224, 255], emerA = 0.06;
  if (t >= SC.themes && t < SC.ajay) {   // the room follows the theme, kept inside the blue/green family
    let i = 0; while (i < K.wipes.length - 1 && t >= K.wipes[i + 1]) i++;
    const p = t < K.wipes[0] ? 0 : eIO3(seg(t, K.wipes[i], K.wipes[i] + 0.2));
    const a = THEME_GLOW[THEME_SEQ[t < K.wipes[0] ? 0 : i]], b = THEME_GLOW[THEME_SEQ[t < K.wipes[0] ? 0 : i + 1]];
    glow2 = mixA(a, b, p); emerA = THEME_SEQ[i + 1] === 'green' ? 0.1 * p + 0.06 : 0.06;
  }
  if (t >= SC.bot && t < SC.themes) emerA = 0.06 + 0.06 * seg(t, K.sync, K.sync + 0.5);
  const base = t >= SC.ajay && t < SC.end ? 0.7 : 1;
  $('stage').style.background = `radial-gradient(ellipse 90% 80% at 50% 45%, #071a3a 0%, #040b1e 45%, ${C.bg} 100%)`;
  const bx = [520 + 300 * Math.sin(t * 0.3), 1420 + 240 * Math.cos(t * 0.26), 960 + 360 * Math.sin(t * 0.19 + 1)];
  const by = [300 + 140 * Math.cos(t * 0.29), 800 + 120 * Math.sin(t * 0.24), 560 + 160 * Math.cos(t * 0.21)];
  [[glow, 0.24 * base], [glow2, 0.14 * base], [[43, 217, 139], emerA * base]].forEach(([c, a], i) => {
    const b = $('b' + i); b.style.background = `radial-gradient(circle, ${rgba(c, a)} 0%, ${rgba(c, a * 0.35)} 35%, transparent 68%)`; b.style.transform = `translate(${bx[i]}px,${by[i]}px)`;
  });
  pg.setTransform(2, 0, 0, 2, 0, 0); pg.clearRect(0, 0, 1920, 1080);
  for (const q of PARTS) {
    const y = ((q.y - t * 14 * q.z * q.sp) % 1080 + 1080) % 1080, x = ((q.x + t * 12 * q.z + 14 * Math.sin(t * 0.6 * q.sp + q.ph)) % 1920 + 1920) % 1920;
    const a = (0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.1 * q.sp + q.ph))) * q.z * 0.7;
    pg.beginPath(); pg.fillStyle = `rgba(${q.z > 0.8 ? '180,240,255' : '140,190,255'},${a})`; pg.arc(x, y, q.r * q.z, 0, 6.2832); pg.fill();
  }
  const fr = Math.round(t * FPS);
  $('grain').style.backgroundPosition = `${(fr * 73) % 256}px ${(fr * 151) % 256}px`;

  // ============ 1. HOOK — real UI drifts through depth; one card finds you
  if (t < SC.look + 0.5) {
    const pass = eIn3(seg(t, SC.look - 0.12, SC.look + 0.3)), hOut1 = eIO3(seg(t, SC.look - 0.22, SC.look + 0.02));
    FIELD.forEach((q, i) => {
      const z = q.z0 + q.sp * t + 900 * pass; if (z > 600 || z < -2800) return;
      const k = q.r[3] > 100 ? 1.25 : 1.6;
      const dof = Math.abs(z + 900) / 180;
      card(backP, q.n, q.r, 960 + q.x - q.r[2] * k / 2, 540 + q.y - q.r[3] * k / 2, k, { rad: 16, op: clamp((z + 2800) / 900) * clamp((600 - z) / 400) * 0.85,
        tf: `translateZ(${z}px) rotateY(${q.ry}deg) rotateX(${q.rx}deg)`, filter: `blur(${Math.min(12, dof)}px) brightness(.8)` });
    });
    // the card that finds you
    const fp = seg(t, K.find - 0.25, K.find + 0.45), e = eOutExpo(fp);
    if (fp > 0) {
      const r = RECTS.home_cards[0], k = 2.0;
      const z = lerp(-1800, 0, e) + 2600 * pass, x = lerp(1600, 1330, e), y = lerp(200, 320, e);
      card(cardP, 'home_content', r, x, y, k, { rad: 22, op: clamp(fp * 3), tf: `translateZ(${z}px) rotateY(${lerp(-40, -12, e) + 6 * Math.sin(t)}deg) rotateX(${lerp(20, 4, e)}deg)`,
        shadow: '0 40px 90px rgba(0,0,0,.55), 0 0 60px rgba(63,224,255,.25)', filter: pass > 0 ? `blur(${14 * pass}px)` : '' });
    }
    KW('h1', [{ s: 'SOME', t: -0.25 }, { s: 'SONGS', t: W('hook1', 'songs') }], { x: 160, y: 450, align: 'left', size: 136, out: hOut1, dxOut: -200 }, t);
    KW('h2', [{ s: 'FIND', t: K.find, grad: true }, { s: 'YOU.', t: K.you1, grad: true, hit: true }], { x: 160, y: 605, align: 'left', size: 136, grad: CYAN, out: hOut1, dxOut: -200 }, t);
  }

  // ============ 2. LOOKING — the search field, led by a cursor
  if (t >= SC.look && t < SC.mood + 0.1) {
    const inP = eOutExpo(seg(t, SC.look + 0.05, SC.look + 0.6));
    const merge = eIO3(seg(t, K.aarti - 0.42, K.aarti - 0.02));
    const sb = RECTS.searchbar, kb = 3.4, bw = (sb[2] + 12) * kb, bh = (sb[3] + 12) * kb;
    const bx0 = 960 - bw / 2, by0 = 590;
    let name = 'search_focus'; if (t >= K.keys1[0]) name = 'search_q1'; if (t >= K.keys1[1]) name = 'search_q2';
    if (merge < 1) {
      const x = lerp(bx0 - 700, bx0, inP), y = by0 + 60 * (1 - inP);
      const focus = t >= K.you2 ? Math.exp(-(t - K.you2) * 4) : 0;
      mcard(cardP, name, [sb[0] - 6, sb[1] - 6, sb[2] + 12, sb[3] + 12], lerp(x, 960 - bw / 2, merge), lerp(y, 540 - bh / 2, merge), kb, {
        rad: 30 * kb / 2.2, op: clamp(inP * 2) * (1 - eIn3(merge)), tf: `perspective(1600px) rotateY(${lerp(28, 0, inP)}deg) rotateZ(${lerp(-6, 0, inP)}deg) scale(${lerp(1, 0.12, merge)})`,
        shadow: `0 40px 90px rgba(0,0,0,.55), 0 0 0 ${2 + 3 * focus}px rgba(63,224,255,${0.35 + 0.6 * focus}), 0 0 ${60 * focus}px rgba(63,224,255,${0.5 * focus})`, filter: inP < 1 ? `blur(${12 * (1 - inP)}px)` : '' });
      cur = cursorAt(t, [[SC.look + 0.15, 1560, 1020], [K.you2 - 0.02, bx0 + bw * 0.62, by0 + bh * 0.55], [K.aarti - 0.5, bx0 + bw * 0.66, by0 + bh * 0.62], [K.aarti - 0.3, 1700, 1100]], [K.you2]);
    }
    const tOut = eIO3(seg(t, K.aarti - 0.5, K.aarti - 0.2));
    KW('l1', [{ s: 'OTHERS,', t: K.others }], { x: 960, y: 290, size: 96, weight: 700, color: C.mute, out: tOut, dyOut: -40 }, t);
    KW('l2', [{ s: 'YOU', t: K.you2 }, { s: 'GO', t: W('hook2', 'go') }, { s: 'LOOKING', t: K.looking, grad: true }, { s: 'FOR.', t: W('hook2', 'for'), grad: true }], { x: 960, y: 410, size: 110, grad: CYAN, out: tOut, dyOut: -40 }, t);
  }

  // ============ 3. BOTH — everything folds into the app icon, then opens as a circle
  if (t >= K.aarti - 0.45 && t < SC.mood + 0.7) {
    const p = seg(t, K.aarti - 0.08, K.aarti + 0.7), sp = spring(p * 0.85, 0.6, 12);
    const open = eIO3(seg(t, SC.mood - 0.1, SC.mood + 0.45));
    const slide = eIO3(seg(t, SC.mood - 0.2, SC.mood + 0.15));
    const IS = 190, ix = lerp(620, 960, slide), iy = 540;
    const s = lerp(0.2, 1, sp) * (1 + 0.06 * Math.exp(-Math.max(0, t - K.bothW) * 8) * (t > K.bothW ? 1 : 0)) * lerp(1, 5.5, eIn3(open));
    if (open < 1) {
      Object.assign(iconTile.style, { display: 'block', left: ix - IS / 2 + 'px', top: iy - IS / 2 + 'px', width: IS + 'px', height: IS + 'px', transform: `scale(${s})`, opacity: clamp(p * 5) * (1 - eIn3(open)),
        filter: 'drop-shadow(0 20px 50px rgba(0,0,0,.6)) drop-shadow(0 0 40px rgba(63,224,255,.45))' });
      Object.assign(iconGlow.style, { display: 'block', left: ix - 420 + 'px', top: iy - 420 + 'px', width: '840px', height: '840px', background: 'radial-gradient(circle, rgba(63,224,255,.28), rgba(47,123,255,.08) 42%, transparent 66%)', opacity: clamp(p * 3) * (1 - open) });
      ring(fxP, ix, iy, K.aarti, t, 'rgba(160,240,255,.9)', 100, 520, 0.8, 3); ring(fxP, ix, iy, K.bothW, t, 'rgba(63,224,255,.8)', 100, 300, 0.6, 2);
      flash = 0.35 * Math.exp(-Math.max(0, t - K.aarti) * 7) * (t >= K.aarti ? 1 : 0);
      const wp = seg(t, K.aarti + 0.05, K.aarti + 0.65);
      T('wm', 'AARTIMUSIC', { x: 760 - 500 * eIn3(slide), y: 548, align: 'left', size: 140, maxW: 1000, grad: CYAN, shine: 1 - eOut3(seg(t, K.music, K.music + 1.0)),
        ls: lerp(0.2, 0.01, eOutExpo(wp)), op: eOut3(seg(t, K.aarti + 0.04, K.aarti + 0.3)) * (1 - slide), blur: 10 * (1 - eOut3(wp)) + 16 * slide, glow: '0 0 40px rgba(63,224,255,.25)' });
    }
  }

  // ============ 4. MOOD — macro on Home, pull back to the phone, moods picked by cursor
  const fMood = { ...F_STD, X: 560, Y: 545, s: 0.98, ry: 16, rx: 3 };
  if (t >= SC.mood - 0.1 && t < SC.search + 0.8) {
    const open = eIO3(seg(t, SC.mood - 0.1, SC.mood + 0.45));
    const pull = eIO3(seg(t, K.disc + 0.35, K.disc + 1.05));
    const toSearch = eInExpo(seg(t, K.or + 0.1, K.or + 0.45));
    const f = { ...fMood, Y: 545 + 6 * Math.sin(t * 1.3), ry: lerp(16, 10, seg(t, SC.mood, SC.search)) - 30 * toSearch, X: 560 - 1300 * toSearch, blur: 16 * toSearch };
    const chip = t >= K.moodW + 0.03 ? 'home_chip2' : t >= K.tuned + 0.03 ? 'home_chip1' : 'home';
    if (pull > 0) { P0.f = { ...f, op: clamp(pull * 3) }; phoneScreen(P0.vp ? P0 : P0, chip); }
    // the macro: header of Home, filling the frame, then flying onto the phone's screen
    if (pull < 1) {
      const [tx, ty] = toStage(f, 0, 0), k0 = 1920 / 412 * lerp(1, 0.94, seg(t, SC.mood, K.disc + 0.35)), k1 = f.s;
      const k = lerp(k0, k1, pull), x = lerp(0, tx, pull), y = lerp(540 - 240 * k0 / 2 + 40, ty, pull);
      const R = open >= 1 ? 3000 : 1400 * open;
      mcard(cardP, chip, [0, 0, 412, 240], x, y, k, { op: 1 - eIn3(seg(pull, 0.75, 1)), clip: open < 1 ? `circle(${R}px at ${960 - x}px ${540 - y}px)` : '',
        tf: pull > 0 ? `perspective(2400px) rotateY(${f.ry * pull}deg)` : '', origin: '0 0', rad: 40 * pull });
      if (open < 1) ring(fxP, 960, 540, SC.mood - 0.05, t, 'rgba(160,240,255,.9)', 90, 1200, 0.6, 3);
    }
    // headline: over the macro first, then it settles on the right
    const right = pull, hx = lerp(160, 1030, right), out = eIO3(seg(t, K.or - 0.05, K.or + 0.25));
    if (pull < 0.6) box(fxP, 0, 640, 1920, 440, `background:linear-gradient(transparent, rgba(3,6,15,.95) 45%);opacity:${1 - pull / 0.6}`);
    KW('fd', [{ s: 'FRESH', t: K.fresh }, { s: 'DISCOVERIES,', t: K.disc, grad: true }], { x: hx, y: lerp(880, 270, right), align: 'left', size: lerp(104, 56, right), weight: lerp(800, 700, right), ls: lerp(-0.01, 0.06, right), grad: CYAN, out, dyOut: -40 }, t);
    KW('tu', [{ s: 'TUNED', t: K.tuned }, { s: 'TO', t: W('mood', 'to') }], { x: 1030, y: 400, align: 'left', size: 128, out, dyOut: -40 }, t);
    KW('ym', [{ s: 'YOUR', t: W('mood', 'your') }, { s: 'MOOD', t: K.moodW, grad: true, hit: true }], { x: 1030, y: 545, align: 'left', size: 128, grad: EMER, out, dyOut: -40 }, t);
    // the mood chips, as a floating row, answering the cursor
    const cp = eOutExpo(seg(t, K.disc + 0.9, K.disc + 1.4));
    if (cp > 0 && out < 1) {
      const kc = 2.6, cx = 1030, cy = 700 + 40 * (1 - cp);
      mcard(cardP, chip, [8, 164, 380, 54], cx - 8 * 0, cy, kc, { rad: 60, op: cp * (1 - out), tf: `translateZ(${lerp(-200, 0, cp)}px)`, shadow: '0 30px 60px rgba(0,0,0,.45)', clip: 'inset(0 round 60px)' });
      const chips = RECTS.home_chips, at = (i) => [cx + (chips[i][0] - 8 + chips[i][2] / 2) * kc, cy + (chips[i][1] - 164 + chips[i][3] / 2) * kc];
      const [a1x, a1y] = at(1), [a2x, a2y] = at(2);
      if (t < K.or) cur = cursorAt(t, [[K.disc + 1.1, 1700, 1000], [K.tuned - 0.02, a1x + 10, a1y + 6], [K.moodW - 0.02, a2x + 8, a2y + 6], [K.moodW + 0.35, a2x + 30, a2y + 40]], [K.tuned, K.moodW]);
      ring(fxP, a1x, a1y, K.tuned, t, 'rgba(63,224,255,.9)', 20, 120, 0.5, 2); ring(fxP, a2x, a2y, K.moodW, t, 'rgba(43,217,139,.9)', 20, 120, 0.5, 2);
    }
    // the Search tab in the nav is tapped, and becomes the search field
    const nb = RECTS.nav_btns[1], [nx, ny] = toStage(f, nb[0] + nb[2] / 2, nb[1] + nb[3] / 2);
    if (t >= K.moodW + 0.3) { const c2 = cursorAt(t, [[K.moodW + 0.35, a2xSafe(), 760], [K.or - 0.01, nx + 6, ny + 4], [K.or + 0.3, nx + 30, ny + 60]], [K.or]); if (c2) cur = c2; }
    touch(P0.ov, nb[0] + nb[2] / 2, nb[1] + nb[3] / 2, K.or, t);
  }
  function a2xSafe() { return 1030 + (RECTS.home_chips[2][0] - 8 + RECTS.home_chips[2][2] / 2) * 2.6; }

  // ============ 5. SEARCH — the tab grows into a giant field; results tilt in
  const sb = RECTS.searchbar, kB = 3.3, barX = 760, barY = 180;
  const rowK = 2.7, rowX = 760, rowY = [400, 590, 780];
  if (t >= K.or + 0.05 && t < SC.play + 0.9) {
    const grow = eIO3(seg(t, K.or + 0.08, K.or + 0.55));
    const nb = RECTS.nav_btns[1], f = { ...fMood, Y: 545, ry: 10 }, [nx, ny] = toStage(f, nb[0] + nb[2] / 2, nb[1] + nb[3] / 2);
    const leave = eInExpo(seg(t, K.tap + 0.1, K.tap + 0.45));
    let name = 'search_q2'; K.keys2.forEach((k, i) => { if (t >= k) name = 'search_q' + (i + 2); });
    if (name === 'search_q7') name = 'search_q6';
    const bw = (sb[2] + 12) * kB, bh = (sb[3] + 12) * kB;
    const x = lerp(nx - 60, barX, grow), y = lerp(ny - 30, barY, grow), w = lerp(120, bw, grow), h = lerp(60, bh, grow);
    mcard(cardP, name, [sb[0] - 6, sb[1] - 6, sb[2] + 12, sb[3] + 12], x - 1500 * leave, y, w / (sb[2] + 12), { dh: h, rad: lerp(24, 70, grow), op: clamp(grow * 4),
      shadow: '0 30px 70px rgba(0,0,0,.5), 0 0 0 2.5px rgba(63,224,255,.55), 0 0 50px rgba(63,224,255,.22)', filter: leave > 0 ? `blur(${14 * leave}px)` : '' });
    const hx = 160 - 1500 * leave, sOut = seg(t, K.one - 0.18, K.one + 0.06);
    T('se', 'SEARCH', { x: hx, y: 430, align: 'left', size: 150, p: seg(t, K.search - 0.04, K.search + 0.35), out: sOut });
    T('as', 'ANY SONG.', { x: hx, y: 600, align: 'left', size: 118, maxW: 640, p: seg(t, K.any - 0.04, K.any + 0.35), grad: t > K.song ? CYAN : null, out: sOut, z: 2 });
    const spx = eIO3(seg(t, K.any + 0.05, K.song + 0.3));
    if (spx > 0 && sOut < 0.3) {
      const wAll = Math.min(640, measure('ANY SONG.', 118)) + 20, hh = 138, y0 = 600 - hh / 2;
      Object.assign(sel.style, { display: 'block', left: hx - 6 + 'px', top: y0 + 'px', width: wAll * spx + 'px', height: hh + 'px', opacity: 1 });
      Object.assign(hTop.style, { display: 'block', left: hx - 8 + 'px', top: y0 + 'px', height: hh + 'px' });
      Object.assign(hBot.style, { display: 'block', left: hx - 6 + wAll * spx + 'px', top: y0 + 'px', height: hh + 'px' });
    }
    // results: cards swing in from beyond the frame
    for (let i = 0; i < 3; i++) {
      const r = RECTS.result_rows[i], t0 = K.submit + 0.04 + i * 0.08, p = seg(t, t0, t0 + 0.6); if (p <= 0) continue;
      const e = eOutExpo(p), yy = rowY[i];
      const hov = i === 0 ? seg(t, K.one - 0.1, K.one + 0.15) : 0, press = i === 0 && t >= K.tap ? Math.exp(-(t - K.tap) * 10) : 0;
      const src = i === 0 && t >= K.tap + 0.05 ? 'search_tapped' : 'search_results';
      const art = i === 0 && t >= K.tap + 0.12;   // row 0's artwork leaves to become the player
      mcard(cardP, src, r, rowX + 700 * (1 - e) - 1900 * leave * (i === 0 ? 0 : 1), yy, rowK, { rad: 16 * rowK / 2, op: clamp(p * 3) * (i === 0 ? 1 - seg(t, K.tap + 0.25, K.tap + 0.45) : 1),
        tf: `perspective(1800px) rotateY(${-35 * (1 - e)}deg) rotateZ(${4 * (1 - e)}deg) translateZ(${24 * hov - 30 * press}px)`,
        shadow: `0 24px 60px rgba(0,0,0,.5)${hov ? `, 0 0 0 ${3 * hov}px rgba(63,224,255,.95), 0 0 ${44 * hov}px rgba(63,224,255,.4)` : ''}`,
        clip: art ? `inset(0 0 0 ${62 * rowK}px round 20px)` : '', filter: i > 0 && leave > 0 ? `blur(${12 * leave}px)` : '' });
      if (i === 0) ripple(fxP, [rowX, yy, 380 * rowK, 66 * rowK, 20], rowX + 45 * rowK, yy + 33 * rowK, K.tap, t, '#3FE0FF', 0.45);
    }
    if (t < K.tap + 0.3) { const c = cursorAt(t, [[K.submit + 0.35, 1760, 1040], [K.one - 0.05, rowX + 60 * rowK, rowY[0] + 40 * rowK], [K.tap + 0.25, rowX + 64 * rowK, rowY[0] + 44 * rowK], [K.tap + 0.45, rowX + 200, rowY[0] + 400]], [K.tap]); if (c) cur = c; }
  }

  // ============ 6. PLAYING — the artwork becomes the player; the play state lands on "playing"
  const fPlay = { ...F_STD, X: 1160, Y: 548, s: 1.0, ry: -10, rx: 3 };
  if (t >= K.tap + 0.1 && t < SC.lists + 0.6) {
    const rise = spring(seg(t, K.tap + 0.15, K.playing + 0.3) * 0.8, 0.75, 10);
    const push = eIO3(seg(t, SC.lists - 0.35, SC.lists + 0.25));
    const f = { ...fPlay, Y: lerp(1500, 548, rise) + 5 * Math.sin(t * 1.4), ry: lerp(-24, -10, rise) + 6 * seg(t, K.playing, SC.lists), rx: lerp(14, 3, rise), op: clamp(rise * 3) };
    const seek = RECTS.now_seek, sx = seek[0] + seek[2] * 0.3, sy = seek[1] + seek[3] / 2;
    const F2 = lerpObj(f, { ...f, ax: sx, ay: sy, X: 960, Y: 700, s: 3.2, ry: 0, rx: 0 }, push); F2.op = f.op * (1 - seg(t, SC.lists + 0.05, SC.lists + 0.4)); F2.blur = 18 * seg(t, SC.lists, SC.lists + 0.4);
    P0.f = F2;
    const playing = t >= K.playing + 0.02;
    phoneScreen(P0, !playing ? 'now_paused' : t < K.playing + 0.55 ? 'now_playing0' : 'now_playing1');
    const pb = RECTS.now_play, cx = pb[0] + pb[2] / 2, cy = pb[1] + pb[3] / 2;
    const press = seg(t, K.playing - 0.04, K.playing + 0.02), rel = seg(t, K.playing + 0.02, K.playing + 0.5);
    if (press > 0 && rel < 1) { const s2 = rel > 0 ? lerp(0.88, 1, spring(rel, 0.5, 16)) : lerp(1, 0.88, eOut3(press)); crop(P0.vp, rel > 0 ? 'now_playing0' : 'now_paused', [pb[0] - 6, pb[1] - 6, pb[2] + 12, pb[3] + 12], { rad: 44, tf: `scale(${s2})` }); }
    ring(P0.ov, cx, cy, K.playing + 0.02, t, 'rgba(63,224,255,.95)', 36, 220, 0.8, 3); ring(P0.ov, cx, cy, K.playing + 0.16, t, 'rgba(43,217,139,.9)', 36, 160, 0.7, 2);
    touch(P0.ov, cx, cy, K.playing - 0.03, t);
    if (playing) { const beat = ((t - K.playing) % 0.5) / 0.5, c = RECTS.now_cover; crop(P0.vp, 'now_playing0', [c[0] - 2, c[1] - 2, c[2] + 4, c[3] + 4], { tf: `scale(${1 + 0.012 * Math.exp(-beat * 6)})`, rad: 18 }); }
    // artwork flight: from the tapped row's thumbnail to the cover
    const fl = seg(t, K.tap + 0.12, K.playing - 0.05);
    if (fl > 0 && fl < 1) {
      const a = [rowX + (20 - 16) * rowK, rowY[0] + (447 - 439) * rowK, 50 * rowK];
      const cv = RECTS.now_cover, [lx, ly] = toStage(f, cv[0], cv[1]), b = [lx, ly, cv[2] * f.s];
      const mid = [700, 180, 520];
      const e1 = eIO3(clamp(fl / 0.5)), e2 = eIO3(clamp((fl - 0.5) / 0.5));
      const x = fl < 0.5 ? lerp(a[0], mid[0], e1) : lerp(mid[0], b[0], e2), y = fl < 0.5 ? lerp(a[1], mid[1], e1) : lerp(mid[1], b[1], e2), w = fl < 0.5 ? lerp(a[2], mid[2], e1) : lerp(mid[2], b[2], e2);
      lay(fxP, { src: 'art/cover00.jpg', srcW: w, sw: w, sh: w, dx: x, dy: y, dw: w, dh: w, rad: lerp(10, 20, e1), op: 1 - eIO3(seg(fl, 0.88, 1)),
        tf: `perspective(1600px) rotateY(${-18 * Math.sin(Math.PI * fl)}deg) rotateZ(${-5 * Math.sin(Math.PI * fl)}deg)`, shadow: `0 40px 90px rgba(0,0,0,.6), 0 0 ${120 * Math.sin(Math.PI * fl)}px rgba(63,224,255,.4)` });
    }
    const out = eIO3(seg(t, SC.lists - 0.4, SC.lists - 0.05));
    KW('ot', [{ s: 'ONE', t: K.one }, { s: 'TAP.', t: K.tap, grad: true, hit: true }], { x: 160, y: 430, align: 'left', size: 140, grad: CYAN, out, dxOut: -120 }, t);
    if (t >= K.playing - 0.05) KW('ip', [{ s: "IT'S", t: K.playing - 0.2 }, { s: 'PLAYING.', t: K.playing, grad: true, hit: true }], { x: 160, y: 590, align: 'left', size: 110, grad: EMER, out, dxOut: -120 }, t);
    // live bars beside the words
    const vis = seg(t, K.playing, K.playing + 0.3) * (1 - out);
    if (vis > 0) for (let i = 0; i < 14; i++) {
      const beat = ((t - K.playing) % 0.5) / 0.5, env = 0.4 + 0.6 * Math.exp(-beat * 4), h = (12 + 60 * Math.abs(Math.sin(t * (2.3 + (i % 5) * 0.6) + i * 1.9)) * env);
      const e = fxP.next(MK_BAR); Object.assign(e.style, { left: 164 + i * 22 + 'px', top: 760 - h + 'px', height: h + 'px', width: '10px', opacity: 0.8 * vis });
    }
    // the progress line leaves the phone and becomes the playlist rail
    const lp = eIO3(seg(t, SC.lists - 0.25, SC.lists + 0.3));
    if (lp > 0) { const e = fxP.next(MK_LINE); const y = lerp(700, 690, lp); Object.assign(e.style, { left: 960 - 960 * lp + 'px', top: y + 'px', width: 1920 * lp + 'px', transform: '', opacity: 1, height: '4px' }); }
  }

  // ============ 7. PLAYLISTS — a flowing rail of cards that make room for a new one
  if (t >= SC.lists - 0.05 && t < SC.bot + 0.5) {
    const out = eInExpo(seg(t, SC.bot - 0.08, SC.bot + 0.3));
    const railY = 690;
    { const e = fxP.next(MK_LINE); Object.assign(e.style, { left: '0px', top: railY + 'px', width: '1920px', opacity: 0.55 * (1 - out) * seg(t, SC.lists + 0.2, SC.lists + 0.4) + (t < SC.lists + 0.3 ? 0 : 0), transform: '', height: '3px' }); }
    const items = [['home_content', RECTS.home_cards[0]], ['home_content', RECTS.home_cards[1]], ['lib_after', RECTS.lib_cards_after[0]], ['NEW', RECTS.lib_cards_after[2]], ['lib_after', RECTS.lib_cards_after[1]], ['home_content', RECTS.home_cards[2]], ['home_content', RECTS.home_cards[3]]];
    const ins = eOutBack(seg(t, K.playlist + 0.2, K.playlist + 0.7), 1.1);   // room opens for the new playlist
    const flow = lerp(-1.2, 0, eOutExpo(seg(t, SC.lists, SC.lists + 0.8))) + 0.9 * eIO3(seg(t, K.every - 0.2, K.moment + 0.5)) + 0.12 * (t - SC.lists);
    const H = 330, gap = 60;
    let acc = 0; const pos = [];
    items.forEach(([n, r], i) => { const w = r[2] * H / r[3]; const wi = n === 'NEW' ? w * ins : w; pos.push([acc + wi / 2, w, wi]); acc += wi + (n === 'NEW' ? gap * ins : gap); });
    const center = pos[3][0] + 0.001, unit = pos[1][0] - pos[0][0];
    items.forEach(([n, r], i) => {
      const [c, w, wi] = pos[i];
      const x = 960 + (c - center) - flow * unit - 1900 * out;
      const d = (x - 960) / 700, k = H / r[3] * (1 + 0.14 * Math.exp(-d * d * 3)) * (n === 'NEW' ? lerp(0.2, 1, ins) : 1);
      if (x < -500 || x > 2420) return;
      const src = n === 'NEW' ? 'lib_after' : n;
      if (n === 'NEW' && ins <= 0.01) return;
      card(cardP, src, r, x - r[2] * k / 2, railY - r[3] * k / 2, k, { rad: 22, op: n === 'NEW' ? clamp(ins * 2) : 1,
        tf: `perspective(2200px) rotateY(${clamp(-d, -1, 1) * 28}deg) translateZ(${-120 * Math.abs(clamp(d, -1.5, 1.5))}px)`,
        shadow: `0 40px 80px rgba(0,0,0,.55)${n === 'NEW' ? `, 0 0 ${60 * Math.exp(-(t - K.playlist - 0.3) * 2)}px rgba(63,224,255,.7)` : ''}`, filter: out > 0 ? `blur(${14 * out}px)` : '' });
    });
    // "A playlist of your own" drops in, Create is clicked, it becomes the new card
    const dp = eOutBack(seg(t, K.build - 0.1, K.build + 0.35), 1.15), dOut = eIO3(seg(t, K.playlist + 0.05, K.playlist + 0.45));
    const dlg = RECTS.create_dialog, dk = 1.35, dx = 960 - dlg[2] * dk / 2, dy = 250;
    if (dp > 0 && dOut < 1) {
      card(cardP, 'create_typed', dlg, lerp(dx, 960 - 60, dOut), lerp(dy - 80 * (1 - dp), railY - 80, dOut), dk * lerp(1, 0.3, dOut), { rad: 24 * dk, op: clamp(dp * 3) * (1 - eIn3(dOut)),
        shadow: '0 40px 90px rgba(0,0,0,.6), 0 0 0 1.5px rgba(63,224,255,.4)' });
      const cb = RECTS.create_btn, bx = dx + (cb[0] - dlg[0] + cb[2] / 2) * dk, by = dy + (cb[1] - dlg[1] + cb[3] / 2) * dk;
      const c = cursorAt(t, [[K.build + 0.1, 1500, 1000], [K.playlist - 0.02, bx + 4, by + 4], [K.playlist + 0.3, bx + 40, by + 120]], [K.playlist]); if (c) cur = c;
      ring(fxP, bx, by, K.playlist, t, 'rgba(63,224,255,.9)', 20, 110, 0.5, 2);
    }
    const hOut = eIO3(seg(t, SC.bot - 0.25, SC.bot + 0.05));
    KW('bp', [{ s: 'BUILD', t: K.build }, { s: 'A', t: W('lists', 'a') }, { s: 'PLAYLIST', t: K.playlist, grad: true }], { x: 960, y: 150 + (t < K.playlist + 0.5 ? 0 : 0), size: 96, grad: CYAN, out: hOut, dyOut: -40 }, t);
    KW('fm', [{ s: 'FOR', t: W('lists', 'for') }, { s: 'EVERY', t: K.every }, { s: 'MOMENT', t: K.moment, grad: true, hit: true }], { x: 960, y: 960, size: 64, weight: 700, grad: EMER, out: hOut, dyOut: 40 }, t);
  }

  // ============ 8. SYNC — a heart, followed from phone to bot to phone
  if (t >= SC.bot - 0.1 && t < SC.themes + 0.9) {
    // a) macro: a song row, the heart tapped and filled
    const inR = eOutExpo(seg(t, SC.bot, SC.bot + 0.5)), shrink = eIO3(seg(t, K.sync - 0.1, K.sync + 0.45));
    const r = RECTS.result_rows[2], hr = RECTS.result_hearts[2], kR = 3.6;
    const rx0 = 960 - r[2] * kR / 2, ry0 = 540 - r[3] * kR / 2;
    const camX = lerp(0, 1, eIO3(seg(t, K.sync, K.telegram + 0.6)));        // the camera follows the heart
    const wx = (x) => x - lerp(-60, 60, camX);
    const A = { ...F_STD, X: wx(420), Y: 580, s: 0.82, ry: 18, rx: 3 }, B = { ...F_STD, X: wx(1500), Y: 580, s: 0.82, ry: -18, rx: 3 };
    if (shrink < 1) {
      const [ax, ay] = toStage(A, 0, r[1]);
      mcard(cardP, 'search_results', r, lerp(rx0, ax, shrink), lerp(ry0 + 400 * (1 - inR), ay, shrink), lerp(kR, A.s, shrink), { rad: 30, op: clamp(inR * 3) * (1 - eIn3(shrink)),
        tf: `perspective(1800px) rotateX(${lerp(24, 0, inR)}deg)`, shadow: '0 40px 90px rgba(0,0,0,.55)' });
      const hx = lerp(rx0, ax, shrink) + (hr[0] - r[0]) * lerp(kR, A.s, shrink), hy = lerp(ry0 + 400 * (1 - inR), ay, shrink) + (hr[1] - r[1]) * lerp(kR, A.s, shrink), hs = hr[2] * lerp(kR, A.s, shrink);
      if (t >= K.favs + 0.02) { const p = seg(t, K.favs + 0.02, K.favs + 0.3); const e = fxP.next(MK_HEARTFILL); const s2 = 1 + 0.35 * Math.sin(Math.PI * p) * (p < 1 ? 1 : 0);
        Object.assign(e.style, { left: hx + 'px', top: hy + 'px', width: hs + 'px', height: hs + 'px', transform: `scale(${s2 * clamp(p * 4)})`, opacity: 1 - eIn3(shrink), filter: 'drop-shadow(0 0 12px rgba(119,204,219,.9))' }); }
      ring(fxP, hx + hs / 2, hy + hs / 2, K.favs + 0.02, t, 'rgba(63,224,255,.95)', 20, 150, 0.6, 3);
      const c = cursorAt(t, [[SC.bot + 0.2, 1650, 1000], [K.favs - 0.02, rx0 + (hr[0] - r[0] + 22) * kR, ry0 + (hr[1] - r[1] + 22) * kR], [K.favs + 0.35, rx0 + (hr[0] - r[0] + 40) * kR, ry0 + 330]], [K.favs]); if (c) cur = c;
    }
    // b) wide: phone A (Connect Telegram) → the bot → phone B
    const wideIn = eIO3(seg(t, K.sync - 0.05, K.sync + 0.45)), toTh = eIO3(seg(t, SC.themes - 0.05, SC.themes + 0.6));
    if (wideIn > 0) {
      P0.f = lerpObj({ ...A, op: wideIn }, { ...F_STD, X: -700, Y: 580, s: 0.82, ry: 30, blur: 14 }, eIn3(toTh));
      phoneScreen(P0, 'lib');
      const sh = seg(t, K.sync + 0.1, K.sync + 0.55), ls = RECTS.link_sheet;
      if (sh > 0) { crop(P0.vp, 'link', [0, 0, 412, ls[1]], { op: eOut3(sh) }); crop(P0.vp, 'link', [0, ls[1], 412, 892 - ls[1]], { tf: `translateY(${(1 - spring(sh * 0.8, 0.8, 11)) * (892 - ls[1])}px)` }); }
      const bIn = eOutExpo(seg(t, K.bot - 0.45, K.bot + 0.2));
      P1.f = lerpObj({ ...B, X: B.X + 700 * (1 - bIn), op: bIn, blur: 10 * (1 - bIn) }, { ...F_STD, X: 960, Y: 585, s: 0.98, ry: 0, rx: 3 }, toTh);
      if (t < SC.themes + 0.3) phoneScreen(P1, 'lib_scroll');
      const gp = spring(seg(t, K.aarti2 - 0.1, K.bot + 0.4) * 0.8, 0.62, 12), gOut = eIO3(seg(t, SC.themes - 0.05, SC.themes + 0.3));
      const BS = 170, bx = wx(960), by = 560;
      if (gp > 0 && gOut < 1) {
        botc.style.display = 'block';
        Object.assign(botc.style, { width: BS + 'px', height: BS + 'px', left: bx - BS / 2 + 'px', top: by - BS / 2 + 'px', opacity: clamp(gp * 3) * (1 - gOut), transform: `scale(${lerp(0.4, 1, gp) * (1 - 0.4 * gOut) * (1 + 0.08 * Math.exp(-Math.max(0, t - K.bot) * 6) * (t > K.bot ? 1 : 0))})` });
        T('bh', '@aartimusic_bot', { x: bx, y: 705, size: 40, weight: 600, ls: 0, p: seg(t, K.bot - 0.05, K.bot + 0.35), op: 1 - gOut });
        T('bs', 'AartiMusic Bot  ·  Telegram', { x: bx, y: 758, size: 24, weight: 400, ls: 0.04, color: C.mute, p: seg(t, K.bot + 0.1, K.bot + 0.45), op: 1 - gOut });
        ring(fxP, bx, by, K.bot, t, 'rgba(63,224,255,.9)', 85, 200, 0.7, 3);
      }
      const ax2 = A.X + 440 * A.s * 0.45, bx2 = B.X - 440 * B.s * 0.45;
      [[ax2, bx - BS / 2 - 10, K.sync + 0.12], [bx + BS / 2 + 10, bx2, K.telegram + 0.12]].forEach(([x0, x1, t0]) => {
        const p = eOut3(seg(t, t0, t0 + 0.4)); if (p <= 0 || gOut >= 1) return;
        const e = fxP.next(MK_LINE); Object.assign(e.style, { left: x0 + 'px', top: by + 'px', width: (x1 - x0) * p + 'px', transform: '', opacity: 0.85 * (1 - gOut), height: '4px' });
      });
      // the heart makes the journey
      [[K.sync + 0.1, ax2, bx - BS / 2], [K.bot + 0.05, bx + BS / 2, bx2]].forEach(([t0, x0, x1], j) => {
        const p = seg(t, t0, t0 + (j ? 0.6 : 1.4)); if (p <= 0 || p >= 1) return;
        const e = fxP.next(MK_TOKEN); const s = 46 + 12 * Math.sin(p * Math.PI);
        Object.assign(e.style, { left: lerp(x0, x1, eIO3(p)) - s / 2 + 'px', top: by - s / 2 + 'px', width: s + 'px', height: s + 'px', opacity: Math.min(1, Math.sin(p * Math.PI) * 3), filter: 'drop-shadow(0 0 14px rgba(63,224,255,.95))' });
      });
      ring(fxP, B.X, B.Y, K.telegram + 0.72, t, 'rgba(43,217,139,.9)', 220, 400, 0.9, 3);
      const hOut = eIO3(seg(t, SC.themes - 0.25, SC.themes + 0.05));
      KW('sy', [{ s: 'IN', t: W('bot', 'in') }, { s: 'SYNC', t: K.sync, grad: true, hit: true }], { x: 960, y: 140, size: 104, grad: EMER, out: hOut, dyOut: -40 }, t);
    }
    if (shrink < 1) KW('kf', [{ s: 'KEEP', t: K.keep }, { s: 'YOUR', t: W('bot', 'your') }, { s: 'FAVOURITES', t: K.favs, grad: true }], { x: 960, y: 190, size: 96, grad: CYAN, out: eIO3(seg(t, K.sync - 0.2, K.sync + 0.05)), dyOut: -40 }, t);
  }

  // ============ 9. THEMES — one screen, seven palettes, the chooser in orbit
  const fTh = { ...F_STD, X: 960, Y: 585, s: 0.98, ry: 0, rx: 3 };
  if (t >= SC.themes + 0.3 && t < SC.ajay + 0.4) {
    const wipeOut = eIn3(seg(t, SC.ajay - 0.3, SC.ajay + 0.2));
    P1.f = { ...fTh, ry: 4 * Math.sin((t - SC.themes) * 1.5), Y: 585 + 5 * Math.sin(t * 1.3), blur: 18 * wipeOut, op: 1 - wipeOut };
    let i = -1; while (i + 1 < K.wipes.length && t >= K.wipes[i + 1]) i++;
    if (i < 0) phoneScreen(P1, 'home_teal');
    else {
      const a = THEME_SEQ[i], b = THEME_SEQ[i + 1], p = eIO3(seg(t, K.wipes[i], K.wipes[i] + 0.2));
      phoneScreen(P1, 'home_' + a);
      if (p > 0) { full(P1.vp, 'home_' + b, 1, { clip: `circle(${1000 * p}px at 372px 36px)` }); ring(P1.ov, 372, 36, K.wipes[i], t, 'rgba(160,240,255,.9)', 10, 1000, 0.22, 4); if (p > 0.5) P1.status.style.background = TOP['home_' + b]; }
    }
    // the real theme buttons, orbiting in depth
    const btns = RECTS.drawer_themes, order = ['teal', 'indigo', 'green', 'violet', 'neon', 'ruby', 'amber'];
    order.forEach((name, j) => {
      const r = btns[THEME_BTN[name]], p = eOutExpo(seg(t, K.seven - 0.15 + j * 0.05, K.seven + 0.45 + j * 0.05)); if (p <= 0) return;
      const ang = (j / 7) * Math.PI * 2 + (t - SC.themes) * 0.9, rad = 560, x = 960 + Math.cos(ang) * rad * 1.1, z = Math.sin(ang) * 380, y = 835 + Math.sin(ang) * 55;
      const lit = THEME_SEQ[Math.max(0, i + 1)] === name && i >= 0 ? 1 : 0, k = 2.0;
      card(z < 0 ? backP : cardP, 'drawer', r, x - r[2] * k / 2, y - r[3] * k / 2, k, { rad: 22 * k, op: p * (1 - wipeOut) * (z < 0 ? 0.55 : 1),
        tf: `translateZ(${z}px) scale(${lerp(0.5, 1, p)})`, shadow: lit ? '0 0 0 3px rgba(63,224,255,.95), 0 0 40px rgba(63,224,255,.6)' : '0 20px 40px rgba(0,0,0,.45)', filter: z < -150 ? 'blur(2px)' : '' });
    });
    KW('st1', [{ s: 'SEVEN', t: K.seven }], { x: 700, y: 560, align: 'right', size: 70, weight: 700, ls: 0.06, out: wipeOut }, t);
    KW('st2', [{ s: 'THEMES', t: K.themes, grad: true }], { x: 1220, y: 560, align: 'left', size: 70, weight: 700, ls: 0.06, grad: CYAN, out: wipeOut }, t);
  }
  // MAKE IT YOURS, and YOURS becomes the wipe
  if (t >= SC.themes && t < SC.ajay + 0.7) {
    const w = eIn3(seg(t, SC.ajay - 0.35, SC.ajay + 0.25));
    const mi = eIO3(seg(t, SC.ajay - 0.4, SC.ajay - 0.2));
    KW('mk', [{ s: 'MAKE', t: K.make }, { s: 'IT', t: W('themes', 'it') }], { x: 700, y: 410, align: 'right', size: 124, out: mi, dxOut: -60 }, t);
    if (t >= K.yours - 0.05) {
      const p = seg(t, K.yours - 0.04, K.yours + 0.3);
      const yw = measure('YOURS', 150);
      T('yo', 'YOURS', { x: lerp(1220 + yw / 2, 960, w), y: lerp(410, 540, w), size: 150, maxW: 5000, grad: CYAN, nomask: true, op: eOut3(p) * (1 - seg(t, SC.ajay + 0.05, SC.ajay + 0.35)), blur: 12 * (1 - eOutExpo(p)),
        scale: lerp(1.2, 1, eOutExpo(p)) * lerp(1, 22, w), origin: '50% 55%', glow: '0 0 30px rgba(63,224,255,.3)', z: 3 });
    }
    if (w > 0.6) box(fxP, 0, 0, 1920, 1080, `background:#8DEBFF;opacity:${0.5 * eIn3(seg(w, 0.6, 1)) * (1 - seg(t, SC.ajay + 0.1, SC.ajay + 0.45))}`);
  }

  // ============ 10. AJAY — the maker, with his Instagram
  if (t >= SC.ajay && t < SC.end + 0.6) {
    const out = eIO3(seg(t, SC.end - 0.3, SC.end + 0.2));
    T('mw', 'MADE WITH LOVE BY', { x: 960, y: 355, size: 34, weight: 600, ls: 0.42, color: '#9fdcff', p: seg(t, K.made - 0.03, K.made + 0.45), op: 1 - out, dy: -30 * out });
    if (t >= K.ajay - 0.04) {
      const p = seg(t, K.ajay - 0.04, K.ajay + 0.28), tr = eOutExpo(seg(t, K.ajay - 0.04, K.ajay + 0.9));
      T('aj', 'AJAY', { x: 960, y: 510, size: 230, maxW: 5000, grad: 'linear-gradient(100deg,#FFFFFF 0%,#C9F4FF 35%,#3FE0FF 62%,#C9F4FF 85%,#FFFFFF 100%)', nomask: true,
        ls: lerp(-0.06, 0.16, tr), op: eOut3(p) * (1 - out), blur: 16 * (1 - eOutExpo(p)) + 12 * out, scale: lerp(1.12, 1, eOutExpo(p)), shine: 1 - eOut3(seg(t, K.ajay + 0.1, K.ajay + 1.2)),
        glow: `0 0 ${40 + 60 * Math.exp(-(t - K.ajay) * 3)}px rgba(63,224,255,${0.25 + 0.35 * Math.exp(-(t - K.ajay) * 3)})` });
      flash = Math.max(flash, 0.22 * Math.exp(-Math.max(0, t - K.ajay) * 8));
      // the underline draws out from the centre
      const lp = eOutExpo(seg(t, K.ajay + 0.03, K.ajay + 0.5)), lw = 640 * lp;
      if (lp > 0 && t < K.lives - 0.1) { const e = fxP.next(MK_LINE); Object.assign(e.style, { left: 960 - lw / 2 + 'px', top: '640px', width: lw + 'px', transform: '', opacity: 1 - out, height: '3px' }); }
      // Instagram glyph resolves, then the handle slides out of it
      if (t >= K.igIn) {
        const ip = seg(t, K.igIn, K.igIn + 0.35), hp = eOutExpo(seg(t, K.handle, K.handle + 0.45));
        const hw = measure('@h81t6', 50, 600, 0.01), IS = 66, gap = 20, total = IS + gap * hp + hw * hp, x0 = 960 - total / 2;
        Object.assign(ig.style, { display: 'block', left: x0 + 'px', top: 738 - IS / 2 + 'px', width: IS + 'px', height: IS + 'px', opacity: clamp(ip * 3) * (1 - out), transform: `scale(${lerp(0.5, 1, spring(ip * 0.8, 0.55, 14))}) rotate(${lerp(-12, 0, eOutExpo(ip))}deg)` });
        ig.querySelector('.igr').style.strokeDasharray = `${eOut3(clamp(ip * 1.4))} 1`; ig.querySelector('.igc').style.strokeDasharray = `${eOut3(clamp(ip * 1.4 - 0.25))} 1`;
        ig.querySelector('.igd').style.opacity = clamp(ip * 2 - 0.9);
        T('ig', '@h81t6', { x: x0 + IS + gap, y: 740, align: 'left', size: 50, weight: 600, ls: 0.01, color: C.ink, nomask: true, op: hp * (1 - out), dx: -30 * (1 - hp), maxW: 5000 });
      }
      // "who lives through music": the line becomes a live waveform, then the horizon
      const wv = seg(t, K.lives - 0.15, K.lives + 0.35), hz = eIO3(seg(t, SC.end - 0.25, SC.end + 0.35));
      if (wv > 0) {
        wave.style.display = 'block'; wave.style.left = '0px'; wave.style.top = lerp(540, 740, hz) + 'px'; wave.style.opacity = 1;
        const L = lerp(640, 1920, hz), pts = [];
        for (let i = 0; i <= 160; i++) {
          const u = i / 160, x = 960 - L / 2 + u * L, env = Math.sin(Math.PI * u) ** 1.5;
          const amp = 34 * eOut3(wv) * (1 - hz) * env;
          const y = 100 + amp * (Math.sin(u * 38 + t * 9) * 0.6 + Math.sin(u * 91 - t * 13) * 0.4);
          pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        document.getElementById('wp').setAttribute('d', pts.join(' '));
      }
    }
  }

  // ============ 11. END — the horizon, the phone, the brand
  if (t >= SC.end - 0.1) {
    const rise = spring(seg(t, SC.end + 0.1, SC.end + 0.95) * 0.8, 0.78, 9);
    P2.f = { ...F_STD, X: 1330, Y: lerp(1300, 548, rise) + 5 * Math.sin(t * 1.2), s: 0.98, ry: lerp(-30, -14, rise) + 3 * seg(t, SC.end, END), rx: lerp(10, 3, rise), op: clamp(rise * 3) };
    phoneScreen(P2, 'now_playing2');
    const beat = ((t - K.playing) % 0.5) / 0.5, c = RECTS.now_cover; crop(P2.vp, 'now_playing2', [c[0] - 2, c[1] - 2, c[2] + 4, c[3] + 4], { tf: `scale(${1 + 0.008 * Math.exp(-beat * 5)})`, rad: 18 });
    // the horizon glow the phone rises from
    box(fxP, 0, 838, 1920, 3, `background:linear-gradient(90deg,transparent,rgba(127,232,255,.8) 30%,rgba(127,232,255,.8) 70%,transparent);box-shadow:0 0 24px rgba(63,224,255,.6);opacity:${0.7 * seg(t, SC.end, SC.end + 0.3)}`);
    box(fxP, 0, 840, 1920, 240, `background:linear-gradient(rgba(47,123,255,.12),transparent);opacity:${seg(t, SC.end, SC.end + 0.4)}`);
    if (t >= K.endAarti - 0.06) {
      const p = seg(t, K.endAarti - 0.02, K.endAarti + 0.8), IS = 170;
      Object.assign(iconTile.style, { display: 'block', left: 560 - IS / 2 + 'px', top: 330 - IS / 2 + 'px', width: IS + 'px', height: IS + 'px', transform: `scale(${lerp(0.4, 1, spring(p * 0.85, 0.6, 12))})`, opacity: clamp(p * 5),
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.6)) drop-shadow(0 0 36px rgba(63,224,255,.45))' });
      Object.assign(iconGlow.style, { display: 'block', left: 560 - 380 + 'px', top: 330 - 380 + 'px', width: '760px', height: '760px', background: 'radial-gradient(circle, rgba(63,224,255,.22), rgba(47,123,255,.06) 42%, transparent 66%)', opacity: 1 });
      ring(fxP, 560, 330, K.endAarti, t, 'rgba(160,240,255,.85)', 90, 420, 0.8, 3);
      flash = Math.max(flash, 0.3 * Math.exp(-Math.max(0, t - K.endAarti) * 6));
      const wp = seg(t, K.endAarti + 0.05, K.endAarti + 0.7);
      T('ew', 'AARTIMUSIC', { x: 560, y: 535, size: 124, maxW: 860, grad: CYAN, shine: 1 - eOut3(seg(t, K.endMusic, K.endMusic + 1.1)), ls: lerp(0.2, 0.01, eOutExpo(wp)), op: eOut3(seg(t, K.endAarti + 0.04, K.endAarti + 0.3)), blur: 8 * (1 - eOut3(wp)), glow: '0 0 40px rgba(63,224,255,.25)' });
      const line = 'Your daily sound', t0 = K.your - 0.03, t1 = K.sound + 0.34;
      const n = Math.round(line.length * clamp((t - t0) / (t1 - t0)));
      if (t >= t0) {
        const size = 50, wFull = measure(line, size, 500, 0.01), shown = line.slice(0, n), wNow = measure(shown, size, 500, 0.01);
        if (n > 0) T('tag', shown, { x: 560 - wFull / 2, y: 648, align: 'left', size, weight: 500, ls: 0.01, color: C.ink, nomask: true, maxW: 5000 });
        const blink = t < t1 + 0.1 || Math.floor((t - t1) * 2.2) % 2 === 0;
        Object.assign(caret.style, { display: blink ? 'block' : 'none', left: 560 - wFull / 2 + wNow + 8 + 'px', top: 648 - 30 + 'px', height: '60px' });
      }
      T('cap', 'Android app  ·  @aartimusic_bot on Telegram', { x: 560, y: 750, size: 25, weight: 400, ls: 0.05, color: C.mute, p: seg(t, K.sound + 0.3, K.sound + 0.75) });
    }
    fade = eIO3(seg(t, K.fade, END - 1 / FPS));
  }

  // ---------- commit
  if (cur && cur.op > 0.01) { cursor.style.display = 'block'; cursor.style.left = cur.x + 'px'; cursor.style.top = cur.y + 'px'; cursor.style.opacity = cur.op; cursor.style.transform = `scale(${1 - 0.16 * cur.press})`; }
  else cursor.style.display = 'none';
  if (cur && cur.press > 0.3) ring(fxP, cur.x, cur.y, t - 0.001, t, 'rgba(63,224,255,.6)', 8, 10, 0.05, 2);
  PH.forEach((P) => P.end());
  const sw = $('sweep');
  if (sweepX >= 0 && sweepX < 1) { sw.style.display = 'block'; sw.style.transform = `translateX(${lerp(-300, 2500, eIO3(sweepX))}px) rotate(20deg)`; sw.style.opacity = Math.sin(sweepX * Math.PI); } else sw.style.display = 'none';
  $('flash').style.opacity = flash; $('fade').style.opacity = fade;
  $('stage').style.transform = t > K.endAarti ? `scale(${1 + 0.018 * eIO3(seg(t, K.endAarti, END))})` : '';
  for (const k in TX) if (!TX[k].used) TX[k].style.display = 'none';
  cardP.end(); backP.end(); fxP.end(); behindP.end();
};
window.READY = true;
})().catch((e) => { window.READY_ERR = String(e && e.stack || e); });
