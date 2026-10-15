# GPT Astra 6: fan-made ChatGPT concept promo (Remotion source)

1920×1080, native 60 fps, 18.2 s, H.264 yuv420p with fast-start.

This is an unofficial fan concept. "GPT Astra 6" is a fictional name supplied for
the project, and nothing in the video describes real specifications, benchmarks or
releases. The video says "Fan-made concept" at the start and "Fan-made concept · not
affiliated with OpenAI" on the end card. The ChatGPT/OpenAI mark is a trademark of
OpenAI.

## How it is built

- **One deterministic timeline.** Everything in `src/Astra.tsx` is computed from frame time; the cues are listed in `T = {…}`.
- **Real temporal motion blur.** During fast moves, `SubframeBlur` renders 8 sub-frames centred on the frame time, which is a 180° shutter at 60 fps, and averages them. When nothing moves fast it renders once, so readable holds stay sharp and timing never shifts. The background light layer is drawn outside the sampler, which keeps its gradients free of banding.
- **Shared camera and anchors.**
  - The logo of the opening lockup lands exactly on the chat header's logo, so the hand-over has no jump.
  - The UI uses a single camera for the push-in, caret follow, whip pan to the model pill and tilt to the menu.
  - The code and the dashboard share a top edge and one lateral camera move.
- **Easing.** Several bezier curves, each used for a specific kind of motion: camera, whip, UI entrance, exit.

## Sequence

| Time (s) | Scene |
|---|---|
| 0 – 1.3 | Night sky: the moon glows and gives way to the logo |
| 0.85 – 2.9 | Logo, then "ChatGPT" letter by letter, then "GPT ASTRA 6" |
| 2.95 – 4.15 | Lockup scales into the chat header; UI resolves soft → sharp, camera pushes in |
| 4.3 – 6.0 | "Turn this idea into a working dashboard." with natural typing rhythm and caret |
| 6.0 – 8.05 | Whip pan to the model pill, click ripple, menu opens, highlight Auto → Instant → GPT Astra 6, select, close |
| 8.1 – 10.3 | Send; valid JS/JSX code reveals line by line, with the newest line glowing |
| 10.35 – 12.4 | Code becomes a dashboard: chart, three cards, Week/Month toggle. Sample data, labelled as such |
| 12.55 – 16.6 | Reason. / Build. / Understand. / From complex ideas. / To clear next steps. |
| 16.6 – 18.2 | Logo, "Think deeper. Create more.", "GPT ASTRA 6", fan-made label (held for more than 1 s) |

## Assets

| Asset | Source | Licence |
|---|---|---|
| OpenAI / ChatGPT mark | `public/brand/openai-logo.svg`, from `@lobehub/icons-static-svg` on npm | MIT for the file; the mark is OpenAI's trademark |
| Inter, JetBrains Mono | `public/fonts/` | SIL OFL, licences included |
| Music and sounds | `audio/make_audio.py` | Original, fully synthesised |

The reference's soundtrack is not reused because its licence is unknown. The original
score keeps the reference's pulse (about 146 bpm) and lands a note on each scene and
word change. Interaction sounds are limited to a few soft key ticks, one click, the
selection and the send.

## Render

```bash
npm install
npm run audio                                   # public/audio/score.wav
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
ffmpeg -i out/GPT_Astra_6_Concept_1920x1080_60fps.mp4 -c copy -movflags +faststart final.mp4
node scripts/stills.mjs <outdir> <frame…>       # frame-accurate stills for review
```
