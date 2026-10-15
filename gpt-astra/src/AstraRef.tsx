// GPT Astra 6 — fan-made ChatGPT concept, rebuilt on the reference's soundtrack and choreography.
// 1920×1080, native 60 fps. Every cue below is a measured accent of public/audio/reference.wav
// (onsets: 0.84 1.33 1.88 2.15 2.43 3.10 3.51 4.06 4.33 4.88 5.28 5.69 6.24 6.52 7.06 8.43 8.70 9.24 10.06 10.71 10.88 11.84).
import React from 'react';
import { AbsoluteFill, Audio, Freeze, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { LOGO_PATH } from './logo';

export const FPS = 60;
export const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
export const DURATION = 14.0;

const C = { bg: '#05090B', em: '#10B981', cy: '#67E8F9', ink: '#F4F7F8', mute: 'rgba(244,247,248,.5)', line: 'rgba(244,247,248,.16)' };
const em = (a: number) => `rgba(16,185,129,${clamp(a).toFixed(3)})`;
const cyA = (a: number) => `rgba(103,232,249,${clamp(a).toFixed(3)})`;
const SERIF = 'Fraunces', SANS = 'Inter', MONO = 'JetBrains Mono';

// ------------------------------------------------------------------ maths & easing
function clamp(x: number, a = 0, b = 1) { return Math.min(b, Math.max(a, x)); }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const bez = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, c_ = 3 * y1, by = 3 * (y2 - y1) - c_, ay = 1 - c_ - by;
  const X = (u: number) => ((ax * u + bx) * u + cx) * u, Y = (u: number) => ((ay * u + by) * u + c_) * u, dX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; let u = x; for (let i = 0; i < 8; i++) { const d = dX(u); if (Math.abs(d) < 1e-6) break; u = clamp(u - (X(u) - x) / d); } return Y(u); };
};
const E = {
  push: bez(0.45, 0, 0.25, 1), // slow camera drift / push
  whip: bez(0.8, 0, 0.1, 1), // whip: violent start, long soft landing
  out: bez(0.16, 1, 0.3, 1), // element arrival
  soft: bez(0.42, 0, 0.58, 1),
  in: bez(0.6, 0, 0.9, 0.35), // exit
};
// Catmull-Rom spline through [time, value] keys: continuous velocity through every key
function spline(t: number, keys: [number, number][], ease?: (x: number) => number): number {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (t > keys[i + 1][0]) i++;
  const [t0, v0] = keys[i], [t1, v1] = keys[i + 1], h = t1 - t0;
  let u = (t - t0) / h; if (ease) u = ease(u);
  const sl = (k: number) => (k <= 0 || k >= n - 1 ? 0 : (keys[k + 1][1] - keys[k - 1][1]) / (keys[k + 1][0] - keys[k - 1][0]));
  const m0 = sl(i) * h, m1 = sl(i + 1) * h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1;
}
const bump = (t: number, a: number, m: number, b: number) => (t <= a || t >= b ? 0 : t < m ? E.soft(seg(t, a, m)) : 1 - E.soft(seg(t, m, b)));

