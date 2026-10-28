# EU Passport website (built section by section)

Open `index.html`. No build step.

## The passport layers (`assets/img/`)
- `original.webp`: the supplied photo, untouched, for reference.
- `man.webp`: the same photo with the passport removed. The jacket and shirt behind it were
  rebuilt from the surrounding pixels (smooth fill along the lapel line plus fabric grain).
- `passport.webp`: the exact passport cut from the photo, transparent background. Only the
  corner hidden under the thumb was filled in, with the cover's own colour.
- `thumb.webp`: the thumb and fingers that overlap the passport. They sit above the passport
  in the first frame so he is holding it.

The layers line up on the 1122 × 1402 photo: passport at (255, 631), thumb at (294, 867).
Stacked, they reproduce the original.

## The scroll path
`js/main.js` moves the one `#passport` element. Each empty page carries
`data-passport="side top scale"`: side is `start` (right), `end` (left) or `center`, top is in vh.
When a section gets its content, change its `data-passport` so the passport rests where
there is no text.
