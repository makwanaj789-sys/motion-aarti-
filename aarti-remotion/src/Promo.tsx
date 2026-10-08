import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import {
  CX, CY, E, H, W, blurOf, bump, clamp, eInCubic, eInOutCubic, eInOutSine, eInQuad, eOutCubic, eOutQuad, lerp, seg, spline,
} from './timing';
import { AppIcon, C, ClearX, FONT, Hand, Heart, Magnifier, MotionBlur, Trail, TrailDefs, cubic, sample, textW } from './fx';
import { QUERY, RESULTS, Item } from './data';

const ABS: React.CSSProperties = { position: 'absolute', left: 0, top: 0 };
const txt = (size: number, weight = 400, color: string = C.ink, extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...ABS, fontFamily: FONT, fontSize: size, fontWeight: weight, color, whiteSpace: 'pre', lineHeight: 1, ...extra,
});
const glow = (a: number, r = 22) => (a > 0.004 ? `0 0 ${r}px ${C.glow(a)}` : 'none');

// ================================================================== LOGO LOCKUP (shared by the open and the end card)
const lockupLayout = (icon: number, gap: number, size: number, weight: number) => {
  const name = 'AartiMusic';
  const total = icon + gap + textW(name, size, weight);
  const left = CX - total / 2;
  const letters = [...name].map((ch, i) => ({ ch, x: left + icon + gap + textW(name.slice(0, i), size, weight) }));
  return { iconX: left + icon / 2, letters };
};

// letters ride in from the right, spread wide, then close up with a long settle (measured r25–42)
const letterX = (r: number, base: number, i: number, n: number, start: number) => {
  const s = start + 0.5 * i;
  const spread = (90 + 330 * (i / (n - 1))) * Math.pow(1 - seg(r, start + 1.5, start + 17), 3);
  const entry = 60 * (1 - eOutCubic(seg(r, s, s + 4)));
  return base + spread + entry;
};

// `icon` is the solo icon size; as it slides aside it shrinks by `iconEnd` (reference: ×0.6)
const Lockup: React.FC<{ r: number; shift: number; icon: number; iconEnd: number; size: number; weight: number; y: number; iconScale: number; iconGlow: number; id: string }> = ({ r, shift, icon, iconEnd, size, weight, y, iconScale, iconGlow, id }) => {
  const fin = icon * iconEnd;
  const L = lockupLayout(fin, fin * 0.3, size, weight);
  const p = E.lockup(r - shift);
  const ix = (rr: number): [number, number] => [lerp(CX, L.iconX, E.lockup(rr - shift)), 0];
  const [ibx] = blurOf(ix, r);
  const start = 25 + shift;
  return (
    <>
      <MotionBlur id={`${id}-icon`} sx={ibx} sy={0}>
        <div style={{ ...ABS, left: lerp(CX, L.iconX, p) - icon / 2, top: y - icon / 2, transform: `scale(${iconScale * lerp(1, iconEnd, p)})`,
          filter: `drop-shadow(0 0 ${18 + 26 * iconGlow}px ${C.glow(0.22 + 0.5 * iconGlow)})` }}>
          <AppIcon size={icon} />
        </div>
      </MotionBlur>
      {L.letters.map(({ ch, x }, i) => {
        const s = start + 0.5 * i;
        if (r < s) return null;
        const pos = (rr: number): [number, number] => [letterX(rr, x, i, L.letters.length, start), 0];
        const [bx] = blurOf(pos, r);
        const op = eOutCubic(seg(r, s, s + 3));
        return (
          <MotionBlur key={i} id={`${id}-l${i}`} sx={bx} sy={0}>
            <div style={txt(size, weight, C.ink, { left: pos(r)[0], top: y - size * 0.52, opacity: op, letterSpacing: 0, textShadow: glow(0.18 + 0.25 * (1 - op), 24) })}>{ch}</div>
          </MotionBlur>
        );
      })}
    </>
  );
};

