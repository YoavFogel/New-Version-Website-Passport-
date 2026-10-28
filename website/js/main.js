// EU Passport: the passport leaves the man's hand on scroll and travels down the page.
// One element (#passport) does the whole journey; everything is tied to the scroll position,
// so scrolling back up plays the same path in reverse. At the very top the passport docks
// back into the photo itself, so it sits exactly where it is in the original picture.
// The move only happens while the visitor scrolls, so it stays on under reduced motion too,
// in a calmer form: native scrolling, no rotation.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ready = !!(window.gsap && window.ScrollTrigger);

if (ready) {
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll, driven by GSAP's ticker so the passport and the page move as one.
  if (window.Lenis && !reduceMotion) {
    const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const passport = document.getElementById('passport');
  const figure = document.getElementById('hero-figure');
  const pages = [...document.querySelectorAll('[data-passport]')];

  // Where the passport sits in the 1122 × 1402 photograph.
  const PHOTO = { left: 255 / 1122, top: 631 / 1402, width: 274 / 1122, ratio: 329 / 274 };

  let trigger = null;
  let floatWidth = 0;
  let docked = true;

  // Docked: the passport is a plain layer of the photo (positioned by style.css).
  // The timeline keeps rendering its first frame at the top, so the dock clears that every time.
  function dock() {
    docked = true;
    passport.classList.remove('is-floating');
    gsap.set(passport, { clearProps: 'transform,width,opacity' });
  }
  // Floating: the same element, fixed to the viewport and moved by the timeline.
  function undock() {
    if (!docked) return;
    docked = false;
    passport.classList.add('is-floating');
    gsap.set(passport, { width: floatWidth });
  }

  function build() {
    trigger?.kill();
    trigger = null;
    dock();

    const scrollY = window.scrollY;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const phone = vw <= 900;

    // The hand, measured while the passport is docked in it.
    const fig = figure.getBoundingClientRect();
    const pw = fig.width * PHOTO.width;
    const ph = pw * PHOTO.ratio;
    floatWidth = pw;
    const hand = {
      cx: fig.left + fig.width * PHOTO.left + pw / 2,
      cy: fig.top + scrollY + fig.height * PHOTO.top + ph / 2,
    };

    // Keyframes: scroll position -> centre of the passport in the viewport, scale, rotation.
    const at = (s, cx, cy, scale, rotation, opacity = 1) => ({
      s, x: cx - pw / 2, y: cy - ph / 2, scale, rotation: reduceMotion ? 0 : rotation, opacity,
    });
    const edge = phone ? 18 : Math.max(32, vw * 0.06);
    const PEEK = 16; // px of passport left on screen when it waits at the edge, inside the side margin
    const sideX = (side, scale) => {
      const half = (pw * scale) / 2;
      if (side === 'center') return vw / 2;
      // Peeking: mostly off the screen edge, so it never sits on text on a phone.
      if (side === 'peek-end' || side === 'hide') return -half + PEEK;
      if (side === 'peek-start') return vw + half - PEEK;
      // RTL: "start" is the right-hand side, "end" the left.
      return side === 'start' ? vw - edge - half : edge + half;
    };

    const keys = [at(0, hand.cx, hand.cy, 1, 0)];

    // The hand-off: forward and a little sideways, slightly larger, as if handed to the visitor.
    // On a phone it leaves toward the left edge, where it waits, so it never crosses the text.
    keys.push(at(vh * 0.5, phone ? edge + (pw * 1.15) / 2 : hand.cx + vw * 0.14, vh * (phone ? 0.5 : 0.4), phone ? 1.15 : 1.28, phone ? 0 : 4));

    // Then one continuous glide: it reaches each page's resting place when that page is
    // centred on screen, and is already on its way to the next one as the page scrolls on.
    pages.forEach((page) => {
      const spec = (phone && page.dataset.passportPhone) || page.dataset.passport;
      const [side, top, sc] = spec.split(' ');
      const scale = Number(sc) * (phone ? 0.8 : 1);
      const cy = vh * (Number(top) / 100) + (ph * scale) / 2;
      const rot = /peek/.test(side) ? 0 : side === 'start' ? -3 : side === 'end' ? 3 : 0;
      const box = page.getBoundingClientRect();
      const centred = box.top + scrollY + box.height / 2 - vh / 2;
      const s = Math.max(centred, keys[keys.length - 1].s + vh * 0.3);
      // 'hide' (phones, long reading): it shrinks and fades out at the edge until the text is past.
      keys.push(at(s, sideX(side, scale), cy, side === 'hide' ? scale * 0.6 : scale, rot, side === 'hide' ? 0 : 1));
    });

    const max = Math.max(ScrollTrigger.maxScroll(window), 1);
    const tl = gsap.timeline({ paused: true });
    const [first, ...rest] = keys;
    tl.set(passport, { x: first.x, y: first.y, scale: first.scale, rotation: first.rotation, opacity: 1 }, 0);
    rest.forEach((k, i) => {
      const prev = keys[i];
      tl.to(passport, {
        x: k.x, y: k.y, scale: k.scale, rotation: k.rotation, opacity: k.opacity,
        duration: Math.max(k.s - prev.s, 1),
        ease: i === 0 ? 'power1.out' : 'sine.inOut',
      }, prev.s);
    });
    if (tl.duration() < max) tl.to({}, { duration: max - tl.duration() }, tl.duration());

    // Dock at the very top, float everywhere else. This runs on every rendered frame,
    // after the scrub has caught up, so the top always ends docked in the photo.
    tl.eventCallback('onUpdate', () => (tl.time() <= 0.5 ? dock() : undock()));

    trigger = ScrollTrigger.create({
      start: 0,
      end: () => max,
      scrub: reduceMotion ? 0.3 : 1,
      animation: tl,
    });
    tl.progress(trigger.progress);
    if (tl.time() > 0.5) undock(); else dock();
  }

  // ---------- About: the story is revealed by the scroll itself ----------
  // Every reveal is scrubbed to the scroll position, so it moves with the reader and
  // stays put once read. Under reduced motion the text is simply there.
  function story() {
    if (reduceMotion) return;
    const mobile = window.innerWidth <= 900;
    const rise = mobile ? 14 : 26;

    // Headings: each word (or line) rises out of its own mask, one after another.
    document.querySelectorAll('[data-mask]').forEach((title) => {
      const words = [...title.querySelectorAll('.w')].map((w) => {
        const inner = document.createElement('span');
        inner.append(...w.childNodes);
        w.append(inner);
        return inner;
      });
      gsap.fromTo(words, { yPercent: 105 }, {
        yPercent: 0, ease: 'none', stagger: 0.35,
        scrollTrigger: { trigger: title, start: 'top 92%', end: mobile ? 'top 62%' : 'top 52%', scrub: 0.6 },
      });
    });

    // Paragraphs and statements: a soft rise as each one reaches the reading zone.
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: rise }, {
        opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 94%', end: mobile ? 'top 74%' : 'top 66%', scrub: 0.6 },
      });
    });

    // The highlight under "רצון לעשות את הדברים קצת אחרת" is drawn as it is read (RTL: from the right).
    document.querySelectorAll('[data-marker]').forEach((m) => {
      gsap.fromTo(m, { backgroundSize: '0% 0.34em' }, {
        backgroundSize: '100% 0.34em', ease: 'none',
        scrollTrigger: { trigger: m, start: 'top 78%', end: 'top 48%', scrub: 0.6 },
      });
    });

    // The file statement lights up word by word while it is read. Words stay whole.
    document.querySelectorAll('[data-words]').forEach((p) => {
      const words = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        p.append(span, i < words.length - 1 ? ' ' : '');
      });
      gsap.fromTo(p.querySelectorAll('.word'), { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: p, start: 'top 80%', end: mobile ? 'bottom 55%' : 'bottom 45%', scrub: 0.6 },
      });
    });

    // The large 2017 drifts slower than the page, a quiet sense of depth.
    document.querySelectorAll('[data-drift]').forEach((el) => {
      gsap.fromTo(el, { y: mobile ? 20 : 60 }, {
        y: mobile ? -20 : -60, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }
  story();

  // Keyframes depend on the layout, so they are measured again after load and on resize.
  const start = () => { build(); ScrollTrigger.refresh(); };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
  document.fonts?.ready.then(() => { if (document.readyState === 'complete') start(); });

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    // Phones fire resize when the address bar slides; only a width change moves the layout.
    if (window.innerWidth === lastWidth && window.innerWidth <= 900) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  });
}
