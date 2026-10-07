#!/bin/bash
# Average motion-blur sub-frames and mux with the reference soundtrack.
# usage: build_teaser2.sh <subframe dir> <avg dir> <WxH> <audio.wav> <out.mp4>
set -e
python3 -I "$(dirname "$0")/mb_avg.py" "$1" "$2"
ffmpeg -nostdin -y -loglevel error -framerate 30 -i "$2/f%04d.png" -i "$4" \
  -vf "scale=${3/x/:}:flags=lanczos,format=yuv420p" -c:v libx264 -profile:v high -preset slow -crf 16 \
  -c:a aac -b:a 256k -ar 48000 -map 0:v -map 1:a -t 11.333 -movflags +faststart "$5"
