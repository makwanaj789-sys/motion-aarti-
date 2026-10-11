// Navratri music edit built from the four supplied transparent PNG cutouts.
// One timeline, locked to the song: beats at 0.400 + 0.5225·k s; vocal phrase onsets
// measured from the harmonic (vocal) energy of the track — see LYRICS_HI.md.
import React from 'react';
import { AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { FPS, H, W, b, blurOf, clamp, eInCubic, lerp, seg, smooth, snap } from './timing';
import { MotionBlur } from './fx';
import photos from './photos.json';

// ------------------------------------------------------------------ fonts: Teko (bold display), Tiro Devanagari Hindi (serif), Playfair for the Latin handle
const DISPLAY = 'Teko', SERIF = 'Tiro Devanagari Hindi', CREDIT = 'Playfair Display';
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const faces: [string, string, string, string][] = [
    [DISPLAY, 'teko-devanagari-600-normal', '600', 'normal'],
    [DISPLAY, 'teko-devanagari-700-normal', '700', 'normal'],
    [SERIF, 'tiro-devanagari-hindi-devanagari-400-normal', '400', 'normal'],
    [CREDIT, 'playfair-display-latin-400-italic', '400', 'italic'],
  ];
  Promise.all(faces.map(([fam, file, weight, style]) => new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, { weight, style }).load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}

const ABS: React.CSSProperties = { position: 'absolute', left: 0, top: 0 };
const FULL: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: W, height: H };
const P = photos as Record<string, { file: string; w: number; h: number }>;
const wOf = (id: string, h: number) => (P[id].w / P[id].h) * h;

// ------------------------------------------------------------------ timeline (seconds)
const T = {
  open: 0, shubh: b(3), amba: b(7), he: b(14), heSettle: b(15), ho: b(16), hoSettle: b(17),
  mangal: b(18), sapno: b(22), baji: b(26), credit: 14.35, end: 15.628,
};
// lyric words on their sung onsets
const MANGAL: [string, number][] = [['मंगल', 10.25], ['बेला', 10.58], ['आए', 10.88]];
const SAPNO: [string, number][] = [['सपनों', 11.9], ['की', 12.18], ['डोली', 12.4], ['पे', 12.62], ['दिल', 12.82], ['की', 13.28]];
const BAJI: [string, number][] = [['बाजी', 14.0], ['रे', 14.5], ['शहनाई', 14.7]];

const C = { red: '#D3150F', pink: '#DE0F62', yellow: '#F4C21B', purple: '#5A189A', green: '#0B7A3B', plum: '#55168A' };

// ------------------------------------------------------------------ helpers
// a cutout placed by its bottom-centre; pos(t) gives the offset so motion blur follows real velocity
const Cut: React.FC<{ id: string; t: number; h: number; x: number; y?: number; pos?: (t: number) => [number, number]; scale?: (t: number) => number;
  rot?: number; flip?: boolean; op?: number; uid: string }> = ({ id, t, h, x, y = H + 8, pos, scale, rot = 0, flip, op = 1, uid }) => {
  const [dx, dy] = pos ? pos(t) : [0, 0];
  const [bx, by] = pos ? blurOf(pos, t, 24) : [0, 0];
  const s = scale ? scale(t) : 1;
  const w = wOf(id, h);
  return (
    <MotionBlur id={uid} sx={bx} sy={by}>
      <Img src={staticFile(P[id].file)} style={{ ...ABS, left: x - w / 2 + dx, top: y - h + dy, width: w, height: h, opacity: op,
        transformOrigin: '50% 100%', transform: `${flip ? 'scaleX(-1) ' : ''}scale(${s}) rotate(${rot}deg)`,
        filter: 'drop-shadow(0 10px 16px rgba(30,0,20,.28))' }} />
    </MotionBlur>
  );
};

