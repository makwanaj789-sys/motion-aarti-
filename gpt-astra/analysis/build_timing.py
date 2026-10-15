"""Builds the timing map from the per-frame measurements of the reference (74505.mp4, 1280x720, 30 fps, 420 frames).

Inputs (written by the other scripts in this folder):
  ref_metrics.json   per-frame luma, cut metric, frame-to-frame similarity (metrics.py)
  tracks.json        moon / logo / white-text tracks (tracks.py)
  cam_ui_direct.json UI camera: each frame registered directly to the anchor frame f87 (cam_direct.py)
  cam.json           code camera: chained frame-to-frame registration, anchor f240 (cam.py)
  light.json         background light centroid / extent / peak (light.py)

Outputs:
  ../timing/ref_timing_map.json  normalized measurements (x / 1280, y / 720, sizes / 1280), seconds
  ../src/refData.ts              the same tracks as typed arrays for the composition

Every track carries "kind": "measured" (read from pixels) or "estimate" (judged from the frames by eye,
or extrapolated where the tracker had no signal). Nothing marked "estimate" should be read as exact.

usage: python3 analysis/build_timing.py
"""
import json, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1280.0, 720.0
L = lambda n: json.load(open(os.path.join(HERE, n)))
tracks, cam_ui, cam, light, metrics = L('tracks.json'), L('cam_ui_direct.json'), L('cam.json'), L('light.json'), L('ref_metrics.json')
r4 = lambda v: round(float(v), 4)
t_of = lambda f: r4(f / 30)

out = {'source': {'file': '74505.mp4 (md5 e2ac981630b71c6c030c3d27e5675dc2)', 'size': [1280, 720], 'fps': 30, 'frames': 420,
                  'note': 'x normalized by width, y by height, sizes by width unless stated. Times in seconds of the original.'}}

# ---------------------------------------------------------------- cuts (frame-difference spikes + content change)
out['cuts'] = {'kind': 'measured', 'between_frames': {
    'brand->ui': [67, 68], 'ui->code(dark beat)': [211, 212], 'code->writing': [257, 258], 'analysis line->coding': [298, 299],
    'research->logo flash': [351, 352], 'logo->end card': [389, 390]},
    'seconds': {'brand_ui': 2.25, 'ui_code': 7.05, 'code_writing': 8.583, 'line_coding': 9.95, 'research_logo': 11.717, 'logo_end': 12.983}}

# ---------------------------------------------------------------- night / moon
moon = [o for o in tracks['moon'] if 4 <= o['f'] <= 18]
out['moon'] = {'kind': 'measured (moon+cloud blob centroid; radius from blob height)',
               't': [t_of(o['f']) for o in moon], 'cy': [r4(o['cy'] / H) for o in moon], 'r_h': [r4(o['h'] / 2 / H) for o in moon],
               'events': {'kind': 'estimate', 'fade_in': [0.033, 0.167], 'glow_and_clouds_part': [0.6, 0.83], 'moon_to_logo': [0.733, 0.767]}}

# ---------------------------------------------------------------- brand lockup
lg = [o for o in tracks['logo'] if 23 <= o['f'] <= 67]
out['brand_logo'] = {'kind': 'measured', 't': [t_of(o['f']) for o in lg], 'x': [r4(o['cx'] / W) for o in lg], 'y': [r4(o['cy'] / H) for o in lg],
                     'size_w': [r4((o['x1'] - o['x0']) / W) for o in lg],
                     'note': 'size includes the glow until ~0.97 s; core logo width settles at 0.161 W'}
