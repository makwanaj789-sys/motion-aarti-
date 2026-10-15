# GPT Astra 6: fan-made ChatGPT concept promo (Remotion source)

**Main composition: `AstraRef`** (`src/AstraRef.tsx`)
- 1920×1080, native 60 fps, 14.0 s, H.264 yuv420p with fast-start
- Output: `../output/GPT_Astra_6_Concept_v2_RefAudio_1920x1080_60fps.mp4`

This is an unofficial fan concept.
- "GPT Astra 6" is a concept entry. The video labels it "Fan-made concept" at the start, tags it CONCEPT in the model menu and ends on "Fan-made concept · not affiliated with OpenAI".
- The ChatGPT/OpenAI mark is a trademark of OpenAI.

The first version (`AstraPromo`, `src/Astra.tsx`, 18.2 s, original synthesised score) is kept for reference.

## Audio

The soundtrack is the reference video's own audio, used unchanged: same segment, speed and pitch. The animation is rebuilt on its accents instead of the music being fitted to the picture. Its licence is unknown, so the WAV is not committed.

```bash
scripts/extract_audio.sh /path/to/reference.mp4   # → public/audio/reference.wav
```

Onsets were measured with spectral flux, and every cue in `T = {…}` sits on one of them:

0.84 · 1.33 · 1.88 · 2.15 · 2.43 · 3.10 · 3.51 · 4.06 · 4.33 · 4.88 · 5.28 · 5.69 · 6.24 · 6.52 · 6.80 · 7.06 · 8.15 · 8.43 · 8.70 · 9.24 · 10.06 · 10.71 · 10.88 · 11.84

The music decays after about 12.6 s and is silent after 13.0 s.

## Sequence (matches the reference's timestamps)

| Time (s) | Scene |
|---|---|
| 0 – 0.95 | Night sky: the moon glows, then hands over to the logo |
| 0.84 – 2.39 | Logo, then "ChatGPT" (Fraunces) letter by letter, soft to sharp. Push in at 1.88, lift away at 2.15 |
| 2.33 – 4.0 | Chat UI fills the frame, then a whip-in on the input. "Help me build a dashboard" types with the caret |
| 4.04 – 6.75 | Whip pan to the model selector. Click ring, then the dropdown opens. The cursor moves GPT-6 → GPT-6 Pro → GPT-5.6 Sol → GPT-5.6 Luna → **GPT Astra 6 (Concept)**. The entry is selected, the menu closes and the selector reads "GPT Astra 6" |
| 7.06 – 8.6 | Code response: the camera starts close on the first lines and eases back while lines arrive (the newest line glows), then pulls back at 8.3 |
| 8.66 – 11.86 | "Writing" / "& analysis" (9.24), "Coding" (10.06), "Research" (10.66). Per-letter blur-to-sharp reveals |
| 11.8 – 14.0 | Logo flash with bloom, shrinks and settles. "GPT Astra 6" and the fan-made footer |

## Model names in the menu

The names were checked against current OpenAI sources (October 2026):

| Name | Source |
|---|---|
| GPT-6 (latest), GPT-6 Pro | https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt |
| GPT-5.6 Sol | https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/ |
| GPT-5.6 Luna (Free and Go default) | https://help.openai.com/en/articles/6825453-chatgpt-release-notes |
| Model list, release notes | https://developers.openai.com/api/docs/models, https://help.openai.com/en/articles/9624314-model-release-notes |

The thinking level (Instant / Medium / High / Extra High) is a *mode*, not a model. It appears as a separate "Thinking · Medium" row.

## How it is built

- **Deterministic timeline.** Everything is computed from frame time, with Catmull-Rom splines and custom bezier easings.
- **Motion blur.** `SubframeBlur` takes 8 centred sub-frames (a 180° shutter at 60 fps) only inside the `FAST` windows: the whips, the fly-out, the pull-back and the logo flash. Holds stay sharp.
- **Localised light.** Two soft emerald/cyan lights move along the frame edges, keyed to the reference's light positions. They are drawn outside the sampler, so there is no banding.
- **One camera for the UI.** The selector, menu, highlight and cursor all live in the same world space, so the push-ins, pans and tilts carry them together.
- **Typography.**
  - Fraunces (display serif) for the brand and the greeting.
  - Inter for the interface and the capability words.
  - JetBrains Mono for code, with ligatures off.

## Assets

| Asset | Source | Licence |
|---|---|---|
| OpenAI / ChatGPT mark | `public/brand/openai-logo.svg`, from `@lobehub/icons-static-svg` | MIT for the file; the mark is OpenAI's trademark |
| Inter, JetBrains Mono, Fraunces | `public/fonts/` | SIL OFL, licences included |
| Soundtrack | the reference video (not committed) | unknown, so not redistributed here |

## Render

```bash
npm install
scripts/extract_audio.sh /path/to/reference.mp4
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
ffmpeg -i out/GPT_Astra_6_Concept_RefAudio_1920x1080_60fps.mp4 -c copy -movflags +faststart final.mp4
node scripts/stills.mjs <outdir> <frame…>       # frame-accurate stills (COMP=AstraPromo for v1)
```