// ================================================================== 1 · OPEN: streak → spark → icon → wordmark (r0–53)
const Open: React.FC<{ r: number }> = ({ r }) => {
  const P0 = [60, 1120], P1 = [520, 790], P2 = [800, 600], P3 = [CX, CY];
  const curve = (u: number) => cubic(P0, P1, P2, P3, u);
  const uH = 1 - Math.pow(1 - seg(r, 1.3, 4.8), 4);
  const uT = eInOutSine(seg(r, 2.2, 5.6));
  const streakA = 1 - seg(r, 5.0, 6.0);

  const spark = bump(r, 5.4, 8, 11);
  const sparkR = lerp(8, 70, seg(r, 5.5, 10.5));
  const iconScale = r < 12.5 ? lerp(0.3, 1.22, eOutCubic(seg(r, 8.8, 12.5)))
    : r < 13.8 ? lerp(1.22, 1.3, eInOutSine(seg(r, 12.5, 13.8))) : lerp(1.3, 1, eInOutSine(seg(r, 13.8, 16.5)));
  // a wide, dim halo ring (measured radius ≈210 → 285 px)
  const ringR = lerp(150, 290, eOutCubic(seg(r, 9.5, 12.8)));
  const ringA = 0.2 * bump(r, 9.5, 12, 16.5);

  // exit: the lockup sinks and fades (r47–53.5)
  const dropAt = (rr: number) => 150 * eInCubic(seg(rr, 47, 53.5));
  const [, dropBlur] = blurOf((rr) => [0, dropAt(rr)], r);
  const exitOp = 1 - eInQuad(seg(r, 48.5, 53));

  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={ABS}>
        <TrailDefs />
        {r >= 1 && r < 6 && <Trail pts={sample(curve, uT, Math.max(uT + 0.001, uH), 40)} width={16} head={34} alpha={streakA} />}
        {spark > 0 && <circle cx={CX} cy={CY} r={sparkR} fill="url(#headGrad)" opacity={spark} />}
      </svg>
      {ringA > 0.003 && (
        <div style={{ ...ABS, left: CX - ringR - 40, top: CY - ringR - 40, width: 2 * ringR + 80, height: 2 * ringR + 80, borderRadius: '50%',
          background: `radial-gradient(circle, transparent ${ringR - 46}px, ${C.glow(ringA)} ${ringR}px, transparent ${ringR + 40}px)` }} />
      )}
      {r >= 8.8 && r < 54 && (
        <MotionBlur id="openDrop" sx={0} sy={dropBlur} style={{ opacity: exitOp, transform: `translateY(${dropAt(r)}px) scale(${1 - 0.04 * seg(r, 47, 53.5)})`, transformOrigin: `${CX}px ${CY}px` }}>
          <Lockup r={r} shift={0} icon={120} iconEnd={0.62} size={70} weight={400} y={CY} iconScale={iconScale} iconGlow={bump(r, 9, 12.5, 19)} id="open" />
        </MotionBlur>
      )}
    </AbsoluteFill>
  );
};

// ================================================================== greeting geometry (world space = screen space in the wide shot)
const GREET = { words: ['Good', 'evening,', 'Ajay'], size: 84, icon: 70 };
const greetLayout = (r: number) => {
  const up = E.greetUp(r);
  const y = r < 80 ? CY - 9 * eInOutSine(seg(r, 70, 80)) : lerp(CY - 9, 393, up);
  const sc = r < 80 ? 1 - 0.05 * eInOutSine(seg(r, 70, 80)) : lerp(0.95, 0.66, up);
  const extra = spline(r, [[61, 150], [63, 95], [65.5, 12], [67, -12], [70, -10], [74, -2], [77, 0]]);
  const size = GREET.size * sc, icon = GREET.icon * sc, gap = 18 * sc;
  const space = textW(' ', size) + extra * sc;
  const ws = GREET.words.map((w) => textW(w, size));
  const total = icon + gap + ws.reduce((a, b) => a + b, 0) + 2 * space;
  let x = CX - total / 2 + icon + gap;
  const xs = ws.map((w) => { const v = x; x += w + space; return v; });
  return { y, sc, size, icon, iconX: CX - total / 2, xs };
};
// where each comet lands: the icon and the three words of the greeting at rest
const landing = () => { const g = greetLayout(78); return [[g.iconX + g.icon / 2, g.y], [g.xs[0] + 40, g.y], [g.xs[1] + 60, g.y], [g.xs[2] + 50, g.y]]; };

