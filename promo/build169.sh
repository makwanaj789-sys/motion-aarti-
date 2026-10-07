#!/usr/bin/env bash
# 16:9 YouTube promo: narration -> frames -> soundtrack & mix -> encode -> QA assets.
# usage: TTS=dir/with/kokoro ./build169.sh [workdir]   (SKIP_FRAMES=1 reuses rendered frames)
set -euo pipefail
cd "$(dirname "$0")"
WORK=${1:-work169}; OUT=../output; mkdir -p "$WORK/stems" "$OUT"
[ -d app ] || python3 prep.py "${APK:?set APK=path/to/AartiMusic.apk}"
[ -f cap/rects.json ] || { python3 make_art.py; node capture.mjs; }
if [ "${SKIP_VO:-0}" != 1 ]; then python3 vo.py "${TTS:?set TTS=dir with kokoro-v1.0-fp32.onnx and voices-v1.0.bin}" "$WORK"; cp "$WORK/vo.json" vo.json; fi
export PAGE=compose169.html VIEW=1920x1080 TLOUT=timeline169.json
[ "${SKIP_FRAMES:-0}" = 1 ] || { rm -rf "$WORK/frames"; node render.mjs frames "$WORK/frames" 4; }
python3 audio169.py timeline169.json "$WORK/narration.wav" "$WORK/mix.wav" "$WORK/stems"

MP4="$OUT/AartiMusic_Promo_16x9_1920x1080.mp4"
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f%04d.jpg" -i "$WORK/mix.wav" \
  -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.2 -preset slow -crf 16 -tune film -g 60 -bf 2 -x264-params "aq-mode=3:deblock=-1,-1" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$MP4"

node render.mjs stills "$WORK/cover" 25.0
ffmpeg -v error -y -i "$WORK/cover/t25.00.png" -vf "scale=1920:1080:flags=lanczos" "$OUT/AartiMusic_Cover_16x9_1920x1080.png"

TIMES=(0.40 1.50 2.90 5.70 7.30 8.60 9.30 10.10 11.80 13.95 15.80 17.60 20.10 21.10 23.20 25.00)
rm -rf "$WORK/sheet"; mkdir -p "$WORK/sheet"
for i in "${!TIMES[@]}"; do
  ffmpeg -v error -y -ss "${TIMES[$i]}" -i "$MP4" -frames:v 1 \
    -vf "drawtext=fontfile=app/fonts/sora-400-latin.woff2:text='${TIMES[$i]}s':x=20:y=18:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=8" "$WORK/sheet/$(printf %02d "$i").png"
done
ffmpeg -v error -y -i "$WORK/sheet/%02d.png" -vf "scale=640:360:flags=lanczos,tile=4x4:padding=10:margin=10:color=0x0A0908" -frames:v 1 "$OUT/AartiMusic_16x9_ContactSheet.png"
echo built
