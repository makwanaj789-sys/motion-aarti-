// "GPT Astra 6" — fan-made ChatGPT concept promo. 1920×1080 @ 60 fps, one deterministic timeline.
// All motion is computed from frame time; fast moves get true temporal sub-frame sampling (SubframeBlur).
import React from 'react';
import { AbsoluteFill, Audio, Freeze, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { LOGO_PATH } from './logo';

// ------------------------------------------------------------------ constants
export const FPS = 60;
export const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
export const DURATION = 18.2;
const COL = { bg: '#05090B', emerald: '#10B981', cyan: '#67E8F9', ink: '#F4F7F8', mute: 'rgba(244,247,248,0.55)', line: 'rgba(244,247,248,0.14)' };
const em = (a: number) => `rgba(16,185,129,${a.toFixed(3)})`;
const cy = (a: number) => `rgba(103,232,249,${a.toFixed(3)})`;
const SANS = 'Inter', MONO = 'JetBrains Mono';

// ------------------------------------------------------------------ easing
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const bez = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy_ = 3 * y1, by = 3 * (y2 - y1) - cy_, ay = 1 - cy_ - by;
  const X = (u: number) => ((ax * u + bx) * u + cx) * u, Y = (u: number) => ((ay * u + by) * u + cy_) * u, dX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) { const e = X(u) - x, d = dX(u); if (Math.abs(d) < 1e-6) break; u = clamp(u - e / d); }
    return Y(u);
  };
};
const E = {
  cam: bez(0.65, 0, 0.18, 1), // camera: patient start, long settle
  whip: bez(0.75, 0, 0.12, 1), // whip pan: hard acceleration, soft landing
  out: bez(0.16, 1, 0.3, 1), // UI entrances: quick out, no overshoot
  soft: bez(0.4, 0, 0.2, 1), // general
  in: bez(0.55, 0, 0.9, 0.4), // exits
};
const bump = (t: number, a: number, m: number, b: number) => (t <= a || t >= b ? 0 : t < m ? E.soft(seg(t, a, m)) : 1 - E.soft(seg(t, m, b)));