// ================================================================== 2 · light arcs gather into the greeting (r53–63)
const Arcs: React.FC<{ r: number }> = ({ r }) => {
  const L = landing();
  const paths: { p: number[][]; a: number; b: number; w: number }[] = [
    { p: [[930, 690], [420, 1130], [130, 520], L[0]], a: 53, b: 62, w: 10 },
    { p: [[990, 700], [1560, 1150], [1720, 260], L[3]], a: 53.5, b: 62.5, w: 10 },
    { p: [[960, 660], [1180, -60], [760, 60], L[2]], a: 54, b: 62, w: 9 },
    { p: [[920, 700], [640, 330], [460, 140], L[1]], a: 55, b: 61.5, w: 7 },
  ];
  return (
    <svg width={W} height={H} style={ABS}>
      <TrailDefs />
      {paths.map(({ p, a, b, w }, i) => {
        const u = seg(r, a, b);
        if (u <= 0 || u >= 1) return null;
        const head = eInOutSine(u) * 0.75 + eOutCubic(u) * 0.25;
        const tail = Math.max(0, head - 0.34);
        const al = (1 - seg(r, b - 2.2, b)) * Math.min(1, u * 6);
        return <Trail key={i} pts={sample((uu) => cubic(p[0], p[1], p[2], p[3], uu), tail, head, 36)} width={w} head={12} alpha={al} />;
      })}
    </svg>
  );
};

// ================================================================== 3 · greeting + search field, one camera (r60–171)
const FIELD = { x: 340, y: 463, w: 1240, h: 224, rad: 66 };
const TEXT_X = FIELD.x + 84, TEXT_SIZE = 64;
const KEYS = [113, 114.5, 116, 118, 119.5, 121, 122.5, 125, 126.5, 128, 129.5, 131, 133, 135, 137, 140, 142, 144, 146.5];
const typedAt = (r: number) => KEYS.filter((k) => r >= k).length;

export const camera = (r: number) => {
  const p1 = E.whipZoom(r);
  const drift = eInOutSine(seg(r, 110, 130));
  const p2 = E.whipPan(r);
  const lift = E.liftOut(r);
  return {
    x: lerp(CX, 700, p1) + 30 * drift + 450 * p2,
    y: lerp(CY, 535, p1) + 520 * lift,
    z: lerp(1, 1.5, p1) + 0.05 * drift + 0.01 * p2,
  };
};
const toScreen = (r: number, wx: number, wy: number): [number, number] => {
  const c = camera(r);
  return [CX + (wx - c.x) * c.z, CY + (wy - c.y) * c.z];
};