// floral corner: the PNG is a top-left spray; other corners are mirrors of it
const Flowers: React.FC<{ t: number; at: number; corner: 'tl' | 'tr' | 'bl' | 'br'; w?: number; out?: [number, number] }> = ({ t, at, corner, w = 470, out }) => {
  const p = smooth(seg(t, at, at + 0.6));
  const q = out ? eInCubic(seg(t, out[0], out[0] + out[1])) : 0;
  const k = 1 - p + q;
  const h = (P.flowers.h / P.flowers.w) * w;
  const fx = corner[1] === 'r', fy = corner[0] === 'b';
  const sway = 1.2 * Math.sin((t - at) * 2.1);
  return (
    <Img src={staticFile(P.flowers.file)} style={{ ...ABS, width: w, height: h, left: fx ? W - w : 0, top: fy ? H - h : 0,
      transformOrigin: `${fx ? '100%' : '0'} ${fy ? '100%' : '0'}`,
      transform: `translate(${(fx ? 1 : -1) * 240 * k}px, ${(fy ? 1 : -1) * 240 * k}px) scale(${fx ? -1 : 1}, ${fy ? -1 : 1}) rotate(${-8 * k + sway}deg)`,
      filter: 'drop-shadow(0 6px 10px rgba(30,0,20,.22))' }} />
  );
};

// left-to-right reveal that never splits Devanagari clusters
const wipe = (p: number) => `inset(-25% ${(100 * (1 - p)).toFixed(2)}% -25% -3%)`;
const word = (font: string, size: number, color: string, weight = 700, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1, whiteSpace: 'nowrap', ...extra,
});

// background: hard beat cuts, plus three directional wipes on the connected transitions
const BG: [number, string, 'cut' | 'up' | 'left' | 'right', number][] = [
  [T.open, C.red, 'cut', 0], [T.shubh, C.pink, 'cut', 0], [T.amba - 0.2, C.yellow, 'up', 0.22], [T.he, C.purple, 'cut', 0],
  [T.ho - 0.14, C.red, 'left', 0.18], [T.mangal, C.green, 'cut', 0], [T.sapno, C.pink, 'cut', 0], [T.baji - 0.12, C.plum, 'right', 0.2],
];
const Background: React.FC<{ t: number }> = ({ t }) => {
  let i = 0;
  while (i + 1 < BG.length && t >= BG[i + 1][0]) i++;
  const [at, color, mode, dur] = BG[i];
  const prev = BG[Math.max(0, i - 1)][1];
  const p = mode === 'cut' ? 1 : smooth(seg(t, at, at + dur));
  const clip = mode === 'up' ? `inset(${100 * (1 - p)}% 0 0 0)` : mode === 'left' ? `inset(0 0 0 ${100 * (1 - p)}%)` : mode === 'right' ? `inset(0 ${100 * (1 - p)}% 0 0)` : undefined;
  return (<><div style={{ ...FULL, background: prev }} /><div style={{ ...FULL, background: color, clipPath: clip }} /></>);
};

// ================================================================== A · नवरात्रि (intro, 0 – 1.97)
const Open: React.FC<{ t: number }> = ({ t }) => {
  const reveal = smooth(seg(t, 0.15, 1.1));
  return (
    <>
      <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={word(DISPLAY, 470, '#FF6F61', 700, { clipPath: wipe(reveal), transform: `translateY(48px) scale(${lerp(1.05, 1, reveal)})` })}>नवरात्रि</div>
      </div>
      <Cut uid="aD" id="dancer" t={t} h={552} x={1160} pos={(tt) => [0, 330 * (1 - smooth(seg(tt, 0.3, 1.15)))]} scale={(tt) => lerp(0.96, 1, smooth(seg(tt, 0.3, 1.15)))} />
      <Flowers t={t} at={0.7} corner="tl" />
    </>
  );
};

