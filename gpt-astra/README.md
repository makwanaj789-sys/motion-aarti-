# GPT Astra 6: fan-made ChatGPT concept promo (Remotion source)

**Main composition: `AstraV3`** (`src/AstraV3.tsx`)
- 1920×1080, native 60 fps, 14.6 s, H.264 High, yuv420p, fast-start
- Output: `../output/GPT_Astra_6_Concept_v3_1920x1080_60fps.mp4`
- Earlier versions are kept as compositions: `AstraRef` (v2, `src/AstraRef.tsx`) and `AstraPromo` (v1, `src/Astra.tsx`).

This is an unofficial fan concept.
- "GPT Astra 6" is a concept entry: the opening says "Fan-made concept" and the model menu tags the entry CONCEPT.
- The ChatGPT/OpenAI mark is a trademark of OpenAI.
- The video ends on the ChatGPT logo, "GPT Astra 6" and "Created by @h81t6".

## What v3 changes: motion measured from the reference, not approximated

The reference's 420 frames (74505.mp4, 1280×720, 30 fps) were decoded and measured frame by frame with the scripts in `analysis/`:

| Script | What it measures |
|---|---|
| `metrics.py` | Cuts; frame-to-frame scale and translation |
| `cam_direct.py` | UI camera: every frame registered to one anchor frame. Roll was checked with Hough lines and is zero |
| `cam.py` | Code camera |
| `tracks.py` | Moon, logo, letter and word tracks; glyph runs; glow energy |
| `light.py` | Background light |
| `sheets.py` | Every-frame contact sheets |

`analysis/build_timing.py` turns these into `timing/ref_timing_map.json` (normalized coordinates, each value marked *measured* or *estimate*) and `src/refData.ts`. A readable summary is in `timing/TIMING_MAP.md`.

The composition is driven by those tracks:
- camera paths, the lockup slide and exit, letter settle, word positions and scale curves, the end-logo size and the end-card motion;
- evaluated at 60 fps with monotone cubic interpolation between the 30 fps samples. That gives real in-between states (no duplicated frames) and adds no overshoot that is not in the data.

The reference's hard cuts stay hard cuts.

Motion blur:
- 16 sub-frame samples with a 90° shutter, only on the frames where the measured speed peaks.
- Samples are clamped to the current shot, so nothing is blended across a cut. The previous version's ghosted headings came from exactly that.
- Holds and reveals render as single sharp images.

## Checking a render against the reference

```bash
python3 analysis/validate.py <render.mp4> <reference.mp4> <workdir>
```

This runs the same trackers on the render and compares motion, not pixels: the UI and code camera curves, the logo slide, the word left edges, the end-logo size, repeated frames during motion, and audio identity. Curves are written to `<workdir>/validation.png`.

## Model names in the menu

The names were checked against OpenAI's help-centre and release-note pages, through search results. The pages themselves were not reachable from the build environment.

| Name | Source |
|---|---|
| GPT-6 (latest), GPT-6 Pro | https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt |
| GPT-5.6 Sol | https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/ |
| GPT-5.6 Luna (Free and Go default) | https://help.openai.com/en/articles/6825453-chatgpt-release-notes |

"Thinking · Medium" is a mode, so it sits on its own row.

## Audio

The soundtrack is the reference's own audio, unchanged (same segment, speed, pitch and offset).
- Its licence is unknown, so it is not committed. Extract it with `scripts/extract_audio.sh /path/to/reference.mp4`.
- The last 0.6 s is a silent visual hold for the credit. The song is not stretched or repeated.

## Fonts and assets

| Asset | Source | Licence |
|---|---|---|
| OpenAI / ChatGPT mark | `public/brand/openai-logo.svg`, from `@lobehub/icons-static-svg` | MIT for the file; the mark is OpenAI's trademark |
| Fraunces (display), Inter (interface, code, words) | `public/fonts/` | SIL OFL, licences included |

## Render

```bash
npm install
scripts/extract_audio.sh /path/to/reference.mp4
npm run timing                                   # rebuild the timing map from analysis/*.json
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
ffmpeg -i out/GPT_Astra_6_Concept_v3_1920x1080_60fps.mp4 -c copy -movflags +faststart final.mp4
node scripts/stills.mjs <outdir> <frame…>        # frame-accurate stills (COMP=AstraRef for v2)
```

Python analysis needs `opencv-python-headless`, `numpy`, `scipy` and `matplotlib`.