const GreetingField: React.FC<{ r: number }> = ({ r }) => {
  const cam = camera(r);
  // blur follows the screen motion of the part of the field the eye is on
  const focusX = r < 128 ? 620 : 1150;
  // horizontal whips get the reference's long smear; the vertical lift keeps a normal shutter
  const [bx] = blurOf((rr) => toScreen(rr, focusX, 575), r, 90, 1.0);
  const [, by] = blurOf((rr) => toScreen(rr, focusX, 575), r, 40);
  const g = greetLayout(r);
  const out = 1 - seg(r, 159, 170);
  const greetGlow = 0.12 + 0.55 * bump(r, 62, 66.5, 72);

  // the bloom that becomes the field (r80.5–89.5)
  const bloomA = spline(r, [[80.5, 0], [81.5, 0.35], [83, 0.85], [84.2, 1], [85.5, 0.85], [87, 0.45], [88.5, 0.1], [89.5, 0]]);
  const rx = spline(r, [[80.5, 60], [82, 260], [84, 520], [85.5, 610], [87, 700], [88.5, 640]]);
  const ry = spline(r, [[80.5, 26], [82, 80], [84, 128], [86, 120], [87.5, 112]]);
  const bloomY = spline(r, [[80.5, 690], [84, 684], [86, 640], [88, 592], [89.5, FIELD.y + FIELD.h / 2]]);
  const fieldIn = eOutCubic(seg(r, 85.5, 89.5));
  const fieldOp = eOutCubic(seg(r, 85.5, 88.5));
  const bloomY0 = 640 - (FIELD.y + FIELD.h / 2); // the box condenses where the bloom is at r86
  const focused = seg(r, 108, 110);
  const n = typedAt(r);
  const typed = QUERY.slice(0, n);
  const caretX = TEXT_X + textW(typed, TEXT_SIZE);
  const lastKey = n ? KEYS[n - 1] : 109;
  const caretOn = r >= 109 && (r - lastKey < 6 || Math.floor((r - lastKey - 6) / 8) % 2 === 1);
  const under = 0.2 * eOutCubic(seg(r, 88, 96));

  return (
    <MotionBlur id="worldBlur" sx={bx} sy={by} style={{ opacity: out }}>
      <div style={{ ...ABS, width: W, height: H, transformOrigin: '0 0', transform: `translate(${CX}px,${CY}px) scale(${cam.z}) translate(${-cam.x}px,${-cam.y}px)` }}>
        {/* greeting */}
        <div style={{ ...ABS, left: g.iconX, top: g.y - g.icon / 2, opacity: eOutCubic(seg(r, 61, 63.5)), filter: `drop-shadow(0 0 ${14 + 20 * greetGlow}px ${C.glow(0.25 + 0.4 * greetGlow)})` }}>
          <AppIcon size={g.icon} />
        </div>
        {GREET.words.map((w, i) => {
          const p = eOutCubic(seg(r, 61.5 + 0.8 * i, 64 + 0.8 * i));
          return (
            <div key={i} style={txt(g.size, 400, i === 2 ? '#c9eff6' : C.ink, { left: g.xs[i], top: g.y - g.size * 0.52, opacity: p,
              filter: p < 0.99 ? `blur(${(8 * (1 - p)).toFixed(2)}px)` : undefined, textShadow: glow(greetGlow, 26) })}>{w}</div>
          );
        })}
        {/* bloom */}
        {bloomA > 0.003 && (
          <svg width={W} height={H} style={{ ...ABS, overflow: 'visible' }}>
            <defs><filter id="bloomBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter></defs>
            <ellipse cx={CX} cy={bloomY} rx={rx} ry={ry} fill="none" stroke={C.hot} strokeOpacity={bloomA * 0.6} strokeWidth={ry * 0.8} filter="url(#bloomBlur)" />
          </svg>
        )}
        {/* soft light pooled under the field */}
        {under > 0 && (
          <div style={{ ...ABS, left: FIELD.x - 80, top: FIELD.y + FIELD.h - 60, width: FIELD.w + 160, height: 220,
            background: `radial-gradient(ellipse 50% 50% at 50% 30%, ${C.glow(under)}, transparent 70%)` }} />
        )}
        {/* the field */}
        {r >= 85.5 && (
          <div style={{ ...ABS, left: FIELD.x, top: FIELD.y, width: FIELD.w, height: FIELD.h, borderRadius: FIELD.rad, opacity: fieldOp,
            transform: `translateY(${(lerp(bloomY0, 0, fieldIn)).toFixed(2)}px) scale(${lerp(1.25, 1, fieldIn)}, ${lerp(0.8, 1, fieldIn)})`,
            filter: fieldIn < 0.995 ? `brightness(${lerp(2.6, 1, fieldIn).toFixed(3)}) blur(${(12 * (1 - fieldIn)).toFixed(2)}px)` : undefined,
            background: `linear-gradient(180deg, ${C.field2}, #0b1c23)`,
            boxShadow: `inset 0 0 0 3px ${focused > 0 ? `rgba(119,204,219,${(0.35 + 0.6 * focused).toFixed(3)})` : C.line}, 0 24px 60px rgba(0,0,0,.55)` }}>
            {n === 0 && <div style={txt(TEXT_SIZE, 400, C.mist, { left: TEXT_X - FIELD.x, top: FIELD.h / 2 - TEXT_SIZE * 0.55 })}>Songs, artists…</div>}
            {n > 0 && <div style={txt(TEXT_SIZE, 400, C.ink, { left: TEXT_X - FIELD.x, top: FIELD.h / 2 - TEXT_SIZE * 0.55 })}>{typed}</div>}
            {caretOn && <div style={{ ...ABS, left: caretX - FIELD.x + 4, top: FIELD.h / 2 - 42, width: 4, height: 80, borderRadius: 2, background: C.ink }} />}
            <div style={{ ...ABS, left: FIELD.w - 250, top: FIELD.h / 2 - 30, opacity: eOutCubic(seg(r, 113, 115)) }}><ClearX size={60} color="#3f78bd" /></div>
            <div style={{ ...ABS, left: FIELD.w - 150, top: FIELD.h / 2 - 38 }}><Magnifier size={76} color="#9fb7bf" stroke={2} /></div>
          </div>
        )}
      </div>
    </MotionBlur>
  );
};

