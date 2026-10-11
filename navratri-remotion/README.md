# Navratri — Gujarati garba music edit (Remotion source)

A 1920×574 edit (3.35:1) at 60 fps, 15.63 s long. It is timed to the song segment
from the wide reference clip. The reference ratio works out to 573 px, but H.264
4:2:0 needs an even height, so the canvas is 574.

## Status

The timeline, typography, colour changes, transitions and audio sync are all
done. **No photos are in the project yet.** The environment's network policy
blocks the image libraries (Wikimedia Commons, Unsplash, Pexels, Pixabay,
Openverse), so nothing could be downloaded. Every image slot renders as a
labelled `PHOTO NEEDED` placeholder; no unrelated image stands in for it.
`../output/Navratri_TIMING_PREVIEW_placeholders.mp4` is that preview.

## Images needed (one per slot, in `assets_src/`, named by slot)

| Slot | Kind | What |
|---|---|---|
| `ground` | photo | garba ground / courtyard at night, dancers in a circle (used wide) |
| `dancerF` | cutout | woman in chaniya choli mid-twirl, full figure |
| `dancerM` | cutout | man in kediyu dancing, full figure |
| `dandiyaPair` | cutout | two dancers striking dandiya |
| `sticks` | cutout | a pair of decorated dandiya sticks |
| `bandhani` | photo | bandhani fabric close-up |
| `mirror` | photo | mirror-work (abhla) embroidery close-up |
| `jewel` | cutout | traditional necklace / jhumka |
| `garbo` | cutout | decorated earthen garbo with a lit diya |
| `amba` | photo | Maa Amba: a respectful murti photo or traditional painting |
| `marigold` | cutout | marigold garland (optional) |

Record each image's source URL, author and licence in `assets_src/CREDITS.csv`.
Then run `python3 scripts/make_cutouts.py`. Cutout slots get their background
removed with rembg's `isnet-general-use` model, and photo slots are resized only.
The script updates `src/photos.json`. Photos are cropped to their focus point,
never stretched.

## Fonts (three families, all SIL OFL; licence files are in `public/fonts/`)

| Font | Role |
|---|---|
| Anton | bold condensed display for the musical accents (GARBA, DANDIYA, RAAS) |
| Playfair Display | high-contrast serif for the italic kicker and the `@h81t6` credit (lining numerals) |
| Noto Serif Gujarati | the Gujarati titles: નવરાત્રી · ગરબાની રમઝટ · રંગ • રાસ • ગરબા · ગુજરાતની શાન · જય અંબે |

## Timeline (song-locked)

Beat grid: `0.400 + 0.5225·k` seconds (about 114.8 BPM), fitted to the track's onsets.

| Beat | Time (s) | Scene |
|---|---|---|
| 0 | 0.00 | નવરાત્રી, courtyard card |
| k3 | 1.97 | GARBA with dancers |
| k7 | 4.06 | ગરબાની / રમઝટ (k8) over the courtyard |
| k10 | 5.63 | textiles; રંગ (k10) • રાસ (k11) • ગરબા (k12) |
| k14 | 7.72 | dhol enters: DANDIYA |
| k16 | 8.76 | RAAS |
| k18 | 9.81 | lit garbo; ગુજરાતની (k19) શાન (k20) |
| k22 | 11.90 | Maa Amba; જય (k23) અંબે (k24) |
| k26 | 13.99 | final phrase resolves; `@h81t6` from 14.30 to the end |

The song lyrics are not used as on-screen text. Only the original cultural titles above appear.

## Render

```bash
npm install
scripts/extract_audio.sh /path/to/wide_reference.mp4   # writes public/audio/song.wav (not in git)
python3 scripts/make_cutouts.py                         # after adding photos
REMOTION_BROWSER=/path/to/headless_shell npm run render
```
