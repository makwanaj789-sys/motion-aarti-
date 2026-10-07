#!/usr/bin/env bash
# Full pipeline: capture real app screens -> render frames -> synthesize audio -> encode -> QA assets.
# usage: ./build.sh [workdir]   (skip capture with SKIP_CAPTURE=1, skip frames with SKIP_FRAMES=1)
set -euo pipefail
cd "$(dirname "$0")"
WORK=${1:-work}
OUT=../output
mkdir -p "$WORK" "$OUT"
[ -d app ] || python3 prep.py "${APK:?set APK=path/to/AartiMusic.apk}"
[ "${SKIP_CAPTURE:-0}" = 1 ] || { python3 make_art.py; node capture.mjs; }
[ "${SKIP_FRAMES:-0}" = 1 ] || { rm -rf "$WORK/frames"; node render.mjs frames "$WORK/frames" 4; }
python3 audio.py "$WORK/soundtrack.wav"

# 2160x3840 frames -> Lanczos downscale -> H.264 High, 30 fps; AAC audio.
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f%04d.jpg" -i "$WORK/soundtrack.wav" \
  -vf "scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 17 -tune film -g 60 -bf 2 \
  -x264-params "aq-mode=3:deblock=-1,-1" -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT/AartiMusic_Promo_1080x1920.mp4"

# cover: the settled hero frame, downscaled the same way
node render.mjs stills "$WORK/cover" 23.85
ffmpeg -v error -y -i "$WORK/cover/t23.85.png" -vf "scale=1080:1920:flags=lanczos" "$OUT/AartiMusic_Cover_1080x1920.png"

# contact sheet: 16 frames pulled from the final MP4 itself
TIMES=(0.00 1.20 1.95 3.70 5.00 6.70 7.95 8.40 10.60 11.60 12.95 14.40 16.30 17.80 19.60 23.00)
rm -rf "$WORK/sheet"; mkdir -p "$WORK/sheet"
for i in "${!TIMES[@]}"; do
  ffmpeg -v error -y -ss "${TIMES[$i]}" -i "$OUT/AartiMusic_Promo_1080x1920.mp4" -frames:v 1 \
    -vf "drawtext=fontfile=app/fonts/sora-400-latin.woff2:text='${TIMES[$i]}s':x=24:y=24:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10" \
    "$WORK/sheet/$(printf %02d "$i").png" 2>/dev/null || ffmpeg -v error -y -ss "${TIMES[$i]}" -i "$OUT/AartiMusic_Promo_1080x1920.mp4" -frames:v 1 "$WORK/sheet/$(printf %02d "$i").png"
done
ffmpeg -v error -y -i "$WORK/sheet/%02d.png" -vf "scale=360:640:flags=lanczos,tile=8x2:padding=12:margin=12:color=0x0A0908" -frames:v 1 "$OUT/AartiMusic_ContactSheet.png"
echo built