// ------------------------------------------------------------------ fonts
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const faces: [string, string, string][] = [
    [SERIF, 'fraunces-latin-300-normal', '300'], [SERIF, 'fraunces-latin-400-normal', '400'], [SERIF, 'fraunces-latin-500-normal', '500'],
    [SANS, 'inter-latin-400-normal', '400'], [SANS, 'inter-latin-500-normal', '500'], [SANS, 'inter-latin-600-normal', '600'],
    [MONO, 'jetbrains-mono-latin-400-normal', '400'],
  ];
  Promise.all(faces.map(([f, file, w]) => new FontFace(f, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, { weight: w }).load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}
const mctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const textW = (s: string, size: number, weight = 400, family = SANS) => { if (!mctx) return s.length * size * 0.55; mctx.font = `${weight} ${size}px "${family}"`; return mctx.measureText(s).width; };

// ------------------------------------------------------------------ cues (seconds), from the reference's accents
const T = {
  logo: 0.84, letters: 1.33, push: 1.88, flyOut: 2.15, ui: 2.33, uiPush: 2.43, whipIn: 3.18, type0: 3.48, typeEnd: 4.0,
  panRight: 4.04, pillSettle: 4.33, click: 4.86, menu: 4.9, ring: 4.95, sel1: 5.28, sel2: 5.69, sel3: 5.95, sel4: 6.1, pick: 6.24,
  close: 6.55, uiOut: 6.88, code0: 7.06, codeEnd: 8.3, pull: 8.3, writing: 8.66, analysis: 9.24, coding: 10.06, research: 10.66,
  resHold: 10.88, logoFlash: 11.8, settle: 12.75, end: DURATION,
};
const PROMPT = 'Help me build a dashboard';
const KEYS = Array.from({ length: PROMPT.length }, (_, i) => T.type0 + (i / PROMPT.length) * (T.typeEnd - T.type0) + ((i * 37) % 5) * 0.003);
const typedN = (t: number) => KEYS.filter((k) => t >= k).length;
// windows rendered with temporal sub-frame sampling (fast camera/object motion only)
const FAST: [number, number][] = [[2.05, 2.5], [3.15, 3.55], [4.0, 4.42], [8.28, 8.62], [10.6, 10.98], [11.55, 11.95]];

// ================================================================== light: localized edge glows (the reference's warm light, here emerald / cyan)
const Light: React.FC<{ t: number }> = ({ t }) => {
  // key positions follow the reference: bottom-centre under the lockup → right edge for the UI → right edge strip for code →
  // opposite corners (bottom-left / top-right) for the words → gone for the final logo
  const ax = spline(t, [[0, 1100], [1.2, 1050], [2.3, 1300], [3.3, 1700], [5, 1880], [7, 2050], [8.6, 2000], [10, 120], [11.6, 60], [12.4, 400]], E.soft);
  const ay = spline(t, [[0, 1150], [1.2, 1000], [2.3, 980], [3.3, 600], [5, 300], [7, 500], [8.6, 500], [10, 960], [11.6, 1000], [12.4, 1200]], E.soft);
  const aA = spline(t, [[0, 0], [0.8, 0], [1.2, 0.55], [2.3, 0.5], [3.3, 0.45], [6.8, 0.42], [7.1, 0.25], [7.6, 0.5], [8.6, 0.5], [10, 0.55], [11.6, 0.5], [12.1, 0.12], [13, 0.05]]);
  const bx = spline(t, [[0, 1500], [2.3, 1500], [7, 300], [8.6, 200], [10, 1820], [11.6, 1900]], E.soft);
  const by = spline(t, [[0, -100], [2.3, -50], [7, -120], [8.6, 0], [10, 80], [11.6, 60]], E.soft);
  const bA = spline(t, [[0, 0], [2.0, 0], [2.6, 0.18], [6.8, 0.2], [8.6, 0.16], [10, 0.38], [11.6, 0.34], [12.1, 0.06], [13, 0.02]]);
  const breathe = 1 + 0.06 * Math.sin(t * 1.7);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(${720 * breathe}px ${900 * breathe}px at ${ax}px ${ay}px, ${em(aA * 0.9)} 0%, ${em(aA * 0.42)} 30%, ${em(aA * 0.12)} 62%, transparent 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(680px 800px at ${bx}px ${by}px, ${cyA(bA * 0.7)} 0%, ${em(bA * 0.42)} 32%, ${em(bA * 0.1)} 62%, transparent 100%)` }} />
    </AbsoluteFill>
  );
};

// ================================================================== logo
const Logo: React.FC<{ size: number; glow?: number; color?: string }> = ({ size, glow = 0, color = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible',
    filter: glow > 0.01 ? `drop-shadow(0 0 ${(size * 0.05 * glow).toFixed(1)}px ${em(0.9 * glow)}) drop-shadow(0 0 ${(size * 0.16 * glow).toFixed(1)}px ${em(0.55 * glow)}) drop-shadow(0 0 ${(size * 0.3 * glow).toFixed(1)}px ${cyA(0.3 * glow)})` : undefined }}>
    <path d={LOGO_PATH} fill={color} fillRule="evenodd" />
  </svg>
);

// ================================================================== 1 · night sky, moon flares into the logo (0 – 0.95)
const STARS = Array.from({ length: 170 }, (_, i) => { const r = (n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); }; return { x: r(1) * W, y: r(2) * H, s: 0.5 + r(3) * 1.6, p: r(4) * 6.3 }; });
const Night: React.FC<{ t: number }> = ({ t }) => {
  const fade = 1 - E.soft(seg(t, 0.78, 1.0));
  const glow = E.soft(seg(t, 0.45, 0.8));
  const moonR = lerp(172, 150, E.soft(seg(t, 0.3, 0.8)));
  const mx = 930 + 40 * t, my = 500;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0B1A24 0%, #08121A 60%, #060C10 100%)' }} />
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {STARS.map((s, i) => <circle key={i} cx={s.x - 30 * t} cy={s.y} r={s.s} fill="#E8F4FF" opacity={0.3 + 0.35 * Math.sin(t * 4 + s.p)} />)}
      </svg>
      <div style={{ position: 'absolute', left: mx - moonR, top: my - moonR, width: 2 * moonR, height: 2 * moonR, borderRadius: '50%',
        background: `radial-gradient(circle at 40% 38%, #FFFFFF 0%, ${glow > 0.5 ? '#E3FFF4' : '#E9EEF0'} 45%, #B7C5C8 100%)`,
        boxShadow: `0 0 ${30 + 220 * glow}px ${em(0.15 + 0.7 * glow)}, 0 0 ${20 + 90 * glow}px ${cyA(0.2 + 0.5 * glow)}` }}>
        {[[70, 70, 22], [130, 110, 15], [90, 150, 12]].map(([x, y, r], i) => <div key={i} style={{ position: 'absolute', left: (x / 236) * 2 * moonR - r, top: (y / 236) * 2 * moonR - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: 'rgba(110,140,145,.2)', opacity: 1 - glow }} />)}
      </div>
      {[[mx - 400 + 60 * t, my + 90, 1.6], [mx + 200 - 30 * t, my - 160, 1.1]].map(([x, y, k], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, filter: 'blur(3px)', opacity: 0.92 - 0.5 * glow }}>
          {[[0, 26, 64], [46, 0, 82], [112, 12, 66], [160, 34, 46], [28, 44, 58], [96, 44, 62], [138, 50, 44]].map(([px, py, r], j) => (
            <div key={j} style={{ position: 'absolute', left: px * k, top: py * k, width: r * k, height: r * k, borderRadius: '50%', background: 'radial-gradient(circle at 40% 30%, #EAF2F5 0%, #9FB4BF 100%)' }} />
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ================================================================== 2 · logo + ChatGPT wordmark (0.84 – 2.33)
const WORD = 'ChatGPT';
const Brand: React.FC<{ t: number }> = ({ t }) => {
  const LOGO = 330, SIZE = 270, GAP = 70;
  const ww = textW(WORD, SIZE, 400, SERIF);
  const total = LOGO + GAP + ww;
  const logoIn = E.out(seg(t, T.logo - 0.05, T.logo + 0.45));
  const slide = E.push(seg(t, T.logo + 0.12, T.letters + 0.02));
  const logoX = lerp(CX - LOGO / 2, CX - total / 2, slide);
  const flash = bump(t, T.logo - 0.06, T.logo + 0.08, T.logo + 0.9);
  // camera on the lockup: gentle push from 1.88, then it lifts away up-left on 2.15 as the UI arrives
  const push = E.push(seg(t, T.push, T.flyOut + 0.05));
  const fly = E.in(seg(t, T.flyOut, T.ui + 0.06));
  const s = lerp(1, 1.07, push) * lerp(1, 1.35, fly);
  const dx = 130 * push - 900 * fly, dy = -70 * push - 520 * fly;
  const op = 1 - E.soft(seg(t, T.flyOut + 0.05, T.ui + 0.06));
  let x = CX - total / 2 + LOGO + GAP;
  return (
    <AbsoluteFill style={{ opacity: op, transformOrigin: `${CX}px ${CY}px`, transform: `translate(${dx}px, ${dy}px) scale(${s})` }}>
      <div style={{ position: 'absolute', left: logoX, top: CY - LOGO / 2 - 10, opacity: logoIn, transform: `scale(${lerp(0.7, 1, logoIn)})`, filter: logoIn < 0.99 ? `blur(${(14 * (1 - logoIn)).toFixed(1)}px)` : undefined }}>
        <Logo size={LOGO} glow={0.35 + 1.2 * flash} />
      </div>
      {[...WORD].map((ch, i) => {
        const a = T.letters + i * 0.07;
        const p = E.out(seg(t, a, a + 0.42));
        const left = x; x += textW(WORD.slice(0, i + 1), SIZE, 400, SERIF) - textW(WORD.slice(0, i), SIZE, 400, SERIF);
        return (
          <div key={i} style={{ position: 'absolute', left: left + 34 * (1 - p), top: CY - SIZE * 0.66, fontFamily: SERIF, fontWeight: 400, fontSize: SIZE, lineHeight: 1.2, color: C.ink, letterSpacing: '-0.015em',
            opacity: p, filter: p < 0.99 ? `blur(${(10 * (1 - p)).toFixed(1)}px)` : undefined, textShadow: `0 0 ${18 + 30 * (1 - p)}px ${em(0.35 * p + 0.3 * (1 - p))}` }}>{ch}</div>
        );
      })}
    </AbsoluteFill>
  );
};

// ================================================================== 3 · chat UI under one camera (2.33 – 7.0)
// world layout measured from the reference at 2.4 s (camera z = 1)
const BOX = { x: 372, y: 612, w: 1176, h: 214 };
const GREET = { y: 505 };
const PILL = { x: 1268, y: 760, w: 150, h: 42 };
const MENU = { x: 1150, y: 818, w: 320 };
const MODELS: [string, string, boolean][] = [
  ['GPT-6', 'Latest model', false], ['GPT-6 Pro', 'Pro reasoning', false], ['GPT-5.6 Sol', 'Earlier model', false], ['GPT-5.6 Luna', 'Free and Go default', false],
  ['GPT Astra 6', 'Concept', true],
];
const ITEM_H = 44;
const itemY = (i: number) => MENU.y + 12 + i * ITEM_H + (i >= 4 ? 13 : 0);
const CHIPS = ['Code', 'Analyze', 'Research', 'Create', 'Learn'];

const cam = (t: number) => {
  // measured: 2.4 z=1 (box ≈61% of width) → 3.0 slight push → 3.4 whip in to z≈1.6 on the input's left → 3.9 hold →
  // 4.06–4.33 whip right to the model pill → 4.9 closer (z≈1.9) → 5.2 tilt down to read the menu → 6.9 drift
  const x = spline(t, [[T.ui, 960], [T.whipIn, 965], [T.whipIn + 0.32, 640], [T.panRight, 690], [T.pillSettle + 0.05, 1230], [T.menu, 1330], [5.3, 1350], [6.9, 1330]]);
  const y = spline(t, [[T.ui, 690], [T.whipIn, 700], [T.whipIn + 0.32, 712], [T.panRight, 716], [T.pillSettle + 0.05, 742], [T.menu, 790], [5.3, 945], [6.6, 952], [6.9, 900]]);
  const z = spline(t, [[T.ui, 1.0], [T.whipIn, 1.05], [T.whipIn + 0.32, 1.6], [T.panRight, 1.63], [T.pillSettle + 0.05, 1.72], [T.menu, 1.9], [5.3, 1.86], [6.9, 1.82]]);
  return { x, y, z };
};
// the whip windows use a sharper profile than the spline alone
const camAt = (t: number) => {
  const c = cam(t);
  const w1 = E.whip(seg(t, T.whipIn, T.whipIn + 0.32)), w2 = E.whip(seg(t, T.panRight, T.pillSettle + 0.05));
  const a = cam(T.whipIn), b = cam(T.whipIn + 0.32), p = cam(T.panRight), q = cam(T.pillSettle + 0.05);
  if (t > T.whipIn && t < T.whipIn + 0.32) return { x: lerp(a.x, b.x, w1), y: lerp(a.y, b.y, w1), z: lerp(a.z, b.z, w1) };
  if (t > T.panRight && t < T.pillSettle + 0.05) return { x: lerp(p.x, q.x, w2), y: lerp(p.y, q.y, w2), z: lerp(p.z, q.z, w2) };
  return c;
};
const toScreen = (t: number, wx: number, wy: number) => { const c = camAt(t); return [CX + (wx - c.x) * c.z, CY + (wy - c.y) * c.z]; };

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 6, top: y - 3, transform: `scale(${1 - 0.12 * press})`, transformOrigin: '6px 3px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.6))' }}>
    <path d="M5 2.5l13.5 9.2-6.1 1.2 3.6 6.8-2.6 1.4-3.6-6.9-4.8 4.1z" fill="#fff" stroke="#0B1013" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const ChatUI: React.FC<{ t: number }> = ({ t }) => {
  const c = camAt(t);
  const inP = E.out(seg(t, T.ui - 0.1, T.ui + 0.1));
  const focus = 1 - E.soft(seg(t, T.ui - 0.1, T.ui + 0.1)); // soft → sharp as the camera arrives
  const out = E.in(seg(t, T.uiOut, T.code0 + 0.06));
  const n = typedN(t), last = n ? KEYS[n - 1] : T.type0;
  const caret = t > T.ui + 0.3 && t < T.uiOut && (t - last < 0.35 || Math.floor((t - last) / 0.45) % 2 === 1);
  const menuP = E.out(seg(t, T.menu, T.menu + 0.22)) * (1 - E.soft(seg(t, T.close, T.close + 0.2)));
  const ring = seg(t, T.ring, T.ring + 0.42);
  const sel = t < T.sel1 ? 0 : t < T.sel2 ? 1 : t < T.sel3 ? 2 : t < T.sel4 ? 3 : 4;
  const hiY = spline(t, [[T.menu, itemY(0)], [T.sel1 - 0.06, itemY(0)], [T.sel1 + 0.1, itemY(1)], [T.sel2 - 0.06, itemY(1)], [T.sel2 + 0.1, itemY(2)], [T.sel3 - 0.04, itemY(2)], [T.sel3 + 0.07, itemY(3)], [T.sel4 - 0.02, itemY(3)], [T.sel4 + 0.09, itemY(4)]]);
  const pickP = bump(t, T.pick, T.pick + 0.1, T.pick + 0.42);
  const picked = t >= T.pick + 0.12;
  // the cursor: arrives at the pill, clicks, then glides through the entries
  const curX = spline(t, [[4.45, PILL.x + 210], [T.click - 0.02, PILL.x + 95], [T.menu + 0.25, PILL.x + 90], [T.sel1, MENU.x + 210], [T.sel2, MENU.x + 222], [T.sel3, MENU.x + 214], [T.sel4 + 0.05, MENU.x + 206], [T.close + 0.1, MENU.x + 206], [6.85, PILL.x + 120]], E.soft);
  const curY = spline(t, [[4.45, PILL.y + 120], [T.click - 0.02, PILL.y + 24], [T.menu + 0.25, PILL.y + 30], [T.sel1, itemY(1) + 22], [T.sel2, itemY(2) + 22], [T.sel3, itemY(3) + 22], [T.sel4 + 0.05, itemY(4) + 22], [T.close + 0.1, itemY(4) + 22], [6.85, PILL.y + 34]], E.soft);
  const curOp = E.soft(seg(t, 4.4, 4.6)) * (1 - E.soft(seg(t, T.uiOut - 0.05, T.uiOut + 0.1)));
  const press = bump(t, T.click - 0.04, T.click + 0.03, T.click + 0.14) + bump(t, T.pick - 0.04, T.pick + 0.03, T.pick + 0.14);
  const label = picked ? 'GPT Astra 6' : 'GPT-6';
  const pillW = picked ? 178 : PILL.w;
  return (
    <AbsoluteFill style={{ opacity: inP * (1 - out), filter: focus > 0.01 ? `blur(${(9 * focus).toFixed(1)}px)` : undefined }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${CX}px, ${CY}px) scale(${c.z}) translate(${-c.x}px, ${-c.y}px)` }}>
        {/* greeting: refined display serif with the mark */}
        <div style={{ position: 'absolute', left: 0, width: W, top: GREET.y - 50, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
          <Logo size={62} glow={0.35} />
          <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 84, color: C.ink, letterSpacing: '-0.01em', textShadow: `0 0 26px ${em(0.22)}` }}>What will you build?</div>
        </div>
        {/* input */}
        <div style={{ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, borderRadius: 34,
          background: 'linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012))',
          boxShadow: `inset 0 0 0 1.6px rgba(167,243,208,.26), 0 0 30px ${em(0.08)}` }}>
          <div style={{ position: 'absolute', left: 40, top: 40, fontFamily: SANS, fontSize: 34, color: n ? C.ink : C.mute, whiteSpace: 'nowrap', textShadow: n ? `0 0 14px ${em(0.15)}` : undefined }}>
            {n ? PROMPT.slice(0, n) : 'Ask anything'}
            {caret && <span style={{ display: 'inline-block', width: 3, height: 40, marginLeft: 3, background: C.cy, verticalAlign: '-7px', boxShadow: `0 0 10px ${cyA(0.8)}` }} />}
          </div>
          <div style={{ position: 'absolute', left: 34, bottom: 30, color: C.mute, fontFamily: SANS, fontSize: 40, lineHeight: 1 }}>+</div>
          {/* voice glyph */}
          <svg width="40" height="40" viewBox="0 0 24 24" style={{ position: 'absolute', right: 32, bottom: 28 }}>
            {[5, 8.5, 12, 15.5, 19].map((x, i) => <line key={i} x1={x} x2={x} y1={12 - [3, 6, 8, 5, 3][i]} y2={12 + [3, 6, 8, 5, 3][i]} stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />)}
          </svg>
        </div>
        {/* model selector */}
        <div style={{ position: 'absolute', left: PILL.x + PILL.w - pillW, top: PILL.y, width: pillW, height: PILL.h, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: menuP > 0.02 || pickP > 0 ? em(0.16 + 0.25 * pickP) : 'transparent', boxShadow: menuP > 0.02 ? `inset 0 0 0 1.2px ${em(0.7)}, 0 0 18px ${em(0.35)}` : 'none',
          fontFamily: SANS, fontSize: 24, fontWeight: 500, color: picked ? C.cy : 'rgba(244,247,248,.78)', whiteSpace: 'nowrap', textShadow: picked ? `0 0 12px ${cyA(0.5)}` : undefined }}>
          {label}
          <svg width="14" height="14" viewBox="0 0 12 12" style={{ transform: `rotate(${180 * menuP}deg)` }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
        </div>
        {/* chips */}
        <div style={{ position: 'absolute', left: BOX.x, width: BOX.w, top: BOX.y + BOX.h + 32, display: 'flex', justifyContent: 'center', gap: 16 }}>
          {CHIPS.map((ch, i) => {
            const p = E.out(seg(t, T.ui + 0.12 + i * 0.05, T.ui + 0.5 + i * 0.05));
            return <div key={ch} style={{ padding: '10px 22px', borderRadius: 14, fontFamily: SANS, fontSize: 24, color: 'rgba(244,247,248,.82)', boxShadow: `inset 0 0 0 1.4px rgba(167,243,208,.22)`,
              opacity: p, transform: `translateY(${(14 * (1 - p)).toFixed(1)}px)` }}>{ch}</div>;
          })}
        </div>
        {/* click ring: a soft luminous ring blooms from the selector */}
        {ring > 0 && ring < 1 && (
          <div style={{ position: 'absolute', left: PILL.x + PILL.w / 2 - 40 - 170 * E.out(ring), top: PILL.y + PILL.h / 2 - 40 - 170 * E.out(ring), width: 80 + 340 * E.out(ring), height: 80 + 340 * E.out(ring), borderRadius: '50%',
            boxShadow: `0 0 0 ${10 + 18 * ring}px ${em(0.32 * (1 - ring))}, 0 0 60px ${16 * (1 - ring)}px ${em(0.3 * (1 - ring))}`, filter: 'blur(6px)' }} />
        )}
        {/* dropdown */}
        {menuP > 0.01 && (
          <div style={{ position: 'absolute', left: MENU.x, top: MENU.y, width: MENU.w, borderRadius: 18, padding: '12px 10px 10px', boxSizing: 'border-box', opacity: menuP,
            transformOrigin: '85% 0', transform: `translateY(${(-12 * (1 - menuP)).toFixed(1)}px) scale(${lerp(0.95, 1, menuP)})`,
            background: 'linear-gradient(180deg, rgba(18,28,31,.97), rgba(10,17,19,.97))', boxShadow: `inset 0 0 0 1.2px ${C.line}, 0 30px 70px rgba(0,0,0,.6), 0 0 40px ${em(0.08)}` }}>
            <div style={{ position: 'absolute', left: 10, right: 10, top: hiY - MENU.y - 2, height: ITEM_H, borderRadius: 11,
              background: em(0.16 + 0.34 * pickP), boxShadow: `inset 0 0 0 1px ${em(0.45 + 0.4 * pickP)}, 0 0 ${24 * pickP}px ${em(0.5 * pickP)}` }} />
            {MODELS.map(([name, desc, concept], i) => (
              <React.Fragment key={name}>
                {i === 4 && <div style={{ height: 1, margin: '6px 8px 6px', background: C.line }} />}
                <div style={{ position: 'relative', height: ITEM_H, padding: '5px 12px', boxSizing: 'border-box', fontFamily: SANS, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 16.5, fontWeight: 600, color: concept ? C.cy : C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {name}
                    {concept && <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 6, color: C.em, boxShadow: `inset 0 0 0 1px ${em(0.6)}` }}>CONCEPT</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>{desc}</div>
                  {((i === 0 && !picked) || (i === 4 && picked)) && <svg width="16" height="16" viewBox="0 0 24 24" style={{ position: 'absolute', right: 12, top: 14 }}><path d="M5 12.5l4.5 4.5L19 7.5" stroke={C.em} strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>}
                </div>
              </React.Fragment>
            ))}
            <div style={{ height: 1, margin: '6px 8px', background: C.line }} />
            <div style={{ height: 38, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: SANS, fontSize: 14, color: 'rgba(244,247,248,.75)' }}>
              <span>Thinking</span><span style={{ color: C.mute }}>Medium ›</span>
            </div>
          </div>
        )}
        {/* pointer, in UI space so it moves with the camera */}
        {curOp > 0.01 && <div style={{ position: 'absolute', left: 0, top: 0, opacity: curOp }}><Cursor x={curX} y={curY} press={press} /></div>}
      </div>
    </AbsoluteFill>
  );
};
void toScreen;

// ================================================================== 4 · code response (7.06 – 8.6)
const CODE = [
  '// Sample data for a weekly dashboard',
  'const data = [12, 19, 15, 27, 23, 31];',
  '',
  '// Summarise the series',
  'function summarize(values) {',
  '  const total = values.reduce((a, b) => a + b, 0);',
  '  const avg = Math.round(total / values.length);',
  '  return { total, avg, peak: Math.max(...values) };',
  '}',
  '',
  '// Render the dashboard',
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
const Code: React.FC<{ t: number }> = ({ t }) => {
  const enter = E.out(seg(t, T.code0 - 0.08, T.code0 + 0.24));
  const out = E.soft(seg(t, T.pull + 0.14, T.writing + 0.02));
  // camera as in the reference: starts close on the first lines, eases back to read the whole block as lines arrive,
  // then a quick pull-back on 8.3 hands over to the words
  const z = spline(t, [[T.code0 - 0.1, 1.62], [T.code0 + 0.3, 1.52], [7.55, 1.36], [7.95, 1.06], [T.pull, 1.0], [T.pull + 0.3, 0.8]], E.soft);
  const k = (z - 1) / 0.62; // 1 → anchored near the top-left corner, 0 → centred layout
  const AX = 250, AY = 236;   // world anchor: the code block's top-left
  const sx = lerp(AX, 150, k), sy = lerp(AY, 96, k) - 20 * E.in(seg(t, T.pull, T.pull + 0.3));
  const step = (T.codeEnd - T.code0 - 0.1) / CODE.length;
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - out) }}>
      {/* the user's message stays pinned top-right in screen space, like the reference */}
      <div style={{ position: 'absolute', right: lerp(250, 110, k), top: lerp(150, 46, k), fontFamily: SANS, fontSize: lerp(40, 46, k), color: C.ink, textShadow: `0 0 18px ${em(0.25)}` }}>{PROMPT}</div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${sx}px, ${sy}px) scale(${z}) translate(${-AX}px, ${-AY}px)` }}>
        <div style={{ position: 'absolute', left: 250, top: 240 }}><Logo size={40} glow={0.7} /></div>
        <div style={{ position: 'absolute', left: 316, top: 236, fontFamily: MONO, fontSize: 26, lineHeight: '34px', whiteSpace: 'pre', color: C.ink, fontVariantLigatures: 'none' }}>
          {CODE.map((line, i) => {
            const a = T.code0 + 0.05 + i * step;
            const p = seg(t, a, a + step * 2.2);
            const heat = t < a ? 0 : Math.exp(-(t - a) / 0.5);
            const comment = line.trim().startsWith('//');
            return (
              <div key={i} style={{ height: 34, clipPath: `inset(-12px ${(100 * (1 - E.soft(p))).toFixed(2)}% -12px 0)`,
                color: heat > 0.25 ? '#C7F9E3' : comment ? 'rgba(244,247,248,.55)' : C.ink,
                textShadow: heat > 0.03 ? `0 0 ${10 + 16 * heat}px ${em(0.95 * heat)}, 0 0 3px ${em(0.7 * heat)}` : `0 0 10px ${em(0.12)}` }}>{line || ' '}</div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 5 · capability words (8.66 – 11.8)
// letters arrive individually, soft → sharp, with a faint luminous edge — as in the reference
const Letters: React.FC<{ t: number; text: string; at: number; stagger: number; size: number; x: number; y: number; weight?: number; glowCol?: (a: number) => string; out?: number }> = ({ t, text, at, stagger, size, x, y, weight = 500, glowCol = em, out = 0 }) => {
  let cx = x;
  return (
    <>
      {[...text].map((ch, i) => {
        const a = at + i * stagger;
        const p = E.out(seg(t, a, a + 0.32));
        const left = cx; cx += textW(text.slice(0, i + 1), size, weight) - textW(text.slice(0, i), size, weight);
        if (p <= 0) return null;
        const blur = 9 * (1 - p) + 8 * out;
        return (
          <div key={i} style={{ position: 'absolute', left: left + 20 * (1 - p), top: y - size * 0.62, fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.2, color: C.ink, whiteSpace: 'pre',
            opacity: p * (1 - out), filter: blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : undefined, textShadow: `0 0 ${16 + 24 * (1 - p)}px ${glowCol(0.18 + 0.6 * (1 - p))}` }}>{ch}</div>
        );
      })}
    </>
  );
};
const Words: React.FC<{ t: number }> = ({ t }) => {
  const S1 = 112;
  const line = 'Writing & analysis';
  const w1 = textW('Writing ', S1, 500), wAll = textW(line, S1, 500);
  const x1 = CX - wAll / 2;
  const out1 = E.soft(seg(t, T.coding - 0.12, T.coding + 0.04));
  const S2 = 118, SC = 104;
  const codingIn = E.out(seg(t, T.coding - 0.02, T.coding + 0.3));
  const codingOut = E.soft(seg(t, T.research - 0.08, T.research + 0.06));
  const resS = spline(t, [[T.resHold, 1], [11.2, 1.12], [11.5, 1.14], [11.75, 0.84]], E.soft);
  const resOut = E.soft(seg(t, 11.62, 11.86));
  const wRes = textW('Research', S2, 500);
  return (
    <AbsoluteFill>
      <Letters t={t} text="Writing" at={T.writing} stagger={0.045} size={S1} x={x1} y={CY} out={out1} />
      <Letters t={t} text="& analysis" at={T.analysis - 0.06} stagger={0.03} size={S1} x={x1 + w1} y={CY} out={out1} glowCol={cyA} />
      {codingIn > 0 && codingOut < 1 && (
        <div style={{ position: 'absolute', left: 0, width: W, top: CY - SC * 0.62, textAlign: 'center', fontFamily: SANS, fontWeight: 500, fontSize: SC, lineHeight: 1.2, color: C.ink,
          opacity: codingIn * (1 - codingOut), transform: `scale(${lerp(1.06, 1, codingIn) * lerp(1, 0.96, codingOut)})`,
          filter: codingIn < 0.99 || codingOut > 0.01 ? `blur(${(8 * (1 - codingIn) + 10 * codingOut).toFixed(1)}px)` : undefined, textShadow: `0 0 26px ${em(0.3)}` }}>Coding</div>
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${resS})` }}>
        <Letters t={t} text="Research" at={T.research} stagger={0.03} size={S2} x={CX - wRes / 2} y={CY} out={resOut} glowCol={(a) => em(a * 1.2)} />
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 6 · logo flash → resolve (11.8 – end)
const Final: React.FC<{ t: number }> = ({ t }) => {
  const inP = E.out(seg(t, T.logoFlash - 0.1, T.logoFlash + 0.18));
  const flash = bump(t, T.logoFlash - 0.1, T.logoFlash + 0.06, T.logoFlash + 0.75);
  const size = spline(t, [[T.logoFlash - 0.1, 420], [T.logoFlash + 0.1, 380], [12.2, 250], [T.settle, 200], [13.2, 196]], E.soft);
  const sub = E.out(seg(t, T.settle, T.settle + 0.45));
  const tag = E.out(seg(t, T.settle + 0.2, T.settle + 0.6));
  const lift = 60 * E.soft(seg(t, T.settle - 0.2, T.settle + 0.4));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: CX - size / 2, top: CY - size / 2 - lift, opacity: inP, filter: inP < 0.99 ? `blur(${(16 * (1 - inP)).toFixed(1)}px)` : undefined }}>
        <Logo size={size} glow={0.45 + 1.6 * flash} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: W, top: CY + 80 - lift * 0.4, textAlign: 'center', fontFamily: SERIF, fontWeight: 400, fontSize: 64, color: C.ink, letterSpacing: '0.01em',
        opacity: sub, filter: sub < 0.99 ? `blur(${(8 * (1 - sub)).toFixed(1)}px)` : undefined, textShadow: `0 0 22px ${em(0.3)}` }}>GPT Astra 6</div>
      <div style={{ position: 'absolute', left: 0, width: W, bottom: 54, textAlign: 'center', fontFamily: SANS, fontSize: 18, letterSpacing: '0.14em', color: 'rgba(244,247,248,.5)', opacity: tag }}>
        FAN-MADE CONCEPT · NOT AFFILIATED WITH OPENAI
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== frame
const Frame: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      {t < 1.0 && <Night t={t} />}
      {t >= T.logo - 0.06 && t < T.ui + 0.08 && <Brand t={t} />}
      {t >= T.ui - 0.1 && t < T.code0 + 0.08 && <ChatUI t={t} />}
      {t >= T.code0 - 0.1 && t < T.writing + 0.04 && <Code t={t} />}
      {t >= T.writing && t < 11.9 && <Words t={t} />}
      {t >= T.logoFlash - 0.1 && <Final t={t} />}
      {t < 1.0 && <div style={{ position: 'absolute', right: 40, bottom: 32, fontFamily: SANS, fontSize: 16, letterSpacing: '0.14em', color: 'rgba(244,247,248,.42)', opacity: 1 - seg(t, 0.75, 1.0) }}>FAN-MADE CONCEPT</div>}
    </AbsoluteFill>
  );
};

// centred temporal sub-frame sampling (8 × 180° shutter) only where things move fast; timing never shifts
const SubframeBlur: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (!FAST.some(([a, b]) => t >= a && t <= b)) return <>{children}</>;
  const n = 8, shutter = 0.5;
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
const Background: React.FC = () => <Light t={useCurrentFrame() / FPS} />;
export const AstraRef: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Audio src={staticFile('audio/reference.wav')} />
    <Background />
    <SubframeBlur><Frame /></SubframeBlur>
  </AbsoluteFill>
);