// ------------------------------------------------------------------ fonts
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const faces: [string, string, string][] = [
    [SANS, 'inter-latin-400-normal', '400'], [SANS, 'inter-latin-500-normal', '500'], [SANS, 'inter-latin-600-normal', '600'], [SANS, 'inter-latin-700-normal', '700'],
    [MONO, 'jetbrains-mono-latin-400-normal', '400'], [MONO, 'jetbrains-mono-latin-500-normal', '500'],
  ];
  Promise.all(faces.map(([f, file, w]) => new FontFace(f, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, { weight: w }).load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}
const mctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const textW = (s: string, size: number, weight = 400, family = SANS) => { if (!mctx) return s.length * size * 0.55; mctx.font = `${weight} ${size}px "${family}"`; return mctx.measureText(s).width; };

// ------------------------------------------------------------------ timeline (seconds)
const T = {
  moonGlow: 0.55, logoIn: 0.85, letters: 1.35, sub: 2.25, toUI: 2.95, uiSettle: 4.15,
  type0: 4.3, type1: 5.95, panToPill: 6.0, click: 6.55, menuOpen: 6.6, hi1: 6.95, hi2: 7.2, pick: 7.45, menuClose: 7.85,
  send: 8.1, code0: 8.45, codeEnd: 10.25, morph0: 10.35, morph1: 11.45, toggle: 11.85, words: 12.45,
  reason: 12.55, build: 13.25, understand: 13.95, from: 14.85, to: 15.75, final: 16.6, end: DURATION,
};
const PROMPT = 'Turn this idea into a working dashboard.';
// natural typing: small rhythm variations, longer gaps after spaces and before the last word
const KEYS: number[] = (() => {
  const out: number[] = []; let t = T.type0;
  for (let i = 0; i < PROMPT.length; i++) {
    out.push(t);
    const ch = PROMPT[i];
    t += 0.034 + ((i * 37) % 7) * 0.004 + (ch === ' ' ? 0.03 : 0) + (i === 25 ? 0.08 : 0);
  }
  return out;
})();
const typed = (t: number) => KEYS.filter((k) => t >= k).length;

// windows that get temporal sub-frame sampling (fast camera / object motion)
const FAST: [number, number][] = [[2.9, 3.55], [6.0, 6.5], [8.05, 8.55], [10.35, 11.5], [12.4, 12.75], [13.15, 13.4], [13.85, 14.1], [14.7, 15.0], [15.65, 15.9], [16.45, 16.95]];

// ================================================================== background light
const Lights: React.FC<{ t: number }> = ({ t }) => {
  // three defocused pools; their paths sweep faster around scene changes
  const sweep = (a: number, b: number) => E.soft(seg(t, a, b));
  const p1x = 1500 - 500 * sweep(2.6, 4.2) + 700 * sweep(8.0, 9.2) - 900 * sweep(12.3, 14.5) + 400 * sweep(16.4, 17.6) + 40 * Math.sin(t * 0.7);
  const p1y = 860 - 160 * sweep(8.0, 9.2) + 120 * sweep(12.3, 14.5) - 140 * sweep(16.4, 17.6);
  const p2x = 300 + 300 * sweep(2.6, 4.2) - 150 * sweep(8, 9.2) + 1100 * sweep(12.3, 15.8) - 450 * sweep(16.4, 17.6) + 30 * Math.cos(t * 0.6);
  const p2y = 180 + 120 * Math.sin(t * 0.4) + 200 * sweep(12.3, 15.8);
  const night = 1 - seg(t, 0.6, 1.3);
  const a1 = (0.32 + 0.1 * bump(t, 12.3, 13.4, 16)) * (1 - night * 0.9);
  const a2 = (0.22 + 0.08 * bump(t, 8, 9, 10.5)) * (1 - night * 0.9);
  return (
    <AbsoluteFill style={{ background: COL.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(640px 520px at ${p1x}px ${p1y}px, ${em(a1)}, transparent 70%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(560px 460px at ${p2x}px ${p2y}px, ${cy(a2)}, transparent 70%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 600px at 50% 120%, ${em(0.08)}, transparent 70%)` }} />
      {/* vignette keeps the centre crisp and the edges deep */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)' }} />
    </AbsoluteFill>
  );
};

// ================================================================== 1 · night sky → moon → logo
const STARS = Array.from({ length: 140 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  return { x: r(1) * W, y: r(2) * H * 0.95, s: 0.6 + r(3) * 1.8, p: r(4) * 6.28 };
});
const Night: React.FC<{ t: number }> = ({ t }) => {
  const fade = 1 - E.soft(seg(t, 0.75, 1.25));
  const moonScale = lerp(1, 0.55, E.soft(seg(t, 0.4, 1.05)));
  const glow = bump(t, 0.35, 0.8, 1.2);
  const drift = 18 * t;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, #071419 0%, ${COL.bg} 70%)` }} />
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {STARS.map((s, i) => <circle key={i} cx={s.x - drift * 0.3} cy={s.y} r={s.s} fill="#EAF6FF" opacity={0.35 + 0.35 * Math.sin(t * 3 + s.p)} />)}
      </svg>
      <div style={{ position: 'absolute', left: CX - 120, top: CY - 120, width: 240, height: 240, borderRadius: '50%', transform: `scale(${moonScale})`,
        background: 'radial-gradient(circle at 38% 36%, #FBFDFC 0%, #DCE8E6 48%, #AFC3C1 100%)',
        boxShadow: `0 0 ${60 + 160 * glow}px ${em(0.25 + 0.45 * glow)}, 0 0 ${30 + 60 * glow}px ${cy(0.25 + 0.3 * glow)}` }}>
        {[[70, 80, 26], [140, 120, 18], [100, 160, 14], [160, 70, 10]].map(([x, y, r], i) => <div key={i} style={{ position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: 'rgba(120,150,150,.18)' }} />)}
      </div>
      {/* two soft clouds pass in front: clusters of blurred puffs */}
      {[[CX - 330 + drift, CY + 70, 1, 0.8], [CX + 140 - drift * 0.6, CY - 120, 0.7, 0.65]].map(([x, y, k, o], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: o, filter: 'blur(6px)' }}>
          {[[0, 20, 60], [50, 0, 74], [110, 14, 58], [150, 30, 40], [30, 36, 50], [90, 38, 54]].map(([px, py, r], j) => (
            <div key={j} style={{ position: 'absolute', left: px * k, top: py * k, width: r * k, height: r * k, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, rgba(214,230,236,.95), rgba(150,180,192,.7))' }} />
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ================================================================== logo
const Logo: React.FC<{ size: number; color?: string; glow?: number }> = ({ size, color = COL.ink, glow = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible', filter: glow > 0.01 ? `drop-shadow(0 0 ${(size * 0.12 * glow).toFixed(1)}px ${em(0.55 * glow)}) drop-shadow(0 0 ${(size * 0.05 * glow).toFixed(1)}px ${cy(0.5 * glow)})` : undefined }}>
    <path d={LOGO_PATH} fill={color} fillRule="evenodd" />
  </svg>
);

// ================================================================== 2 · lockup (logo + ChatGPT + GPT Astra 6) → shrinks into the chat header
const WORD = 'ChatGPT';
const Lockup: React.FC<{ t: number }> = ({ t }) => {
  const LOGO = 150, SIZE = 132, GAP = 42;
  const wordW = textW(WORD, SIZE, 600);
  const total = LOGO + GAP + wordW;
  const slide = E.cam(seg(t, T.letters - 0.15, T.letters + 0.75)); // logo moves aside as the word arrives
  const logoX = lerp(CX - LOGO / 2, CX - total / 2, slide);
  const logoIn = E.out(seg(t, T.logoIn, T.logoIn + 0.55));
  const glow = 0.9 * (1 - seg(t, T.logoIn + 0.2, T.logoIn + 1.4)) + 0.25;
  // toUI: the whole lockup scales into the chat header. The logo is the shared anchor: its target is
  // the header logo's position under the UI camera, so the hand-over has no jump.
  const u = E.cam(seg(t, T.toUI, T.toUI + 0.7));
  const c = uiCam(t);
  const lx = logoX + LOGO / 2, ly = CY;
  const ax = lerp(lx, CX + (HEADER_LOGO.x - c.x) * c.z, u), ay = lerp(ly, CY + (HEADER_LOGO.y - c.y) * c.z, u);
  const s = lerp(1, (HEADER_LOGO.size / LOGO) * c.z, u);
  const wordOut = 1 - E.soft(seg(t, T.toUI, T.toUI + 0.35));
  const left0 = CX - total / 2 + LOGO + GAP;
  let x = left0;
  return (
    <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${(ax - s * lx).toFixed(2)}px, ${(ay - s * ly).toFixed(2)}px) scale(${s.toFixed(5)})` }}>
      <div style={{ position: 'absolute', left: logoX, top: CY - LOGO / 2, opacity: logoIn, transform: `scale(${lerp(0.82, 1, logoIn)})`, filter: logoIn < 0.99 ? `blur(${(10 * (1 - logoIn)).toFixed(2)}px)` : undefined }}>
        <Logo size={LOGO} glow={glow} />
      </div>
      <div style={{ opacity: wordOut }}>
        {[...WORD].map((ch, i) => {
          const a = T.letters + i * 0.075;
          const p = E.out(seg(t, a, a + 0.45));
          const left = x; x += textW(ch, SIZE, 600) + (i < WORD.length - 1 ? textW(WORD.slice(i, i + 2), SIZE, 600) - textW(ch, SIZE, 600) - textW(WORD[i + 1], SIZE, 600) : 0);
          return (
            <div key={i} style={{ position: 'absolute', left: left + 26 * (1 - p), top: CY - SIZE * 0.6, fontFamily: SANS, fontWeight: 600, fontSize: SIZE, color: COL.ink, lineHeight: 1.2, letterSpacing: '-0.02em',
              opacity: p, filter: p < 0.99 ? `blur(${(8 * (1 - p)).toFixed(2)}px)` : undefined, textShadow: `0 0 30px ${em(0.25 * p)}` }}>{ch}</div>
          );
        })}
        <div style={{ position: 'absolute', left: left0 + 4, top: CY + 92, fontFamily: SANS, fontWeight: 500, fontSize: 40, letterSpacing: '0.32em', color: COL.cyan,
          opacity: E.out(seg(t, T.sub, T.sub + 0.5)), transform: `translateY(${(14 * (1 - E.out(seg(t, T.sub, T.sub + 0.5)))).toFixed(1)}px)`, textShadow: `0 0 18px ${cy(0.35)}` }}>GPT ASTRA 6</div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 3 · chat UI, one camera through push-in, typing, whip-pan, menu
// UI world coordinates (unscaled layout around the canvas centre)
const BOX = { x: 560, y: 410, w: 800, h: 132 };
const HEADER_LOGO = { x: 746, y: 351, size: 46 };
const PILL = { x: 1150, y: 488, w: 132, h: 38 };
const MENU = { x: 1004, y: 538, w: 300 };
const CHIPS = ['Code', 'Analyze', 'Research', 'Create'];
const OPTIONS: [string, string][] = [['Auto', 'Decides how long to think'], ['Instant', 'Answers right away'], ['GPT Astra 6', 'Thinks deeper on complex work']];

const uiCam = (t: number) => {
  // keyframes: wide → push to the input's left → follow the caret → whip to the model pill → tilt to menu → pull back
  const push = E.cam(seg(t, T.toUI + 0.35, T.uiSettle));
  const follow = E.soft(seg(t, T.type0 + 0.4, T.type1));
  const whip = E.whip(seg(t, T.panToPill, T.panToPill + 0.5));
  const tilt = E.soft(seg(t, T.menuOpen, T.menuOpen + 0.45));
  const back = E.cam(seg(t, T.send, T.send + 0.45));
  let x = lerp(960, 820, push) + 120 * follow;
  let y = lerp(470, 470, push);
  let z = lerp(0.82, 1.55, push) + 0.06 * follow;
  x = lerp(x, PILL.x + 20, whip); z = lerp(z, 1.75, whip);
  y = lerp(y, 560, tilt); z = lerp(z, 1.6, tilt);
  x = lerp(x, 960, back); y = lerp(y, 470, back); z = lerp(z, 0.95, back);
  return { x, y, z };
};

const ChatUI: React.FC<{ t: number }> = ({ t }) => {
  const c = uiCam(t);
  const appear = E.out(seg(t, T.toUI + 0.2, T.toUI + 0.65));
  const focus = 1 - E.soft(seg(t, T.toUI + 0.1, T.toUI + 0.62)); // soft → sharp
  const leave = E.in(seg(t, T.send, T.send + 0.4));
  const n = typed(t);
  const text = PROMPT.slice(0, n);
  const last = n ? KEYS[n - 1] : T.type0;
  const caretOn = t >= T.uiSettle - 0.1 && (t - last < 0.45 || Math.floor((t - last) / 0.5) % 2 === 1) && t < T.send;
  const menu = E.out(seg(t, T.menuOpen, T.menuOpen + 0.3)) * (1 - E.soft(seg(t, T.menuClose, T.menuClose + 0.22)));
  const hiIdx = t < T.hi1 ? -1 : t < T.hi2 ? 0 : t < T.hi1 + 0.5 ? 1 : 2;
  const hiY = (i: number) => MENU.y + 14 + i * 64;
  const hiPos = t < T.hi1 ? hiY(0) : lerp(lerp(hiY(0), hiY(1), E.soft(seg(t, T.hi2 - 0.12, T.hi2 + 0.1))), hiY(2), E.soft(seg(t, T.hi2 + 0.13, T.pick - 0.05)));
  const pickPulse = bump(t, T.pick, T.pick + 0.12, T.pick + 0.45);
  const picked = t >= T.pick + 0.2;
  const ripple = seg(t, T.click, T.click + 0.5);
  const pillLabel = picked ? 'GPT Astra 6' : 'Auto';
  const pillW = picked ? 170 : PILL.w;
  const sendGlow = bump(t, T.send - 0.05, T.send + 0.1, T.send + 0.4);
  return (
    <AbsoluteFill style={{ opacity: appear * (1 - leave), filter: focus > 0.01 ? `blur(${(12 * focus).toFixed(2)}px)` : undefined }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${CX}px, ${CY}px) scale(${c.z}) translate(${-c.x}px, ${-c.y}px) translateY(${-60 * leave}px)` }}>
        {t >= T.toUI + 0.68 && <div style={{ position: 'absolute', left: HEADER_LOGO.x - HEADER_LOGO.size / 2, top: HEADER_LOGO.y - HEADER_LOGO.size / 2 }}><Logo size={HEADER_LOGO.size} glow={0.25} /></div>}
        {/* greeting (the lockup's logo lands left of it) */}
        <div style={{ position: 'absolute', left: 960 - 170, top: 322, fontFamily: SANS, fontWeight: 600, fontSize: 46, color: COL.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
          opacity: E.out(seg(t, T.toUI + 0.35, T.toUI + 0.8)) }}>What will you build?</div>
        {/* input */}
        <div style={{ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, borderRadius: 30, background: 'linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025))',
          boxShadow: `inset 0 0 0 1.5px ${cy(0.22 + 0.25 * sendGlow)}, 0 20px 60px rgba(0,0,0,.45), 0 0 ${40 * sendGlow}px ${em(0.4 * sendGlow)}` }}>
          <div style={{ position: 'absolute', left: 30, top: 26, fontFamily: SANS, fontSize: 25, color: n ? COL.ink : COL.mute, whiteSpace: 'nowrap' }}>
            {n ? text : 'Ask anything'}
            {caretOn && <span style={{ display: 'inline-block', width: 2.5, height: 30, background: COL.cyan, marginLeft: 2, verticalAlign: '-6px', boxShadow: `0 0 8px ${cy(0.7)}` }} />}
          </div>
          <div style={{ position: 'absolute', left: 26, bottom: 18, width: 36, height: 36, borderRadius: 18, boxShadow: `inset 0 0 0 1.5px ${COL.line}`, color: COL.mute, fontFamily: SANS, fontSize: 26, textAlign: 'center', lineHeight: '34px' }}>+</div>
          <div style={{ position: 'absolute', right: 22, bottom: 16, width: 40, height: 40, borderRadius: 20, background: n === PROMPT.length ? COL.ink : 'rgba(244,247,248,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke={COL.bg} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        {/* model pill */}
        <div style={{ position: 'absolute', left: PILL.x + PILL.w - pillW, top: PILL.y, width: pillW, height: PILL.h, borderRadius: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: menu > 0.02 || pickPulse > 0 ? em(0.12 + 0.2 * pickPulse) : 'rgba(255,255,255,.05)', boxShadow: `inset 0 0 0 1.2px ${menu > 0.02 ? em(0.6) : COL.line}`,
          fontFamily: SANS, fontWeight: 500, fontSize: 18, color: picked ? COL.cyan : COL.ink, whiteSpace: 'nowrap' }}>
          {pillLabel}
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: `rotate(${180 * menu}deg)` }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
        </div>
        {ripple > 0 && ripple < 1 && (
          <div style={{ position: 'absolute', left: PILL.x + PILL.w / 2 - 30 - 50 * ripple, top: PILL.y + PILL.h / 2 - 30 - 50 * ripple, width: 60 + 100 * ripple, height: 60 + 100 * ripple, borderRadius: '50%',
            boxShadow: `0 0 0 2px ${cy(0.5 * (1 - ripple))}, 0 0 24px ${em(0.35 * (1 - ripple))}` }} />
        )}
        {/* suggestion chips */}
        <div style={{ position: 'absolute', left: BOX.x, top: BOX.y + BOX.h + 26, width: BOX.w, display: 'flex', justifyContent: 'center', gap: 14 }}>
          {CHIPS.map((c2, i) => {
            const p = E.out(seg(t, T.toUI + 0.5 + i * 0.06, T.toUI + 0.95 + i * 0.06));
            return <div key={c2} style={{ padding: '10px 20px', borderRadius: 22, fontFamily: SANS, fontSize: 18, fontWeight: 500, color: 'rgba(244,247,248,.8)', boxShadow: `inset 0 0 0 1.2px ${COL.line}`,
              background: 'rgba(255,255,255,.03)', opacity: p, transform: `translateY(${(10 * (1 - p)).toFixed(1)}px)` }}>{c2}</div>;
          })}
        </div>
        {/* model menu */}
        {menu > 0.01 && (
          <div style={{ position: 'absolute', left: MENU.x, top: MENU.y, width: MENU.w, padding: '14px 10px', boxSizing: 'border-box', borderRadius: 18, opacity: menu,
            transformOrigin: '80% 0', transform: `translateY(${(-10 * (1 - menu)).toFixed(1)}px) scale(${lerp(0.96, 1, menu)})`,
            background: '#0D1619', boxShadow: `inset 0 0 0 1.2px ${COL.line}, 0 24px 60px rgba(0,0,0,.6)` }}>
            {hiIdx >= 0 && <div style={{ position: 'absolute', left: 10, right: 10, top: hiPos - MENU.y, height: 58, borderRadius: 12, background: em(0.14 + 0.22 * pickPulse), boxShadow: `inset 0 0 0 1px ${em(0.35 + 0.4 * pickPulse)}` }} />}
            {OPTIONS.map(([name, desc], i) => (
              <div key={name} style={{ position: 'relative', height: 64, padding: '8px 14px', boxSizing: 'border-box', fontFamily: SANS }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: i === 2 ? COL.cyan : COL.ink }}>{name}</div>
                <div style={{ fontSize: 14, color: COL.mute, marginTop: 4 }}>{desc}</div>
                {i === 2 && picked && <svg width="18" height="18" viewBox="0 0 24 24" style={{ position: 'absolute', right: 14, top: 22 }}><path d="M5 12.5l4.5 4.5L19 7.5" stroke={COL.emerald} strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 4 · code → dashboard (shared stage, one camera)
const CODE: string[] = [
  'import { Panel, Stat, LineChart } from "./ui";',
  '',
  'const data = [12, 19, 15, 27, 23, 31]; // sample',
  '',
  'function summarize(values) {',
  '  const total = values.reduce((a, b) => a + b, 0);',
  '  const avg = Math.round(total / values.length);',
  '  return { total, avg, peak: Math.max(...values) };',
  '}',
  '',
  'export function Dashboard() {',
  '  const { total, avg, peak } = summarize(data);',
  '  return (',
  '    <Panel title="Weekly overview">',
  '      <Stat label="Total" value={total} />',
  '      <Stat label="Average" value={avg} />',
  '      <Stat label="Peak" value={peak} />',
  '      <LineChart points={data} />',
  '    </Panel>',
  '  );',
  '}',
];
const KW = /\b(import|from|const|function|return|export)\b/g;
const tokenize = (line: string) => {
  // tiny highlighter: strings, numbers, keywords, JSX tags, comments
  const parts: [string, string][] = [];
  const re = /(\/\/.*$)|("[^"]*")|(<\/?[A-Za-z]+)|(\b\d+\b)|(\b(?:import|from|const|function|return|export)\b)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push([line.slice(last, m.index), COL.ink]);
    parts.push([m[0], m[1] ? 'rgba(244,247,248,.42)' : m[2] ? '#A7F3D0' : m[3] ? COL.cyan : m[4] ? '#FCD9A8' : '#6EE7B7']);
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push([line.slice(last), COL.ink]);
  void KW;
  return parts;
};
const DATA = [12, 19, 15, 27, 23, 31];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CodeAndDash: React.FC<{ t: number }> = ({ t }) => {
  const enter = E.out(seg(t, T.code0 - 0.1, T.code0 + 0.45));
  const morph = E.cam(seg(t, T.morph0, T.morph1));
  const exit = E.in(seg(t, T.words - 0.25, T.words + 0.1));
  // camera: slow push on the code, then a lateral move that centres the dashboard
  const camX = lerp(0, -560, morph), camZ = lerp(lerp(1.0, 1.08, E.soft(seg(t, T.code0, T.codeEnd))), 1.0, morph);
  const lineStep = (T.codeEnd - T.code0) / CODE.length;
  const codeX = 230, codeY = 214, LH = 34;
  const dashX = 1150, dashY = 210, DW = 820, DH = 640; // shares the code's top edge (y≈210)
  const dash = E.out(seg(t, T.morph0 + 0.15, T.morph0 + 0.75));
  const codeFade = 1 - E.soft(seg(t, T.morph0 + 0.35, T.morph1));
  const chart = E.soft(seg(t, T.morph0 + 0.45, T.morph1 + 0.3));
  const toggleX = E.soft(seg(t, T.toggle, T.toggle + 0.3));
  const count = (v: number, at: number) => Math.round(v * E.out(seg(t, at, at + 0.6)));
  const max = 35, cw = 720, ch = 250, cx0 = dashX + 50, cy0 = dashY + 330;
  const pts = DATA.map((v, i) => [cx0 + (i * cw) / (DATA.length - 1), cy0 + ch - (v / max) * ch]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const pathLen = 900;
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${camZ}) translate(${camX}px, ${-30 * exit}px)` }}>
        {/* the prompt, now sent */}
        <div style={{ position: 'absolute', right: W - 1660 - (morph * 560), top: 120, padding: '14px 22px', borderRadius: 20, background: 'rgba(255,255,255,.06)', fontFamily: SANS, fontSize: 22, color: COL.ink,
          opacity: E.out(seg(t, T.code0 - 0.1, T.code0 + 0.3)) * codeFade }}>{PROMPT}</div>
        <div style={{ position: 'absolute', left: codeX - 64, top: codeY - 4, opacity: codeFade }}><Logo size={36} glow={0.4} /></div>
        {/* code, revealed line by line; the newest line glows, then cools */}
        <div style={{ position: 'absolute', left: codeX, top: codeY, opacity: codeFade, fontFamily: MONO, fontSize: 23, lineHeight: `${LH}px`, whiteSpace: 'pre', fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }}>
          {CODE.map((line, i) => {
            const a = T.code0 + i * lineStep;
            const p = seg(t, a, a + lineStep * 1.6);
            if (p <= 0) return <div key={i} style={{ height: LH }} />;
            const heat = Math.exp(-Math.max(0, t - a) / 0.35);
            return (
              <div key={i} style={{ height: LH, clipPath: `inset(0 ${(100 * (1 - E.soft(p))).toFixed(2)}% 0 0)`, textShadow: heat > 0.05 ? `0 0 14px ${em(0.8 * heat)}` : undefined }}>
                {tokenize(line).map(([s, c], k) => <span key={k} style={{ color: c }}>{s}</span>)}
              </div>
            );
          })}
        </div>
        {/* the dashboard grows from the code's right edge, sharing its top line */}
        {dash > 0.001 && (
          <div style={{ position: 'absolute', left: dashX, top: dashY, width: DW, height: DH, borderRadius: 26, opacity: dash, transformOrigin: '0 0', transform: `translateX(${(-60 * (1 - dash)).toFixed(1)}px) scale(${lerp(0.96, 1, dash)})`,
            background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025))', boxShadow: `inset 0 0 0 1.2px ${COL.line}, 0 30px 80px rgba(0,0,0,.5)` }}>
            <div style={{ position: 'absolute', left: 40, top: 32, fontFamily: SANS, fontWeight: 600, fontSize: 28, color: COL.ink }}>Weekly overview</div>
            <div style={{ position: 'absolute', left: 40, top: 72, fontFamily: SANS, fontSize: 15, color: COL.mute }}>Sample data · illustration only</div>
            {/* segmented control */}
            <div style={{ position: 'absolute', right: 36, top: 34, width: 300, height: 42, borderRadius: 21, background: 'rgba(255,255,255,.05)', boxShadow: `inset 0 0 0 1px ${COL.line}` }}>
              <div style={{ position: 'absolute', top: 4, left: 4 + 98 * toggleX, width: 96, height: 34, borderRadius: 17, background: em(0.28), boxShadow: `inset 0 0 0 1px ${em(0.6)}` }} />
              {['Week', 'Month', 'Year'].map((l, i) => <div key={l} style={{ position: 'absolute', left: 4 + i * 98, width: 96, top: 0, lineHeight: '42px', textAlign: 'center', fontFamily: SANS, fontSize: 16, fontWeight: 500, color: i === Math.round(toggleX) ? COL.ink : COL.mute }}>{l}</div>)}
            </div>
            {/* summary cards */}
            {[['Total', count(127, T.morph0 + 0.35)], ['Average', count(21, T.morph0 + 0.45)], ['Peak', count(31, T.morph0 + 0.55)]].map(([l, v], i) => {
              const p = E.out(seg(t, T.morph0 + 0.3 + i * 0.08, T.morph0 + 0.75 + i * 0.08));
              return (
                <div key={l as string} style={{ position: 'absolute', left: 40 + i * 252, top: 116, width: 232, height: 104, borderRadius: 18, background: 'rgba(255,255,255,.04)', boxShadow: `inset 0 0 0 1px ${COL.line}`,
                  opacity: p, transform: `translateY(${(12 * (1 - p)).toFixed(1)}px)` }}>
                  <div style={{ position: 'absolute', left: 20, top: 16, fontFamily: SANS, fontSize: 15, color: COL.mute }}>{l}</div>
                  <div style={{ position: 'absolute', left: 20, top: 42, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: i === 0 ? COL.cyan : COL.ink }}>{v}</div>
                </div>
              );
            })}
          </div>
        )}
        {dash > 0.001 && (
          <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: dash, transform: `translateX(${(-60 * (1 - dash)).toFixed(1)}px)` }}>
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={COL.emerald} stopOpacity="0.32" /><stop offset="1" stopColor={COL.emerald} stopOpacity="0" /></linearGradient>
            </defs>
            {[0, 1, 2, 3].map((k) => <line key={k} x1={cx0} x2={cx0 + cw} y1={cy0 + (k * ch) / 3} y2={cy0 + (k * ch) / 3} stroke="rgba(244,247,248,.08)" />)}
            <path d={`${path} L${cx0 + cw} ${cy0 + ch} L${cx0} ${cy0 + ch} Z`} fill="url(#area)" opacity={chart} />
            <path d={path} fill="none" stroke={COL.emerald} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - chart)} style={{ filter: `drop-shadow(0 0 6px ${em(0.6)})` }} />
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill={COL.bg} stroke={COL.cyan} strokeWidth={3} opacity={clamp(chart * 6 - i)} />)}
            {DAYS.map((d, i) => <text key={d} x={cx0 + (i * cw) / 5} y={cy0 + ch + 34} textAnchor="middle" fontFamily={SANS} fontSize={15} fill="rgba(244,247,248,.5)">{d}</text>)}
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 5 · capability typography
const Phrase: React.FC<{ t: number; text: string; at: number; out: number; size: number; weight?: number; color?: string; dy?: number }> = ({ t, text, at, out, size, weight = 700, color = COL.ink, dy = 0 }) => {
  const i = E.out(seg(t, at, at + 0.38));
  const o = E.in(seg(t, out - 0.16, out + 0.12));
  if (i <= 0 || o >= 1) return null;
  const s = lerp(1.08, 1, i) * lerp(1, 0.94, o);
  const blur = 10 * (1 - i) + 10 * o;
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: SANS, fontWeight: weight, fontSize: size, color, letterSpacing: '-0.03em', whiteSpace: 'nowrap', opacity: i * (1 - o),
        transform: `translateY(${dy}px) scale(${s})`, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined, textShadow: `0 0 40px ${em(0.22)}` }}>{text}</div>
    </AbsoluteFill>
  );
};
const Words: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Phrase t={t} text="Reason." at={T.reason} out={T.build} size={210} />
    <Phrase t={t} text="Build." at={T.build} out={T.understand} size={250} color={COL.cyan} />
    <Phrase t={t} text="Understand." at={T.understand} out={T.from - 0.05} size={190} />
    <Phrase t={t} text="From complex ideas." at={T.from} out={T.to} size={112} weight={600} />
    <Phrase t={t} text="To clear next steps." at={T.to} out={T.final} size={112} weight={600} color="#A7F3D0" />
  </>
);

// ================================================================== 6 · final resolve
const Final: React.FC<{ t: number }> = ({ t }) => {
  const l = E.out(seg(t, T.final, T.final + 0.6));
  const glow = 0.3 + 0.8 * bump(t, T.final, T.final + 0.35, T.final + 1.3);
  const line = E.out(seg(t, T.final + 0.35, T.final + 0.85));
  const sub = E.out(seg(t, T.final + 0.6, T.final + 1.05));
  const tag = E.out(seg(t, T.final + 0.8, T.final + 1.2));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: CX - 70, top: 300, opacity: l, transform: `scale(${lerp(1.25, 1, l)})`, filter: l < 0.99 ? `blur(${(14 * (1 - l)).toFixed(2)}px)` : undefined }}>
        <Logo size={140} glow={glow} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: W, top: 494, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 70, letterSpacing: '-0.02em', color: COL.ink,
        opacity: line, transform: `translateY(${(16 * (1 - line)).toFixed(1)}px)`, filter: line < 0.99 ? `blur(${(6 * (1 - line)).toFixed(2)}px)` : undefined }}>Think deeper. Create more.</div>
      <div style={{ position: 'absolute', left: 0, width: W, top: 596, textAlign: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 30, letterSpacing: '0.3em', color: COL.cyan,
        opacity: sub, textShadow: `0 0 16px ${cy(0.35)}` }}>GPT ASTRA 6</div>
      <div style={{ position: 'absolute', left: 0, width: W, bottom: 52, textAlign: 'center', fontFamily: SANS, fontSize: 18, letterSpacing: '0.12em', color: 'rgba(244,247,248,.5)', opacity: tag }}>
        FAN-MADE CONCEPT · NOT AFFILIATED WITH OPENAI
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== the frame
const Frame: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      {t < 1.3 && <Night t={t} />}
      {t >= T.logoIn && t < T.toUI + 0.75 && <Lockup t={t} />}
      {t >= T.toUI && t < T.send + 0.45 && <ChatUI t={t} />}
      {t >= T.code0 - 0.12 && t < T.words + 0.12 && <CodeAndDash t={t} />}
      {t >= T.reason && t < T.final + 0.15 && <Words t={t} />}
      {t >= T.final && <Final t={t} />}
      {t < 1.6 && <div style={{ position: 'absolute', right: 40, bottom: 32, fontFamily: SANS, fontSize: 16, letterSpacing: '0.12em', color: 'rgba(244,247,248,.42)', opacity: 1 - seg(t, 1.2, 1.6) }}>FAN-MADE CONCEPT</div>}
    </AbsoluteFill>
  );
};
// temporal sub-frame sampling, centred on the frame so switching it on/off never shifts time
const SubframeBlur: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const fast = FAST.some(([a, b]) => t >= a && t <= b);
  if (!fast) return <>{children}</>;
  const n = 8, shutter = 0.5; // 180° at 60 fps
  return (
    <AbsoluteFill style={{ isolation: 'isolate' }}>
      {Array.from({ length: n }, (_, i) => (
        <AbsoluteFill key={i} style={{ mixBlendMode: 'plus-lighter', filter: `opacity(${1 / n})` }}>
          <Freeze frame={f + (i / (n - 1) - 0.5) * shutter}>{children}</Freeze>
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

const Background: React.FC = () => <Lights t={useCurrentFrame() / FPS} />;
export const AstraPromo: React.FC = () => (
  <AbsoluteFill style={{ background: COL.bg }}>
    <Audio src={staticFile('audio/score.wav')} />
    <Background />
    <SubframeBlur><Frame /></SubframeBlur>
  </AbsoluteFill>
);