# first letter: offset relative to the logo (letters slide left into place while the group moves)
first = {o['f']: [r for r in o['runs'] if r[1] - r[0] > 20][0][0] for o in tracks['white'] if 40 <= o['f'] <= 60}
lx = {o['f']: o['cx'] for o in lg}
rel = [(f, first[f] - lx[f]) for f in sorted(first) if f in lx]
final_rel = rel[-1][1]
out['letter_offset'] = {'kind': 'measured (letter C)', 'tau': [r4((f - rel[0][0]) / 30) for f, _ in rel], 'dx_w': [r4((d - final_rel) / W) for _, d in rel]}
out['letters'] = {'kind': 'estimate', 'appear': [1.29, 1.37, 1.43, 1.5, 1.58, 1.66], 'blur_to_sharp_s': 0.22,
                  'final_layout_w': {'logo_cx': 0.264, 'logo_w': 0.161, 'word_x0': 0.406, 'word_x1': 0.817, 'cy_h': 0.494, 'ascender_h': 0.181}}

# ---------------------------------------------------------------- UI camera (anchor f87 = 2.9 s, camera scale 1)
cu = [o for o in cam_ui]
out['ui_camera'] = {'kind': 'measured (direct registration to f87, scale+translation, no roll: Hough check shows 0.00 deg)',
                    't': [t_of(o['f']) for o in cu], 's': [r4(o['s']) for o in cu], 'cx': [r4(o['cx'] / W) for o in cu], 'cy': [r4(o['cy'] / H) for o in cu],
                    'meaning': 'screen = s * (p - centre) + (cx, cy), p in anchor-frame pixels'}
out['ui_layout_anchor_f87'] = {'kind': 'measured', 'input_box': [r4(247 / W), r4(326 / H), r4(1028 / W), r4(468 / H)],
                               'greeting_logo_c': [r4(515 / W), r4(253 / H)], 'greeting_text_x': [r4(555 / W), r4(776 / W)],
                               'placeholder_x': r4(273 / W), 'placeholder_cy': r4(363 / H), 'plus_c': [r4(287 / W), r4(430 / H)],
                               'model_pill_x': [r4(854 / W), r4(952 / W)], 'model_pill_cy': r4(430 / H), 'voice_c': [r4(990 / W), r4(430 / H)],
                               'chips': [r4(361 / W), r4(492 / H), r4(910 / W), r4(527 / H)],
                               'menu': [r4(764 / W), r4(449 / H), r4(993 / W), r4(699 / H)], 'ring_c': [r4(885 / W), r4(576 / H)], 'ring_r_w': r4(190 / W)}
out['ui_events'] = {'kind': 'estimate (frame by frame)', 'chips_stagger': [2.27, 2.55], 'caret_visible': 2.9, 'typing': [3.533, 3.87],
                    'pill_highlight': 4.833, 'menu_container': [4.867, 5.0], 'menu_rows': [4.9, 5.2], 'ring': [4.933, 5.43],
                    'hover_first': 5.433, 'hover_moves': [5.9, 5.97], 'select_flash': [6.3, 6.6], 'highlight_gone': 6.67}

# ---------------------------------------------------------------- code
cc = [o for o in cam['code'] if o['f'] >= 216]
out['code_camera'] = {'kind': 'measured (chained, anchor f240 = 8.0 s; scale about the frame centre)',
                      't': [7.167] + [t_of(o['f']) for o in cc], 's': [1.37] + [r4(o['s']) for o in cc],
                      'note': 'first value (7.167) is an extrapolated estimate: the tracker had too few points'}
out['code_layout_anchor_f240'] = {'kind': 'measured', 'logo_c': [r4(178 / W), r4(131 / H)], 'text_x': r4(205 / W), 'first_line_cy': r4(130 / H),
                                  'line_pitch_h': r4(16.25 / H), 'lines': 33, 'font_h': r4(14 / H), 'prompt_right_x': r4(1071 / W), 'prompt_cy': r4(90 / H)}
out['code_events'] = {'kind': 'measured per row band, rounded', 'dark_beat': [7.067, 7.133], 'first_line': 7.167, 'line_step_s': 0.0156,
                      'line_fade_s': 0.1, 'deglow_start': 7.6, 'deglow_step_s': 0.021, 'deglow_s': 0.12, 'glow_colour': 'warm (r-b ~ 100 of 255)'}

