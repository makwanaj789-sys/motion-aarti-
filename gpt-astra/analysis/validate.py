"""Measures the rendered video with the same trackers used on the reference and compares motion, not pixels.

usage: python3 analysis/validate.py <render.mp4> <reference.mp4> <workdir>
writes <workdir>/validation.json and <workdir>/validation.png (reference vs render curves)
"""
import json, os, subprocess, sys
import cv2, numpy as np

out_mp4, ref_mp4, wd = sys.argv[1:4]
HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(f'{wd}/o', exist_ok=True)
# every 60 fps frame, scaled to the reference's 1280x720 so the same pixel thresholds apply
if not os.path.exists(f'{wd}/o/0001.png'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out_mp4, '-vf', 'scale=1280:720:flags=area', '-vsync', '0', f'{wd}/o/%04d.png'], check=True)
N = len(os.listdir(f'{wd}/o'))
O = lambda i: cv2.imread(f'{wd}/o/{i + 1:04d}.png')
rep = {'frames': N}

# ------------------------------------------------ frame pacing: identical consecutive frames while the reference is moving
moving = [(0.05, 0.7), (1.2, 2.24), (2.26, 4.7), (4.8, 5.4), (6.55, 7.04), (7.2, 8.57), (8.6, 9.9), (9.97, 10.5), (11.45, 11.7), (11.75, 12.97), (13.0, 13.45)]
dups = []
prev = None
for i in range(N):
    g = cv2.cvtColor(O(i), cv2.COLOR_BGR2GRAY).astype(np.float32)
    if prev is not None:
        d = float(np.abs(g - prev).mean()); t = i / 60
        if d < 0.02 and any(a <= t <= b for a, b in moving): dups.append(round(t, 3))
    prev = g
rep['repeated_frames_in_motion'] = dups

# ------------------------------------------------ scale+translation registration (same model as cam_direct.py)
orb = cv2.ORB_create(8000, fastThreshold=5, nlevels=12, scaleFactor=1.15)
def reg(A, B):
    kA, dA = orb.detectAndCompute(cv2.cvtColor(A, cv2.COLOR_BGR2GRAY), None)
    kB, dB = orb.detectAndCompute(cv2.cvtColor(B, cv2.COLOR_BGR2GRAY), None)
    ms = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(dA, dB)
    p1 = np.float32([kA[m.queryIdx].pt for m in ms]); p2 = np.float32([kB[m.trainIdx].pt for m in ms])
    rng = np.random.default_rng(0); best = None
    for _ in range(2000):
        i, j = rng.choice(len(p1), 2, replace=False); n1 = np.linalg.norm(p1[i] - p1[j])
        if n1 < 20: continue
        s = np.linalg.norm(p2[i] - p2[j]) / n1; t = p2[i] - s * p1[i]
        inl = np.linalg.norm(p2 - (s * p1 + t), axis=1) < 2.0
        if best is None or inl.sum() > best.sum(): best = inl
    P, Q = p1[best], p2[best]
    X = np.zeros((2 * len(P), 3)); X[0::2, 0] = P[:, 0]; X[0::2, 1] = 1; X[1::2, 0] = P[:, 1]; X[1::2, 2] = 1
    s, tx, ty = np.linalg.lstsq(X, Q.reshape(-1), rcond=None)[0]
    return float(s), float(s * 640 + tx), float(s * 360 + ty), int(best.sum())

ref_ui = json.load(open(f'{HERE}/cam_ui_direct.json'))
A = O(174)  # 2.9 s, the same anchor time as the reference
ui = []
for r in ref_ui:
    if r['inl'] < 60: continue
    i = round(r['t'] * 60)
    if i >= N: continue
    s, cx, cy, n = reg(A, O(i))
    ui.append(dict(t=r['t'], ref_s=r['s'], s=s, ref_cx=r['cx'], cx=cx, ref_cy=r['cy'], cy=cy, inl=n))
e = lambda k: float(np.max([abs(u[k] - u['ref_' + k]) for u in ui]))
rep['ui_camera'] = {'samples': len(ui), 'max_abs_err_scale': round(e('s'), 4), 'max_abs_err_cx_px720': round(e('cx'), 1), 'max_abs_err_cy_px720': round(e('cy'), 1),
                    'mean_abs_err_cx_px720': round(float(np.mean([abs(u['cx'] - u['ref_cx']) for u in ui])), 2)}

ref_code = json.load(open(f'{HERE}/cam.json'))['code']
B = O(480)  # 8.0 s anchor
code = []
for r in ref_code:
    if r['f'] < 216: continue
    s, cx, cy, n = reg(B, O(round(r['t'] * 60)))
    code.append(dict(t=r['t'], ref_s=r['s'], s=s))
rep['code_camera'] = {'samples': len(code), 'max_abs_err_scale': round(float(np.max([abs(c['s'] - c['ref_s']) for c in code])), 4)}

# ------------------------------------------------ object tracks
def bright_box(img, x0=0, x1=1280, thr=150):
    Y = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)[:, x0:x1]; m = Y > thr
    if m.sum() < 20: return None
    ys, xs = np.nonzero(m); return x0 + np.percentile(xs, 0.5), x0 + np.percentile(xs, 99.5), xs.mean() + x0