// ================================================================== B · शुभारंभ with the dandiya pair (1.97 – 4.06)
const Shubh: React.FC<{ t: number }> = ({ t }) => {
  const textX = (tt: number) => 620 * (1 - smooth(seg(tt, T.shubh, T.shubh + 0.5))) - 40 * seg(tt, T.shubh, T.amba) - 1400 * eInCubic(seg(tt, T.amba - 0.3, T.amba + 0.02));
  const [tbx] = blurOf((tt) => [textX(tt), 0], t, 26);
  const pairY = (tt: number): [number, number] => [0, 70 * (1 - smooth(seg(tt, T.shubh, T.shubh + 0.5))) + 620 * eInCubic(seg(tt, T.amba - 0.28, T.amba + 0.02))];
  return (
    <>
      <MotionBlur id="bT" sx={tbx} sy={0}>
        <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={word(DISPLAY, 520, '#FF8DBB', 700, { transform: `translate(${textX(t)}px, 52px)` })}>शुभारंभ</div>
        </div>
      </MotionBlur>
      <Cut uid="bP" id="dandiyaPair" t={t} h={560} x={960} pos={pairY} scale={(tt) => lerp(1.06, 1, smooth(seg(tt, T.shubh, T.shubh + 0.5)))} />
      <Flowers t={t} at={T.shubh + 0.45} corner="tr" out={[T.amba - 0.3, 0.3]} />
    </>
  );
};

// ================================================================== C · जय माँ अम्बे, Maa Amba (4.06 – 7.72)
const Amba: React.FC<{ t: number }> = ({ t }) => {
  const rise = smooth(seg(t, T.amba - 0.05, T.amba + 0.7));
  const push = lerp(1, 1.035, smooth(seg(t, T.amba + 0.7, T.he)));
  const drift = 18 * smooth(seg(t, T.amba + 0.5, T.he));
  const words: [string, number, number][] = [['जय', T.amba + 0.1, 0], ['माँ', b(8), 0], ['अम्बे', b(9), 1]];
  return (
    <>
      <div style={{ position: 'absolute', top: 0, height: H, right: W - 715 + drift, display: 'flex', alignItems: 'center', gap: 40 }}>
        {words.filter((w) => w[2] === 0).map(([w, at]) => <Reveal key={w} t={t} at={at}><div style={word(SERIF, 280, '#A5160E', 400)}>{w}</div></Reveal>)}
      </div>
      <div style={{ position: 'absolute', top: 0, height: H, left: 1215 + drift, display: 'flex', alignItems: 'center' }}>
        {words.filter((w) => w[2] === 1).map(([w, at]) => <Reveal key={w} t={t} at={at}><div style={word(SERIF, 280, '#A5160E', 400)}>{w}</div></Reveal>)}
      </div>
      <Cut uid="cA" id="amba" t={t} h={566} x={965} pos={(tt) => [0, 260 * (1 - smooth(seg(tt, T.amba - 0.05, T.amba + 0.7)))]} scale={() => lerp(0.95, 1, rise) * push} op={clamp(rise * 2)} />
      <Flowers t={t} at={T.amba + 0.35} corner="bl" w={400} />
      <Flowers t={t} at={T.amba + 0.5} corner="tr" w={400} />
    </>
  );
};
// a word that rises out of a mask
const Reveal: React.FC<{ t: number; at: number; dur?: number; children: React.ReactNode }> = ({ t, at, dur = 0.45, children }) => {
  const p = snap(seg(t, at, at + dur));
  return (
    <div style={{ overflow: 'hidden', padding: '50px 6px 70px' }}>
      <div style={{ transform: `translateY(${((1 - p) * 105).toFixed(2)}%)` }}>{children}</div>
    </div>
  );
};

