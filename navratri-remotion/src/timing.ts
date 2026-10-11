// Timeline locked to the song (public/audio/song.wav, 15.63 s).
// Beat grid fitted to the track's onset envelope: beat k sits at 0.400 + 0.5225·k s (≈114.8 BPM).
// Downbeats fall on k = 2, 6, 10, 14 …; the dhol section enters on k = 14 (7.72 s).
import { Easing } from 'remotion';

export const FPS = 60;
export const W = 1920;
// 1920×572: the reference reel's 3.35:1 canvas (even height for H.264 4:2:0).
export const H = 572;
export const SONG_END = 15.628;
export const TOTAL_FRAMES = Math.round(SONG_END * FPS);

export const BEAT = 0.5225;
export const b = (k: number) => 0.4 + BEAT * k; // seconds of beat k

// section cuts (vocal phrases enter on these beats)
export const CUT = {
  open: 0,
  garba: b(3), // 1.97 s
  ramzat: b(7), // 4.06 s
  textiles: b(10), // 5.63 s
  dandiya: b(14), // 7.72 s — dhol enters
  raas: b(16), // 8.76 s
  garbo: b(18), // 9.81 s
  amba: b(22), // 11.90 s
  close: b(26), // 13.99 s — final phrase
  credit: b(26.6), // 14.30 s
  end: SONG_END,
};

export const clamp = (x: number, a = 0, c = 1) => Math.min(c, Math.max(a, x));
export const lerp = (a: number, c: number, t: number) => a + (c - a) * t;
export const seg = (t: number, a: number, c: number) => clamp((t - a) / (c - a));
export const eOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const eOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
export const eInCubic = (x: number) => x * x * x;
export const eInOutSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
export const eInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const smooth = Easing.bezier(0.65, 0, 0.2, 1); // deliberate accelerate → long settle
export const snap = Easing.bezier(0.2, 0.9, 0.25, 1); // fast arrival, no overshoot

// directional motion blur from analytic velocity (shutter = one 60 fps frame)
export function blurOf(pos: (t: number) => [number, number], t: number, max = 28): [number, number] {
  const d = 1 / 240;
  const [x0, y0] = pos(t - d), [x1, y1] = pos(t + d);
  const vx = (x1 - x0) / (2 * d), vy = (y1 - y0) / (2 * d);
  const s = (v: number) => Math.min(max, (Math.abs(v) / FPS) / 2.4);
  return [s(vx), s(vy)];
}
