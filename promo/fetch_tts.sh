#!/usr/bin/env bash
# Fetch the Kokoro-82M v1.0 voice model from npm (fp32 weights in shards + voice packs) into $1.
set -euo pipefail
D=${1:-tts}; mkdir -p "$D"; cd "$D"
for p in kokoro-fp32a-shards kokoro-fp32b-shards kokoro-fp32c-shards kokoro-js; do npm pack "$p" --silent >/dev/null; done
mkdir -p shards kjs
for f in kokoro-fp32*-shards-*.tgz; do tar xzf "$f" -C shards --strip-components=1; done
cat $(ls shards/*.bin | sort -V) > kokoro-v1.0-fp32.onnx
tar xzf kokoro-js-*.tgz -C kjs
python3 - <<'PY'
import numpy as np, glob, os
v = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256) for f in glob.glob('kjs/package/voices/*.bin')}
np.savez('voices-v1.0.bin.npz', **v); os.replace('voices-v1.0.bin.npz', 'voices-v1.0.bin')
PY
pip install -q kokoro-onnx soundfile pocketsphinx
echo "tts ready in $PWD"
