"""Female narration for the 16:9 promo: synthesis, checking and word timings.

Kokoro-82M v1.0 (local ONNX) speaks each line; PocketSphinx transcribes it back
to catch dropped or garbled words and force-aligns every word, so the picture
can land each headline on the word the narrator actually says.

usage: python3 vo.py <tts_dir> <out_dir>
  tts_dir holds kokoro-v1.0-fp32.onnx and voices-v1.0.bin
writes out_dir/narration.wav (48 kHz mono) and vo.json (lines + word times)
"""
import json, re, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro
import pocketsphinx

TTS, OUT = sys.argv[1], sys.argv[2]
SR = 48000
BRAND = 'ˈɑːɹti mjˈuːzɪk'            # "Aar-tee Music", not the American flap "Ar-dee"

# id, text, pause after (s). Copy leans on the app's own words where it can:
# "Search any song", "a playlist for your own kind of mood", "your favourites
# will follow you to any phone", "Your daily sound".
LINES = [
    ('hook',   'What does your day sound like?',                                  0.45),
    ('meet',   'Meet Aarti Music.',                                               0.60),
    ('mood',   'Fresh picks, made for your mood.',                                0.50),
    ('search', 'Search any song.',                                                0.30),
    ('play',   'Find it, tap it, and just press play.',                           0.80),
    ('lists',  'Build playlists for every mood, and keep your favourites close.', 0.60),
    ('tg',     'Connect Telegram, and your favourites follow you to any phone.',  0.60),
    ('themes', 'Pick from seven themes, and make it yours.',                      0.85),
    ('end',    'Aarti Music. Your daily sound.',                                  0.00),
]
LEAD = 0.18       # narration starts almost at once: no empty intro
SPEED = 0.88

k = Kokoro(f'{TTS}/kokoro-v1.0-fp32.onnx', f'{TTS}/voices-v1.0.bin')
V = np.load(f'{TTS}/voices-v1.0.bin')
MIX = {'af_heart': 0.8, 'hf_alpha': 0.2}   # warm, clear, with a light Indian-English colour
voice = sum(V[n] * w for n, w in MIX.items()).astype(np.float32)

def phon(text):
    p = k.tokenizer.phonemize(text.replace('Aarti Music', 'BRANDX'), 'en-us')
    return re.sub(r'bɹˈændɛks|bɹˈændˌɛks|bɹˈændks', BRAND, p)

def trim(x, thr=0.004):
    idx = np.where(np.abs(x) > thr)[0]
    a, b = max(0, idx[0] - int(0.01 * SR)), min(len(x), idx[-1] + int(0.04 * SR))
    return x[a:b]

def asr(x, align=None):
    a = (np.clip(resample_poly(x, 1, 3), -1, 1) * 32767).astype(np.int16)
    d = pocketsphinx.Decoder(samprate=16000, bestpath=False)
    if align:
        d.set_align_text(align.replace('aarti', 'arty').replace('favourites', 'favorites'))
    d.start_utt(); d.process_raw(a.tobytes(), full_utt=True); d.end_utt()
    if not align:
        return d.hyp().hypstr if d.hyp() else ''
    d.set_alignment(); d.start_utt(); d.process_raw(a.tobytes(), full_utt=True); d.end_utt()
    words = []
    for w in d.get_alignment():
        if w.name not in ('<s>', '</s>', '<sil>'):
            nm = re.sub(r'\(\d+\)$', '', w.name)
            words.append({'w': {'arty': 'aarti', 'favorites': 'favourites'}.get(nm, nm), 'start': w.start / 100, 'end': (w.start + w.duration) / 100})
    return words

def words_of(text): return re.findall(r"[a-z']+", text.lower())

out, meta, t = [np.zeros(int(LEAD * SR))], [], LEAD
for lid, text, pause in LINES:
    for attempt in range(3):
        s, sr = k.create(phon(text), voice=voice, speed=SPEED - 0.02 * attempt, is_phonemes=True)
        x = trim(resample_poly(s, SR // 1000, sr // 1000))
        heard = asr(x)
        want = [w for w in words_of(text) if w not in ('aarti', 'music')]
        got = set(words_of(heard.replace('favorites', 'favourites')))
        missing = [w for w in want if w not in got]
        if len(missing) <= max(1, len(want) // 4):   # PocketSphinx is strict; allow a little
            break
    try:
        ws = asr(x, ' '.join(words_of(text)))
    except Exception as e:  # alignment failure: fall back to proportional timing
        ws = []
    if len(ws) != len(words_of(text)):
        n = words_of(text); L = sum(len(w) + 1 for w in n); acc = 0; ws = []
        for w in n:
            a = acc / L * len(x) / SR; acc += len(w) + 1; ws.append({'w': w, 'start': a, 'end': acc / L * len(x) / SR})
    for w in ws:
        w['start'] = round(t + w['start'], 3); w['end'] = round(t + w['end'], 3)
    meta.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3), 'words': ws,
                 'heard': heard, 'missing': missing})
    print(f"{lid:7s} {t:6.2f}-{t + len(x) / SR:6.2f}  heard: {heard!r}  missing: {missing}")
    out += [x, np.zeros(int(pause * SR))]; t += len(x) / SR + pause

vo = np.concatenate(out)
vo = vo / np.abs(vo).max() * 0.89
sf.write(f'{OUT}/narration.wav', vo, SR, subtype='PCM_24')
nwords = sum(len(words_of(l[1])) for l in LINES)
speech = sum(m['end'] - m['start'] for m in meta)
json.dump({'lines': meta, 'duration': round(t, 3), 'words': nwords, 'voice': MIX, 'speed': SPEED}, open(f'{OUT}/vo.json', 'w'), indent=1)
print(f'words {nwords}, narration {t:.2f}s, {60 * nwords / t:.0f} wpm overall, {60 * nwords / speech:.0f} wpm while speaking')