// ================================================================== 4 · the search press (r169–211)
const Press: React.FC<{ r: number }> = ({ r }) => {
  const B = 176;
  const rise = (rr: number) => 123 * (1 - eOutCubic(seg(rr, 170, 187)));
  const drop = (rr: number) => 280 * eInCubic(seg(rr, 203, 208.5));
  const by = (rr: number) => CY + rise(rr) + drop(rr);
  const [, bBlur] = blurOf((rr) => [0, by(rr)], r);
  const op = eOutCubic(seg(r, 170, 176)) * (1 - eInQuad(seg(r, 204.5, 208.5)));
  const press = 1 - 0.06 * bump(r, 188.5, 190, 192);
  const pale = bump(r, 198.5, 200.5, 204.5);

  const HS = 190, tip = [HS * 0.383, HS * 0.1];
  const handAt = (rr: number): [number, number] => {
    const k = 1 - eOutCubic(seg(rr, 172.5, 188));
    return [CX + 30 - tip[0] + 70 * k, CY + 40 - tip[1] + 400 * k + 600 * eInCubic(seg(rr, 203.5, 210))];
  };
  const [hbx, hby] = blurOf(handAt, r);
  const [hx, hy] = handAt(r);
  const handOp = seg(r, 172.5, 174) * (1 - seg(r, 207, 210));
  const handPress = 1 - 0.1 * bump(r, 188, 189.5, 191.5);

  const ringR = spline(r, [[190, 60], [191.5, 300], [192, 440], [193, 465], [194, 520], [195, 640], [196, 790], [197, 960], [198, 1200], [199, 1450], [200, 1700]]);
  const ringT = spline(r, [[190, 40], [192, 110], [196, 220], [199, 300]]);
  const ringA = spline(r, [[190, 0], [191.3, 0.25], [192, 0.3], [194, 0.42], [196, 0.55], [197, 0.5], [198, 0.3], [199.5, 0.1], [200.5, 0]]);

  return (
    <AbsoluteFill>
      {ringA > 0.003 && (
        <div style={{ ...ABS, width: W, height: H,
          background: `radial-gradient(circle at ${CX}px ${CY}px, transparent ${ringR - ringT}px, ${C.hotGlow(ringA * 0.55)} ${ringR - ringT * 0.35}px, ${C.hotGlow(ringA)} ${ringR}px, ${C.glow(ringA * 0.5)} ${ringR + ringT * 0.35}px, transparent ${ringR + ringT}px)` }} />
      )}
      <MotionBlur id="btnBlur" sx={0} sy={bBlur}>
        <div style={{ ...ABS, left: CX - B / 2, top: by(r) - B / 2, width: B, height: B, borderRadius: 46, opacity: op,
          transform: `scale(${press})`,
          filter: `brightness(${(lerp(0.45, 1, seg(r, 170, 178)) * lerp(1, 0.45, seg(r, 203, 208))).toFixed(3)})`,
          background: `linear-gradient(160deg, #8fd9e6, ${C.flame} 45%, #4fa9bb)`,
          boxShadow: `0 0 ${30 + 30 * pale}px ${C.glow(0.28 + 0.3 * pale)}, inset 0 1px 0 rgba(255,255,255,.35)` }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 46, background: `rgba(240,252,255,${(0.5 * pale).toFixed(3)})` }} />
          <div style={{ position: 'absolute', left: B / 2 - 46, top: B / 2 - 46 }}><Magnifier size={92} color="#06222a" stroke={2.4} /></div>
        </div>
      </MotionBlur>
      {handOp > 0.003 && (
        <MotionBlur id="handBlur" sx={hbx} sy={hby}>
          <div style={{ ...ABS, left: hx, top: hy, opacity: handOp, transform: `scale(${handPress})`, transformOrigin: `${tip[0]}px ${tip[1]}px` }}>
            <Hand size={HS} />
          </div>
        </MotionBlur>
      )}
    </AbsoluteFill>
  );
};

