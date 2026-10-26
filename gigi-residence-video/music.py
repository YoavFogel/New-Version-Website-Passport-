"""Original instrumental bed for the GIGI RESIDENCE film (synthesised, no samples,
so there is no third-party licence). 102 s, 48 kHz stereo -> music.wav

Arc (seconds): discovery 0-16 · gentle tech pulse 16-30 · warm lifestyle 30-58 ·
data lift 58-76 · confident luxury 76-100 · clean musical ending 100-102.
"""
import sys
import wave
import numpy as np

SR = 48000
DUR = 102.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(4)

BPM = 80.0
BEAT = 60.0 / BPM
BAR = BEAT * 4


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# D major colour: Dmaj9 · Bm9 · Gmaj9 · Asus4→A, two bars each
PROG = [
    (50, [62, 66, 69, 73, 76]),   # Dmaj9
    (47, [62, 66, 69, 71, 73]),   # Bm9
    (43, [62, 66, 69, 71, 74]),   # Gmaj9 (add6)
    (45, [62, 64, 69, 71, 76]),   # Asus
]


def chord_at(time):
    i = int(time // (BAR * 2)) % len(PROG)
    return PROG[i]


def env_curve(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


# section intensities
pad_lvl = env_curve([(0, 0), (2.5, 0.8), (16, 0.8), (30, 0.7), (58, 0.85), (76, 0.8), (94, 1.0), (100.4, 1.0), (102, 0)])
arp_lvl = env_curve([(0, 0), (5, 0.3), (16, 0.45), (30, 0.5), (58, 0.5), (76, 0.6), (94, 0.45), (99, 0.3), (100.5, 0)])
pulse_lvl = env_curve([(0, 0), (16, 0), (17.5, 0.3), (29, 0.3), (31, 0.08), (57, 0.1), (59, 0.45), (75, 0.45), (77, 0.2), (93, 0.25), (95, 0), (102, 0)])
bass_lvl = env_curve([(0, 0), (4, 0.6), (58, 0.7), (60, 0.95), (76, 0.85), (100.4, 0.9), (102, 0)])

L = np.zeros(N)
R = np.zeros(N)


def add(sig, start, pan=0.0):
    i0 = int(start * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i0:i0 + len(sig)] += sig * gl
    R[i0:i0 + len(sig)] += sig * gr


# ---- pad: detuned additive voices, slow swell per chord, gentle low-pass via harmonic roll-off
seg = BAR * 2
n_seg = int(np.ceil(DUR / seg)) + 1
for k in range(n_seg):
    st = k * seg - 0.6
    root, notes = PROG[k % len(PROG)]
    ln = seg + 2.2
    tt = np.arange(int(ln * SR)) / SR
    e = np.minimum(1, tt / 1.6) * np.minimum(1, np.maximum(0, (ln - tt) / 1.8))
    for j, m in enumerate(notes[:4]):
        for det, pan in ((-0.07, -0.5), (0.07, 0.5)):
            f = hz(m) * 2 ** (det / 12)
            v = sum(np.sin(2 * np.pi * f * h * tt + rng.random() * 6) / (h ** 1.8) for h in (1, 2, 3, 4))
            add(0.020 * e * v, max(0, st), pan * (0.4 + 0.15 * j))

# ---- soft piano arpeggio (bell-ish, exponential decay)
def piano(f, dur=2.6, vel=1.0):
    tt = np.arange(int(dur * SR)) / SR
    a = np.minimum(1, tt / 0.004)
    v = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 2.5)
         + 0.12 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt * 4))
    return vel * a * np.exp(-tt * 1.6) * v


pattern = [0, 2, 4, 3, 1, 3, 4, 2]  # chord-tone indices per 8th note
step = BEAT / 2
k = 0
time = 0.0
while time < 100.5:
    root, notes = chord_at(time)
    idx = int(time / step + 1e-6)
    lvl = float(np.interp(time, t[::480], arp_lvl[::480]))
    # thin the pattern in calm passages
    if lvl > 0.02 and (idx % 2 == 0 or lvl > 0.5):
        m = notes[pattern[idx % 8]] + (12 if idx % 16 >= 12 else 0)
        add(0.09 * lvl * piano(hz(m), vel=0.8 + 0.2 * rng.random()), time, pan=(-0.35 if idx % 2 else 0.35))
    time += step

# ---- sub bass (root, soft attack)
for k in range(int(DUR / BAR) + 1):
    st = k * BAR
    root, _ = chord_at(st)
    tt = np.arange(int(BAR * SR)) / SR
    e = np.minimum(1, tt / 0.08) * np.exp(-tt * 0.5)
    v = np.sin(2 * np.pi * hz(root - 12) * tt) + 0.25 * np.sin(2 * np.pi * hz(root) * tt)
    add(0.10 * e * v * float(np.interp(st, t[::480], bass_lvl[::480])), st)

# ---- gentle pulse: muted kick on 1 and 3, filtered tick on off-beats
for b in range(int(DUR / BEAT)):
    st = b * BEAT
    lvl = float(np.interp(st, t[::480], pulse_lvl[::480]))
    if lvl < 0.02:
        continue
    if b % 2 == 0:
        tt = np.arange(int(0.35 * SR)) / SR
        f = 48 + 70 * np.exp(-tt * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
        add(0.16 * lvl * kick, st)
    tt = np.arange(int(0.06 * SR)) / SR
    noise = rng.standard_normal(len(tt))
    noise = np.diff(np.concatenate([[0], noise]))  # crude high-pass
    add(0.012 * lvl * noise * np.exp(-tt * 70), st + BEAT / 2, pan=0.3)

# ---- final resolve: D major chord swell under the logo, ringing out
for m, pan in ((50, 0), (57, -0.3), (62, 0.3), (66, -0.2), (69, 0.2), (74, 0)):
    add(0.07 * piano(hz(m), dur=4.0), 98.1, pan)

# simple stereo reverb (feedback delays)
def verb(x):
    y = x.copy()
    for d, g in ((0.031, 0.35), (0.047, 0.3), (0.071, 0.25), (0.113, 0.2), (0.173, 0.15)):
        n = int(d * SR)
        z = np.zeros_like(x)
        z[n:] = x[:-n] * g
        for _ in range(3):
            z[n:] += z[:-n] * 0.45
        y += z
    return y

L, R = verb(L), verb(R)
master = env_curve([(0, 0), (0.8, 1), (100.6, 1), (101.9, 0), (102, 0)])
L *= master
R *= master
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.8, R / peak * 0.8
out = np.stack([L, R], 1)
pcm = (out * 32767).astype('<i2')
path = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', path, out.shape)
