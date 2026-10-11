import React from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { FPS, H, W, b, blurOf, clamp, eInCubic, eOutCubic, lerp, seg, smooth, snap } from './timing';
import { AmbaSymbol, FlowerCorner, Garbo, GarbaWoman, KediyuMan } from './art';
import { MotionBlur } from './fx';

// ------------------------------------------------------------------ fonts: three Devanagari families + a Latin serif for the credit
const DISPLAY = 'Teko', SERIF = 'Tiro Devanagari Hindi', HAND = 'Kalam', CREDIT = 'Playfair Display';
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const faces: [string, string, string, string][] = [
    [DISPLAY, 'teko-devanagari-600-normal', '600', 'normal'],
    [DISPLAY, 'teko-devanagari-700-normal', '700', 'normal'],
    [SERIF, 'tiro-devanagari-hindi-devanagari-400-normal', '400', 'normal'],
    [HAND, 'kalam-devanagari-700-normal', '700', 'normal'],
    [CREDIT, 'playfair-display-latin-400-italic', '400', 'italic'],
    [CREDIT, 'playfair-display-latin-600-normal', '600', 'normal'],
  ];
  Promise.all(faces.map(([fam, file, weight, style]) => new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, { weight, style }).load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}

const ABS: React.CSSProperties = { position: 'absolute', left: 0, top: 0 };
const FULL: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: W, height: H };

// ------------------------------------------------------------------ the song's sections (vocal phrases land on these beats)
const S = {
  open: 0, shubh: b(3), navratri: b(7), amba: b(10), ho: b(14), he: b(16), mangal: b(18), sapno: b(22), baji: b(26), credit: 14.62, end: 15.628,
};
const COLORS: [number, string][] = [
  [S.open, '#D7140F'], [S.shubh, '#E0115F'], [S.navratri, '#C8102E'], [S.amba, '#F08A0B'],
  [S.ho, '#5E17A6'], [S.he, '#F05A16'], [S.mangal, '#0C7A36'], [S.sapno, '#F5C518'], [S.baji, '#5B1E8E'],
];

// ------------------------------------------------------------------ building blocks
const FIG = 0.63; // figure scale → ~567 px tall
type Fig = { x: number; kind: 'w' | 'm'; props: any; scale?: number; enter?: [number, number, 'up' | 'left' | 'right']; exit?: [number, number, 'left' | 'right' | 'down'] };
// a dancer placed by its feet (x = centre), with entrance / exit slides and directional blur
const Dancer: React.FC<{ t: number; f: Fig; id: string; beatSway?: boolean }> = ({ t, f, id, beatSway = true }) => {
  const s = (f.scale ?? 1) * FIG;
  const off = (tt: number): [number, number] => {
    let x = 0, y = 0;
    if (f.enter) {
      const [a, d, dir] = f.enter, p = 1 - snap(seg(tt, a, a + d));
      if (dir === 'up') y += 420 * p; else x += (dir === 'left' ? -1 : 1) * 900 * p;
    }
    if (f.exit) {
      const [a, d, dir] = f.exit, p = eInCubic(seg(tt, a, a + d));
      if (dir === 'down') y += 600 * p; else x += (dir === 'left' ? -1 : 1) * 1500 * p;
    }
    return [x, y];
  };
  const [dx, dy] = off(t);
  const [bx, by] = blurOf(off, t, 22);
  const phase = (t - 0.4) / 0.5225;
  const sway = beatSway ? 2.2 * Math.sin(phase * Math.PI) : 0;
  const flare = (f.props.flare ?? 0.4) + 0.12 * Math.sin(phase * Math.PI * 2);
  const Comp = f.kind === 'w' ? GarbaWoman : KediyuMan;
  return (
    <MotionBlur id={id} sx={bx} sy={by}>
      <svg width={400 * s} height={900 * s} viewBox="0 0 400 900" style={{ ...ABS, left: f.x - 200 * s + dx, top: H - 900 * s + 22 * s + dy, overflow: 'visible',
        filter: 'drop-shadow(0 10px 14px rgba(40,0,20,.28))' }}>
        <Comp {...f.props} sway={sway + (f.props.sway ?? 0)} flare={flare} />
      </svg>
    </MotionBlur>
  );
};

