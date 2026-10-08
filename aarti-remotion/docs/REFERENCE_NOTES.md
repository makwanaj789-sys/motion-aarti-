# Reference study — measured choreography

Source: the supplied Claude promo (1280×720, 30 fps, 336 frames, 11.2 s).
Every frame was extracted and reviewed on contact sheets; positions come from a
per-frame bright-pixel bounding box / centroid pass plus manual reads of key frames.
Frame numbers below are **reference frames (r)**; the AartiMusic composition runs
at 60 fps, so composition frame = 2·r. Pixel values are converted to 1920×1080 (×1.5).

| r | Reference | Measurement | AartiMusic implementation |
|---|---|---|---|
| 1–6 | Light streak from lower-left lands at centre | head progress .54/.90/.98 at r2/3/4; tail .25/.72/.93 at r3/4/5 | quartic-out head, sine in-out tail along a cubic path |
| 6–9 | Point of light grows | radius 3→40 px | radial spark |
| 9–16 | Logo swells inside an expanding ring | icon peak ×1.3 at r13; ring r≈55→85 px, fades by r16 | AartiMusic icon, same curve |
| 24–43 | Logo slides left, wordmark glides in | icon left edge progress .05/.17/.49/.76/.86/.92/.98 at r26/28/30/32/34/36/40 → fitted bezier(.55,0,.02,1) over r22.5–44.5 (rms err .010) | “AartiMusic” letters stagger 0.5 r, spread decays (1−u)³ |
| 47–53 | Lockup sinks and fades | centroid +100 px (1280) accelerating | 150 px ease-in-cubic drop, vertical motion blur |
| 53–62 | Four arcs of light sweep the frame, land on the greeting words | bbox spans full height at r57–58 | four comets landing on icon / Good / evening, / Ajay |
| 61–77 | Greeting assembles: wide gaps → too tight → relaxed | gaps collapse r63–67, relax by r76; glow peaks r66–68 | spline keys for word gap; glow bump r62–72 |
| 70–80 | Slow drift up, shrink to 0.95 | −9 px, −5 % | same |
| 80–89 | Elliptical bloom grows under the greeting, flashes wide, settles into the input box; greeting climbs above it | bloom peak r84; wide flash r86–87 (×1.27 of box); greeting climb progress .09/.23/.57/.88 at r83/85/87/88 → bezier(.8,.05,.4,1) r80–91.5 | bloom ellipse → AartiMusic search field (“Songs, artists…”) |
| 97–112 | Whip-zoom into the left of the field | progress .05/.13/.31/.66/.85/.95 at r99/101/103/104/105/107 → bezier(.85,.05,.2,1) r96–110.5 (rms .016); zoom ≈1.55 | zoom 1→1.5, x-motion blur from velocity |
| 109–151 | Caret appears, typing ≈1 char/frame with micro-pauses; slow follow, push-in | — | “Om Jai Jagdish Hare”, 19 keys r113–146.5 |
| 128–151 | Whip-pan to the end of the line | progress .03/.12/.35/.59/.81/.92/.95/.98 at r130/132/134/135/137/140/142/147 → bezier(.55,.05,.05,1) r127.5–148 (rms .020) | pan 450 world px, reveals ✕ and the search icon |
| 150–170 | Field lifts out of frame, last row lingers and fades | bottom-edge progress .05/.20/.50/.73/.84/.93 at r152/156/159/161/163/166 → bezier(.6,.05,.3,1) r149–171 | camera lift 520 world px, fade r159–170 |
| 170–188 | Send button rises into centre; hand enters from below | button +123 px → 0 (cubic-out r170–187); hand ease-out quad r173–190 | teal search button, pointer hand |
| 188–192 | Press | button ×0.94, hand ×0.9 | same |
| 190–200 | Ring bursts from the button and fills the frame | radius 440/520/640/790/960 px at r192/194/195/196/197; brightness peak r196 | same radii, alpha capped at .55 (restrained) |
| 200–209 | Button goes pale, then drops and fades; hand follows | drop 280 px ease-in r203–208.5 | same |
| 213–222 | Response drops in from the top | header top −60 → 282 px | same, results list |
| 214–268 | Lines stream in, newest glowing, sections at r216/234/250, close at r263 | — | rows at r217/220.5/224/228, 235.5/239.5, 251.5/255.5; footer r263 |
| 224–272 | Continuous zoom-out, block re-centres | text scale 1 → 0.59; left edge 99 → 465 px | z 1 → 0.6, Catmull-Rom camera keys |
| 272–278 | Block squashes into wavy lines | width ×0.53 by r277 | rows → wavy lines → one flowing waveform |
| 278–300 | Symbol, then the big word types in, glow decays, slight scale-down | letters at r281/289/290/295 | “Your daily”, 10 keys r281–295 |
| 301–315 | Smaller word, bright then cooling | scale 1.1 → 1 | “sound.” |
| 316–324 | Word dissolves into the logo, which pops ×1.3 and settles | pop peak r321–322 | AartiMusic icon |
| 324–336 | Logo hold (reference ends here) | 0.4 s | extended: wordmark lockup (same motion as r24–43), “@AartiMusic_bot”, 0.5 s read, fade |

The reference ends after a 0.4 s logo hold. The brief adds a wordmark and a
secondary line, so the end card runs 30 reference frames (1 s) longer: 12.2 s total.

## Motion blur

Directional Gaussian blur, computed per element from the analytic velocity of its
screen position (central difference at ±¼ reference frame). Virtual shutter = one
60 fps frame; σ = |v|·0.5/2.4, capped. When velocity is ~0 the filter is removed,
so every readable hold renders sharp.
