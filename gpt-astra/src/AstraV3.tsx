// GPT Astra 6: fan-made ChatGPT concept, v3.
// Motion is reconstructed from per-frame measurements of the reference (timing/ref_timing_map.json → src/refData.ts):
// camera paths, object trajectories, scale curves and reveal timings are the reference's own 30 fps samples, evaluated at
// 60 fps with monotone cubic interpolation (no overshoot that is not in the data, no duplicated frames). Values marked
// "estimate" in the timing map are judged frame by frame where the tracker had no signal.
// Audio: the reference's soundtrack, unchanged (public/audio/reference.wav).
import React from 'react';
import { AbsoluteFill, Audio, Freeze, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { LOGO_PATH } from './logo';
import {
  ANALYSIS_X0, BRAND_LOGO, CODE_CAM, CODING_X0, CODING_ZOOM, END_CARD, END_LOGO, LETTER_OFFSET, MOON, RESEARCH_SHRINK, UI_CAM,
  WRITING_SCALE, WRITING_X0,
} from './refData';

export const FPS = 60;
export const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
export const DURATION = 14.6; // reference 14.0 s + a 0.6 s silent hold so the creator credit holds sharp for more than 1 s

const C = { bg: '#010303', em: '#10B981', cy: '#67E8F9', ink: '#F4F7F8', mute: 'rgba(244,247,248,.52)', line: 'rgba(244,247,248,.16)' };
const em = (a: number) => `rgba(16,185,129,${clamp(a).toFixed(3)})`;
const mint = (a: number) => `rgba(167,243,208,${clamp(a).toFixed(3)})`;
const cyA = (a: number) => `rgba(103,232,249,${clamp(a).toFixed(3)})`;
const SERIF = 'Fraunces', SANS = 'Inter';

// ------------------------------------------------------------------ maths
function clamp(x: number, a = 0, b = 1) { return Math.min(b, Math.max(a, x)); }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const bez = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, c_ = 3 * y1, by = 3 * (y2 - y1) - c_, ay = 1 - c_ - by;
  const X = (u: number) => ((ax * u + bx) * u + cx) * u, Y = (u: number) => ((ay * u + by) * u + c_) * u, dX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; let u = x; for (let i = 0; i < 8; i++) { const d = dX(u); if (Math.abs(d) < 1e-6) break; u = clamp(u - (X(u) - x) / d); } return Y(u); };
};
// curves used only for the few events the timing map marks as estimates
const E = { out: bez(0.16, 1, 0.3, 1), soft: bez(0.42, 0, 0.58, 1), in: bez(0.55, 0, 0.9, 0.4), expo: bez(0.12, 0.9, 0.2, 1) };
// monotone cubic (Fritsch–Carlson) through measured samples; `extend` extrapolates linearly past the ends
function mono(t: number, ts: number[], vs: number[], extend = false): number {
  const n = ts.length;
  if (t <= ts[0]) return extend ? vs[0] + ((vs[1] - vs[0]) / (ts[1] - ts[0])) * (t - ts[0]) : vs[0];
  if (t >= ts[n - 1]) return extend ? vs[n - 1] + ((vs[n - 1] - vs[n - 2]) / (ts[n - 1] - ts[n - 2])) * (t - ts[n - 1]) : vs[n - 1];
  let i = 0; while (t > ts[i + 1]) i++;
  const d = (k: number) => (vs[k + 1] - vs[k]) / (ts[k + 1] - ts[k]);
  const m = (k: number) => {
    if (k === 0) return d(0);
    if (k === n - 1) return d(n - 2);
    const a = d(k - 1), b = d(k);
    if (a * b <= 0) return 0;
    const w1 = 2 * (ts[k + 1] - ts[k]) + (ts[k] - ts[k - 1]), w2 = (ts[k + 1] - ts[k]) + 2 * (ts[k] - ts[k - 1]);
    return (w1 + w2) / (w1 / a + w2 / b);
  };
  const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m(i + 1);
}
const bump = (t: number, a: number, m: number, b: number) => (t <= a || t >= b ? 0 : t < m ? E.soft(seg(t, a, m)) : 1 - E.soft(seg(t, m, b)));

