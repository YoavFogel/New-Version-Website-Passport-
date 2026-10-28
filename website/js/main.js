// EU Passport: the passport leaves the man's hand on scroll and travels down the page.
// One element (#passport) does the whole journey; everything is tied to the scroll position,
// so scrolling back up plays the same path in reverse and the top puts it back in his hand.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ready = !reduceMotion && window.gsap && window.ScrollTrigger;

if (ready) {
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll, driven by GSAP's ticker so the passport and the page move as one.
  if (window.Lenis) {
    const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const passport = document.getElementById('passport');
  const figure = document.getElementById('hero-figure');
  const thumb = document.querySelector('.hero-thumb');
  const hero = document.querySelector('.hero');
  const pages = [...document.querySelectorAll('[data-passport]')];

  // Where the passport sits in the 1122 × 1402 photograph.
  const PHOTO = { left: 255 / 1122, top: 631 / 1402, width: 274 / 1122, ratio: 329 / 274 };

  let trigger = null;

  function build() {
    trigger?.kill(true);
    const scrollY = window.scrollY;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const phone = vw <= 900;

    // The hand, in page coordinates.
    const fig = figure.getBoundingClientRect();
    const pw = fig.width * PHOTO.width;
    const ph = pw * PHOTO.ratio;
    const hand = {
      cx: fig.left + fig.width * PHOTO.left + pw / 2,
      cy: fig.top + scrollY + fig.height * PHOTO.top + ph / 2,
    };

    passport.classList.add('is-floating');
    thumb.classList.add('is-above');
    gsap.set(passport, { width: pw, x: 0, y: 0, xPercent: 0, yPercent: 0 });

    // Keyframes: scroll position -> centre of the passport in the viewport, scale, rotation.
    const at = (s, cx, cy, scale, rotation) => ({ s, x: cx - pw / 2, y: cy - ph / 2, scale, rotation });
    const edge = phone ? 18 : Math.max(32, vw * 0.06);
    const sideX = (side, scale) => {
      const half = (pw * scale) / 2;
      if (side === 'center') return vw / 2;
      // RTL: "start" is the right-hand side, "end" the left.
      return side === 'start' ? vw - edge - half : edge + half;
    };

    const keys = [at(0, hand.cx, hand.cy, 1, 0)];

    // The hand-off: forward and a little sideways, slightly larger, as if handed to the visitor.
    const heroEnd = hero.offsetTop + hero.offsetHeight;
    const handoffScale = phone ? 1.25 : 1.32;
    keys.push(at(vh * 0.55, phone ? vw * 0.5 : hand.cx + vw * 0.14, vh * (phone ? 0.42 : 0.4), handoffScale, 4));

    // Then it rests beside each page while that page is on screen, and travels between them.
    pages.forEach((page, i) => {
      const [side, top, sc] = page.dataset.passport.split(' ');
      const scale = Number(sc) * (phone ? 0.8 : 1);
      const cx = sideX(side, scale);
      const cy = vh * (Number(top) / 100) + (ph * scale) / 2;
      const rot = side === 'start' ? -3 : side === 'end' ? 3 : 0;
      const arrive = Math.max(page.offsetTop - vh * 0.08, keys[keys.length - 1].s + vh * 0.2);
      const leave = page.offsetTop + page.offsetHeight * 0.45;
      keys.push(at(arrive, cx, cy, scale, rot));
      keys.push(at(leave, cx, cy, scale, rot));
    });

    const max = ScrollTrigger.maxScroll(window);
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
    const [first, ...rest] = keys;
    tl.set(passport, { x: first.x, y: first.y, scale: first.scale, rotation: first.rotation }, 0);
    rest.forEach((k, i) => {
      const prev = keys[i];
      const hold = k.x === prev.x && k.y === prev.y;
      tl.to(passport, {
        x: k.x, y: k.y, scale: k.scale, rotation: k.rotation,
        duration: Math.max(k.s - prev.s, 1),
        ease: i === 0 ? 'power1.out' : hold ? 'none' : 'power2.inOut',
      }, prev.s);
    });
    if (tl.duration() < max) tl.to({}, { duration: max - tl.duration() }, tl.duration());

    trigger = ScrollTrigger.create({
      start: 0,
      end: () => Math.max(max, 1),
      scrub: 0.6,
      animation: tl,
    });
  }

  // Keyframes depend on the layout, so they are measured again after load and on resize.
  const start = () => { build(); ScrollTrigger.refresh(); };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  });
}
