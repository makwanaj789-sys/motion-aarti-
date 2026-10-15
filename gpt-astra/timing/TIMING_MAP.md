# Timing map: reference 74505.mp4 → AstraV3

**Source.** 74505.mp4: 1280×720, 30 fps, 420 frames, 14.0 s.

**How it was measured.**
- All 420 frames were decoded and inspected in order. Contact sheets of every frame can be rebuilt with `analysis/sheets.py`.
- Each frame was measured by the scripts in `analysis/`.
- Raw measurements are in `analysis/*.json`. The normalized map is `timing/ref_timing_map.json`, built by `npm run timing`.

**Units.**
- x is normalized by width, y by height, sizes by width.
- Times are seconds of the original.
- The composition evaluates these 30 fps samples at 60 fps with monotone cubic interpolation. This gives real intermediate states, not duplicated frames, and adds no overshoot that is not in the data.

**Measured vs estimate.**
- **measured**: read from pixels: tracks, registration, bounding boxes, glyph runs.
- **estimate**: judged frame by frame, or extrapolated where the tracker had no signal.

## Cuts (hard cuts in the reference; kept as cuts, not dissolves)

| Cut | Between frames | Seconds |
|---|---|---|
| lockup → UI | 67 / 68 | 2.25 |
| UI → code (dark beat) | 211 / 212 | 7.05 |
| code → "Writing" | 257 / 258 | 8.583 |
| line → "coding" | 298 / 299 | 9.95 |
| "research" → logo flash | 351 / 352 | 11.717 |
| logo → end card | 389 / 390 | 12.983 |

The moon → logo change at 0.733–0.767 s is a morph inside one shot, not a cut.

## Scenes

### 0 – 0.75 s: night
| Kind | What |
|---|---|
| measured | Moon centre rises 0.605 H → 0.514 H between 0.133 and 0.6 s, decelerating. |
| measured | Moon radius 0.15 → 0.176 H. |
| estimate | Fade-in 0.033–0.167 s. |
| estimate | 0.6–0.73 s: the moon flares, and the clouds part (left one ~0.36 W to the left, right one ~0.3 W to the right). |
| estimate | 0.745–0.78 s: the moon dissolves into the logo. |

### 0.75 – 2.25 s: logo + wordmark
| Kind | What |
|---|---|
| measured | Logo centre: x 0.502 W until 1.13 s. Slide left to 0.264 W, with the peak speed at 1.30–1.33 s (64 px/frame at 720p). The slide accelerates for ~0.17 s and decelerates for ~0.5 s, settling at 1.87 s. |
| measured | Logo core width 0.161 W. With bloom it is 0.19 W at 0.767 s; the bloom is gone by 0.97 s. |
| measured | Letter settle: each letter enters 0.0885 W to the right of its slot and decays to 0 (≈0.1 s time constant). Values at each frame after appearing: 0.0885, 0.0619, 0.0451, 0.0331, 0.0241, 0.0179, 0.0126, 0.0084… |
| estimate | Letters appear at 1.29, 1.37, 1.43, 1.50, 1.58, 1.66 s, interpolated to 7 letters for "ChatGPT". Opacity 0 → 1 in ~0.14 s; blur → sharp in ~0.22 s. |
| measured | Exit: the whole lockup moves up 0 → −0.204 H from 1.9 to 2.233 s, accelerating (frame steps 1.5, 2.5, 3, 5, 6, 8, 13, 18, 31, 58 px at 720p). Then the hard cut. |

### 2.25 – 7.05 s: chat UI under one camera
Measured by registering every frame directly to anchor frame 87 (2.9 s) with a scale + translation model. A Hough-line check confirms there is no roll (0.00° at 2.9, 4.0 and 6.0 s).

| Time (s) | Camera |
|---|---|
| 2.267 → 2.9 | Enters from below, continuing the lockup's upward motion. Centre y 0.948 H → 0.5 H, decelerating. Scale 1.0. |
| 2.93 → 3.9 | Push-in: scale 1 → 1.578. Fastest at 3.30–3.37 s (×1.10 per frame). Centre x 0.5 → 0.770 W, y 0.5 → 0.430 H. |
| 3.93 → 4.63 | Whip pan: centre x 0.770 → 0.245 W. Peak 176 px/frame at 4.267–4.300 s, followed by a long settle. |
| 4.63 → 5.43 | Tilt down + slight pull: centre y 0.430 → 0.140 H, scale 1.578 → 1.373. Fastest at 4.93–5.0 s. |
| 5.43 → 6.5 | Hold at scale 1.37: the readable menu close-up. |
| 6.5 → 7.033 | Accelerating pull-out: scale 1.37 → 1.045, centre drifting to (0.300 W, 0.225 H). Then the cut. |

**Layout (anchor, normalized).**
- Input box 0.193–0.803 W, 0.453–0.650 H.
- Greeting centred at 0.362 H.
- Chips 0.282–0.711 W, 0.683–0.732 H.
- Menu 0.597–0.776 W, 0.624–0.971 H.

