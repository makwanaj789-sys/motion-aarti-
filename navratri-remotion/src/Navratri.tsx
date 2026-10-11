import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { CUT, FPS, H, W, b, blurOf, clamp, eInCubic, eInOutSine, eOutCubic, lerp, seg, smooth, snap } from './timing';
import { Bandhani, C, Cutout, F, MotionBlur, PetalRing, Photo, cutoutWidth, tint } from './fx';

const ABS: React.CSSProperties = { position: 'absolute', left: 0, top: 0 };
const FULL: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: W, height: H };

// text helpers ------------------------------------------------------------------
const text = (family: string, size: number, color: string, weight: number | string = 400, extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...ABS, fontFamily: family, fontSize: size, fontWeight: weight, color, lineHeight: 1, whiteSpace: 'nowrap', ...extra,
});
// a word that rises out of a mask (no fade-from-nothing pop): p = 0..1
const Rise: React.FC<{ p: number; children: React.ReactNode; style: React.CSSProperties; dist?: number }> = ({ p, children, style, dist = 1 }) => (
  <div style={{ ...style, overflow: 'hidden', paddingTop: 30, paddingBottom: 40, marginTop: -30 }}>
    <div style={{ transform: `translateY(${((1 - p) * 110 * dist).toFixed(2)}%)` }}>{children}</div>
  </div>
);

// background colour: each change is a hard beat cut or a short directional wipe ----
type Change = { t: number; color: string; dur: number; from: 'left' | 'right' | 'bottom' | 'fade' };
const CHANGES: Change[] = [
  { t: CUT.open, color: C.vermilion, dur: 0, from: 'fade' },
  { t: CUT.garba - 0.16, color: C.marigold, dur: 0.24, from: 'right' },
  { t: CUT.ramzat, color: C.rani, dur: 0, from: 'fade' },
  { t: CUT.textiles - 0.1, color: C.emerald, dur: 0.22, from: 'bottom' },
  { t: CUT.dandiya, color: C.purple, dur: 0, from: 'fade' },
  { t: CUT.raas, color: C.marigold, dur: 0, from: 'fade' },
  { t: CUT.garbo - 0.18, color: C.maroon, dur: 0.26, from: 'right' },
  { t: CUT.amba - 0.12, color: C.cream, dur: 0.32, from: 'fade' },
];
const Background: React.FC<{ t: number }> = ({ t }) => {
  let i = 0;
  while (i + 1 < CHANGES.length && t >= CHANGES[i + 1].t) i++;
  const cur = CHANGES[i];
  const prev = CHANGES[Math.max(0, i - 1)];
  const p = cur.dur > 0 ? smooth(seg(t, cur.t, cur.t + cur.dur)) : 1;
  const clip = cur.from === 'right' ? `inset(0 0 0 ${(100 * (1 - p)).toFixed(3)}%)`
    : cur.from === 'left' ? `inset(0 ${(100 * (1 - p)).toFixed(3)}% 0 0)`
      : cur.from === 'bottom' ? `inset(${(100 * (1 - p)).toFixed(3)}% 0 0 0)` : undefined;
  return (
    <>
      <div style={{ ...FULL, background: prev.color }} />
      <div style={{ ...FULL, background: cur.color, clipPath: clip, opacity: cur.from === 'fade' ? p : 1 }} />
    </>
  );
};

// ================================================================== 1 · નવરાત્રી (0 – 1.97)
const Open: React.FC<{ t: number }> = ({ t }) => {
  const exit = (tt: number) => -1500 * eInCubic(seg(tt, CUT.garba - 0.3, CUT.garba + 0.12));
  const [bx] = blurOf((tt) => [exit(tt), 0], t);
  const card = smooth(seg(t, 0.05, 1.0));
  const title = snap(seg(t, 0.35, 1.05));
  return (
    <MotionBlur id="openX" sx={bx} sy={0} style={{ transform: `translateX(${exit(t)}px)` }}>
      <Bandhani w={W} h={H} color={C.cream} opacity={0.11} />
      <div style={{ ...ABS, left: 1010, top: 64 + 70 * (1 - card), opacity: clamp(card * 1.6), transform: `rotate(${lerp(-4, -2, card)}deg) scale(${lerp(0.94, 1, card)})`, transformOrigin: '50% 60%',
        boxShadow: '0 22px 50px rgba(60,5,5,.35)', borderRadius: 22 }}>
        <Photo id="ground" w={820} h={440} radius={22} zoom={lerp(1.1, 1.02, seg(t, 0, 2))} />
      </div>
      <Rise p={title} style={{ ...ABS, left: 120, top: 120 }}>
        <div style={text(F.guj, 196, C.cream, 700, { position: 'relative', textShadow: '0 6px 24px rgba(80,10,5,.25)' })}>નવરાત્રી</div>
      </Rise>
      <div style={text(F.serif, 34, tint(C.vermilion, 0.62), 400, { left: 128, top: 440, fontStyle: 'italic', letterSpacing: '0.04em', opacity: eOutCubic(seg(t, 0.9, 1.4)) })}>
        nine nights · one rhythm
      </div>
    </MotionBlur>
  );
};