// ================================================================== D · हे शुभारंभ (7.72 – 8.76), dhol drop
// E · हो शुभारंभ (8.76 – 9.81). Same choreography idea, mirrored: the exclamation lands on the
// phrase onset, शुभारंभ settles on the sung accent one beat later, the dancers carry the phrase.
const Phrase: React.FC<{ t: number; ex: string; at: number; settle: number; exColor: string; mainColor: string; mirror?: boolean }> = ({ t, ex, at, settle, exColor, mainColor, mirror }) => {
  const exP = snap(seg(t, at, at + 0.2));
  // हे: the word slides in from the right and lands on the accent; हो: it is wiped on left→right instead
  const mx = (tt: number) => (mirror ? 0 : 760 * (1 - smooth(seg(tt, at + 0.12, settle + 0.04))));
  const reveal = mirror ? smooth(seg(t, at + 0.1, settle + 0.02)) : 1;
  const [mbx] = blurOf((tt) => [mx(tt), 0], t, 26);
  const accent = 1 + 0.03 * Math.sin(Math.PI * seg(t, settle, settle + 0.24));
  return (
    <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, transform: 'translate(-150px, 46px)' }}>
      <div style={word(DISPLAY, 300, exColor, 700, { opacity: clamp(exP * 2), transform: `translateY(-26px) scale(${lerp(1.3, 1, exP)})` })}>{ex}</div>
      <MotionBlur id={`ph${ex}`} sx={mbx} sy={0} style={{ position: 'relative', inset: 'auto' }}>
        <div style={word(DISPLAY, 420, mainColor, 700, { transform: `translateX(${mx(t)}px) scale(${accent})`, opacity: mirror ? 1 : clamp(seg(t, at + 0.1, at + 0.25) * 1.5), clipPath: mirror ? wipe(reveal) : undefined })}>शुभारंभ</div>
      </MotionBlur>
    </div>
  );
};
const He: React.FC<{ t: number }> = ({ t }) => {
  const out = (tt: number) => -1700 * eInCubic(seg(tt, T.ho - 0.16, T.ho + 0.06));
  const [obx] = blurOf((tt) => [out(tt), 0], t, 28);
  return (
    <MotionBlur id="dOut" sx={obx} sy={0} style={{ transform: `translateX(${out(t)}px)` }}>
      <Phrase t={t} ex="हे" at={T.he} settle={T.heSettle} exColor="#F7C948" mainColor="#A57BE8" />
      <Cut uid="dP" id="dandiyaPair" t={t} h={560} x={1600} flip
        pos={(tt) => [-900 * (1 - smooth(seg(tt, T.he, T.he + 0.45))), 0]}
        scale={(tt) => 1 + 0.025 * Math.sin(Math.PI * seg(tt, T.heSettle, T.heSettle + 0.26))} />
    </MotionBlur>
  );
};
const Ho: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Phrase t={t} ex="हो" at={T.ho} settle={T.hoSettle} exColor="#F7C948" mainColor="#FF8A7E" mirror />
    <Cut uid="eD" id="dancer" t={t} h={556} x={1660}
      pos={(tt) => [700 * (1 - smooth(seg(tt, T.ho - 0.12, T.ho + 0.38))), 0]}
      rot={-5 * (1 - smooth(seg(t, T.ho - 0.12, T.ho + 0.6)))}
      scale={(tt) => 1 + 0.025 * Math.sin(Math.PI * seg(tt, T.hoSettle, T.hoSettle + 0.26))} />
  </>
);

// ================================================================== F · मंगल बेला आए (9.81 – 11.90)
const Mangal: React.FC<{ t: number }> = ({ t }) => {
  const out = (tt: number) => eInCubic(seg(tt, T.sapno - 0.28, T.sapno - 0.02));
  return (
    <>
      <div style={{ position: 'absolute', left: 110 - 900 * out(t), top: 0, height: H, display: 'flex', alignItems: 'center', gap: 46, transform: 'translateY(18px)' }}>
        {MANGAL.map(([w, at]) => <Reveal key={w} t={t} at={at} dur={0.32}><div style={word(SERIF, 230, '#F4F1DE', 400)}>{w}</div></Reveal>)}
      </div>
      <Cut uid="fP" id="dandiyaPair" t={t} h={560} x={1610}
        pos={(tt) => [700 * eInCubic(seg(tt, T.sapno - 0.3, T.sapno - 0.02)), 300 * (1 - smooth(seg(tt, T.mangal, T.mangal + 0.5)))]} />
      <Flowers t={t} at={T.mangal + 0.2} corner="tl" w={420} out={[T.sapno - 0.3, 0.28]} />
      <Flowers t={t} at={T.mangal + 0.35} corner="br" w={360} out={[T.sapno - 0.3, 0.28]} />
    </>
  );
};