# ---------------------------------------------------------------- words
wt = {o['f']: o for o in tracks['white']}
def runs(f): return [r for r in wt[f]['runs'] if r[1] - r[0] > 2] if f in wt else []
writ = [(f, runs(f)[0][0]) for f in range(266, 299) if runs(f)]
out['writing'] = {'kind': 'measured', 'scale_t': [8.6, 8.633] + [t_of(f) for f in range(266, 284)],
                  'scale': [1.95, 1.75] + [r4((wt[f]['y1'] - wt[f]['y0']) / 67.0) for f in range(266, 284)],
                  'scale_note': '8.6 and 8.633 are estimates (glyphs too blurred to measure)',
                  'x0_t': [t_of(f) for f, _ in writ], 'x0': [r4(x / W) for _, x in writ], 'cx_at_rest': 0.503, 'cy': 0.497,
                  'letter_step_s': 0.033, 'glow_decay': [8.6, 8.9], 'final_word_w': r4(187 / W), 'line_h': r4(67 / H)}
ana = [(f, runs(f)[7][0]) for f in range(278, 299) if len(runs(f)) > 7]
out['analysis'] = {'kind': 'measured', 'cut_in': 9.267, 'x0_t': [t_of(f) for f, _ in ana], 'x0': [r4(x / W) for _, x in ana], 'glow_decay': [9.267, 9.47],
                   'final_line': [r4(375 / W), r4(889 / W)]}
cod = [(f, runs(f)[0][0]) for f in range(299, 320) if runs(f)]
out['coding'] = {'kind': 'measured', 'x0_t': [t_of(f) for f, _ in cod], 'x0': [r4(x / W) for _, x in cod], 'final_w': r4(214 / W),
                 'zoom_t': [10.5, 10.533, 10.567, 10.6, 10.633, 10.667, 10.7], 'zoom': [1.0, 1.0, 1.014, 1.028, 1.056, 1.09, 1.13],
                 'zoom_note': '10.667 and 10.7 estimated from frame-to-frame scale (letters already dissolving)', 'dissolve': [10.63, 10.77]}
out['research'] = {'kind': 'measured', 'letters': 'research', 'final_x': [r4(457 / W), r4(820 / W)], 'cy': r4(352 / H),
                   'letter_appear': {'kind': 'estimate from glyph runs', 'r': 10.8, 'e': 10.833, 's': 10.9, 'e2': 10.9, 'a': 10.8, 'r2': 10.867, 'c': 10.867, 'h': 10.867},
                   'glow_decay': [10.8, 11.07], 'settle_dx_w': r4(11 / W),
                   'shrink_t': [t_of(f) for f in range(343, 352)], 'shrink': [r4((wt[f]['x1'] - wt[f]['x0']) / 362.0) for f in range(343, 352)]}

# ---------------------------------------------------------------- end logo
el = [o for o in tracks['logo'] if 352 <= o['f'] <= 389]
sz = [(o['x1'] - o['x0']) for o in el]
core = [300, 262, 236, 222, 213] + sz[5:]  # first five include the bloom; core sizes estimated
out['end_logo'] = {'kind': 'measured from 11.9 s; 11.733-11.867 core size estimated (bloom)', 't': [t_of(o['f']) for o in el] + [13.0],
                   'size_w': [r4(v / W) for v in core] + [0.0], 'glow': [11.717, 11.95]}

# ---------------------------------------------------------------- end card (reference: third-party icon; reused only as a motion curve)
ds = [m['ds'] for m in metrics[391:409]]
cum = np.cumprod(ds); start = 1 / cum[-1]
out['end_card_scale'] = {'kind': 'measured (frame-to-frame scale of the end icon)', 't': [13.0] + [t_of(f) for f in range(391, 409)],
                         's': [r4(start)] + [r4(start * c) for c in cum]}

