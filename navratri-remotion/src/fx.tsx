import React from 'react';
import { Img, continueRender, delayRender, staticFile } from 'remotion';
import { SLOTS, sizeOf } from './assets';

// ------------------------------------------------------------------ palette
export const C = {
  vermilion: '#D9381E',
  rani: '#D61F69',
  marigold: '#F4A300',
  emerald: '#0B7A4B',
  purple: '#5B1F8C',
  cream: '#F7EBD3',
  maroon: '#5E0F14',
  ink: '#1B0B0E',
};
// tone-on-tone background type: the bg colour, a little lighter
export const tint = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, bl = n & 255;
  const m = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${m(r)},${m(g)},${m(bl)})`;
};

// ------------------------------------------------------------------ fonts (three families)
export const F = {
  display: 'Anton', // bold condensed, musical accents
  serif: 'Playfair Display', // high-contrast serif, cultural titles + credit
  guj: 'Noto Serif Gujarati', // Gujarati text
};
const FACES: [string, string, string, string][] = [
  ['Anton', 'anton-latin-400-normal', '400', 'normal'],
  ['Playfair Display', 'playfair-display-latin-400-normal', '400', 'normal'],
  ['Playfair Display', 'playfair-display-latin-600-normal', '600', 'normal'],
  ['Playfair Display', 'playfair-display-latin-400-italic', '400', 'italic'],
  ['Playfair Display', 'playfair-display-latin-600-italic', '600', 'italic'],
  ['Noto Serif Gujarati', 'noto-serif-gujarati-gujarati-400-normal', '400', 'normal'],
  ['Noto Serif Gujarati', 'noto-serif-gujarati-gujarati-600-normal', '600', 'normal'],
  ['Noto Serif Gujarati', 'noto-serif-gujarati-gujarati-700-normal', '700', 'normal'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(FACES.map(([fam, file, weight, style]) => new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, { weight, style }).load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}

// ------------------------------------------------------------------ motion blur (directional, only while moving)
export const MotionBlur: React.FC<{ id: string; sx: number; sy: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ id, sx, sy, style, children }) => {
  const on = sx > 0.4 || sy > 0.4;
  return (
    <div style={{ position: 'absolute', inset: 0, ...style, filter: on ? `url(#${id})` : style?.filter }}>
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

// ------------------------------------------------------------------ photos
const Placeholder: React.FC<{ id: string; w: number; h: number; cut?: boolean }> = ({ id, w, h, cut }) => (
  <div style={{ width: w, height: h, boxSizing: 'border-box', border: '3px dashed rgba(255,255,255,.75)', borderRadius: cut ? 28 : 10,
    background: 'repeating-linear-gradient(45deg, rgba(0,0,0,.28) 0 14px, rgba(0,0,0,.18) 14px 28px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center',
    fontFamily: 'sans-serif', fontSize: Math.max(13, Math.min(22, w / 14)), lineHeight: 1.3, padding: 10 }}>
    <b>PHOTO NEEDED · {id}</b>
    <span style={{ opacity: 0.85 }}>{SLOTS[id]?.what}</span>
  </div>
);

// a photo cropped (never stretched) to fill a w×h box, keeping its focus point in frame
export const Photo: React.FC<{ id: string; w: number; h: number; radius?: number; style?: React.CSSProperties; zoom?: number }> = ({ id, w, h, radius = 0, style, zoom = 1 }) => {
  const s = SLOTS[id];
  if (!s?.file) return <div style={style}><Placeholder id={id} w={w} h={h} /></div>;
  const [iw, ih] = sizeOf(id);
  const k = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * k, dh = ih * k;
  const [fx, fy] = s.focus ?? [0.5, 0.5];
  const left = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
  const top = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
  return (
    <div style={{ width: w, height: h, overflow: 'hidden', borderRadius: radius, position: 'relative', ...style }}>
      <Img src={staticFile(s.file)} style={{ position: 'absolute', left, top, width: dw, height: dh }} />
    </div>
  );
};

// a cutout drawn at a given height, aspect kept, with a soft contact shadow
export const Cutout: React.FC<{ id: string; h: number; style?: React.CSSProperties; shadow?: number }> = ({ id, h, style, shadow = 0.35 }) => {
  const s = SLOTS[id];
  const [iw, ih] = sizeOf(id);
  const w = (iw / ih) * h;
  if (!s?.file) return <div style={style}><Placeholder id={id} w={h * 0.62} h={h} cut /></div>;
  return (
    <Img src={staticFile(s.file)} style={{ width: w, height: h, display: 'block', filter: `drop-shadow(0 ${h * 0.02}px ${h * 0.03}px rgba(20,5,5,${shadow}))`, ...style }} />
  );
};
export const cutoutWidth = (id: string, h: number) => {
  if (!SLOTS[id]?.file) return h * 0.62;
  const [iw, ih] = sizeOf(id);
  return (iw / ih) * h;
};

// ------------------------------------------------------------------ textile details (vector, low contrast)
// bandhani: rings of tiny tie-dye dots
export const Bandhani: React.FC<{ w: number; h: number; color: string; opacity?: number; step?: number }> = ({ w, h, color, opacity = 0.18, step = 46 }) => {
  const dots = [];
  for (let y = step / 2, row = 0; y < h + step; y += step * 0.86, row++) {
    for (let x = (row % 2 ? step / 2 : 0); x < w + step; x += step) {
      dots.push(<g key={`${x}-${y}`} transform={`translate(${x},${y})`}>
        <circle r={3.2} fill={color} />
        {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={Math.cos(i * 1.047) * 8} cy={Math.sin(i * 1.047) * 8} r={1.6} fill={color} />)}
      </g>);
    }
  }
  return <svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, opacity }}>{dots}</svg>;
};

// a simple lotus-petal ring used behind the Amba image (drawn, not an icon)
export const PetalRing: React.FC<{ r: number; color: string; petals?: number; opacity?: number; rot?: number }> = ({ r, color, petals = 24, opacity = 1, rot = 0 }) => (
  <svg width={r * 2.4} height={r * 2.4} viewBox={`${-r * 1.2} ${-r * 1.2} ${r * 2.4} ${r * 2.4}`} style={{ display: 'block', opacity }}>
    <g transform={`rotate(${rot})`}>
      {Array.from({ length: petals }, (_, i) => (
        <path key={i} transform={`rotate(${(i * 360) / petals})`} d={`M0 ${-r * 0.78} C ${r * 0.09} ${-r * 0.9}, ${r * 0.08} ${-r * 1.08}, 0 ${-r * 1.16} C ${-r * 0.08} ${-r * 1.08}, ${-r * 0.09} ${-r * 0.9}, 0 ${-r * 0.78}Z`} fill={color} />
      ))}
      <circle r={r * 0.76} fill="none" stroke={color} strokeWidth={r * 0.025} />
      <circle r={r * 0.7} fill="none" stroke={color} strokeWidth={r * 0.01} strokeDasharray={`${r * 0.03} ${r * 0.03}`} />
    </g>
  </svg>
);
