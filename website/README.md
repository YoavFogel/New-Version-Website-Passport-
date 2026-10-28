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

## Video gallery ("הסרטונים שלנו")

Each video is one `<li class="vg-item">` inside `<ul class="vg-track">` in `index.html`.
The number of cards, the counter and the order all follow the list; nothing else needs editing.

There are two ways to give a card its video:

**A. From Google Drive (how the five current ads are set up).**
1. Upload the video to the Drive folder that holds the ads, and set its sharing to
   "Anyone with the link: Viewer".
2. Copy the file ID: in the share link `https://drive.google.com/file/d/<ID>/view`, it is the `<ID>` part.
3. Add a card:
   ```html
   <li class="vg-item" data-drive="<ID>" data-title="שם הסרטון">
     ...copy the <button> of an existing card and change the title and the number...
   </li>
   ```
   The poster is taken from Drive's thumbnail automatically.

**B. From the website itself (best quality and speed on iPhone).**
1. Export each video as MP4 (H.264, 1080p, about 8–15 MB) and a poster image (JPG, 800 px wide).
2. Put both in `website/assets/video/`, e.g. `assets/video/pool.mp4` and `assets/video/pool.jpg`.
3. Use `data-src` and `data-poster` instead of `data-drive`:
   ```html
   <li class="vg-item" data-src="assets/video/pool.mp4" data-poster="assets/video/pool.jpg" data-title="בריכה">
   ```
   Files of 60–110 MB, like the current Drive originals, should not go on the site itself;
   compress them first, or keep them on Drive.

To replace a video, change its `data-drive` (or `data-src` / `data-poster`) and `data-title`.
To remove one, delete its `<li>`. Videos load only when a visitor presses play, so adding
cards does not slow the page down.

## Settings (`js/config.js`)

- `whatsapp`: the WhatsApp Business number, in the form `9725XXXXXXXX`. Every WhatsApp
  link on both pages is built from it.
- `leadEndpoint`: the HTTPS address the lead form posts to (a JSON body with `name`, `phone`,
  `email`, `relation`, `page`, `sentAt`). Until it is set the form does not pretend to send:
  it tells the visitor to use WhatsApp or the phone instead.

## Pages

- `index.html`: the home page, with its sections in order: about, journey, services,
  questions, videos, lead form, then the footer.
- `contact.html`: contact details, the map, navigation buttons and the same lead form.