const Corner: React.FC<{ t: number; at: number; corner: 'tl' | 'tr' | 'bl' | 'br'; scale?: number; palette?: 'warm' | 'pink'; out?: number }> = ({ t, at, corner, scale = 1, palette = 'warm', out }) => {
  const p = snap(seg(t, at, at + 0.5));
  const q = out ? eInCubic(seg(t, out, out + 0.3)) : 0;
  const k = 1 - p + q;
  const sx = corner[1] === 'l' ? 1 : -1, sy = corner[0] === 't' ? 1 : -1;
  const x = corner[1] === 'l' ? 0 : W, y = corner[0] === 't' ? 0 : H;
  return (
    <svg width={W} height={H} style={{ ...ABS, overflow: 'visible' }}>
      <g transform={`translate(${x - sx * 260 * k} ${y - sy * 260 * k}) scale(${sx} ${sy}) rotate(${-20 * k + 3 * Math.sin(t * 2)})`}>
        <FlowerCorner scale={scale} palette={palette} />
      </g>
    </svg>
  );
};

// big type behind the cutouts
const Big: React.FC<{ children: React.ReactNode; font: string; size: number; color: string; weight?: number; y?: number; x?: number; style?: React.CSSProperties; center?: boolean }> = ({ children, font, size, color, weight = 700, y = 0, x = 0, style, center = true }) => (
  <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start', transform: `translate(${x}px, ${y}px)` }}>
    <div style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1, whiteSpace: 'nowrap', ...style }}>{children}</div>
  </div>
);
// left-to-right wipe — safe for Devanagari (never splits conjuncts or matras)
const wipe = (p: number) => `inset(-20% ${(100 * (1 - p)).toFixed(2)}% -20% -2%)`;

// ================================================================== scenes
// 1 · नवरात्रि — the shehnai intro
const Open: React.FC<{ t: number }> = ({ t }) => {
  const word = smooth(seg(t, 0.15, 1.3));
  return (
    <>
      <Big font={DISPLAY} size={560} color="#F35A4C" y={70} style={{ clipPath: wipe(word), letterSpacing: '0.01em', transform: `scale(${lerp(1.06, 1, word)})` }}>नवरात्रि</Big>
      <Dancer t={t} id="o1" f={{ x: 960, kind: 'w', enter: [0.25, 0.9, 'up'], props: { skirt: '#F5B700', skirt2: '#E08E00', choli: '#1E8A4C', border: '#1E8A4C', dupatta: '#E0115F', pose: 'clap', skin: '#C68642' } }} />
      <Corner t={t} at={0.9} corner="tl" scale={0.9} />
      <Corner t={t} at={1.05} corner="br" scale={0.9} />
    </>
  );
};

