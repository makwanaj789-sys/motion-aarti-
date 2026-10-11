// Original flat-vector illustrations drawn for this edit (no stock or third-party art).
// Every figure is drawn in a 400×900 box whose bottom-centre (200, 900) is the feet.
import React from 'react';

export type Skin = '#C68642' | '#A86B3C' | '#8D5524' | '#D9A066';
const HAIR = '#1E120D';
const GOLD = '#E9B63B';

// ------------------------------------------------------------------ helpers
const arm = (pts: number[][], skin: string, w = 17) => (
  <path d={`M${pts[0][0]} ${pts[0][1]} Q${pts[1][0]} ${pts[1][1]} ${pts[2][0]} ${pts[2][1]}`} stroke={skin} strokeWidth={w} strokeLinecap="round" fill="none" />
);
const bangles = (hand: number[], elbow: number[], colors: string[]) => {
  const dx = elbow[0] - hand[0], dy = elbow[1] - hand[1], l = Math.hypot(dx, dy);
  const ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
  return colors.map((c, i) => {
    const cx = hand[0] + ux * (14 + i * 6), cy = hand[1] + uy * (14 + i * 6);
    return <line key={i} x1={cx - nx * 10} y1={cy - ny * 10} x2={cx + nx * 10} y2={cy + ny * 10} stroke={c} strokeWidth={4} strokeLinecap="round" />;
  });
};
export const Stick: React.FC<{ x: number; y: number; angle: number; len?: number }> = ({ x, y, angle, len = 150 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={-6} y={-len} width={12} height={len} rx={6} fill="#C7342B" />
    {[0.15, 0.32, 0.5, 0.68, 0.85].map((f, i) => <rect key={i} x={-6.5} y={-len * f - 5} width={13} height={10} fill={i % 2 ? '#1E8A4C' : GOLD} />)}
    <circle cy={-len - 2} r={7} fill={GOLD} />
    <path d="M0 4 L-7 26 M0 4 L0 30 M0 4 L7 26" stroke="#E2475B" strokeWidth={3} strokeLinecap="round" />
  </g>
);

// ------------------------------------------------------------------ woman in chaniya choli
export type FPose = 'clap' | 'side' | 'dandiya' | 'twirl';
export const GarbaWoman: React.FC<{
  skirt: string; skirt2: string; choli: string; border: string; dupatta: string; skin?: Skin; pose?: FPose; flare?: number; sway?: number;
}> = ({ skirt, skirt2, choli, border, dupatta, skin = '#C68642', pose = 'clap', flare = 0.4, sway = 0 }) => {
  const hw = 150 + 75 * flare; // hem half-width
  const hemY = 862;
  const L = [170, 214], R = [230, 214];
  const P: Record<FPose, number[][][]> = {
    clap: [[L, [128, 150], [186, 78]], [R, [272, 150], [214, 78]]],
    side: [[L, [118, 250], [62, 196]], [R, [272, 168], [252, 82]]],
    dandiya: [[L, [128, 244], [92, 176]], [R, [272, 244], [308, 176]]],
    twirl: [[L, [120, 222], [58, 236]], [R, [280, 222], [342, 236]]],
  };
  const [la, ra] = P[pose];
  const wave = (y: number, amp: number) => {
    let d = `L${200 + hw} ${y}`;
    const n = 6;
    for (let i = n; i > 0; i--) {
      const x0 = 200 - hw + ((i - 1) * 2 * hw) / n, x1 = 200 - hw + (i * 2 * hw) / n;
      d += ` Q${(x0 + x1) / 2} ${y + amp * (i % 2 ? 1 : -1)} ${x0} ${y}`;
    }
    return d;
  };
  const skirtPath = `M166 300 C150 420 ${200 - hw * 0.8} 700 ${200 - hw} ${hemY} ${wave(hemY, 14)} Z`.replace(`L${200 + hw} ${hemY} Q`, `L${200 + hw} ${hemY} Q`);
  const skirtOutline = `M166 300 L234 300 C250 420 ${200 + hw * 0.8} 700 ${200 + hw} ${hemY} L${200 - hw} ${hemY} C${200 - hw * 0.8} 700 150 420 166 300 Z`;
  const band = (y: number, hwy: number) => `M${200 - hwy} ${y} L${200 + hwy} ${y}`;
  const mirrors = [];
  for (let row = 0; row < 3; row++) {
    const y = 470 + row * 120, half = 40 + (hw - 40) * ((y - 300) / (hemY - 300));
    for (let k = -3; k <= 3; k++) mirrors.push(<g key={`${row}${k}`} transform={`translate(${200 + (k / 3.4) * half} ${y})`}><circle r={6.5} fill="#FFF6DE" stroke={GOLD} strokeWidth={2} /><circle r={2.4} fill="#BFD8E8" /></g>);
  }
  return (
    <g transform={`rotate(${sway} 200 900)`}>
      {/* dupatta flowing behind */}
      <path d={`M232 212 C330 260 ${330 + 40 * flare} 420 ${300 + 50 * flare} 560 C270 470 230 380 220 300 Z`} fill={dupatta} opacity={0.92} />
      <path d={`M232 212 C330 260 ${330 + 40 * flare} 420 ${300 + 50 * flare} 560`} stroke={GOLD} strokeWidth={3} fill="none" />
      {/* skirt */}
      <path d={skirtOutline} fill={skirt} />
      {Array.from({ length: 9 }, (_, i) => { const f = (i + 1) / 10; return <path key={i} d={`M${172 + 56 * f} 302 L${200 - hw + 2 * hw * f} ${hemY - 6}`} stroke={skirt2} strokeWidth={10} opacity={0.55} />; })}
      <path d={`M${200 - hw * 0.93} ${hemY - 52} L${200 + hw * 0.93} ${hemY - 52} L${200 + hw} ${hemY} L${200 - hw} ${hemY} Z`} fill={border} />
      <path d={band(hemY - 56, hw * 0.92)} stroke={GOLD} strokeWidth={5} />
      <path d={band(hemY - 4, hw)} stroke={GOLD} strokeWidth={5} />
      {Array.from({ length: 11 }, (_, k) => <circle key={k} cx={200 - hw * 0.85 + (k * 1.7 * hw) / 10} cy={hemY - 27} r={7} fill="#FFF6DE" stroke={GOLD} strokeWidth={2} />)}
      {mirrors}
      <path d={skirtPath} fill="none" />
      {/* waist, midriff, choli */}
      <rect x={168} y={268} width={64} height={36} rx={10} fill={skin} />
      <path d="M160 206 Q200 194 240 206 L236 272 Q200 282 164 272 Z" fill={choli} />
      <path d="M164 272 Q200 282 236 272" stroke={GOLD} strokeWidth={4} fill="none" />
      <rect x={164} y={296} width={72} height={12} rx={5} fill={GOLD} />
      {/* arms + bangles */}
      {arm(la, skin)}{arm(ra, skin)}
      {bangles(la[2], la[1], ['#D6273C', GOLD, '#1E8A4C'])}
      {bangles(ra[2], ra[1], ['#D6273C', GOLD, '#1E8A4C'])}
      {pose === 'dandiya' && <><Stick x={la[2][0]} y={la[2][1] + 8} angle={-24} /><Stick x={ra[2][0]} y={ra[2][1] + 8} angle={24} /></>}
      {/* head */}
      <rect x={191} y={176} width={18} height={30} rx={6} fill={skin} />
      <ellipse cx={200} cy={146} rx={41} ry={45} fill={HAIR} />
      <circle cx={238} cy={116} r={20} fill={HAIR} />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={238 + Math.cos(i * 1.25) * 20} cy={116 + Math.sin(i * 1.25) * 20} r={5} fill="#FFF8E7" />)}
      <ellipse cx={200} cy={156} rx={30} ry={35} fill={skin} />
      <path d="M168 146 Q172 112 200 108 Q230 110 233 146 Q216 124 200 124 Q184 126 168 146 Z" fill={HAIR} />
      <circle cx={200} cy={136} r={3.4} fill="#C1121F" />
      <path d="M187 156 q5 3 9 0 M204 156 q5 3 9 0" stroke="#3A1F14" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M193 174 q7 4 14 0" stroke="#7A2E2E" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <circle cx={169} cy={170} r={5} fill={GOLD} /><circle cx={231} cy={170} r={5} fill={GOLD} />
      <path d="M190 206 Q200 222 210 206" stroke={GOLD} strokeWidth={4} fill="none" />
    </g>
  );
};