// ================================================================== G · सपनों की डोली | पे दिल की (11.90 – 13.99) → H
const Sapno: React.FC<{ t: number }> = ({ t }) => {
  const textOut = smooth(seg(t, T.baji - 0.2, T.baji + 0.05));
  const groups = [SAPNO.slice(0, 3), SAPNO.slice(3)];
  return (
    <div style={{ ...FULL, opacity: 1 - textOut, transform: `translateY(${-30 * textOut}px)` }}>
      {groups.map((g, gi) => (
        <div key={gi} style={{ position: 'absolute', top: 0, height: H, display: 'flex', alignItems: 'center', gap: 28, ...(gi === 0 ? { right: W - 775 } : { left: 1150 }), transform: 'translateY(26px)' }}>
          {g.map(([w, at], i) => <Reveal key={i} t={t} at={at} dur={0.28}><div style={word(SERIF, 134, '#FFE6EF', 400)}>{w}</div></Reveal>)}
        </div>
      ))}
    </div>
  );
};

// the garba dancer is one continuous element across G → H: centre, then she glides right
const dancerGH = (tt: number): [number, number] => [560 * smooth(seg(tt, T.baji - 0.14, T.baji + 0.42)), 300 * (1 - smooth(seg(tt, T.sapno, T.sapno + 0.5)))];

// ================================================================== H · बाजी रे शहनाई → @h81t6 (13.99 – end)
const Final: React.FC<{ t: number }> = ({ t }) => {
  const credit = smooth(seg(t, T.credit, T.credit + 0.4));
  return (
    <>
      <div style={{ position: 'absolute', left: 720, width: 640, top: 0, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, transform: 'translateY(-20px)' }}>
        {BAJI.map(([w, at]) => {
          const p = snap(seg(t, at, at + 0.26));
          return <div key={w} style={word(DISPLAY, 150, '#C7A3F2', 700, { opacity: clamp(p * 2.5), transform: `translateY(${(1 - p) * 26}px) scale(${lerp(1.12, 1, p)})` })}>{w}</div>;
        })}
      </div>
      <Cut uid="hP" id="dandiyaPair" t={t} h={566} x={420} pos={(tt) => [-760 * (1 - smooth(seg(tt, T.baji - 0.06, T.baji + 0.45))), 0]} />
      <Flowers t={t} at={T.baji + 0.15} corner="tl" w={380} />
      <Flowers t={t} at={T.baji + 0.25} corner="tr" w={380} />
      <div style={{ ...FULL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 54, boxSizing: 'border-box',
        opacity: credit, transform: `translateY(${(12 * (1 - credit)).toFixed(2)}px)` }}>
        <div style={{ width: 50 * credit, height: 2, background: '#F7C948', marginBottom: 12 }} />
        <div style={{ fontFamily: CREDIT, fontStyle: 'italic', fontSize: 50, color: '#FFF4DC', letterSpacing: '0.06em', fontVariantNumeric: 'lining-nums', textShadow: '0 2px 10px rgba(20,0,40,.5)' }}>@h81t6</div>
      </div>
    </>
  );
};

// ================================================================== composition
export const NavratriPhoto: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: C.red, overflow: 'hidden' }}>
      <Audio src={staticFile('audio/song.wav')} />
      <Background t={t} />
      {t < T.shubh && <Open t={t} />}
      {t >= T.shubh && t < T.amba + 0.05 && <Shubh t={t} />}
      {t >= T.amba - 0.05 && t < T.he && <Amba t={t} />}
      {t >= T.he && t < T.ho + 0.08 && <He t={t} />}
      {t >= T.ho - 0.14 && t < T.mangal && <Ho t={t} />}
      {t >= T.mangal && t < T.sapno && <Mangal t={t} />}
      {t >= T.sapno && t < T.baji + 0.06 && <Sapno t={t} />}
      {t >= T.baji - 0.02 && <Final t={t} />}
      {t >= T.sapno && <Cut uid="gD" id="dancer" t={t} h={556} x={960} pos={dancerGH} scale={(tt) => lerp(1.05, 1, smooth(seg(tt, T.sapno, T.sapno + 0.5)))} />}
      {t >= T.sapno && t < T.baji + 0.02 && <Flowers t={t} at={T.sapno + 0.1} corner="tr" w={380} out={[T.baji - 0.28, 0.28]} />}
      {t >= T.sapno && t < T.baji + 0.02 && <Flowers t={t} at={T.sapno + 0.22} corner="br" w={340} out={[T.baji - 0.28, 0.28]} />}
    </AbsoluteFill>
  );
};