// 2 · शुभारंभ — three dancers arrive on three beats
const Shubh: React.FC<{ t: number }> = ({ t }) => {
  const x = (tt: number) => 700 * (1 - snap(seg(tt, S.shubh, S.shubh + 0.45)));
  const [bx] = blurOf((tt) => [x(tt), 0], t, 30);
  return (
    <>
      <MotionBlur id="shubhW" sx={bx} sy={0}>
        <Big font={DISPLAY} size={600} color="#F7A3C4" y={64} x={x(t)}>शुभारंभ</Big>
      </MotionBlur>
      <Dancer t={t} id="s1" f={{ x: 470, kind: 'm', enter: [b(4) - 0.05, 0.4, 'up'], props: { kediyu: '#FFF8EC', trim: '#D7261E', pants: '#D7261E', pagdi: '#F5B700', pagdi2: '#D7261E', pose: 'dandiya' } }} />
      <Dancer t={t} id="s2" f={{ x: 960, kind: 'w', scale: 1.04, enter: [S.shubh - 0.02, 0.42, 'up'], props: { skirt: '#7B2CBF', skirt2: '#5A189A', choli: '#F5B700', border: '#F5B700', dupatta: '#22A06B', pose: 'side', skin: '#A86B3C' } }} />
      <Dancer t={t} id="s3" f={{ x: 1450, kind: 'w', enter: [b(5) - 0.05, 0.4, 'up'], props: { skirt: '#F5B700', skirt2: '#E08E00', choli: '#D7261E', border: '#0C7A36', dupatta: '#D7261E', pose: 'clap', skin: '#C68642' } }} />
    </>
  );
};

// 3 · शुभ नवरात्रि — the lit garbo between two dancers
const NavratriScene: React.FC<{ t: number }> = ({ t }) => {
  const w1 = snap(seg(t, S.navratri, S.navratri + 0.4));
  const w2 = snap(seg(t, b(8), b(8) + 0.45));
  const g = snap(seg(t, S.navratri + 0.05, S.navratri + 0.6));
  return (
    <>
      <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, transform: 'translateY(-70px)' }}>
        <div style={{ fontFamily: SERIF, fontSize: 250, color: '#FFD9C9', lineHeight: 1, clipPath: wipe(w1) }}>शुभ</div>
        <div style={{ fontFamily: SERIF, fontSize: 250, color: '#FFD9C9', lineHeight: 1, clipPath: wipe(w2) }}>नवरात्रि</div>
      </div>
      <svg width={W} height={H} style={{ ...ABS, overflow: 'visible' }}>
        <g transform={`translate(960 ${H + 14 + 380 * (1 - g)}) scale(0.78)`}><Garbo flicker={Math.sin(t * 19) * 0.5 + 0.5} /></g>
      </svg>
      <Dancer t={t} id="n1" f={{ x: 230, kind: 'w', enter: [S.navratri, 0.45, 'left'], props: { skirt: '#0C7A36', skirt2: '#085C28', choli: '#F5B700', border: '#E0115F', dupatta: '#F5B700', pose: 'twirl', flare: 0.7, skin: '#D9A066' } }} />
      <Dancer t={t} id="n2" f={{ x: 1700, kind: 'm', enter: [S.navratri + 0.08, 0.45, 'right'], props: { kediyu: '#F5B700', trim: '#0C7A36', pants: '#FFF8EC', pagdi: '#E0115F', pagdi2: '#F5B700', pose: 'clap' } }} />
    </>
  );
};

// 4 · जय माँ अम्बे — Maa Amba's symbols as the focal cutout, type behind
const Amba: React.FC<{ t: number }> = ({ t }) => {
  const words: [string, number][] = [['जय', S.amba], ['माँ', b(11)], ['अम्बे', b(12)]];
  const sym = snap(seg(t, S.amba, S.amba + 0.6));
  return (
    <>
      {[words.slice(0, 2), words.slice(2)].map((group, g) => (
        <div key={g} style={{ position: 'absolute', top: 0, height: H, display: 'flex', alignItems: 'center', gap: 34, ...(g === 0 ? { right: W - 705 } : { left: 1215 }), transform: 'translateY(50px)' }}>
          {group.map(([w, at]) => {
            const p = snap(seg(t, at, at + 0.32));
            return <div key={w} style={{ fontFamily: DISPLAY, fontSize: 265, fontWeight: 700, color: '#8E1B0C', lineHeight: 1, opacity: clamp(p * 3), transform: `scale(${lerp(1.18, 1, p)})` }}>{w}</div>;
          })}
        </div>
      ))}
      <svg width={W} height={H} style={{ ...ABS, overflow: 'visible' }}>
        <g transform={`translate(960 ${300 + 120 * (1 - sym)}) scale(${0.82 * lerp(0.9, 1, sym)})`} opacity={clamp(sym * 1.5)}>
          <AmbaSymbol rot={10 * (t - S.amba)} glow={0.5 + 0.5 * Math.sin(t * 3)} />
        </g>
      </svg>
      <Corner t={t} at={S.amba + 0.3} corner="bl" scale={0.8} />
      <Corner t={t} at={S.amba + 0.42} corner="tr" scale={0.8} />
    </>
  );
};

