import React from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

// ------------------------------------------------------------------ palette (app "teal" theme)
export const C = {
  bg: '#000000',
  field: '#0f242c',
  field2: '#10272f',
  line: '#284752',
  ink: '#edf9fb',
  mist: '#a7bdc3',
  flame: '#77ccdb',
  ember: '#32849b',
  hot: '#d3f6fb',
  glow: (a: number) => `rgba(119,204,219,${a.toFixed(3)})`,
  hotGlow: (a: number) => `rgba(211,246,251,${a.toFixed(3)})`,
};
export const FONT = 'Sora';

// ------------------------------------------------------------------ fonts: loaded once, render waits for them
const FACES: [number, string][] = [[300, 'sora-300-latin'], [400, 'sora-400-latin'], [600, 'sora-600-latin'], [700, 'sora-700-latin']];
let fontsReady = false;
if (typeof document !== 'undefined') {
  const handle = delayRender('Sora');
  Promise.all(FACES.map(([w, f]) => new FontFace(FONT, `url(${staticFile(`fonts/${f}.woff2`)}) format('woff2')`, { weight: String(w) }).load()))
    .then((faces) => { faces.forEach((f) => document.fonts.add(f)); fontsReady = true; continueRender(handle); })
    .catch((e) => { console.error(e); continueRender(handle); });
}

// text width with the real font (deterministic once the faces are loaded)
const mctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const cache = new Map<string, number>();
export function textW(s: string, size: number, weight = 400, tracking = 0): number {
  const k = `${s}|${size}|${weight}|${tracking}|${fontsReady}`;
  const hit = cache.get(k);
  if (hit !== undefined) return hit;
  if (!mctx) return s.length * size * 0.6;
  mctx.font = `${weight} ${size}px ${FONT}`;
  const w = mctx.measureText(s).width + tracking * size * s.length;
  cache.set(k, w);
  return w;
}

// ------------------------------------------------------------------ directional motion blur
// sigma in screen pixels along x / y. Below a hair it renders sharp — no constant blur anywhere.
export const MotionBlur: React.FC<{ id: string; sx: number; sy: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ id, sx, sy, style, children }) => {
  const on = sx > 0.35 || sy > 0.35;
  return (
    <div style={{ position: 'absolute', inset: 0, ...style, filter: on ? `url(#${id})` : undefined }}>
      {on && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} />
          </filter>
        </svg>
      )}
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ light trail (a comet with a tapered tail)
export const Trail: React.FC<{ pts: [number, number][]; width: number; alpha?: number; head?: number }> = ({ pts, width, alpha = 1, head = 0 }) => {
  if (pts.length < 2 || alpha <= 0.002) return null;
  const n = pts.length;
  const segs = [];
  for (let i = 1; i < n; i++) {
    const a = i / (n - 1);
    segs.push(
      <line key={i} x1={pts[i - 1][0]} y1={pts[i - 1][1]} x2={pts[i][0]} y2={pts[i][1]}
        stroke={C.hot} strokeOpacity={alpha * a * a} strokeWidth={width * (0.15 + 0.85 * a)} strokeLinecap="round" />,
    );
  }
  const [hx, hy] = pts[n - 1];
  return (
    <g>
      <g filter="url(#trailGlow)">{segs}</g>
      {head > 0 && <circle cx={hx} cy={hy} r={head} fill="url(#headGrad)" opacity={alpha} />}
    </g>
  );
};
export const TrailDefs: React.FC = () => (
  <defs>
    <filter id="trailGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="wide" />
      <feColorMatrix in="wide" type="matrix" values="0 0 0 0 0.47  0 0 0 0 0.80  0 0 0 0 0.86  0 0 0 0.9 0" result="tint" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="core" />
      <feMerge><feMergeNode in="tint" /><feMergeNode in="core" /></feMerge>
    </filter>
    <radialGradient id="headGrad">
      <stop offset="0" stopColor="#f2fdff" stopOpacity="1" />
      <stop offset="0.3" stopColor={C.flame} stopOpacity="0.55" />
      <stop offset="1" stopColor={C.ember} stopOpacity="0" />
    </radialGradient>
  </defs>
);

export const cubic = (p0: number[], p1: number[], p2: number[], p3: number[], u: number): [number, number] => {
  const v = 1 - u;
  return [
    v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
  ];
};
// points of a curve between parameters a..b (a tail behind a head)
export const sample = (f: (u: number) => [number, number], a: number, b: number, n = 36): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => f(a + ((b - a) * i) / n));

// ------------------------------------------------------------------ brand icon (app/icons/teal.svg)
export const AppIcon: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <svg width={size} height={size} viewBox="0 0 108 108" style={{ display: 'block', ...style }}>
    <defs>
      <linearGradient id="iconGrad" x2="1" y2="1">
        <stop stopColor="#83d8e6" stopOpacity=".25" />
        <stop offset="1" stopColor="#102a34" />
      </linearGradient>
    </defs>
    <rect width="108" height="108" rx="24" fill="#102a34" />
    <rect width="108" height="108" rx="24" fill="url(#iconGrad)" />
    <rect x="0.75" y="0.75" width="106.5" height="106.5" rx="23.3" fill="none" stroke="#83d8e6" strokeOpacity=".22" strokeWidth="1.5" />
    <path d="M34 76L54 30L74 76M42 59L66 59" fill="none" stroke="#83d8e6" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Magnifier: React.FC<{ size: number; color: string; stroke?: number }> = ({ size, color, stroke = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M15.4 15.4L20 20" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);

export const ClearX: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const Heart: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <path d="M12 20.3s-7.6-4.6-7.6-10.2A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.6 2.5c0 5.6-7.6 10.2-7.6 10.2z" fill="none" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
  </svg>
);

// pointing hand: white glove, dark outline (drawn for this project)
export const Hand: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.55))' }}>
    <path
      d="M24.5 6.5c2.6 0 4.6 2 4.6 4.6v16.2l1.4-.4c.2-2.4 2.2-4.2 4.6-4.2s4.4 1.9 4.6 4.3l1.5-.2c.4-2.2 2.3-3.8 4.6-3.8 2.5 0 4.5 2 4.6 4.5l1.2.1c.7-1.6 2.3-2.6 4.1-2.6 2.5 0 4.5 2 4.5 4.6v12.1c0 9.5-7.4 16.9-16.9 16.9h-5.4c-5.5 0-9.4-2.2-12.5-6.6l-9.4-13.1a4.6 4.6 0 0 1 7.2-5.7l2.7 3.1V11.1c0-2.6 2-4.6 4.6-4.6z"
      fill="#ffffff" stroke="#0a0f12" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M35.1 34v11M44.8 34v11M54.4 35v10" stroke="#0a0f12" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