// ================================================================== 5 · results stream in, camera eases out (r212–282)
const resultsView = (r: number) => {
  const z = spline(r, [[212, 1.25], [224, 1.25], [240, 1.1], [262, 0.64], [272, 0.6]]);
  const L = spline(r, [[212, 100], [224, 100], [240, 112], [262, 500], [272, 528]]);
  const T = r < 222.5 ? lerp(-70, 282, eOutCubic(seg(r, 212.5, 222.5))) : spline(r, [[222.5, 282], [228, 268], [236, 170], [242, 112], [252, 98], [262, 140], [272, 179]]);
  return { z, L, T };
};
const heatOf = (r: number, t: number) => (r < t ? 0 : Math.exp(-(r - t) / 4.5));
const squashOf = (r: number) => eInCubic(seg(r, 272.5, 277.5));
const SQ_CENTER: [number, number] = [CX, 513];

const ItemView: React.FC<{ it: Item; r: number }> = ({ it, r }) => {
  if (r < it.t) return null;
  if (it.kind !== 'row') {
    const size = it.kind === 'header' ? 46 : it.kind === 'section' ? 34 : 32;
    const weight = it.kind === 'footer' ? 400 : 600;
    const color = it.kind === 'footer' ? C.mist : it.kind === 'section' ? '#cfe9ee' : C.ink;
    const words = it.text.split(' ');
    let x = 0;
    return (
      <>
        {words.map((w, i) => {
          const tw = it.t + i * (it.kind === 'footer' ? 0.6 : 0.45);
          const left = x; x += textW(w + ' ', size, weight);
          if (r < tw) return null;
          const h = heatOf(r, tw), p = eOutCubic(seg(r, tw, tw + 1.6));
          return <div key={i} style={txt(size, weight, h > 0.5 ? C.hot : color, { left, top: it.y, opacity: p, textShadow: glow(0.75 * h, 18) })}>{w}</div>;
        })}
      </>
    );
  }
  // a song / playlist row, built like the app's list row
  const t = it.t, h = heatOf(r, t + 0.6);
  const wipe = (a: number, b: number) => `inset(-30px ${(100 * (1 - eOutCubic(seg(r, a, b)))).toFixed(2)}% -30px -10px)`;
  return (
    <div style={{ ...ABS, top: it.y, width: 1440, height: 92 }}>
      <div style={{ ...ABS, width: 80, height: 80, borderRadius: 16, overflow: 'hidden', opacity: eOutCubic(seg(r, t, t + 2.2)),
        transform: `scale(${lerp(0.88, 1, eOutCubic(seg(r, t, t + 3)))})`, boxShadow: `0 0 ${28 * h}px ${C.glow(0.55 * h)}` }}>
        <Img src={staticFile(`covers/${it.cover}.jpg`)} style={{ width: 80, height: 80, display: 'block' }} />
      </div>
      <div style={txt(36, 400, C.ink, { left: 110, top: 6, clipPath: wipe(t + 0.3, t + 3.2), textShadow: glow(0.7 * h, 18) })}>{it.title}</div>
      <div style={txt(27, 400, C.mist, { left: 110, top: 50, clipPath: wipe(t + 1, t + 3.8), textShadow: glow(0.45 * h, 14) })}>{it.sub}</div>
      {it.dur && <div style={txt(27, 400, C.mist, { left: 1236, top: 27, opacity: eOutCubic(seg(r, t + 2.5, t + 4.5)) })}>{it.dur}</div>}
      <div style={{ ...ABS, left: 1352, top: 20, opacity: eOutCubic(seg(r, t + 2.8, t + 4.8)) }}><Heart size={40} color={C.mist} /></div>
    </div>
  );
};