tr = json.load(open(f'{HERE}/tracks.json'))
# brand logo slide: progress 0..1 between start and end positions (ours ends at a different x by design)
rl = [o for o in tr['logo'] if 30 <= o['f'] <= 60]
rp = [(o['f'] / 30, (o['cx'] - 643) / (338 - 643)) for o in rl]
op = []
for t, _ in rp:
    # the logo is the leftmost cluster of bright components (letters sit to its right)
    g = cv2.cvtColor(O(round(t * 60)), cv2.COLOR_BGR2GRAY)
    n, lab, st, cen = cv2.connectedComponentsWithStats((g > 150).astype(np.uint8), connectivity=8)
    comps = [(st[k][0], st[k][0] + st[k][2]) for k in range(1, n) if st[k][4] > 30]
    if not comps: op.append(np.nan); continue
    x0 = min(c[0] for c in comps); grp = [c for c in comps if c[0] < x0 + 140]
    op.append((min(c[0] for c in grp) + max(c[1] for c in grp)) / 2)
op = np.array(op); op = (op - op[0]) / (op[-1] - op[0])
rep['logo_slide_progress_max_err'] = round(float(np.nanmax(np.abs(op - np.array([p for _, p in rp])))), 3)
# end logo width
rel = [o for o in tr['logo'] if 357 <= o['f'] <= 388]
ew = []
for o in rel:
    b = bright_box(O(round(o['f'] / 30 * 60)), thr=120)
    ew.append((o['f'] / 30, (o['x1'] - o['x0']) / 1280, (b[1] - b[0]) / 1280 if b else np.nan))
rep['end_logo_width_max_err_w'] = round(float(np.nanmax([abs(a - b) for _, a, b in ew])), 4)
# word left edges (Writing 9.0-9.93, coding 9.97-10.6) in normalized x
from_ref = json.load(open(os.path.join(HERE, '..', 'timing', 'ref_timing_map.json')))
def edges(key, t0, t1):
    rows = []
    for t, x in zip(from_ref[key]['x0_t'], from_ref[key]['x0']):
        if not (t0 <= t <= t1): continue
        b = bright_box(O(round(t * 60)), thr=140)
        rows.append((t, x, b[0] / 1280 if b else np.nan))
    return rows
wr, co = edges('writing', 9.0, 9.93), edges('coding', 9.97, 10.6)
rep['writing_left_edge_max_err_w'] = round(float(np.nanmax([abs(a - b) for _, a, b in wr])), 4)
rep['coding_left_edge_max_err_w'] = round(float(np.nanmax([abs(a - b) for _, a, b in co])), 4)

# ------------------------------------------------ audio: identical to the reference's soundtrack
def pcm(f):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-t', '13.9', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
a, b = pcm(out_mp4), pcm(ref_mp4); n = min(len(a), len(b))
lags = range(-80, 81); lag = max(lags, key=lambda L: float(np.dot(a[16000 + L:48000 + L], b[16000:48000])))
rep['audio'] = {'corr': round(float(np.corrcoef(a[:n], b[:n])[0, 1]), 5), 'lag_samples_16k': lag}

json.dump(dict(report=rep, ui=ui, code=code, end_logo=ew, writing=wr, coding=co), open(f'{wd}/validation.json', 'w'), indent=1)
print(json.dumps(rep, indent=1))

import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
fig, ax = plt.subplots(3, 2, figsize=(14, 11)); ax = ax.ravel()
T = [u['t'] for u in ui]
for k, (key, lab) in enumerate([('s', 'UI camera scale'), ('cx', 'UI camera centre x (px @720p)'), ('cy', 'UI camera centre y (px @720p)')]):
    ax[k].plot(T, [u['ref_' + key] for u in ui], 'o-', ms=3, label='reference (30 fps samples)', color='#E07050')
    ax[k].plot(T, [u[key] for u in ui], '.-', ms=3, label='render', color='#10B981'); ax[k].set_title(lab); ax[k].legend()
ax[3].plot([c['t'] for c in code], [c['ref_s'] for c in code], 'o-', ms=3, color='#E07050', label='reference'); ax[3].plot([c['t'] for c in code], [c['s'] for c in code], '.-', ms=3, color='#10B981', label='render'); ax[3].set_title('Code camera scale'); ax[3].legend()
ax[4].plot([w[0] for w in wr + co], [w[1] for w in wr + co], 'o', ms=3, color='#E07050', label='reference'); ax[4].plot([w[0] for w in wr + co], [w[2] for w in wr + co], '.', ms=4, color='#10B981', label='render'); ax[4].set_title('Word left edge (Writing → coding), x / W'); ax[4].legend()
ax[5].plot([w[0] for w in ew], [w[1] for w in ew], 'o-', ms=3, color='#E07050', label='reference'); ax[5].plot([w[0] for w in ew], [w[2] for w in ew], '.-', ms=3, color='#10B981', label='render'); ax[5].set_title('End logo width / W'); ax[5].legend()
plt.tight_layout(); plt.savefig(f'{wd}/validation.png', dpi=90)