// 5 · हो शुभारंभ — dhol drop: a dandiya pair, sticks strike on every beat
const Ho: React.FC<{ t: number }> = ({ t }) => {
  const hit = snap(seg(t, S.ho, S.ho + 0.2));
  const beat = Math.floor((t - S.ho) / 0.5225);
  const strike = beat % 2 === 0;
  return (
    <>
      <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, transform: `translateY(62px) scale(${lerp(1.07, 1, hit)})` }}>
        <div style={{ fontFamily: HAND, fontSize: 300, fontWeight: 700, color: '#F5B700', lineHeight: 1, transform: 'translateY(-20px) rotate(-6deg)' }}>हो</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 540, fontWeight: 700, color: '#9A63D8', lineHeight: 1 }}>शुभारंभ</div>
      </div>
      <Dancer t={t} id="h1" beatSway={false} f={{ x: 820, kind: 'm', props: { kediyu: '#FFF8EC', trim: '#5E17A6', pants: '#E0115F', pagdi: '#F05A16', pagdi2: '#F5B700', pose: strike ? 'strike' : 'dandiya', sway: strike ? 4 : -2 } }} />
      <Dancer t={t} id="h2" beatSway={false} f={{ x: 1100, kind: 'w', props: { skirt: '#E0115F', skirt2: '#B00C4A', choli: '#F5B700', border: '#F5B700', dupatta: '#22A06B', pose: 'dandiya', sway: strike ? -4 : 2, flare: 0.55, skin: '#C68642' } }} />
    </>
  );
};

// 6 · हे शुभारंभ — a row of dancers sweeps across
const He: React.FC<{ t: number }> = ({ t }) => {
  const he = snap(seg(t, S.he, S.he + 0.25));
  const w = smooth(seg(t, S.he + 0.12, S.he + 0.55));
  const row: Fig[] = [
    { x: 300, kind: 'w', props: { skirt: '#0C7A36', skirt2: '#085C28', choli: '#E0115F', border: '#F5B700', dupatta: '#E0115F', pose: 'side', skin: '#A86B3C' } },
    { x: 760, kind: 'm', props: { kediyu: '#E0115F', trim: '#F5B700', pants: '#FFF8EC', pagdi: '#0C7A36', pagdi2: '#F5B700', pose: 'dandiya' } },
    { x: 1200, kind: 'w', props: { skirt: '#5E17A6', skirt2: '#45107D', choli: '#F5B700', border: '#E0115F', dupatta: '#F5B700', pose: 'clap', skin: '#C68642' } },
    { x: 1640, kind: 'm', props: { kediyu: '#FFF8EC', trim: '#0C7A36', pants: '#5E17A6', pagdi: '#F5B700', pagdi2: '#E0115F', pose: 'strike' } },
  ];
  return (
    <>
      <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, transform: 'translateY(62px)' }}>
        <div style={{ fontFamily: HAND, fontSize: 300, fontWeight: 700, color: '#FFF1C2', lineHeight: 1, transform: `translateY(-20px) rotate(-6deg) scale(${lerp(1.3, 1, he)})`, opacity: clamp(he * 2) }}>हे</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 540, fontWeight: 700, color: '#FF9466', lineHeight: 1, clipPath: wipe(w) }}>शुभारंभ</div>
      </div>
      {row.map((f, i) => <Dancer key={i} t={t} id={`he${i}`} f={{ ...f, enter: [S.he + i * 0.06, 0.45, 'right'], exit: [S.mangal - 0.32, 0.3, 'left'] }} />)}
    </>
  );
};