const Results: React.FC<{ r: number }> = ({ r }) => {
  const v = resultsView(r);
  const [bx, by] = blurOf((rr) => { const q = resultsView(rr); return [q.L, q.T]; }, r, 40);
  const sq = squashOf(r);
  const scale = lerp(1, 0.5, sq);
  const rowsOp = 1 - seg(r, 273, 276);
  return (
    <MotionBlur id="resBlur" sx={bx} sy={by} style={{ opacity: rowsOp, transformOrigin: `${SQ_CENTER[0]}px ${SQ_CENTER[1]}px`, transform: `scale(${scale})` }}>
      <div style={{ ...ABS, transformOrigin: '0 0', transform: `translate(${v.L}px,${v.T}px) scale(${v.z})` }}>
        {RESULTS.map((it, i) => <ItemView key={i} it={it} r={r} />)}
      </div>
    </MotionBlur>
  );
};

// ================================================================== 6 · the list folds into a flowing waveform (r272–282)
const Waveform: React.FC<{ r: number }> = ({ r }) => {
  const lineA = seg(r, 273, 275.5) * (1 - seg(r, 280.6, 282));
  if (lineA <= 0) return null;
  const v = resultsView(Math.min(r, 272));
  const sq = squashOf(r), scale = lerp(1, 0.5, sq);
  const merge = eInOutCubic(seg(r, 275.5, 279.5));
  const rows = RESULTS.filter((it) => r >= it.t);
  const amp = 9 * seg(r, 273, 276);
  return (
    <svg width={W} height={H} style={ABS}>
      <defs>
        <filter id="waveGlow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#waveGlow)">
        {rows.map((it, i) => {
          const len = it.kind === 'row' ? 1300 : textW(it.text, it.kind === 'header' ? 46 : 34, 600);
          const midY = it.y + (it.kind === 'row' ? 40 : 18);
          const map = (wx: number, wy: number): [number, number] => {
            const sx = v.L + wx * v.z, sy = v.T + wy * v.z;
            return [SQ_CENTER[0] + (sx - SQ_CENTER[0]) * scale, SQ_CENTER[1] + (sy - SQ_CENTER[1]) * scale];
          };
          const [x0, y0] = map(it.kind === 'row' ? 110 : 0, midY);
          const [x1] = map((it.kind === 'row' ? 110 : 0) + len * (it.kind === 'row' ? 0.7 : 1), midY);
          const X0 = lerp(x0, CX - 190, merge), X1 = lerp(x1, CX + 190, merge), Y = lerp(y0, CY, merge);
          const pts: string[] = [];
          for (let k = 0; k <= 64; k++) {
            const u = k / 64, x = lerp(X0, X1, u);
            const env = lerp(1, Math.sin(Math.PI * u) ** 1.5 * 3.2, merge);
            const y = Y + amp * env * (Math.sin(u * 19 + i * 1.3 + r * 2.2) * 0.65 + Math.sin(u * 7.3 - r * 1.4 + i) * 0.35);
            pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          }
          return <polyline key={i} points={pts.join(' ')} fill="none" stroke={C.hot} strokeOpacity={lineA * (0.85 - 0.3 * merge * (i % 2))} strokeWidth={2.4} strokeLinecap="round" />;
        })}
      </g>
    </svg>
  );
};

