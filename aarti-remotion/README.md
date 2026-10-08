# AartiMusic promo (Remotion source)

16:9 promotional video, 1920×1080 at 60 fps, 12.2 s. Its choreography is
re-timed frame by frame to the supplied Claude reference cut. The measurements
are in [`docs/REFERENCE_NOTES.md`](docs/REFERENCE_NOTES.md).

Rendered output: `../output/AartiMusic_Promo_Reference_16x9_1920x1080_60fps.mp4`

## Layout

| Path | What it holds |
|---|---|
| `src/timing.ts` | fps and duration, easing curves fitted to the reference, the spline helper and velocity-based motion blur |
| `src/Promo.tsx` | the whole timeline as one composition (open, arcs, greeting and field under one camera, press, results, waveform, outro) |
| `src/fx.tsx` | palette (the app's teal theme), font loading and measuring, the `MotionBlur` wrapper, light trails, icons, hand |
| `src/data.ts` | query and results content (the app's demo catalogue) |
| `audio/make_audio.py` | original synthesised score and interaction sounds, written on the same cue frames |
| `public/` | Sora fonts, AartiMusic icon, cover art, `audio/score.wav` |

Every cue is written in reference frames `r`, which are 30 fps frame numbers. The
composition evaluates `r = frame / 2`, so to retime a beat you change its `r`
values.

## Render

Requirements: Node 18+, Python 3 with numpy and scipy. Remotion can download its
own headless Chrome; on a machine that already has one, point `REMOTION_BROWSER`
at it.

```bash
npm install
npm run audio                       # rebuild public/audio/score.wav
npx remotion studio src/index.ts    # live preview / scrub
REMOTION_BROWSER=/path/to/headless_shell npm run render
# stills for review: node scripts/stills.mjs <outdir> <frame> [frame …]
```

The project uses Remotion. Individuals and small teams can use it for free.
Larger companies need a Remotion company license; see remotion.dev/license.
