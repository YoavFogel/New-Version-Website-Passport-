# GIGI RESIDENCE BY ISROMANA: 102-second motion-graphics film

**v2 visual language** (after client feedback, modelled on the approved reference clip): flat royal-blue and near-black fields, dot-matrix maps, heavy Hebrew typography, rolling numbers with motion blur, white UI cards with slide transitions, and clean elevation-view architecture with depth layers.

**Font:** the film is set up for **Almoni** (AlefAlefAlef). Almoni is a commercial licensed font, so it isn't included. Copy the licensed web-font files into `assets/fonts/` as `almoni-200.woff2`, `almoni-300.woff2`, `almoni-400.woff2`, `almoni-500.woff2`, `almoni-700.woff2`, `almoni-800.woff2` and `almoni-900.woff2`, then rebuild. Until then the film uses Noto Sans Hebrew (OFL).

Procedural motion-graphics film. Every frame is drawn on one canvas as a pure function of time (`anim.js`). The frames are rendered headless in Chromium (Playwright) at 3840×2160, 25 fps, and muxed with the supplied Hebrew voiceover (unchanged) and an original synthesised music bed (`music.py`, no third-party samples, so it needs no licence).

```
./build.sh            # → out/GIGI_Residence_by_ISROMANA_4K.mp4  (≈15 min on 4 cores)
./build.sh out 0.5    # fast 960×540 draft (<1 min)
node preview.cjs dir 12.5 33 66   # still frames for review
node tools_dots.cjs                # rebuild assets/dots.js (dot-matrix land grids) from assets/world.js
open index.html?play&scale=1      # live preview with voiceover (click to start)
```

## Timing (locked to the voiceover)

The voiceover file is 100.6 s, not 99 s: speech ends at **100.36 s**. The film still runs exactly **102.0 s**, so the brand end card holds for about 1.6 s instead of 3 s. The scene breaks were measured with `ffmpeg silencedetect`:

| # | Scene | Time (s) | Sync point |
|---|-------|----------|------------|
| 01 | Globe → Romania → BUCHAREST | 0.0–5.3 | Dot and label on "בוקרשט" (~4.4) |
| 02 | North to CORBEANCA | 5.3–10.6 | Pin lands on "קורביאנקה" (~9.5) |
| 03 | Tel Aviv → Bucharest, 2:30 | 10.6–16.6 | Flight 11.8–13.5, counter 13.4 |
| 04 | OTP, 6 km drive, DN1, A0 | 16.6–29.5 | Drive 18.9–22.5, DN1 ~25.0, A0 ~25.7 |
| 05 | Route → street → homes | 29.5–34.0 | |
| 06 | Neighbourhood, city vs. Corbeanca | 34.0–44.8 | City on "הצפיפות של העיר" (40.4–42.4) |
| 07 | Shopping nearby | 44.8–48.3 | |
| 08 | Lidl / Mega Image / Penny, DN1 Value Centre | 48.3–58.0 | 51.5 / 52.2 / 52.9 · VC 53.7–55.6 |
| 09 | Map → graph lines, royal blue | 58.0–60.5 | |
| 10 | A decade of development | 60.5–64.4 | |
| 11 | +61% | 64.4–68.6 | |
| 12 | ~90% bars | 68.6–75.8 | Number on "כ-90%" (~72.6) |
| 13 | Plane / home / growth | 75.8–79.4 | |
| 14 | Villa → luxury neighbourhood | 79.4–87.9 | |
| 15 | Home at dusk | 87.9–94.0 | Camera settles on "בית" (~93.2) |
| 16 | Brand reveal | 94.0–100.4 | GIGI 94.2 · BY ISROMANA 95.3 · LUXURY RESIDENCE 96.5 · tagline 98.1 |
| 17 | End card | 100.4–102.0 | Fade to black from 101.3 |

## Open items before final delivery

1. **GIGI RESIDENCE logo.** No logo file was supplied, so the end card uses a clean typographic stand-in ("GIGI RESIDENCE" in Cinzel). To use the official file, put it in `assets/` and replace the `text('GIGI RESIDENCE', …)` call in `sceneBrand`.
2. **LUXURY RESIDENCE.** The official ISROMANA logo already contains "LUXURY RESIDENCE". To avoid showing it twice, that moment is a light sweep and a gold underline on the logo's own tagline.
3. **Supermarkets.** Lidl, Mega Image and Penny appear as uniform modern name chips, each with a brand-colour dot, instead of logos.
4. **Geographic points to verify on a live map.** No map service was reachable while building this, so these use reference coordinates (all in `GEO`, `DN1`, `ROUTE`, `A0` at the top of `anim.js`):
   - the exact Lidl, Mega Image and Penny branches in Corbeanca (`GEO.lidl`, `GEO.mega`, `GEO.penny`);
   - the DN1 Value Centre position (`GEO.valueCentre`);
   - the drive route OTP → Corbeanca (`ROUTE`) and the DN1 alignment (`DN1`);
   - **A0:** only the southern arc is drawn as an active road. Confirm which northern sections are open before showing them;
   - the project pin uses Corbeanca's centre. Move `GEO.corbeanca` to the plot if it should be exact.
5. **Music.** The music is an original synthesised bed, so it has no licence issues. To use a licensed library track instead, swap `out/music.wav`. The ducking in `build.sh` still applies.

## Brand rules applied

- ISROMANA logo, from the original file only: top-left, 6% of frame width, 4% margins, until the reveal. It is screen-blended, so its black field disappears without changing its colours or proportions.
- Palette: deep blue, royal blue (data act), white, black, soft green, subtle gold accents.
- Hebrew text appears only for key numbers and short labels. There are no subtitles and no years.