# ---------------------------------------------------------------- light
lt = [o for o in light if 'px' in o]
out['light'] = {'kind': 'estimate (warm-glow peak/centroid with text masked; broad and noisy)', 'per_frame': [
    {'t': t_of(o['f']), 'peak': o['peak'], 'centroid': [o['cx'], o['cy']], 'extent': [o['hw'], o['hh']], 'floor_Y': o['floor']} for o in lt],
    'keys': [
        [0.75, 'born from the moon at frame centre'], [1.1, 'bottom right (0.75, 0.84)'], [1.6, 'bottom centre under the lockup (0.52, 0.70)'],
        [2.25, 'bottom centre (0.56, 0.99) under the UI'], [3.4, 'top right (0.80, 0.05) during the push-in'], [4.3, 'sweeps to top left with the whip (0.27, 0.0)'],
        [5.0, 'ring around the menu'], [5.6, 'dim, around the menu (0.55, 0.45)'], [6.33, 'selection flash'], [6.9, 'top left (0.33, 0.05)'],
        [7.2, 'right edge strip, rising 0.8 -> 0.4, brightest of the film'], [8.6, 'top right corner + bottom centre'],
        [9.3, 'bottom left corner + top right corner'], [11.6, 'fades'], [11.73, 'logo bloom only'], [12.0, 'black']],
    'dark_floor': 'pure black (Y 0-1) outside the light from 2.3 s on'}

json.dump(out, open(os.path.join(HERE, '..', 'timing', 'ref_timing_map.json'), 'w'), indent=1)

# ---------------------------------------------------------------- TS export
def arr(v): return '[' + ', '.join(f'{x:g}' for x in v) + ']'
ts = ['// Generated by analysis/build_timing.py from per-frame measurements of the reference. Do not edit by hand.',
      '// Normalized: x / width, y / height, sizes / width. Times are seconds of the original (30 fps samples).', '']
def track(name, t, *cols):
    ts.append(f'export const {name} = {{ t: {arr(t)}, ' + ', '.join(f'{k}: {arr(v)}' for k, v in cols) + ' };')
o = out
track('MOON', o['moon']['t'], ('cy', o['moon']['cy']), ('r', o['moon']['r_h']))
track('BRAND_LOGO', o['brand_logo']['t'], ('x', o['brand_logo']['x']), ('y', o['brand_logo']['y']), ('size', o['brand_logo']['size_w']))
track('LETTER_OFFSET', o['letter_offset']['tau'], ('dx', o['letter_offset']['dx_w']))
track('UI_CAM', o['ui_camera']['t'], ('s', o['ui_camera']['s']), ('cx', o['ui_camera']['cx']), ('cy', o['ui_camera']['cy']))
track('CODE_CAM', o['code_camera']['t'], ('s', o['code_camera']['s']))
track('WRITING_SCALE', o['writing']['scale_t'], ('s', o['writing']['scale']))
track('WRITING_X0', o['writing']['x0_t'], ('x', o['writing']['x0']))
track('ANALYSIS_X0', o['analysis']['x0_t'], ('x', o['analysis']['x0']))
track('CODING_X0', o['coding']['x0_t'], ('x', o['coding']['x0']))
track('CODING_ZOOM', o['coding']['zoom_t'], ('s', o['coding']['zoom']))
track('RESEARCH_SHRINK', [11.4] + o['research']['shrink_t'], ('s', [1.0] + o['research']['shrink']))
track('END_LOGO', o['end_logo']['t'], ('size', o['end_logo']['size_w']))
track('END_CARD', o['end_card_scale']['t'], ('s', o['end_card_scale']['s']))
open(os.path.join(HERE, '..', 'src', 'refData.ts'), 'w').write('\n'.join(ts) + '\n')
print('ok; end card start scale %.3f' % start)
