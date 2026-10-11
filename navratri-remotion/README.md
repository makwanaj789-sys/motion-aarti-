# Navratri: "शुभारंभ" edit (Remotion source)

A 1920×572 edit (3.35:1, the reference reel's canvas) at 60 fps, 15.63 s long,
timed to the song segment from the wide reference reel.

Output: `../output/Navratri_Shubhaarambh_1920x572_60fps.mp4`

## What is in it

- Every figure, flower, the garbo and Maa Amba's symbols (halo, trishul,
  chunri, lotus) are original vector illustrations, drawn in `src/art.tsx`.
- The environment's network policy blocks every image host, so no photos could
  be downloaded, and no image-generation tool is available.
- Text is Hindi in Devanagari. The lyric phrases follow `LYRICS_HI.md`. The titles
  नवरात्रि, शुभ नवरात्रि and जय माँ अम्बे cover the instrumental stretches.

## Fonts (SIL OFL; licence files in `public/fonts/`)

| Font | Use |
|---|---|
| Teko 600/700 | bold display: शुभारंभ, जय माँ अम्बे, बाजी रे शहनाई |
| Tiro Devanagari Hindi | serif for longer phrases: शुभ नवरात्रि, मंगल बेला आए, सपनों की डोली पे दिल की |
| Kalam 700 | handwritten accents: हो, हे |
| Playfair Display italic | the `@h81t6` credit |

## Timeline (beat k = 0.400 + 0.5225·k s)

| Time (s) | Background | Scene |
|---|---|---|
| 0.00 | red | नवरात्रि, dancer rises, flowers |
| 1.97 | pink | शुभारंभ, three dancers on three beats |
| 4.06 | crimson | शुभ नवरात्रि, lit garbo between two dancers |
| 5.63 | marigold | जय माँ अम्बे, Maa Amba symbol |
| 7.72 | purple | हो शुभारंभ (dhol drop), dandiya pair strikes on each beat |
| 8.76 | orange | हे शुभारंभ, row of four dancers |
| 9.81 | green | मंगल बेला आए, couple between the words, flower corners |
| 11.90 | yellow | सपनों की डोली / पे दिल की, around a twirling dancer |
| 13.99 | purple | बाजी रे शहनाई, final line of dancers |
| 14.62 – end | purple | `@h81t6` credit |

## Using real photos instead

Put images in `assets_src/` and run `python3 scripts/make_cutouts.py`
(rembg `isnet-general-use`). It writes transparent PNGs to `public/photos/`.
Those can then replace the `GarbaWoman` / `KediyuMan` / `AmbaSymbol` drawings in
`src/NavratriHindi.tsx`.

## Render

```bash
npm install
scripts/extract_audio.sh /path/to/wide_reference.mp4   # public/audio/song.wav (not in git)
REMOTION_BROWSER=/path/to/headless_shell npm run render
```