// ------------------------------------------------------------------ fonts
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const faces: [string, string, string][] = [
    [SERIF, 'fraunces-latin-300-normal', '300'], [SERIF, 'fraunces-latin-400-normal', '400'], [SERIF, 'fraunces-latin-500-normal', '500'],
    [SANS, 'inter-latin-400-normal', '400'], [SANS, 'inter-latin-500-normal', '500'], [SANS, 'inter-latin-600-normal', '600'],
  ];
  Promise.all(faces.map(([f, file, w]) => new FontFace(f, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, { weight: w }).load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}
const mctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const font = (size: number, weight: number, family: string) => `${weight} ${size}px "${family}"`;
const textW = (s: string, size: number, weight = 400, family = SANS) => { if (!mctx) return s.length * size * 0.55; mctx.font = font(size, weight, family); return mctx.measureText(s).width; };
// distance from the top of a line-height:1 box to the alphabetic baseline, and the ink box of a string
const baseTop = (size: number, weight: number, family: string) => {
  if (!mctx) return size * 0.8;
  mctx.font = font(size, weight, family); const m = mctx.measureText('Hg');
  return (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
};
const ink = (s: string, size: number, weight: number, family: string) => {
  if (!mctx) return { a: size * 0.72, d: size * 0.2 };
  mctx.font = font(size, weight, family); const m = mctx.measureText(s); return { a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
};
// font size that gives a string a measured width
const sizeFor = (s: string, width: number, weight: number, family: string) => (width / textW(s, 100, weight, family)) * 100;

// ------------------------------------------------------------------ shots (the reference's hard cuts, measured) and motion-blur windows
const CUTS = [0, 2.25, 7.05, 8.583, 9.95, 11.717, 12.983, DURATION];
const shotOf = (t: number) => { let i = 0; while (i < CUTS.length - 2 && t >= CUTS[i + 1]) i++; return [CUTS[i], CUTS[i + 1]] as const; };
// only the frames where the measured speed peaks (> ~3000 px/s at 1080p); the reference itself stays crisp elsewhere,
// so holds, reveals and moderate moves are rendered as single sharp images
const FAST: [number, number][] = [
  [2.25, 2.32], [3.29, 3.38], [4.26, 4.37], [6.98, 7.05], [8.5, 8.583], [9.9, 10.0], [11.66, 11.717], [12.94, 13.05],
];

// ------------------------------------------------------------------ light: two localized lights keyed per shot (estimates from light.json)
type LK = [number, number, number, number, number, number]; // t, x, y, rx, ry, intensity (x,y,r normalized to W/H)
const LIGHT_A: LK[][] = [
  [[0, 0.5, 0.5, 0.1, 0.1, 0], [0.74, 0.5, 0.5, 0.12, 0.14, 0], [0.86, 0.55, 0.62, 0.34, 0.5, 0.75], [1.1, 0.72, 0.86, 0.42, 0.6, 0.85],
    [1.6, 0.53, 0.74, 0.48, 0.6, 0.9], [2.0, 0.5, 0.74, 0.5, 0.55, 0.88], [2.25, 0.6, 0.96, 0.48, 0.45, 0.75]],
  [[2.25, 0.56, 1.04, 0.32, 0.3, 0.35], [2.7, 0.56, 0.96, 0.36, 0.38, 0.85], [3.2, 0.57, 0.86, 0.38, 0.5, 0.9], [3.45, 0.76, 0.3, 0.44, 0.62, 0.85],
    [4.0, 0.8, 0.02, 0.44, 0.42, 0.72], [4.25, 0.62, 0.0, 0.5, 0.45, 0.66], [4.48, 0.3, 0.04, 0.5, 0.5, 0.56], [4.8, 0.3, 0.3, 0.48, 0.6, 0.5],
    [5.0, 0.42, 0.6, 0.38, 0.55, 0.72], [5.6, 0.5, 0.46, 0.26, 0.5, 0.48], [6.25, 0.55, 0.38, 0.26, 0.5, 0.48], [6.36, 0.45, 0.3, 0.32, 0.5, 0.78],
    [6.62, 0.42, 0.34, 0.34, 0.5, 0.5], [7.05, 0.3, 0.06, 0.5, 0.5, 0.6]],
  [[7.05, 1.03, 0.86, 0.24, 0.5, 0], [7.14, 1.03, 0.8, 0.32, 0.62, 0.7], [7.6, 1.03, 0.64, 0.36, 0.62, 0.95], [8.2, 1.03, 0.46, 0.36, 0.62, 1.0],
    [8.45, 1.03, 0.4, 0.36, 0.6, 0.9], [8.583, 1.03, 0.38, 0.36, 0.6, 0.35]],
  [[8.583, 1.03, -0.03, 0.4, 0.46, 0.85], [9.3, 1.02, -0.03, 0.42, 0.5, 0.88], [9.95, 1.0, -0.02, 0.42, 0.5, 0.88]],
  [[9.95, 1.0, -0.02, 0.42, 0.5, 0.88], [11.45, 0.98, 0.0, 0.42, 0.5, 0.85], [11.62, 0.98, 0.0, 0.42, 0.5, 0.35], [11.717, 0.98, 0.0, 0.42, 0.5, 0.1]],
  [[11.717, 0.5, 0.5, 0.2, 0.2, 0], [12.983, 0.5, 0.5, 0.2, 0.2, 0]],
  [[12.983, 0.5, 0.5, 0.2, 0.2, 0], [DURATION, 0.5, 0.5, 0.2, 0.2, 0]],
];
const LIGHT_B: LK[][] = [
  [[0, 0.5, 1.1, 0.2, 0.2, 0], [2.25, 0.5, 1.1, 0.2, 0.2, 0]],
  [[2.25, 0.9, -0.05, 0.3, 0.3, 0], [3.4, 0.9, -0.05, 0.3, 0.3, 0.15], [7.05, 0.9, -0.05, 0.3, 0.3, 0.1]],
  [[7.05, 0.5, 1.1, 0.2, 0.2, 0], [8.583, 0.5, 1.1, 0.2, 0.2, 0]],
  [[8.583, 0.45, 1.06, 0.3, 0.26, 0.6], [9.2, 0.3, 1.06, 0.3, 0.3, 0.7], [9.36, 0.06, 1.03, 0.33, 0.36, 0.95], [9.95, 0.05, 1.03, 0.33, 0.36, 0.95]],
  [[9.95, 0.05, 1.03, 0.33, 0.36, 0.95], [11.45, 0.04, 1.02, 0.33, 0.36, 0.95], [11.62, 0.04, 1.02, 0.33, 0.36, 0.4], [11.717, 0.04, 1.02, 0.33, 0.36, 0.1]],
  [[11.717, 0.5, 1.1, 0.2, 0.2, 0], [12.983, 0.5, 1.1, 0.2, 0.2, 0]],
  [[12.983, 0.5, 1.1, 0.2, 0.2, 0], [DURATION, 0.5, 1.1, 0.2, 0.2, 0]],
];
const lightAt = (t: number, keys: LK[][]) => {
  let si = 0; while (si < CUTS.length - 2 && t >= CUTS[si + 1]) si++;
  const ks = keys[si]; const ts = ks.map((k) => k[0]);
  return [1, 2, 3, 4, 5].map((j) => mono(t, ts, ks.map((k) => k[j])));
};
// a soft gaussian-like falloff (no visible edge); colour channel values 0..255
const glowStops = (r: number, g: number, b: number, a: number) =>
  [[0, 1], [12, 0.86], [25, 0.64], [38, 0.43], [50, 0.27], [62, 0.15], [74, 0.075], [86, 0.028], [100, 0]]
    .map(([p, k]) => `rgba(${r},${g},${b},${(a * k).toFixed(4)}) ${p}%`).join(', ');
const Light: React.FC<{ t: number }> = ({ t }) => {
  const [ax, ay, arx, ary, aI] = lightAt(t, LIGHT_A);
  const [bx, by, brx, bry, bI] = lightAt(t, LIGHT_B);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {aI > 0.002 && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(${arx * W}px ${ary * H}px at ${ax * W}px ${ay * H}px, ${glowStops(14, 112, 82, 0.92 * aI)})` }} />}
      {bI > 0.002 && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(${brx * W}px ${bry * H}px at ${bx * W}px ${by * H}px, ${glowStops(16, 128, 104, 0.85 * bI)})` }} />}
    </AbsoluteFill>
  );
};
// fine static grain over the light only (overlay: black stays black); dithers the dark gradients so H.264 does not band them
const Grain: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.14, mixBlendMode: 'overlay' }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" /></filter>
    <rect width={W} height={H} filter="url(#grain)" />
  </svg>
);

