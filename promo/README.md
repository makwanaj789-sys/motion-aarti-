# AartiMusic promo pipeline

Renders `output/AartiMusic_Promo_1080x1920.mp4` from the AartiMusic APK.

    APK=path/to/AartiMusic_1.2.apk ./build.sh work

1. `prep.py` extracts the app's Capacitor web layer (`assets/public`) and the launcher mark from the APK.
2. `make_art.py` draws original cover art for the demo songs (`songs.json`).
3. `capture.mjs` runs the real app UI in Chromium against a local mock of its server
   (`harness.mjs`) and captures every screen state at 4x, plus element rectangles.
4. `compose.html` / `compose.js` hold the whole timeline: phone camera, UI layers, copy,
   background. `render.mjs` renders it at 2160x3840 and writes `timeline.json` (scenes + sound cues).
5. `audio.py` synthesizes the soundtrack and sound design from `timeline.json`, sidechains,
   and masters to -14 LUFS.
6. `build.sh` downscales with Lanczos, encodes H.264 High + AAC, and makes the cover and contact sheet.

Needs Node with Playwright (Chromium), Python with numpy/scipy/pillow, and ffmpeg.
