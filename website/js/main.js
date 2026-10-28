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
    gsap.set(passport, { clearProps: 'transform,width' });
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
    const at = (s, cx, cy, scale, rotation) => ({
      s, x: cx - pw / 2, y: cy - ph / 2, scale, rotation: reduceMotion ? 0 : rotation,
    });
    const edge = phone ? 18 : Math.max(32, vw * 0.06);
    const sideX = (side, scale) => {
      const half = (pw * scale) / 2;
      if (side === 'center') return vw / 2;
      // RTL: "start" is the right-hand side, "end" the left.
      return side === 'start' ? vw - edge - half : edge + half;
    };

    const keys = [at(0, hand.cx, hand.cy, 1, 0)];

    // The hand-off: forward and a little sideways, slightly larger, as if handed to the visitor.
    keys.push(at(vh * 0.5, phone ? vw * 0.5 : hand.cx + vw * 0.14, vh * (phone ? 0.42 : 0.4), phone ? 1.2 : 1.28, 4));

    // Then one continuous glide: it reaches each page's resting place when that page is
    // centred on screen, and is already on its way to the next one as the page scrolls on.
    pages.forEach((page) => {
      const [side, top, sc] = page.dataset.passport.split(' ');
      const scale = Number(sc) * (phone ? 0.8 : 1);
      const cy = vh * (Number(top) / 100) + (ph * scale) / 2;
      const rot = side === 'start' ? -3 : side === 'end' ? 3 : 0;
      const centred = page.offsetTop + page.offsetHeight / 2 - vh / 2;
      const s = Math.max(centred, keys[keys.length - 1].s + vh * 0.3);
      keys.push(at(s, sideX(side, scale), cy, scale, rot));
    });

    const max = Math.max(ScrollTrigger.maxScroll(window), 1);
    const tl = gsap.timeline({ paused: true });
    const [first, ...rest] = keys;
    tl.set(passport, { x: first.x, y: first.y, scale: first.scale, rotation: first.rotation }, 0);
    rest.forEach((k, i) => {
      const prev = keys[i];
      tl.to(passport, {
        x: k.x, y: k.y, scale: k.scale, rotation: k.rotation,
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