// ------------------------------------------------------------------ logo
const Logo: React.FC<{ size: number; glow?: number; color?: string }> = ({ size, glow = 0, color = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible',
    filter: glow > 0.01 ? `drop-shadow(0 0 ${(size * 0.035 * glow).toFixed(1)}px ${mint(0.95 * Math.min(1, glow))}) drop-shadow(0 0 ${(size * 0.12 * glow).toFixed(1)}px ${em(0.7 * Math.min(1, glow))}) drop-shadow(0 0 ${(size * 0.28 * glow).toFixed(1)}px ${em(0.35 * Math.min(1, glow))})` : undefined }}>
    <path d={LOGO_PATH} fill={color} fillRule="evenodd" />
  </svg>
);

// ================================================================== 1 · night sky → moon becomes the logo (0 – 1.0)
const STARS = Array.from({ length: 150 }, (_, i) => { const r = (n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); }; return { x: r(1) * W, y: r(2) * H, s: 0.6 + r(3) * 1.5, p: r(4) * 6.3 }; });
// measured moon track (0.133–0.6 s) with the reference's rise from below before it (estimate) and its settle on the frame centre
const MOON_T = [0.033, 0.067, 0.1, ...MOON.t, 0.733];
const MOON_Y = [0.76, 0.72, 0.66, ...MOON.cy, 0.5];
const MOON_R = [0.12, 0.135, 0.145, ...MOON.r, 0.176];
const Cloud: React.FC<{ x: number; y: number; k: number; o: number }> = ({ x, y, k, o }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity: o, filter: 'blur(1.5px)' }}>
    {[[0, 30, 70], [52, 0, 92], [126, 14, 74], [178, 38, 52], [30, 48, 64], [104, 48, 70], [152, 56, 50]].map(([px, py, r], j) => (
      <div key={j} style={{ position: 'absolute', left: px * k, top: py * k, width: r * k, height: r * k, borderRadius: '50%', background: 'radial-gradient(circle at 40% 30%, #E6EEF2 0%, #93A9B6 100%)' }} />
    ))}
  </div>
);
const Night: React.FC<{ t: number }> = ({ t }) => {
  const sky = 1 - E.soft(seg(t, 0.72, 0.92));
  const moonIn = E.soft(seg(t, 0.02, 0.17));
  const glow = E.soft(seg(t, 0.58, 0.74));
  const toLogo = seg(t, 0.745, 0.785);
  const r = mono(t, MOON_T, MOON_R) * H, my = mono(t, MOON_T, MOON_Y) * H, mx = CX;
  const part = E.soft(seg(t, 0.6, 0.82));
  const cloudO = (1 - E.soft(seg(t, 0.8, 1.0))) * moonIn;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: sky, background: 'linear-gradient(180deg, #071019 0%, #0A1720 55%, #071015 100%)' }} />
      <svg width={W} height={H} style={{ position: 'absolute', opacity: sky * E.soft(seg(t, 0.08, 0.3)) }}>
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y - 40 * t} r={s.s} fill="#E8F4FF" opacity={0.28 + 0.3 * Math.sin(t * 5 + s.p)} />)}
      </svg>
      {toLogo < 1 && (
        <div style={{ position: 'absolute', left: mx - r, top: my - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: moonIn * (1 - toLogo),
          background: `radial-gradient(circle at 42% 38%, #FFFFFF 0%, ${glow > 0.5 ? '#EFFFF8' : '#E8EEF0'} 48%, #B9C7CA 100%)`,
          boxShadow: `0 0 ${20 + 160 * glow}px ${mint(0.1 + 0.6 * glow)}, 0 0 ${40 + 260 * glow}px ${em(0.08 + 0.5 * glow)}` }}>
          {[[0.3, 0.3, 0.09], [0.55, 0.47, 0.065], [0.38, 0.64, 0.05]].map(([x, y, rr], i) => <div key={i} style={{ position: 'absolute', left: (x - rr) * 2 * r, top: (y - rr) * 2 * r, width: rr * 4 * r, height: rr * 4 * r, borderRadius: '50%', background: 'rgba(110,140,145,.18)', opacity: 1 - glow }} />)}
        </div>
      )}
      {/* clouds: one crosses the moon's lower left, one sits upper right; they part as the moon flares */}
      <Cloud x={mx - r * 1.55 - 0.36 * W * part} y={my + r * 0.25} k={1.75} o={cloudO * 0.95} />
      <Cloud x={mx + r * 0.55 + 0.3 * W * part} y={my - r * 1.05} k={1.0} o={cloudO * 0.9} />
    </AbsoluteFill>
  );
};