// ================================================================== 2 · GARBA (1.97 – 4.06)
const Garba: React.FC<{ t: number }> = ({ t }) => {
  const word = (tt: number) => lerp(260, 0, smooth(seg(tt, CUT.garba - 0.16, CUT.garba + 0.5))) - 70 * seg(tt, CUT.garba, CUT.ramzat);
  const [wbx] = blurOf((tt) => [word(tt), 0], t);
  const fIn = snap(seg(t, CUT.garba + 0.02, CUT.garba + 0.55));
  const mX = (tt: number) => lerp(-520, 0, smooth(seg(tt, b(5) - 0.08, b(5) + 0.42)));
  const [mbx] = blurOf((tt) => [mX(tt), 0], t);
  const fH = 600, mH = 560;
  return (
    <>
      <MotionBlur id="garbaWord" sx={wbx} sy={0}>
        <div style={text(F.display, 600, tint(C.marigold, 0.3), 400, { left: 110 + word(t), top: -50, letterSpacing: '0.03em' })}>GARBA</div>
      </MotionBlur>
      <MotionBlur id="garbaM" sx={mbx} sy={0}>
        <div style={{ ...ABS, left: 560 + mX(t) - cutoutWidth('dancerM', mH) / 2, top: H - mH + 40 }}><Cutout id="dancerM" h={mH} /></div>
      </MotionBlur>
      <div style={{ ...ABS, left: 1120 + 20 * seg(t, CUT.garba, CUT.ramzat) - cutoutWidth('dancerF', fH) / 2, top: H - fH + 30 + 120 * (1 - fIn), opacity: clamp(fIn * 2) }}>
        <Cutout id="dancerF" h={fH} />
      </div>
    </>
  );
};