**Events (estimate).**
- Chips stagger in 2.27–2.55 s.
- Caret from 2.9 s. Typing 3.533–3.9 s, overwriting the placeholder.
- Selector lights at 4.833 s. Menu container opens 4.867–5.0 s; rows reveal 4.9–5.2 s.
- Ring 4.93–5.43 s.
- Hover appears at 5.433 s, lands on its target at 5.97 s.
- Selection flash 6.3–6.6 s; highlight gone by 6.67 s.
- AstraV3 only, from the earlier brief: the menu closes 6.62–6.76 s during the measured pull-out, and the selector then reads "GPT Astra 6".

### 7.05 – 8.583 s: code
| Kind | What |
|---|---|
| estimate | Dark beat 7.067–7.133 s (light only). |
| measured | Camera scales about the frame centre: 1.342 at 7.2 s → 1.0 at 8.0 s → 0.777 at 8.567 s. A faster section at 7.63–7.83 s; the pull accelerates at 8.3–8.57 s. 7.167 s is an extrapolated estimate (1.37). |
| measured | Lines appear top to bottom from 7.167 s, one every 0.0156 s, each fading in over ~0.1 s, lit. |
| measured | A de-glow wave runs top to bottom from 7.6 s, one line every 0.021 s, ~0.12 s per line. |
| measured | Layout at 8.0 s: text x 0.160 W, first line 0.181 H, line pitch 0.0226 H, prompt right edge 0.837 W at 0.125 H. |

### 8.583 – 9.95 s: "Writing" + "analysis"
| Kind | What |
|---|---|
| measured | "Writing" cuts in large and glowing. Scale 1.95 (est.) → 1.25 at 8.867 s → 1.0 at 9.43 s, about the word centre (0.503 W, 0.498 H). |
| measured | Letters land one frame apart. The glow decays to 0 by 8.9 s. |
| measured | "analysis" cuts in at 9.267 s, glowing, gone by 9.47 s. Its left edge goes 0.641 W → 0.491 W by 9.6 s while "Writing" shifts left (peak −55 px/frame at 9.233–9.267 s). |
| measured | 9.6–9.93 s: the line accelerates off to the left, then the cut. |
| measured | Final widths: "Writing" 0.177 W, "analysis" 0.204 W, gap 0.020 W. |

### 9.95 – 10.78 s: "coding"
| Kind | What |
|---|---|
| measured | Left edge 0.579 W → 0.410 W, decelerating (−71, −32, −22, −17… px/frame). Width 0.169 W. |
| measured | 10.5–10.7 s: zoom 1.0 → 1.13, accelerating. |
| estimate | Letters dissolve in a scattered order 10.63–10.77 s. |

### 10.78 – 11.717 s: "research"
| Kind | What |
|---|---|
| estimate | Letters appear in a scattered order 10.8–10.97 s, glowing, settling ~0.0086 W to the left. |
| measured | Glow gone by 11.07 s. Final 0.357–0.641 W at 0.489 H. Hold until 11.43 s. |
| measured | Shrink: 1.0 → 0.989 (11.5 s) → 0.92 (11.6 s) → 0.776 (11.667 s) → 0.589 (11.7 s). Then the cut. |

### 11.717 – 12.983 s: logo
| Kind | What |
|---|---|
| measured | Flash with bloom. Core width ≈0.234 W at 11.733 s (est., bloom), 0.160 W at 11.9 s, 0.145 W at 12.0 s, 0.118 W at 12.5 s, 0.098 W at 12.9 s, 0.068 W at 12.967 s, then 0. |
| measured | The background is black from 11.75 s on. |

### 12.983 s – end: outro
| Kind | What |
|---|---|
| measured | The reference's end card is a third-party app icon, so only its motion is reused: scale 1.785 → 1.0, decelerating, settled by 13.5 s. Frame steps: ×0.882, 0.916, 0.931, 0.945… |
| AstraV3 | ChatGPT logo and "GPT Astra 6" use that motion. "Created by @h81t6" enters 13.2–13.5 s (opacity + 12 px rise), then a sharp hold to 14.6 s (1.1 s). The 0.6 s past 14.0 s is a silent visual hold; the song is not stretched or repeated. |

## Light (estimate: the warm light is broad, so centroids are approximate)
| Time (s) | Light |
|---|---|
| 0.75 | Born from the moon. |
| 1.1 | Bottom right. |
| 1.6–2.2 | Bottom centre under the lockup. |
| 2.25–3.2 | Bottom centre under the UI. |
| 3.4–4.0 | Top right. |
| 4.3 | Sweeps to top left with the whip. |
| 4.93–5.43 | Ring around the menu. |
| 5.5–6.3 | Dim, around the menu. |
| 6.33 | Selection flash. |
| 6.9 | Top left. |
| 7.1–8.5 | A right-edge strip rising 0.8 → 0.4 H, the brightest of the film. |
| 8.6–9.25 | Top-right corner + bottom centre. |
| 9.3–11.45 | Bottom-left + top-right corners. |
| from 11.6 | Fades; after the flash, black. |

Dark areas are pure black (luma 0–1) from 2.3 s on.

## Motion blur
The reference itself is crisp even at its fastest frame (176 px/frame at 4.3 s). AstraV3 therefore samples sub-frames only where the measured speed peaks: the UI entry, the push-in peak, the whip, the UI and code exits, the line exit / "coding" entry, the "research" shrink, and the logo vanish / end-card entry.
- 16 samples, 90° shutter.
- Samples are clamped to the current shot, so no image is ever blended across a cut.