// ================================================================== 2 · logo + ChatGPT wordmark (0.733 – 2.25)
const WORD = 'ChatGPT';
const LOGO_CORE = 0.161 * W; // measured core width of the reference logo
const WS = 252; // Fraunces size: ascender ≈ 0.18 H, as measured
const brandLayout = () => {
  const ww = textW(WORD, WS, 400, SERIF), gap = 0.0615 * W;
  const total = LOGO_CORE + gap + ww;
  const left = (W - total) / 2;
  return { logoCX: left + LOGO_CORE / 2, wordX: left + LOGO_CORE + gap, ww };
};
const LETTER_AT = Array.from({ length: WORD.length }, (_, i) => 1.29 + (i * 0.37) / (WORD.length - 1));
const Brand: React.FC<{ t: number }> = ({ t }) => {
  const { logoCX, wordX } = brandLayout();
  // measured logo slide (x) and exit (y), mapped onto this lockup's start and end positions
  const rx = mono(t, BRAND_LOGO.t, BRAND_LOGO.x), x0 = BRAND_LOGO.x[0], x1 = BRAND_LOGO.x[BRAND_LOGO.x.length - 12];
  const slide = clamp((rx - x0) / (x1 - x0), -0.05, 1.05);
  const lx = lerp(CX, logoCX, slide);
  const ly = mono(t, BRAND_LOGO.t, BRAND_LOGO.y) * H;
  const dy = ly - 0.4944 * H;
  // the logo emerges from the moon with a bloom that settles by ~0.97 s (measured size incl. glow / core)
  const sz = mono(t, BRAND_LOGO.t, BRAND_LOGO.size) * W;
  const scale = t < 0.97 ? Math.max(1, sz / LOGO_CORE) : 1;
  const bloom = 1 - E.soft(seg(t, 0.75, 1.0));
  const logoIn = E.out(seg(t, 0.742, 0.78));
  let pen = wordX;
  return (
    <AbsoluteFill>
      {bloom > 0.01 && <div style={{ position: 'absolute', left: lx - 0.2 * W, top: ly - 0.2 * W, width: 0.4 * W, height: 0.4 * W, borderRadius: '50%', opacity: bloom * logoIn,
        background: `radial-gradient(circle, ${mint(0.55)} 0%, ${em(0.35)} 30%, ${em(0.1)} 55%, rgba(0,0,0,0) 72%)` }} />}
      <div style={{ position: 'absolute', left: lx - LOGO_CORE / 2, top: ly - LOGO_CORE / 2, opacity: logoIn, transform: `scale(${scale})` }}>
        <Logo size={LOGO_CORE} glow={0.25 + 1.4 * bloom} color={bloom > 0.4 ? '#FFFFFF' : C.ink} />
      </div>
      {[...WORD].map((ch, i) => {
        const left = pen; pen += textW(WORD.slice(0, i + 1), WS, 400, SERIF) - textW(WORD.slice(0, i), WS, 400, SERIF);
        const tau = t - LETTER_AT[i];
        if (tau < 0) return null;
        const dx = mono(tau, LETTER_OFFSET.t, LETTER_OFFSET.dx) * W; // measured settle of each letter
        const o = E.out(seg(tau, 0, 0.14)), blur = 9 * (1 - E.out(seg(tau, 0, 0.22)));
        return (
          <div key={i} style={{ position: 'absolute', left: left + (lx - logoCX) + dx, top: 0.4944 * H + dy + ink(WORD, WS, 400, SERIF).a / 2 - baseTop(WS, 400, SERIF),
            fontFamily: SERIF, fontWeight: 400, fontSize: WS, lineHeight: 1, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'pre',
            opacity: o, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined, textShadow: `0 0 ${14 + 26 * (1 - o)}px ${em(0.18 + 0.45 * (1 - o))}` }}>{ch}</div>
        );
      })}
    </AbsoluteFill>
  );
};

// ================================================================== 3 · chat UI under the measured camera (2.25 – 7.05)
// world = the reference's anchor frame (2.9 s, camera scale 1) × 1.5
const BOX = { x: 370.5, y: 489, w: 1171.5, h: 213, r: 36 };
const GREET = { logoCX: 772.5, cy: 379.5, textX: 832.5, textW: 331.5 };
const PH = { x: 410, cy: 544.5, size: 30 };
const PILL = { right: 1428, cy: 645 };
const MENU = { x: 1146, y: 673.5, w: 343.5, h: 375 };
const RING = { cx: 1327.5, cy: 864, r: 285 };
const MODELS: [string, string, boolean][] = [
  ['GPT-6', 'Latest model', false], ['GPT-6 Pro', 'Pro reasoning', false], ['GPT-5.6 Sol', 'Earlier model', false], ['GPT-5.6 Luna', 'Free and Go default', false],
  ['GPT Astra 6', 'Concept', true],
];
const ITEM = { top: 12, h: 58 };
const itemY = (i: number) => MENU.y + ITEM.top + i * ITEM.h;
const CHIPS = ['Write', 'Code', 'Analyze', 'Create', 'Learn'];
const PROMPT = 'Help me build a dashboard';
const PLACEHOLDER = 'Ask anything';
// typing: 3.533 – 3.9 s, in small bursts like the reference (estimate)
const KEYS = Array.from({ length: PROMPT.length }, (_, i) => 3.533 + (i / PROMPT.length) * 0.36 + (((i * 7) % 3) - 1) * 0.004);
const typedN = (t: number) => KEYS.filter((k) => t >= k).length;
// hover path through the entries (lands on the concept entry at 5.97 s, selected 6.3 s, as the reference's hover/select)
const HOVER: [number, number][] = [[5.433, 1], [5.6, 1], [5.68, 2], [5.78, 2], [5.86, 3], [5.9, 3], [5.97, 4]];
const hoverAt = (t: number) => mono(t, HOVER.map((k) => k[0]), HOVER.map((k) => k[1]));