// ================================================================== 7 · "Your daily" … "sound." … the icon … the end card (r281–366)
const LINE1 = 'Your daily';
const L1_KEYS = [281, 283, 284.5, 286, 287.5, 289, 290.5, 292, 293, 295];
const Outro: React.FC<{ r: number }> = ({ r }) => {
  const S1 = 108, w1 = textW(LINE1, S1, 600), left1 = CX - w1 / 2;
  const word1 = r < 300.5 ? 1 : 0;
  const scale1 = lerp(1.08, 1, eOutCubic(seg(r, 281, 300)));
  const S2 = 66, w2 = textW('sound.', S2, 600);
  const snd = (r >= 300.5 ? 1 : 0) * (1 - seg(r, 315, 319));
  const sndScale = lerp(1.1, 1, eOutCubic(seg(r, 301, 313))) * lerp(1, 0.9, seg(r, 315, 319));
  const sndGlow = lerp(0.8, 0.18, eOutCubic(seg(r, 301, 311)));
  const iconScale = r < 319 ? lerp(0.55, 1, eOutCubic(seg(r, 316, 319)))
    : r < 321.5 ? lerp(1, 1.32, eOutCubic(seg(r, 319, 321.5))) : lerp(1.32, 1, eInOutSine(seg(r, 321.5, 324.5)));
  const lockY = lerp(CY, 505, eInOutSine(seg(r, 333, 345)));
  const handle = eOutCubic(seg(r, 336, 344));
  return (
    <AbsoluteFill>
      {r < 300.5 && (
        <div style={{ ...ABS, width: W, height: H, opacity: word1, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${scale1})` }}>
          {[...LINE1].map((ch, i) => {
            const t = L1_KEYS[i];
            if (r < t || ch === ' ') return null;
            const p = eOutCubic(seg(r, t, t + 1.5)), h = heatOf(r, t);
            return (
              <div key={i} style={txt(S1, 600, C.ink, { left: left1 + textW(LINE1.slice(0, i), S1, 600), top: CY - S1 * 0.55, opacity: p,
                transform: `scale(${lerp(0.86, 1, p)})`, transformOrigin: '50% 80%', textShadow: `${glow(0.2 + 0.6 * h, 30)}` })}>{ch}</div>
            );
          })}
        </div>
      )}
      {snd > 0.003 && (
        <div style={txt(S2, 600, C.ink, { left: CX - w2 / 2, top: CY - S2 * 0.55, opacity: snd, transform: `scale(${sndScale})`, transformOrigin: '50% 55%',
          textShadow: glow(sndGlow, 30), filter: r > 315 ? `blur(${(6 * seg(r, 315, 319)).toFixed(2)}px)` : undefined })}>sound.</div>
      )}
      {r >= 316 && (
        <Lockup r={r} shift={301} icon={120} iconEnd={0.78} size={86} weight={600} y={lockY} iconScale={iconScale}
          iconGlow={0.35 * seg(r, 316, 319) + 0.5 * bump(r, 318, 321.5, 327)} id="end" />
      )}
      {handle > 0.003 && (
        <div style={txt(38, 400, C.mist, { left: CX - textW('@AartiMusic_bot', 38, 400) / 2, top: lockY + 92 + 16 * (1 - handle), opacity: handle,
          filter: handle < 0.99 ? `blur(${(6 * (1 - handle)).toFixed(2)}px)` : undefined })}>@AartiMusic_bot</div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================== composition
export const Promo: React.FC = () => {
  const frame = useCurrentFrame();
  const r = frame / 2;
  const fadeOut = 1 - eInOutSine(seg(r, 362, 372));
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Audio src={staticFile('audio/score.wav')} />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <div style={{ ...ABS, width: W, height: H, background: 'radial-gradient(ellipse 60% 55% at 50% 52%, rgba(14,38,46,.22), transparent 75%)' }} />
        {r < 54 && <Open r={r} />}
        {r >= 53 && r < 63.5 && <Arcs r={r} />}
        {r >= 60 && r < 171 && <GreetingField r={r} />}
        {r >= 169 && r < 211 && <Press r={r} />}
        {r >= 212 && r < 277 && <Results r={r} />}
        {r >= 272 && r < 282 && <Waveform r={r} />}
        {r >= 280 && <Outro r={r} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export { clamp };