// ------------------------------------------------------------------ man in kediyu with pagdi
export const KediyuMan: React.FC<{
  kediyu: string; trim: string; pants: string; pagdi: string; pagdi2: string; skin?: Skin; pose?: 'dandiya' | 'clap' | 'strike'; flare?: number; sway?: number;
}> = ({ kediyu, trim, pants, pagdi, pagdi2, skin = '#A86B3C', pose = 'dandiya', flare = 0.4, sway = 0 }) => {
  const fw = 120 + 55 * flare;
  const L = [166, 214], R = [234, 214];
  const P = {
    dandiya: [[L, [124, 250], [100, 180]], [R, [276, 250], [300, 180]]],
    clap: [[L, [126, 150], [188, 82]], [R, [274, 150], [212, 82]]],
    strike: [[L, [120, 200], [150, 120]], [R, [280, 200], [250, 120]]],
  }[pose];
  const [la, ra] = P;
  const ruffle = [];
  for (let i = 0; i <= 10; i++) ruffle.push(<circle key={i} cx={200 - fw + (i * 2 * fw) / 10} cy={548} r={fw / 10 + 2} fill={kediyu} stroke={trim} strokeWidth={3} />);
  return (
    <g transform={`rotate(${sway} 200 900)`}>
      {/* chorno (gathered trousers) */}
      <path d="M150 520 C132 640 150 760 168 862 L196 862 L200 600 L204 862 L232 862 C250 760 268 640 250 520 Z" fill={pants} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${160 + i * 4} ${560 + i * 70} q20 10 40 0 q20 -10 40 0`} stroke="rgba(0,0,0,.12)" strokeWidth={3} fill="none" />)}
      <ellipse cx={180} cy={866} rx={20} ry={8} fill="#5A2E1A" /><ellipse cx={220} cy={866} rx={20} ry={8} fill="#5A2E1A" />
      {/* kediyu: fitted to the waist, then a flared, frilled skirt */}
      {ruffle}
      <path d={`M168 300 L232 300 C250 380 ${200 + fw * 0.9} 470 ${200 + fw} 548 L${200 - fw} 548 C${200 - fw * 0.9} 470 150 380 168 300 Z`} fill={kediyu} />
      {Array.from({ length: 8 }, (_, i) => { const f = (i + 1) / 9; return <path key={i} d={`M${172 + 56 * f} 304 L${200 - fw + 2 * fw * f} 544`} stroke={trim} strokeWidth={2} opacity={0.35} />; })}
      <path d={`M${200 - fw * 0.96} 520 L${200 + fw * 0.96} 520`} stroke={trim} strokeWidth={8} />
      <path d="M156 206 Q200 196 244 206 L236 302 L164 302 Z" fill={kediyu} />
      <path d="M200 206 L200 300" stroke={trim} strokeWidth={4} />
      {[230, 252, 274].map((y) => <circle key={y} cx={200} cy={y} r={3.5} fill={GOLD} />)}
      <path d="M156 206 Q200 196 244 206" stroke={trim} strokeWidth={6} fill="none" />
      <rect x={160} y={292} width={80} height={16} rx={6} fill={pagdi2} />
      {/* arms */}
      {arm(la, kediyu, 19)}{arm(ra, kediyu, 19)}
      <circle cx={la[2][0]} cy={la[2][1]} r={9} fill={skin} /><circle cx={ra[2][0]} cy={ra[2][1]} r={9} fill={skin} />
      {pose !== 'clap' && <><Stick x={la[2][0]} y={la[2][1] + 8} angle={pose === 'strike' ? 30 : -22} /><Stick x={ra[2][0]} y={ra[2][1] + 8} angle={pose === 'strike' ? -30 : 22} /></>}
      {/* head with pagdi */}
      <rect x={191} y={176} width={18} height={30} rx={6} fill={skin} />
      <ellipse cx={200} cy={154} rx={30} ry={34} fill={skin} />
      <path d="M166 142 C160 104 240 96 236 140 C228 128 172 126 166 142 Z" fill={pagdi} />
      <path d="M168 128 C190 110 216 112 234 126" stroke={pagdi2} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M170 138 C192 122 214 122 232 134" stroke={GOLD} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M236 132 C262 150 262 200 248 230 C244 196 240 168 232 150 Z" fill={pagdi} />
      <path d="M186 158 q5 3 9 0 M205 158 q5 3 9 0" stroke="#2B160D" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M188 172 q12 -6 24 0" stroke="#2B160D" strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <circle cx={200} cy={140} r={2.6} fill="#C1121F" />
    </g>
  );
};

// ------------------------------------------------------------------ flowers
export const Marigold: React.FC<{ r: number; c1?: string; c2?: string; rot?: number }> = ({ r, c1 = '#F59E0B', c2 = '#F97316', rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    {[1, 0.78, 0.56, 0.34].map((k, ring) => (
      <g key={ring}>
        {Array.from({ length: 16 - ring * 2 }, (_, i) => (
          <ellipse key={i} cx={0} cy={-r * k * 0.62} rx={r * k * 0.24} ry={r * k * 0.42} fill={ring % 2 ? c1 : c2}
            transform={`rotate(${(i * 360) / (16 - ring * 2) + ring * 11})`} stroke="rgba(120,40,0,.18)" strokeWidth={1} />
        ))}
      </g>
    ))}
    <circle r={r * 0.16} fill="#B45309" />
  </g>
);
export const Hibiscus: React.FC<{ r: number; color?: string; rot?: number }> = ({ r, color = '#E11D74', rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    {Array.from({ length: 5 }, (_, i) => (
      <path key={i} transform={`rotate(${i * 72})`} d={`M0 0 C${r * 0.55} ${-r * 0.2} ${r * 0.62} ${-r * 0.95} 0 ${-r} C${-r * 0.62} ${-r * 0.95} ${-r * 0.55} ${-r * 0.2} 0 0 Z`} fill={color} stroke="rgba(90,0,30,.25)" strokeWidth={1.5} />
    ))}
    <circle r={r * 0.2} fill="#8B0A3A" />
    <path d={`M0 0 L${r * 0.55} ${-r * 0.55}`} stroke="#FDE68A" strokeWidth={r * 0.06} strokeLinecap="round" />
    <circle cx={r * 0.58} cy={-r * 0.58} r={r * 0.08} fill="#FACC15" />
  </g>
);
export const Leaf: React.FC<{ len: number; rot: number; color?: string }> = ({ len, rot, color = '#15803D' }) => (
  <g transform={`rotate(${rot})`}>
    <path d={`M0 0 C${len * 0.3} ${-len * 0.25} ${len * 0.75} ${-len * 0.22} ${len} 0 C${len * 0.75} ${len * 0.22} ${len * 0.3} ${len * 0.25} 0 0 Z`} fill={color} />
    <path d={`M0 0 L${len * 0.95} 0`} stroke="rgba(255,255,255,.35)" strokeWidth={2} />
  </g>
);
// a corner spray of flowers; anchored at the corner (0,0), growing into +x +y
export const FlowerCorner: React.FC<{ scale?: number; palette?: 'warm' | 'pink' }> = ({ scale = 1, palette = 'warm' }) => (
  <g transform={`scale(${scale})`}>
    <Leaf len={150} rot={18} /><Leaf len={130} rot={62} color="#166534" /><Leaf len={110} rot={-8} color="#22863A" /><Leaf len={120} rot={88} />
    {palette === 'warm' ? (
      <>
        <g transform="translate(40 40)"><Marigold r={58} /></g>
        <g transform="translate(140 22)"><Hibiscus r={44} color="#E11D74" rot={20} /></g>
        <g transform="translate(26 140)"><Marigold r={42} c1="#FBBF24" c2="#F59E0B" rot={14} /></g>
        <g transform="translate(118 112)"><Marigold r={30} c1="#FB923C" c2="#EA580C" /></g>
      </>
    ) : (
      <>
        <g transform="translate(46 40)"><Hibiscus r={56} color="#DB2777" rot={8} /></g>
        <g transform="translate(150 30)"><Marigold r={40} c1="#FBBF24" c2="#F59E0B" /></g>
        <g transform="translate(30 150)"><Hibiscus r={40} color="#F472B6" rot={40} /></g>
        <g transform="translate(120 120)"><Hibiscus r={28} color="#BE185D" rot={60} /></g>
      </>
    )}
  </g>
);

// ------------------------------------------------------------------ garbo (earthen pot) with a lit diya
export const Garbo: React.FC<{ flicker: number }> = ({ flicker }) => (
  <g>
    <defs>
      <radialGradient id="garboGlow"><stop offset="0" stopColor="#FFE08A" stopOpacity="0.9" /><stop offset="1" stopColor="#FFB020" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx={0} cy={-330} rx={90} ry={110} fill="url(#garboGlow)" opacity={0.55 + 0.1 * flicker} />
    <path d="M-150 -40 C-190 -170 -120 -260 -60 -268 L60 -268 C120 -260 190 -170 150 -40 C130 0 -130 0 -150 -40 Z" fill="#B4532A" />
    <path d="M-150 -40 C-190 -170 -120 -260 -60 -268 L60 -268 C120 -260 190 -170 150 -40" fill="none" stroke="#7C2D12" strokeWidth={4} />
    <rect x={-70} y={-292} width={140} height={30} rx={10} fill="#9A3412" />
    {[-150, -110, -70].map((y, row) => Array.from({ length: 7 - row }, (_, i) => {
      const x = (i - (6 - row) / 2) * 38;
      return <circle key={`${row}${i}`} cx={x} cy={y} r={9} fill="#FFD166" opacity={0.75 + 0.2 * flicker} />;
    }))}
    <path d="M-168 -96 Q0 -60 168 -96" stroke="#E9B63B" strokeWidth={8} fill="none" />
    <path d="M-160 -190 Q0 -228 160 -190" stroke="#1E8A4C" strokeWidth={8} fill="none" />
    <path d="M-60 -300 Q0 -270 60 -300 L50 -320 L-50 -320 Z" fill="#C2410C" />
    <path d={`M0 ${-322} C-16 -350 -8 -380 0 ${-404 - 6 * flicker} C8 -380 16 -350 0 -322 Z`} fill="#FFB703" />
    <path d={`M0 -326 C-7 -346 -3 -362 0 ${-374 - 4 * flicker} C3 -362 7 -346 0 -326 Z`} fill="#FFF3B0" />
  </g>
);

// ------------------------------------------------------------------ Maa Amba, shown through her symbols: halo, trishul, red chunri, lotus
export const AmbaSymbol: React.FC<{ rot: number; glow: number }> = ({ rot, glow }) => (
  <g>
    <g transform={`rotate(${rot})`}>
      {Array.from({ length: 36 }, (_, i) => <path key={i} transform={`rotate(${i * 10})`} d="M0 -250 L12 -300 L0 -330 L-12 -300 Z" fill="#E9B63B" opacity={0.9} />)}
      <circle r={248} fill="none" stroke="#E9B63B" strokeWidth={8} />
      <circle r={232} fill="#FCE7B2" opacity={0.25 + 0.15 * glow} />
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={Math.cos((i * Math.PI) / 12) * 214} cy={Math.sin((i * Math.PI) / 12) * 214} r={7} fill="#C2410C" />)}
    </g>
    {/* trishul */}
    <rect x={-9} y={-170} width={18} height={420} rx={6} fill="#C99A2E" />
    <path d="M0 -330 C-16 -300 -16 -250 0 -214 C16 -250 16 -300 0 -330 Z" fill="#E9B63B" stroke="#A16207" strokeWidth={3} />
    <path d="M-12 -200 C-80 -210 -100 -260 -96 -310 C-70 -270 -40 -250 -10 -240 Z" fill="#E9B63B" stroke="#A16207" strokeWidth={3} />
    <path d="M12 -200 C80 -210 100 -260 96 -310 C70 -270 40 -250 10 -240 Z" fill="#E9B63B" stroke="#A16207" strokeWidth={3} />
    <rect x={-46} y={-214} width={92} height={22} rx={8} fill="#C99A2E" />
    {/* chunri draped from the trishul */}
    <path d="M-40 -190 C-150 -140 -170 20 -120 140 C-90 60 -60 -40 -10 -120 C40 -40 90 60 120 140 C170 20 150 -140 40 -190 Z" fill="#D7261E" />
    <path d="M-120 140 C-90 60 -60 -40 -10 -120 C40 -40 90 60 120 140" stroke="#E9B63B" strokeWidth={6} fill="none" />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-110 + i * 27} cy={-60 + Math.abs(i - 4) * 18} r={4} fill="#FDE68A" />)}
    {/* lotus base */}
    {[-2, -1, 0, 1, 2].map((i) => (
      <path key={i} transform={`translate(${i * 46} 250) rotate(${i * 14})`} d="M0 0 C-34 -40 -24 -96 0 -120 C24 -96 34 -40 0 0 Z" fill={i % 2 ? '#F472B6' : '#EC4899'} stroke="#9D174D" strokeWidth={2} />
    ))}
    <ellipse cx={0} cy={252} rx={150} ry={22} fill="#15803D" />
  </g>
);