const uiCam = (t: number) => ({ s: mono(t, UI_CAM.t, UI_CAM.s, true), x: mono(t, UI_CAM.t, UI_CAM.cx, true) * W, y: mono(t, UI_CAM.t, UI_CAM.cy, true) * H });

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width="30" height="30" viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 5, top: y - 2, transform: `scale(${1 - 0.12 * press})`, transformOrigin: '5px 2px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.6))' }}>
    <path d="M5 2.5l13.5 9.2-6.1 1.2 3.6 6.8-2.6 1.4-3.6-6.9-4.8 4.1z" fill="#fff" stroke="#0B1013" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const ChatUI: React.FC<{ t: number }> = ({ t }) => {
  const c = uiCam(t);
  const n = typedN(t), last = n ? KEYS[n - 1] : 2.9;
  const caret = t > 2.9 && (t - last < 0.3 || Math.floor((t - last) / 0.42) % 2 === 1);
  // selector + menu (estimates from the frames: pill lights 4.833, container 4.867–5.0, rows 4.9–5.2)
  const pillOn = E.soft(seg(t, 4.8, 4.86));
  const menuH = E.expo(seg(t, 4.867, 5.0)) * (1 - E.in(seg(t, 6.62, 6.76)));
  const menuO = E.soft(seg(t, 4.86, 4.92)) * (1 - E.soft(seg(t, 6.62, 6.76)));
  const ringO = E.soft(seg(t, 4.93, 5.03)) * (1 - E.soft(seg(t, 5.2, 5.43)));
  const ringR = RING.r * lerp(0.9, 1.06, E.out(seg(t, 4.93, 5.43)));
  const hov = hoverAt(t), hovO = E.soft(seg(t, 5.42, 5.5)) * (1 - E.soft(seg(t, 6.6, 6.67)));
  const flash = bump(t, 6.29, 6.37, 6.6);
  const picked = t >= 6.36;
  const label = picked ? 'GPT Astra 6' : 'GPT-6';
  const labelS = 25;
  const labelW = textW(label, labelS, 500) + 26;
  // pointer in UI space: reaches the selector, clicks at 4.833, follows the hover, clicks the concept entry at 6.3
  const curT = [4.55, 4.8, 4.86, 5.25, 5.433, 5.6, 5.68, 5.78, 5.86, 5.9, 5.97, 6.3, 6.6, 6.9];
  const curX = mono(t, curT, [PILL.right + 160, PILL.right - 50, PILL.right - 52, MENU.x + 250, MENU.x + 236, MENU.x + 236, MENU.x + 228, MENU.x + 228, MENU.x + 236, MENU.x + 236, MENU.x + 226, MENU.x + 228, MENU.x + 232, PILL.right - 30]);
  const curY = mono(t, curT, [PILL.cy + 150, PILL.cy + 6, PILL.cy + 8, itemY(1) + 70, itemY(1) + 34, itemY(1) + 34, itemY(2) + 32, itemY(2) + 32, itemY(3) + 34, itemY(3) + 34, itemY(4) + 32, itemY(4) + 32, itemY(4) + 30, PILL.cy + 40]);
  const curO = E.soft(seg(t, 4.5, 4.62)) * (1 - E.soft(seg(t, 6.75, 6.9)));
  const press = bump(t, 4.8, 4.835, 4.92) + bump(t, 6.27, 6.3, 6.38);
  const chipsIn = (i: number) => E.out(seg(t, 2.27 + i * 0.055, 2.42 + i * 0.055));
  const GS = sizeFor('Welcome', GREET.textW, 400, SERIF);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${c.x}px, ${c.y}px) scale(${c.s}) translate(${-CX}px, ${-CY}px)` }}>
        {/* greeting: display serif with the mark */}
        <div style={{ position: 'absolute', left: GREET.logoCX - 39, top: GREET.cy - 39 }}><Logo size={78} glow={0.3} /></div>
        <div style={{ position: 'absolute', left: GREET.textX, top: GREET.cy - baseTop(GS, 400, SERIF) + ink('Welcome', GS, 400, SERIF).a / 2, fontFamily: SERIF, fontWeight: 400, fontSize: GS, lineHeight: 1, color: C.ink, whiteSpace: 'nowrap', textShadow: `0 0 22px ${em(0.22)}` }}>Welcome</div>
        {/* input */}
        <div style={{ position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, borderRadius: BOX.r, background: 'rgba(6,14,13,.55)',
          boxShadow: `inset 0 0 0 1.6px ${mint(0.55)}, 0 0 14px ${em(0.35)}, 0 0 36px ${em(0.12)}` }} />
        <div style={{ position: 'absolute', left: PH.x, top: PH.cy - baseTop(PH.size, 400, SANS) + ink('Hg', PH.size, 400, SANS).a / 2 - 2, fontFamily: SANS, fontSize: PH.size, lineHeight: 1, whiteSpace: 'pre' }}>
          <span style={{ color: C.ink }}>{PROMPT.slice(0, n)}</span>
          {caret && <span style={{ display: 'inline-block', width: 2.5, height: PH.size * 1.05, marginLeft: 1, marginRight: 1, background: C.ink, verticalAlign: '-0.18em' }} />}
          <span style={{ color: C.mute }}>{PLACEHOLDER.slice(n)}{n < PLACEHOLDER.length ? '' : ''}</span>
        </div>
        <div style={{ position: 'absolute', left: 430.5 - 15, top: PILL.cy - 15, width: 30, height: 30 }}>
          <svg width="30" height="30" viewBox="0 0 30 30"><path d="M15 4v22M4 15h22" stroke={C.ink} strokeWidth="2" strokeLinecap="round" opacity=".85" /></svg>
        </div>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ position: 'absolute', left: 1485 - 20, top: PILL.cy - 20 }}>
          {[4, 7.5, 11, 14.5, 18].map((x, i) => <line key={i} x1={x} x2={x} y1={12 - [3, 6, 8, 6, 3][i]} y2={12 + [3, 6, 8, 6, 3][i]} stroke={C.ink} strokeWidth="1.7" strokeLinecap="round" />)}
        </svg>
        {/* model selector */}
        <div style={{ position: 'absolute', left: PILL.right - labelW + 10, top: PILL.cy - 22, width: labelW, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          background: em(0.22 * pillOn * (picked ? 0.6 : 1) + 0.3 * flash), fontFamily: SANS, fontSize: labelS, fontWeight: 500, color: picked ? C.cy : C.ink, whiteSpace: 'nowrap',
          textShadow: picked ? `0 0 12px ${cyA(0.45)}` : undefined }}>
          {label}
          <svg width="14" height="14" viewBox="0 0 12 12" style={{ transform: `rotate(${180 * menuO}deg)` }}><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
        </div>
        {/* chips */}
        <div style={{ position: 'absolute', left: 541.5, width: 1365 - 541.5, top: 738, height: 52, display: 'flex', justifyContent: 'space-between' }}>
          {CHIPS.map((ch, i) => (
            <div key={ch} style={{ height: 52, padding: '0 26px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderRadius: 13, fontFamily: SANS, fontSize: 25, color: C.ink,
              boxShadow: `inset 0 0 0 1.5px ${mint(0.5)}, 0 0 10px ${em(0.25)}`, opacity: chipsIn(i), transform: `translateY(${(10 * (1 - chipsIn(i))).toFixed(2)}px)` }}>{ch}</div>
          ))}
        </div>
        {/* ring: a soft luminous ring blooms around the opening menu */}
        {ringO > 0.005 && (
          <div style={{ position: 'absolute', left: RING.cx - ringR, top: RING.cy - ringR, width: 2 * ringR, height: 2 * ringR, borderRadius: '50%', opacity: ringO,
            boxShadow: `0 0 70px 34px ${em(0.42)}, inset 0 0 70px 34px ${em(0.42)}`, filter: 'blur(10px)' }} />
        )}
        {/* dropdown */}
        {menuO > 0.005 && (
          <div style={{ position: 'absolute', left: MENU.x, top: MENU.y, width: MENU.w, height: MENU.h * menuH, overflow: 'hidden', borderRadius: 18, opacity: menuO,
            background: 'linear-gradient(180deg, rgba(20,30,32,.97), rgba(12,19,21,.97))', boxShadow: `inset 0 0 0 1.4px ${mint(0.42)}, 0 24px 60px rgba(0,0,0,.6), 0 0 26px ${em(0.16)}` }}>
            <div style={{ position: 'absolute', left: 10, right: 10, top: itemY(hov) - MENU.y, height: ITEM.h - 4, borderRadius: 11, opacity: hovO,
              background: em(0.2 + 0.45 * flash), boxShadow: `inset 0 0 0 1px ${mint(0.3 + 0.5 * flash)}, 0 0 ${40 * flash}px ${em(0.8 * flash)}, 0 0 ${90 * flash}px ${em(0.45 * flash)}` }} />
            {MODELS.map(([name, desc, concept], i) => {
              const rowO = E.out(seg(t, 4.9 + i * 0.045, 5.0 + i * 0.045));
              return (
                <div key={name} style={{ position: 'absolute', left: 24, right: 20, top: itemY(i) - MENU.y, height: ITEM.h - 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: SANS, opacity: rowO }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: concept ? C.cy : C.ink, display: 'flex', alignItems: 'center', gap: 9 }}>
                    {name}
                    {concept && <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 6, color: C.em, boxShadow: `inset 0 0 0 1px ${em(0.7)}` }}>CONCEPT</span>}
                  </div>
                  <div style={{ fontSize: 15.5, color: 'rgba(244,247,248,.72)', marginTop: 3 }}>{desc}</div>
                  {((i === 0 && !picked) || (i === 4 && picked)) && <svg width="18" height="18" viewBox="0 0 24 24" style={{ position: 'absolute', right: 6, top: (ITEM.h - 4) / 2 - 9 }}><path d="M5 12.5l4.5 4.5L19 7.5" stroke={C.em} strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>}
                </div>
              );
            })}
            <div style={{ position: 'absolute', left: 16, right: 16, top: itemY(5) - MENU.y + 4, height: 1.2, background: C.line, opacity: E.out(seg(t, 5.08, 5.16)) }} />
            <div style={{ position: 'absolute', left: 24, right: 22, top: itemY(5) - MENU.y + 12, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: SANS, fontSize: 18, color: 'rgba(244,247,248,.82)', opacity: E.out(seg(t, 5.1, 5.2)) }}>
              <span>Thinking</span><span style={{ color: C.mute }}>Medium ›</span>
            </div>
          </div>
        )}
        {curO > 0.01 && <div style={{ position: 'absolute', left: 0, top: 0, opacity: curO }}><Cursor x={curX} y={curY} press={press} /></div>}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 4 · code response (7.05 – 8.583), camera pulls back about the frame centre
const CODE = [
  '// Sample data for the weekly dashboard',
  'const visits = [120, 190, 150, 270, 230, 310, 280];',
  'const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];',
  '',
  '// Summarise a series of numbers',
  'function summarize(values) {',
  '  const total = values.reduce((sum, v) => sum + v, 0);',
  '  const average = Math.round(total / values.length);',
  '  const peak = Math.max(...values);',
  '  return { total, average, peak };',
  '}',
  '',
  '// Percentage change between the first and last value',
  'function trend(values) {',
  '  const first = values[0];',
  '  const last = values[values.length - 1];',
  '  return Math.round(((last - first) / first) * 100);',
  '}',
  '',
  '// Render the dashboard',
  'export function Dashboard() {',
  '  const { total, average, peak } = summarize(visits);',
  '  return (',
  '    <Panel title="Weekly overview">',
  '      <Stat label="Total visits" value={total} />',
  '      <Stat label="Daily average" value={average} />',
  '      <Stat label="Peak day" value={peak} />',
  '      <Stat label="Trend" value={`${trend(visits)}%`} />',
  '      <LineChart labels={days} points={visits} />',
  '    </Panel>',
  '  );',
  '}',
];
const CODE_L = { logoCX: 267, logoCY: 196.5, logo: 48, x: 307.5, firstCY: 195, pitch: 24.4, size: 20.5, promptRight: 1606.5, promptCY: 135, promptSize: 38 };
const Code: React.FC<{ t: number }> = ({ t }) => {
  const s = mono(t, CODE_CAM.t, CODE_CAM.s);
  const vis = E.soft(seg(t, 7.14, 7.2));
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${s})` }}>
        <div style={{ position: 'absolute', right: W - CODE_L.promptRight, top: CODE_L.promptCY - baseTop(CODE_L.promptSize, 400, SANS) + ink('Hp', CODE_L.promptSize, 400, SANS).a / 2,
          fontFamily: SANS, fontSize: CODE_L.promptSize, lineHeight: 1, color: C.ink, whiteSpace: 'nowrap', textShadow: `0 0 16px ${em(0.2)}` }}>{PROMPT}</div>
        <div style={{ position: 'absolute', left: CODE_L.logoCX - CODE_L.logo / 2, top: CODE_L.logoCY - CODE_L.logo / 2 }}><Logo size={CODE_L.logo} glow={0.8} /></div>
        {CODE.map((line, i) => {
          const a = 7.167 + i * 0.0156, d = 7.6 + i * 0.021;
          const o = E.out(seg(t, a, a + 0.1));
          if (o <= 0 || !line) return null;
          const lit = 1 - E.soft(seg(t, d, d + 0.12)); // measured de-glow wave, top to bottom
          const comment = line.trim().startsWith('//');
          return (
            <div key={i} style={{ position: 'absolute', left: CODE_L.x, top: CODE_L.firstCY + i * CODE_L.pitch - baseTop(CODE_L.size, 400, SANS) + ink('Hd', CODE_L.size, 400, SANS).a / 2,
              fontFamily: SANS, fontSize: CODE_L.size, lineHeight: 1, whiteSpace: 'pre', opacity: o,
              color: lit > 0.5 ? '#D6FFEF' : comment ? 'rgba(244,247,248,.68)' : C.ink, filter: o < 0.98 ? `blur(${(2.5 * (1 - o)).toFixed(2)}px)` : undefined,
              textShadow: lit > 0.02 ? `0 0 ${3 + 3 * lit}px ${mint(0.9 * lit)}, 0 0 ${12 + 10 * lit}px ${em(0.95 * lit)}, 0 0 ${26 * lit}px ${em(0.5 * lit)}` : `0 0 8px ${em(0.12)}` }}>{line}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 5 · capability words (8.583 – 11.717)
const WF = { weight: 400 };
// sizes chosen so each word's width equals the reference's measured width
const WRITING_W = 0.1773 * W, ANALYSIS_W = 0.2039 * W, GAP = 0.0203 * W, CODING_W = 0.1688 * W, RESEARCH_W = 0.2859 * W;
const Glyphs: React.FC<{ text: string; size: number; x: number; baseY: number; per: (i: number) => { o: number; blur: number; glow: number; dx?: number } }> = ({ text, size, x, baseY, per }) => {
  const top = baseY - baseTop(size, WF.weight, SANS);
  let pen = x;
  return (
    <>
      {[...text].map((ch, i) => {
        const left = pen; pen += textW(text.slice(0, i + 1), size, WF.weight) - textW(text.slice(0, i), size, WF.weight);
        const { o, blur, glow, dx = 0 } = per(i);
        if (o <= 0.003 || ch === ' ') return null;
        return (
          <div key={i} style={{ position: 'absolute', left: left + dx, top, fontFamily: SANS, fontWeight: WF.weight, fontSize: size, lineHeight: 1, color: glow > 0.5 ? '#E4FFF4' : C.ink, whiteSpace: 'pre', opacity: o,
            filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
            textShadow: glow > 0.01 ? `0 0 ${4 + 4 * glow}px ${mint(0.9 * glow)}, 0 0 ${18 + 22 * glow}px ${em(0.95 * glow)}, 0 0 ${50 * glow}px ${em(0.55 * glow)}` : undefined }}>{ch}</div>
        );
      })}
    </>
  );
};
const Words: React.FC<{ t: number }> = ({ t }) => {
  const SW = sizeFor('Writing', WRITING_W, WF.weight, SANS);
  const SA = SW; // one font size for the whole line, as in the reference
  const second = '& analysis';
  const wSecond = textW(second, SA, WF.weight);
  const extra = wSecond - ANALYSIS_W; // our second unit is longer than the reference's; recentre with the measured shift
  const lineCY = 0.4979 * H;
  if (t < 9.95) {
    const s = mono(t, WRITING_SCALE.t, WRITING_SCALE.s);
    // left edge: centred while it shrinks (before 8.867), then the measured track (shift as "analysis" lands, exit to the left)
    const xc = 0.503 * W;
    const xMeasured = mono(t, WRITING_X0.t, WRITING_X0.x) * W;
    const p = clamp((WRITING_X0.x[10] * W - xMeasured) / ((WRITING_X0.x[10] - WRITING_X0.x[22]) * W));
    const x0 = (t < 8.867 ? xc - (s * WRITING_W) / 2 : xMeasured) - (extra / 2) * p * s;
    const ax0 = mono(t, ANALYSIS_X0.t, ANALYSIS_X0.x) * W - (extra / 2) * p * s;
    const base = (size: number) => lineCY + (ink('Writing', size, WF.weight, SANS).a - ink('Writing', size, WF.weight, SANS).d) / 2;
    return (
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${x0}px ${lineCY}px`, transform: `scale(${s})` }}>
          <Glyphs text="Writing" size={SW} x={x0} baseY={base(SW)} per={(i) => {
            const tau = t - [8.583, 8.59, 8.633, 8.667, 8.7, 8.733, 8.767][i];
            return { o: E.out(seg(tau, 0, 0.03)), blur: 4 * (1 - E.out(seg(tau, 0, 0.1))), glow: tau < 0 ? 0 : 1.3 * Math.exp(-tau / 0.12) };
          }} />
        </div>
        {t >= 9.267 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${ax0}px ${lineCY}px`, transform: `scale(${s})` }}>
            <Glyphs text={second} size={SA} x={ax0} baseY={base(SA)} per={() => { const tau = t - 9.267; return { o: 1, blur: 3 * (1 - E.out(seg(tau, 0, 0.08))), glow: 1.1 * Math.exp(-tau / 0.1) }; }} />
          </div>
        )}
      </AbsoluteFill>
    );
  }
  if (t < 10.78) {
    const SC = sizeFor('Coding', CODING_W, WF.weight, SANS);
    const x0 = mono(t, CODING_X0.t, CODING_X0.x) * W;
    const z = mono(t, CODING_ZOOM.t, CODING_ZOOM.s, true);
    const cx = x0 + CODING_W / 2;
    const order = [2, 5, 0, 3, 1, 4]; // letters dissolve in a scattered order, as in the reference
    return (
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${cx}px ${0.5 * H}px`, transform: `scale(${t > 10.7 ? z * (1 + 1.2 * (t - 10.7)) : z})` }}>
          <Glyphs text="Coding" size={SC} x={x0} baseY={0.5 * H + (ink('Coding', SC, WF.weight, SANS).a - ink('Coding', SC, WF.weight, SANS).d) / 2} per={(i) => {
            const d = 10.63 + order.indexOf(i) * 0.022, k = seg(t, d, d + 0.06);
            return { o: 1 - k, blur: 6 * k, glow: 0 };
          }} />
        </div>
        {t >= 10.78 - 0.05 && <ResearchWord t={t} />}
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill><ResearchWord t={t} /></AbsoluteFill>;
};
const R_APPEAR = [10.78, 10.81, 10.875, 10.875, 10.78, 10.845, 10.845, 10.845]; // r e s e a r c h (estimate from glyph runs)
const ResearchWord: React.FC<{ t: number }> = ({ t }) => {
  const SR = sizeFor('Research', RESEARCH_W, WF.weight, SANS);
  const x0 = 0.357 * W, cy = 0.4889 * H;
  const s = mono(t, RESEARCH_SHRINK.t, RESEARCH_SHRINK.s);
  const m = ink('Research', SR, WF.weight, SANS);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${x0 + RESEARCH_W / 2}px ${cy}px`, transform: `scale(${s})` }}>
      <Glyphs text="Research" size={SR} x={x0} baseY={cy + (m.a - m.d) / 2} per={(i) => {
        const tau = t - R_APPEAR[i];
        return { o: E.out(seg(tau, 0, 0.035)), blur: 6 * (1 - E.out(seg(tau, 0, 0.12))), glow: tau < 0 ? 0 : 1.35 * Math.exp(-tau / 0.11), dx: 0.0086 * W * (1 - E.out(seg(tau, 0, 0.15))) };
      }} />
    </div>
  );
};