// ================================================================== 3 · ગરબાની રમઝટ (4.06 – 5.63)
const Ramzat: React.FC<{ t: number }> = ({ t }) => {
  const zoom = lerp(1.08, 1.0, smooth(seg(t, CUT.ramzat, CUT.textiles)));
  const w1 = snap(seg(t, CUT.ramzat + 0.02, CUT.ramzat + 0.45));
  const w2 = snap(seg(t, b(8), b(8) + 0.45));
  return (
    <>
      <div style={{ ...ABS, clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)' }}>
        <Photo id="ground" w={1220} h={H} zoom={zoom} />
      </div>
      <Bandhani w={W} h={H} color={C.cream} opacity={0.08} />
      <Rise p={w1} style={{ ...ABS, left: 1210, top: 92 }}>
        <div style={text(F.guj, 96, C.cream, 600, { position: 'relative' })}>ગરબાની</div>
      </Rise>
      <Rise p={w2} style={{ ...ABS, left: 1200, top: 238 }}>
        <div style={text(F.guj, 168, C.marigold, 700, { position: 'relative' })}>રમઝટ</div>
      </Rise>
    </>
  );
};

// ================================================================== 4 · રંગ • રાસ • ગરબા — textiles (5.63 – 7.72)
const Textiles: React.FC<{ t: number }> = ({ t }) => {
  const t0 = CUT.textiles;
  const card = (d: number) => snap(seg(t, t0 + d, t0 + d + 0.5));
  const drift = seg(t, t0, CUT.dandiya);
  const words: [string, number][] = [['રંગ', b(10)], ['રાસ', b(11)], ['ગરબા', b(12)]];
  return (
    <>
      <div style={{ ...ABS, left: 70 - 14 * drift, top: 60 + 90 * (1 - card(0)), opacity: clamp(card(0) * 2), transform: 'rotate(-3deg)', boxShadow: '0 18px 40px rgba(0,30,15,.4)', borderRadius: 14 }}>
        <Photo id="bandhani" w={430} h={430} radius={14} />
      </div>
      <div style={{ ...ABS, left: 420 + 10 * drift, top: 90 + 90 * (1 - card(0.18)), opacity: clamp(card(0.18) * 2), transform: 'rotate(3.5deg)', boxShadow: '0 18px 40px rgba(0,30,15,.4)', borderRadius: 14 }}>
        <Photo id="mirror" w={380} h={400} radius={14} />
      </div>
      <div style={{ ...ABS, left: 700 + 22 * drift - cutoutWidth('jewel', 330) / 2, top: 210 + 120 * (1 - card(0.36)), opacity: clamp(card(0.36) * 2) }}>
        <Cutout id="jewel" h={330} />
      </div>
      <div style={{ ...ABS, left: 1000, top: 196, display: 'flex', alignItems: 'center', gap: 34 }}>
        {words.map(([w, at], i) => {
          const p = snap(seg(t, at, at + 0.42));
          return (
            <React.Fragment key={w}>
              <Rise p={p} style={{ position: 'relative' }}>
                <div style={text(F.guj, 128, C.cream, 600, { position: 'relative' })}>{w}</div>
              </Rise>
              {i < 2 && <div style={{ width: 16, height: 16, borderRadius: 8, background: C.marigold, transform: `scale(${eOutCubic(seg(t, at + 0.2, at + 0.45))})` }} />}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ ...ABS, left: 1016, top: 420, height: 4, width: 760 * smooth(seg(t, b(13), b(13) + 0.45)), background: C.marigold, borderRadius: 2 }} />
    </>
  );
};

// ================================================================== 5 · DANDIYA → RAAS (7.72 – 9.81) — dhol section
const Dandiya: React.FC<{ t: number }> = ({ t }) => {
  const raas = t >= CUT.raas;
  const exit = (tt: number) => -1700 * eInCubic(seg(tt, CUT.garbo - 0.3, CUT.garbo + 0.08));
  const [bx] = blurOf((tt) => [exit(tt), 0], t);
  // sticks tick together on each beat of the bar (k = 14…17), quick and settled — no shake
  const beat = Math.floor((t - b(14)) / (b(15) - b(14)));
  const local = (t - b(14 + beat)) / (b(15) - b(14));
  const tick = (beat % 2 ? -1 : 1) * 7 * (1 - snap(clamp(local * 2.2)));
  const pairIn = snap(seg(t, CUT.dandiya, CUT.dandiya + 0.35));
  const stickH = 380;
  const word = raas ? 'RAAS' : 'DANDIYA';
  const wordColor = raas ? tint(C.marigold, 0.32) : tint(C.purple, 0.16);
  return (
    <MotionBlur id="dandiyaX" sx={bx} sy={0} style={{ transform: `translateX(${exit(t)}px)` }}>
      <div style={{ ...FULL, display: 'flex', justifyContent: 'center' }}>
        <div style={text(F.display, raas ? 640 : 560, wordColor, 400, { position: 'relative', top: raas ? -62 : -36, letterSpacing: '0.02em' })}>{word}</div>
      </div>
      <div style={{ ...ABS, left: 300, top: 110, transform: `rotate(${-28 + tick}deg)`, transformOrigin: '50% 80%' }}><Cutout id="sticks" h={stickH} /></div>
      <div style={{ ...ABS, left: W - 300 - cutoutWidth('sticks', stickH), top: 110, transform: `rotate(${28 - tick}deg) scaleX(-1)`, transformOrigin: '50% 80%' }}><Cutout id="sticks" h={stickH} /></div>
      <div style={{ ...ABS, left: W / 2 - cutoutWidth('dandiyaPair', 590) / 2 + (raas ? 30 : 0) * smooth(seg(t, CUT.raas, CUT.raas + 0.4)), top: H - 590 + 30 + 110 * (1 - pairIn) }}>
        <Cutout id="dandiyaPair" h={590} />
      </div>
    </MotionBlur>
  );
};

// ================================================================== 6 · garbo + ગુજરાતની શાન (9.81 – 11.90)
const Garbo: React.FC<{ t: number }> = ({ t }) => {
  const rise = smooth(seg(t, CUT.garbo - 0.05, CUT.garbo + 0.6));
  const out = smooth(seg(t, CUT.amba - 0.15, CUT.amba + 0.3));
  const push = lerp(1, 1.04, eInOutSine(seg(t, CUT.garbo, CUT.amba)));
  const gH = 470;
  const w1 = snap(seg(t, b(19), b(19) + 0.45));
  const w2 = snap(seg(t, b(20), b(20) + 0.45));
  const glow = 0.32 * rise * (1 - out) * (1 + 0.06 * Math.sin(t * 9));
  return (
    <div style={{ ...FULL, transform: `scale(${push})`, opacity: 1 - out }}>
      <Bandhani w={W} h={H} color={C.marigold} opacity={0.09} />
      <div style={{ ...ABS, left: W / 2 - 330, top: H / 2 - 260, width: 660, height: 560, background: `radial-gradient(ellipse 50% 50% at 50% 45%, rgba(255,176,60,${glow.toFixed(3)}), transparent 70%)` }} />
      <div style={{ ...ABS, left: W / 2 - cutoutWidth('garbo', gH) / 2, top: H - gH - 20 + 150 * (1 - rise) + 60 * out }}>
        <Cutout id="garbo" h={gH} shadow={0.5} />
      </div>
      <Rise p={w1} style={{ ...ABS, left: 180, top: 190 }}>
        <div style={text(F.guj, 104, C.cream, 600, { position: 'relative' })}>ગુજરાતની</div>
      </Rise>
      <Rise p={w2} style={{ ...ABS, left: 1240, top: 150 }}>
        <div style={text(F.guj, 176, C.marigold, 700, { position: 'relative' })}>શાન</div>
      </Rise>
    </div>
  );
};

// ================================================================== 7 · Maa Amba — જય અંબે (11.90 – 13.99)
const Amba: React.FC<{ t: number }> = ({ t }) => {
  const inn = smooth(seg(t, CUT.amba - 0.05, CUT.amba + 0.55));
  const out = smooth(seg(t, CUT.close, CUT.close + 0.4));
  const w1 = snap(seg(t, b(23), b(23) + 0.45));
  const w2 = snap(seg(t, b(24), b(24) + 0.45));
  const ringRot = 8 * (t - CUT.amba);
  const aw = 360, ah = 500;
  return (
    <div style={{ ...FULL, opacity: 1 - out }}>
      <div style={{ ...ABS, left: W / 2 - 330, top: H / 2 - 330 + 6, transform: `scale(${lerp(0.85, 1, inn)})`, opacity: inn * 0.9 }}>
        <PetalRing r={275} color={C.marigold} rot={ringRot} />
      </div>
      {/* temple-arch frame: the image is never covered by text */}
      <div style={{ ...ABS, left: W / 2 - aw / 2, top: (H - ah) / 2 + 40 * (1 - inn) + 10, opacity: inn, transform: `scale(${lerp(1, 0.96, out)})`,
        borderRadius: `${aw / 2}px ${aw / 2}px 18px 18px`, overflow: 'hidden', boxShadow: '0 20px 50px rgba(90,30,0,.35), 0 0 0 6px #F4C35A' }}>
        <Photo id="amba" w={aw} h={ah} zoom={lerp(1.06, 1.0, seg(t, CUT.amba, CUT.close))} />
      </div>
      <Rise p={w1} style={{ ...ABS, left: 420, top: 170 }}>
        <div style={text(F.guj, 150, C.vermilion, 700, { position: 'relative' })}>જય</div>
      </Rise>
      <Rise p={w2} style={{ ...ABS, left: 1225, top: 170 }}>
        <div style={text(F.guj, 150, C.vermilion, 700, { position: 'relative' })}>અંબે</div>
      </Rise>
    </div>
  );
};

// ================================================================== 8 · the final phrase resolves into the credit (13.99 – end)
const Credit: React.FC<{ t: number }> = ({ t }) => {
  const bg = smooth(seg(t, CUT.close, CUT.close + 0.5));
  const p = smooth(seg(t, CUT.credit, CUT.credit + 0.5));
  return (
    <>
      <div style={{ ...FULL, opacity: bg, background: `radial-gradient(ellipse 60% 85% at 50% 50%, ${C.cream} 0%, #F5DDB0 62%, #EFC27A 100%)` }} />
      <div style={{ ...FULL, opacity: bg }}><Bandhani w={W} h={H} color={C.vermilion} opacity={0.07} step={52} /></div>
      <div style={{ ...ABS, left: W / 2 - 230, top: H / 2 - 230, opacity: bg * 0.35 }}>
        <PetalRing r={190} color="#E9A93A" rot={6 * (t - CUT.close)} />
      </div>
      <div style={{ ...FULL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: p, transform: `translateY(${(10 * (1 - p)).toFixed(2)}px)` }}>
        <div style={{ width: 46 * p, height: 2, background: C.vermilion, marginBottom: 16, opacity: 0.8 }} />
        <div style={{ fontFamily: F.serif, fontSize: 44, fontWeight: 400, color: C.maroon, fontVariantNumeric: 'lining-nums', letterSpacing: `${(0.08 + 0.04 * (1 - p)).toFixed(3)}em` }}>@h81t6</div>
      </div>
    </>
  );
};

// ================================================================== composition
export const Navratri: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: C.vermilion, overflow: 'hidden' }}>
      <Audio src={staticFile('audio/song.wav')} />
      <Background t={t} />
      {t < CUT.garba + 0.15 && <Open t={t} />}
      {t >= CUT.garba - 0.2 && t < CUT.ramzat && <Garba t={t} />}
      {t >= CUT.ramzat && t < CUT.textiles + 0.15 && <Ramzat t={t} />}
      {t >= CUT.textiles - 0.05 && t < CUT.dandiya && <Textiles t={t} />}
      {t >= CUT.dandiya && t < CUT.garbo + 0.1 && <Dandiya t={t} />}
      {t >= CUT.garbo - 0.1 && t < CUT.amba + 0.32 && <Garbo t={t} />}
      {t >= CUT.amba - 0.1 && t < CUT.close + 0.42 && <Amba t={t} />}
      {t >= CUT.close && <Credit t={t} />}
    </AbsoluteFill>
  );
};
