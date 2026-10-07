#!/usr/bin/env bash
# v2.0: narration -> frames -> score, sound design & mix -> encode -> cover & contact sheet.
# usage: TTS=dir ./build_v2.sh [workdir]   (SKIP_VO=1 / SKIP_FRAMES=1 reuse earlier outputs)
set -euo pipefail
cd "$(dirname "$0")"
WORK=${1:-work_v2}; OUT=../output; mkdir -p "$WORK/stems" "$OUT"
[ -d app ] || python3 prep.py "${APK:?set APK=path/to/AartiMusic.apk}"
[ -f cap2/rects.json ] || { python3 make_art.py; node capture_v2.mjs; MACRO=1 node capture_v2.mjs; node capture_themes.mjs; }
if [ "${SKIP_VO:-0}" != 1 ]; then python3 vo2.py "${TTS:?set TTS=dir with kokoro-v1.0-fp32.onnx and voices-v1.0.bin}" "$WORK"; cp "$WORK/vo2.json" vo2.json; fi
export PAGE=compose_v2.html VIEW=1920x1080 TLOUT=timeline_v2.json
[ "${SKIP_FRAMES:-0}" = 1 ] || { rm -rf "$WORK/frames"; RESUME=1 node render.mjs frames "$WORK/frames" 4; }
python3 audio_v2.py timeline_v2.json "$WORK/narration2.wav" "$WORK/mix.wav" "$WORK/stems"
MP4="$OUT/AartiMusic_Promo_v2_16x9_1920x1080.mp4"
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f%04d.jpg" -i "$WORK/mix.wav" \
  -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.2 -preset slow -crf 16 -tune film -g 60 -bf 2 -x264-params "aq-mode=3:deblock=-1,-1" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$MP4"
node render.mjs stills "$WORK/cover" 29.5
ffmpeg -v error -y -i "$WORK/cover/t29.50.png" -vf "scale=1920:1080:flags=lanczos" "$OUT/AartiMusic_v2_Cover_1920x1080.png"
TIMES=(0.00 1.20 2.90 4.40 5.60 7.60 9.70 10.60 11.60 12.20 13.50 15.40 17.90 19.80 20.90 22.15 23.70 25.00 27.80 29.50)
rm -rf "$WORK/sheet"; mkdir -p "$WORK/sheet"
for i in "${!TIMES[@]}"; do
  ffmpeg -v error -y -ss "${TIMES[$i]}" -i "$MP4" -frames:v 1 \
    -vf "drawtext=fontfile=app/fonts/sora-400-latin.woff2:text='${TIMES[$i]}s':x=20:y=18:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=8" "$WORK/sheet/$(printf %02d "$i").png"
done
ffmpeg -v error -y -i "$WORK/sheet/%02d.png" -vf "scale=640:360:flags=lanczos,tile=4x5:padding=10:margin=10:color=0x03060F" -frames:v 1 "$OUT/AartiMusic_v2_ContactSheet.png"
echo built