// 7 · मंगल बेला आए — a couple in the centre, framed by flowers
const Mangal: React.FC<{ t: number }> = ({ t }) => {
  const words: [string, number][] = [['मंगल', S.mangal], ['बेला', b(19)], ['आए', b(20)]];
  return (
    <>
      {words.map(([w, at], i) => {
        const p = snap(seg(t, at, at + 0.4));
        const cx = [330, 960, 1590][i];
        return (
          <div key={w} style={{ position: 'absolute', left: cx - 400, width: 800, top: 40, overflow: 'hidden', padding: '40px 0 60px', textAlign: 'center' }}>
            <div style={{ fontFamily: SERIF, fontSize: 270, color: '#F4F1DE', lineHeight: 1, transform: `translateY(${(1 - p) * 110}%)` }}>{w}</div>
          </div>
        );
      })}
      <Dancer t={t} id="m1" f={{ x: 655, kind: 'm', enter: [S.mangal - 0.02, 0.45, 'up'], props: { kediyu: '#D7261E', trim: '#F5B700', pants: '#FFF8EC', pagdi: '#F5B700', pagdi2: '#D7261E', pose: 'clap' } }} />
      <Dancer t={t} id="m2" f={{ x: 1275, kind: 'w', enter: [S.mangal + 0.06, 0.45, 'up'], props: { skirt: '#D7261E', skirt2: '#A51D16', choli: '#F5B700', border: '#F5B700', dupatta: '#F5B700', pose: 'twirl', flare: 0.75, skin: '#C68642' } }} />
      <Corner t={t} at={S.mangal + 0.2} corner="tl" scale={0.95} palette="pink" />
      <Corner t={t} at={S.mangal + 0.3} corner="tr" scale={0.95} />
      <Corner t={t} at={S.mangal + 0.4} corner="bl" scale={0.75} />
      <Corner t={t} at={S.mangal + 0.5} corner="br" scale={0.75} palette="pink" />
    </>
  );
};

// 8 · सपनों की डोली पे दिल की — the long phrase, word by word, around a twirling dancer
const Sapno: React.FC<{ t: number }> = ({ t }) => {
  const words: [string, number][] = [['सपनों', S.sapno], ['की', 12.25], ['डोली', 12.43], ['पे', 12.94], ['दिल', 13.28], ['की', 13.65]];
  return (
    <>
      {[words.slice(0, 3), words.slice(3)].map((group, g) => (
        <div key={g} style={{ position: 'absolute', top: 0, height: H, display: 'flex', alignItems: 'center', gap: 30, ...(g === 0 ? { right: W - 815 } : { left: 1105 }), transform: 'translateY(30px)' }}>
          {group.map(([w, at], i) => {
            const p = snap(seg(t, at, at + 0.3));
            return <div key={i} style={{ fontFamily: SERIF, fontSize: 150, color: '#B31B0F', lineHeight: 1, opacity: clamp(p * 2.5), transform: `translateY(${(1 - p) * 40}px)` }}>{w}</div>;
          })}
        </div>
      ))}
      <Dancer t={t} id="sp1" f={{ x: 960, kind: 'w', scale: 1.02, enter: [S.sapno - 0.04, 0.5, 'up'], props: { skirt: '#E0115F', skirt2: '#B00C4A', choli: '#0C7A36', border: '#5E17A6', dupatta: '#5E17A6', pose: 'twirl', flare: 0.85, skin: '#A86B3C' } }} />
      <Corner t={t} at={S.sapno + 0.15} corner="tl" scale={0.85} palette="pink" />
      <Corner t={t} at={S.sapno + 0.3} corner="br" scale={0.85} palette="pink" />
    </>
  );
};

