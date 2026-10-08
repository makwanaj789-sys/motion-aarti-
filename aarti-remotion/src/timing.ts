// Every cue in this project is written in REFERENCE FRAMES: frame numbers of the
// 30 fps reference cut, measured one frame at a time (see docs/REFERENCE_NOTES.md).
// The composition renders at 60 fps, so r = frame / 2 and every value is
// evaluated at half-frame resolution.
import { Easing } from 'remotion';

export const FPS = 60;
export const REF_FPS = 30;
export const REF_END = 366; // reference runs 336; +30 frames to give the end card reading time
export const TOTAL_FRAMES = REF_END * (FPS / REF_FPS);
export const W = 1920;
export const H = 1080;
export const CX = W / 2;
export const CY = H / 2;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (r: number, a: number, b: number) => clamp((r - a) / (b - a));

export const eOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const eOutQuad = (x: number) => 1 - (1 - x) * (1 - x);
export const eInCubic = (x: number) => x * x * x;
export const eInQuad = (x: number) => x * x;
export const eInOutSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
export const eInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const bez = (x1: number, y1: number, x2: number, y2: number) => Easing.bezier(x1, y1, x2, y2);

// Curves fitted to the reference's measured progress tables (docs/REFERENCE_NOTES.md).
// Least-squares fits; residuals are listed in docs/REFERENCE_NOTES.md.
const fitted = (a: number, b: number, c: [number, number, number, number]) => {
  const f = bez(...c);
  return (r: number) => f(seg(r, a, b));
};
export const E = {
  lockup: fitted(22.5, 44.5, [0.55, 0, 0.02, 1]), // icon slides aside for the wordmark
  whipZoom: fitted(96, 110.5, [0.85, 0.05, 0.2, 1]), // push into the search field
  whipPan: fitted(127.5, 148, [0.55, 0.05, 0.05, 1]), // pan along the query
  liftOut: fitted(149, 171, [0.6, 0.05, 0.3, 1]), // field leaves upward
  greetUp: fitted(80, 91.5, [0.8, 0.05, 0.4, 1]), // greeting climbs above the field
};

// a smooth bump: 0 → 1 at m → 0, sine-shaped
export const bump = (r: number, a: number, m: number, b: number) =>
  r <= a || r >= b ? 0 : r < m ? eInOutSine((r - a) / (m - a)) : eInOutSine((b - r) / (b - m));

// Keyframed value with Catmull-Rom tangents: velocity stays continuous through
// interior keys and is zero at the first and last key.
export function spline(r: number, keys: [number, number][]): number {
  if (r <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (r >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (r > keys[i + 1][0]) i++;
  const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
  const h = t1 - t0, u = (r - t0) / h;
  const slope = (k: number) => {
    if (k === 0 || k === n - 1) return 0;
    return (keys[k + 1][1] - keys[k - 1][1]) / (keys[k + 1][0] - keys[k - 1][0]);
  };
  const m0 = slope(i) * h, m1 = slope(i + 1) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1;
}

// Directional motion blur: Gaussian sigma for an element whose screen position is pos(r).
// The virtual shutter stays open for half a reference frame (one 60 fps frame),
// so blur length = speed × 0.5; a box of length L is matched by sigma ≈ L / 2.4.
export const SHUTTER = 0.5;
export function blurOf(pos: (r: number) => [number, number], r: number, max = 70): [number, number] {
  const d = 0.25;
  const [x0, y0] = pos(r - d), [x1, y1] = pos(r + d);
  const vx = (x1 - x0) / (2 * d), vy = (y1 - y0) / (2 * d);
  const s = (v: number) => Math.min(max, (Math.abs(v) * SHUTTER) / 2.4);
  return [s(vx), s(vy)];
}
