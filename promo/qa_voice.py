"""Voice intelligibility check for the final mix: voice-to-bed ratio per line and ASR hit rate."""
import json, sys, re, numpy as np, soundfile as sf, pocketsphinx
from scipy.signal import resample_poly
A = sys.argv[1]; SR = 48000
v, _ = sf.read(f'{A}/stems/voice.wav'); b, _ = sf.read(f'{A}/stems/music_bed.wav'); fx, _ = sf.read(f'{A}/stems/sfx.wav'); m, _ = sf.read(sys.argv[2])
vo = json.load(open('vo.json'))
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def asr(x):
    x = x.mean(1) if x.ndim > 1 else x; a = (np.clip(resample_poly(x, 1, 3), -1, 1) * 32767 * 0.9).astype(np.int16)
    d = pocketsphinx.Decoder(samprate=16000); d.start_utt(); d.process_raw(a.tobytes(), full_utt=True); d.end_utt(); return d.hyp().hypstr if d.hyp() else ''
tot = hv_ = hm_ = 0
for l in vo['lines']:
    a, z = int(l['start'] * SR), int(l['end'] * SR)
    want = [w for w in re.findall(r"[a-z']+", l['text'].lower()) if w not in ('aarti', 'music')]
    a2, z2 = int((l['start'] - 0.05) * SR), int((l['end'] + 0.1) * SR)
    hv = asr(v[a2:z2]).replace('favorites', 'favourites'); hm = asr(m[a2:z2]).replace('favorites', 'favourites')
    tot += len(want); hv_ += sum(w in hv.split() for w in want); hm_ += sum(w in hm.split() for w in want)
    from scipy.signal import butter, sosfilt
    sos = butter(4, 300, "high", fs=SR, output="sos"); sb = lambda x: sosfilt(sos, x, axis=0)
    print(f"{l['id']:7s} voice/bed {rms(v[a:z]) - rms((b + fx)[a:z]):+5.1f} dB, speech band {rms(sb(v[a:z])) - rms(sb((b + fx)[a:z])):+5.1f} dB | mix heard: {hm}")
print('ASR words recognised: voice-only', hv_, '/', tot, '  full mix', hm_, '/', tot)