// 9 · बाजी रे शहनाई → final dance composition and the credit
const Final: React.FC<{ t: number }> = ({ t }) => {
  // the phrase is compressed slightly so it has finished before the credit-only ending
  const words: [string, number][] = [['बाजी', S.baji], ['रे', 14.24], ['शहनाई', 14.40]];
  const textOut = smooth(seg(t, 14.5, 14.72));
  const credit = smooth(seg(t, S.credit, S.credit + 0.45));
  const line: Fig[] = [
    { x: 170, kind: 'w', props: { skirt: '#F5B700', skirt2: '#E08E00', choli: '#E0115F', border: '#E0115F', dupatta: '#0C7A36', pose: 'clap', skin: '#C68642' } },
    { x: 420, kind: 'm', props: { kediyu: '#FFF8EC', trim: '#E0115F', pants: '#F5B700', pagdi: '#E0115F', pagdi2: '#F5B700', pose: 'dandiya' } },
    { x: 1500, kind: 'm', props: { kediyu: '#F5B700', trim: '#5B1E8E', pants: '#FFF8EC', pagdi: '#0C7A36', pagdi2: '#F5B700', pose: 'dandiya' } },
    { x: 1750, kind: 'w', props: { skirt: '#0C7A36', skirt2: '#085C28', choli: '#F5B700', border: '#F5B700', dupatta: '#E0115F', pose: 'side', skin: '#D9A066' } },
  ];
  return (
    <>
      <div style={{ ...FULL, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, transform: `translateY(40px) scale(${lerp(1, 0.94, textOut)})`, opacity: 1 - textOut }}>
        {words.map(([w, at]) => {
          const p = snap(seg(t, at, at + 0.28));
          return <div key={w} style={{ fontFamily: DISPLAY, fontSize: 150, fontWeight: 700, color: '#B98AE6', lineHeight: 1, opacity: clamp(p * 3), transform: `scale(${lerp(1.15, 1, p)})` }}>{w}</div>;
        })}
      </div>
      {line.map((f, i) => <Dancer key={i} t={t} id={`f${i}`} f={{ ...f, enter: [S.baji + (i % 2) * 0.08, 0.45, i < 2 ? 'left' : 'right'] }} />)}
      <Corner t={t} at={S.baji + 0.25} corner="tl" scale={0.8} />
      <Corner t={t} at={S.baji + 0.35} corner="tr" scale={0.8} palette="pink" />
      <div style={{ ...FULL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: credit, transform: `translateY(${(12 * (1 - credit)).toFixed(2)}px)` }}>
        <div style={{ width: 54 * credit, height: 2, background: '#F5B700', marginBottom: 14 }} />
        <div style={{ fontFamily: CREDIT, fontStyle: 'italic', fontSize: 46, color: '#FFF4D6', letterSpacing: '0.06em', fontVariantNumeric: 'lining-nums', textShadow: '0 2px 10px rgba(30,0,40,.45)' }}>@h81t6</div>
      </div>
    </>
  );
};

// ================================================================== composition
export const NavratriHindi: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  let bg = COLORS[0][1];
  for (const [at, c] of COLORS) if (t >= at) bg = c;
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      <Audio src={staticFile('audio/song.wav')} />
      {t < S.shubh && <Open t={t} />}
      {t >= S.shubh && t < S.navratri && <Shubh t={t} />}
      {t >= S.navratri && t < S.amba && <NavratriScene t={t} />}
      {t >= S.amba && t < S.ho && <Amba t={t} />}
      {t >= S.ho && t < S.he && <Ho t={t} />}
      {t >= S.he && t < S.mangal && <He t={t} />}
      {t >= S.mangal && t < S.sapno && <Mangal t={t} />}
      {t >= S.sapno && t < S.baji && <Sapno t={t} />}
      {t >= S.baji && <Final t={t} />}
    </AbsoluteFill>
  );
};
