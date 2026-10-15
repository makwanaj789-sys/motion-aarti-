#!/usr/bin/env sh
# Extracts the reference video's soundtrack unchanged (same segment, speed and pitch) to public/audio/reference.wav.
# usage: scripts/extract_audio.sh /path/to/reference.mp4
set -e
ffmpeg -y -i "$1" -vn -ac 2 -ar 48000 -c:a pcm_s16le "$(dirname "$0")/../public/audio/reference.wav"