// ================================================================== 6 · logo flash → measured shrink → vanish (11.717 – 12.983)
const EndLogo: React.FC<{ t: number }> = ({ t }) => {
  const size = Math.max(0, mono(t, [11.717, ...END_LOGO.t], [0.25, ...END_LOGO.size]) * W);
  const bloom = 1 - E.soft(seg(t, 11.717, 11.96));
  if (size < 1) return null;
  return (
    <AbsoluteFill>
      {bloom > 0.01 && <div style={{ position: 'absolute', left: CX - size * 1.1, top: 0.496 * H - size * 1.1, width: size * 2.2, height: size * 2.2, borderRadius: '50%', opacity: bloom,
        background: `radial-gradient(circle, ${mint(0.5)} 0%, ${em(0.32)} 32%, ${em(0.08)} 58%, rgba(0,0,0,0) 72%)` }} />}
      <div style={{ position: 'absolute', left: CX - size / 2, top: 0.496 * H - size / 2 }}>
        <Logo size={size} glow={0.2 + 1.6 * bloom} color={bloom > 0.35 ? '#FFFFFF' : C.ink} />
      </div>
    </AbsoluteFill>
  );
};

// ================================================================== 7 · outro: ChatGPT logo, GPT Astra 6, creator credit (12.983 – end)
const Outro: React.FC<{ t: number }> = ({ t }) => {
  const s = mono(t, END_CARD.t, END_CARD.s); // the reference end card's measured scale-down
  const credit = E.out(seg(t, 13.2, 13.5));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${CX}px ${0.47 * H}px`, transform: `scale(${s})` }}>
        <div style={{ position: 'absolute', left: CX - 75, top: 0.47 * H - 150 }}><Logo size={150} glow={0.35} /></div>
        <div style={{ position: 'absolute', left: 0, width: W, top: 0.47 * H + 34, textAlign: 'center', fontFamily: SERIF, fontWeight: 400, fontSize: 66, lineHeight: 1, color: C.ink, letterSpacing: '0.005em', textShadow: `0 0 20px ${em(0.25)}` }}>GPT Astra 6</div>
      </div>
      <div style={{ position: 'absolute', left: 0, width: W, top: 0.47 * H + 138 + 12 * (1 - credit), textAlign: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 26, lineHeight: 1, letterSpacing: '0.02em',
        color: 'rgba(244,247,248,.78)', opacity: credit, filter: credit < 0.99 ? `blur(${(4 * (1 - credit)).toFixed(2)}px)` : undefined }}>Created by @h81t6</div>
    </AbsoluteFill>
  );
};

// ================================================================== frame
const Frame: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      {t < 1.0 && <Night t={t} />}
      {t >= 0.72 && t < 2.25 && <Brand t={t} />}
      {t >= 2.25 && t < 7.05 && <ChatUI t={t} />}
      {t >= 7.05 && t < 8.583 && <Code t={t} />}
      {t >= 8.583 && t < 11.717 && <Words t={t} />}
      {t >= 11.717 && t < 12.983 && <EndLogo t={t} />}
      {t >= 12.983 && <Outro t={t} />}
      {t < 0.95 && <div style={{ position: 'absolute', right: 40, bottom: 32, fontFamily: SANS, fontSize: 16, letterSpacing: '0.14em', color: 'rgba(244,247,248,.42)', opacity: 1 - seg(t, 0.7, 0.95) }}>FAN-MADE CONCEPT</div>}
    </AbsoluteFill>
  );
};

// temporal sub-frame sampling only inside FAST windows, and never across a cut (samples are clamped to the current shot),
// so fast moves get real motion blur while holds and cuts stay single, sharp images
const SHUTTER = 0.25, SAMPLES = 16;
const SubframeBlur: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (!FAST.some(([a, b]) => t >= a && t <= b)) return <>{children}</>;
  const [s0, s1] = shotOf(t);
  const frames = Array.from({ length: SAMPLES }, (_, i) => clamp(f + (i / (SAMPLES - 1) - 0.5) * SHUTTER, s0 * FPS, s1 * FPS - 0.001));
  return (
    <AbsoluteFill style={{ isolation: 'isolate' }}>
      {frames.map((fr, i) => (
        <AbsoluteFill key={i} style={{ mixBlendMode: 'plus-lighter', filter: `opacity(${1 / SAMPLES})` }}>
          <Freeze frame={fr}>{children}</Freeze>
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};
const Background: React.FC = () => <><Light t={useCurrentFrame() / FPS} /><Grain /></>;
export const AstraV3: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Audio src={staticFile('audio/reference.wav')} />
    <Background />
    <SubframeBlur><Frame /></SubframeBlur>
  </AbsoluteFill>
);
