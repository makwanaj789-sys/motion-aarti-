"""Extract the AartiMusic web layer and brand mark from the APK, plus a silent demo stream.
usage: python3 prep.py path/to/AartiMusic.apk"""
import sys, zipfile, io, os, wave
import numpy as np
from PIL import Image
apk = zipfile.ZipFile(sys.argv[1])
for n in apk.namelist():
    if n.startswith('assets/public/'):
        dst = os.path.join('app', n[len('assets/public/'):])
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'wb').write(apk.read(n))
# The launcher mark: the 360px version inside the xxxhdpi splash, keyed off its black ground.
os.makedirs('brand', exist_ok=True)
a = np.asarray(Image.open(io.BytesIO(apk.read('res/drawable-port-xxxhdpi-v4/splash.png'))).convert('RGB')).astype(float)[700:1200, 380:890]
alpha = np.clip((a.max(2) - 16) / 70, 0, 1) ** 1.1
un = np.clip(a / np.maximum(alpha[..., None], 0.05), 0, 255)
Image.fromarray(np.dstack([un, alpha * 255]).astype(np.uint8), 'RGBA').save('brand/logo.png')
# 3:42 of near-silence for the mock stream, so the real player shows a real duration.
sr = 8000; t = np.arange(sr * 222) / sr
w = wave.open('app_stream.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((0.05 * np.sin(2 * np.pi * 220 * t) * 32767).astype('<i2').tobytes()); w.close()
print('prepared')
