#!/bin/sh
# Pull the song segment out of the wide reference clip (it is not stored in git).
# usage: scripts/extract_audio.sh /path/to/wide_reference.mp4
set -e
ffmpeg -nostdin -v error -y -i "$1" -vn -ac 2 -ar 48000 "$(dirname "$0")/../public/audio/song.wav"
echo "public/audio/song.wav written"
