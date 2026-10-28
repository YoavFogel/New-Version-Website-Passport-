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
  // Every move is scrubbed to the scroll position: the text arrives as the reader scrolls
  // and stays once read. Under reduced motion it still arrives, with shorter, calmer moves.
  // The words themselves are never altered; spans only wrap whole words and lines.
  const storyTriggers = [];
  const track = (tween) => { if (tween.scrollTrigger) storyTriggers.push(tween.scrollTrigger); return tween; };

  // Wrap a paragraph's lines in masks, measured from where the browser actually breaks them.
  function splitLines(p) {
    if (!p.dataset.text) p.dataset.text = p.textContent.trim().replace(/\s+/g, ' ');
    const words = p.dataset.text.split(' ');
    p.textContent = '';
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.textContent = w;
      p.append(s, i < words.length - 1 ? ' ' : '');
      return s;
    });
    const lines = [];
    let top = null;
    spans.forEach((s) => {
      if (top === null || Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; }
      lines[lines.length - 1].push(s.textContent);
    });
    p.textContent = '';
    return lines.map((ws) => {
      const mask = document.createElement('span');
      mask.className = 'ln';
      const inner = document.createElement('span');
      inner.className = 'ln-in';
      inner.textContent = ws.join(' ');
      mask.append(inner);
      p.append(mask, ' ');
      return inner;
    });
  }

  function story() {
    storyTriggers.splice(0).forEach((t) => t.kill(true));
    const mobile = window.innerWidth <= 900;
    const calm = reduceMotion;
    const zone = (start, end) => ({ start, end: mobile ? end.replace(/(\d+)%/, (m, n) => `${Math.min(+n + 10, 95)}%`) : end, scrub: 0.8 });

    // Headings: each word or line rises out of its own mask, one after another.
    document.querySelectorAll('[data-mask]').forEach((title) => {
      let words = [...title.querySelectorAll('.w > span')];
      if (!words.length) {
        words = [...title.querySelectorAll('.w')].map((w) => {
          const inner = document.createElement('span');
          inner.append(...w.childNodes);
          w.append(inner);
          return inner;
        });
      }
      track(gsap.fromTo(words, { yPercent: 110, rotate: calm ? 0 : 2 }, {
        yPercent: 0, rotate: 0, ease: 'none', stagger: 0.4,
        scrollTrigger: { trigger: title, ...zone('top 95%', 'top 45%') },
      }));
    });

    // Paragraphs: line by line, each line rising out of its mask, like the page writing itself.
    document.querySelectorAll('[data-lines]').forEach((p) => {
      const lines = splitLines(p);
      track(gsap.fromTo(lines, { yPercent: 105, opacity: 0 }, {
        yPercent: 0, opacity: 1, ease: 'none', stagger: 0.25,
        scrollTrigger: { trigger: p, ...zone('top 92%', 'bottom 62%') },
      }));
    });

    // Large statements: they slide in from the reading side and come into focus.
    document.querySelectorAll('[data-slide]').forEach((el) => {
      track(gsap.fromTo(el, { xPercent: calm ? 4 : 12, opacity: 0, filter: calm ? 'none' : 'blur(10px)' }, {
        xPercent: 0, opacity: 1, filter: 'blur(0px)', ease: 'none',
        scrollTrigger: { trigger: el, ...zone('top 95%', 'top 55%') },
      }));
    });

    // The three transparency sentences arrive one after another, each from the right.
    const seq = [...document.querySelectorAll('[data-seq]')];
    if (seq.length) {
      track(gsap.fromTo(seq, { x: calm ? 30 : 120, opacity: 0 }, {
        x: 0, opacity: 1, ease: 'none', stagger: 0.6,
        scrollTrigger: { trigger: seq[0].parentNode, ...zone('top 90%', 'bottom 55%') },
      }));
    }

    // Small lines that close the story.
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      track(gsap.fromTo(el, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: el, ...zone('top 96%', 'top 75%') },
      }));
    });

    // The highlight under "רצון לעשות את הדברים קצת אחרת" is drawn as it is read (RTL: from the right).
    document.querySelectorAll('[data-marker]').forEach((m) => {
      track(gsap.fromTo(m, { backgroundSize: '0% 0.34em' }, {
        backgroundSize: '100% 0.34em', ease: 'none',
        scrollTrigger: { trigger: m, ...zone('top 80%', 'top 45%') },
      }));
    });

    // The file statement lights up word by word while it is read. Words stay whole.
    document.querySelectorAll('[data-words]').forEach((p) => {
      if (!p.querySelector('.word')) {
        const words = p.textContent.trim().split(/\s+/);
        p.textContent = '';
        words.forEach((word, i) => {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = word;
          p.append(span, i < words.length - 1 ? ' ' : '');
        });
      }
      track(gsap.fromTo(p.querySelectorAll('.word'), { opacity: 0.14, y: calm ? 0 : 10 }, {
        opacity: 1, y: 0, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: p, ...zone('top 85%', 'bottom 45%') },
      }));
    });

    // The year counts up to 2017 as it rises, slower than the page.
    document.querySelectorAll('[data-count]').forEach((el) => {
      const from = Number(el.dataset.count);
      const to = Number(el.dataset.final || (el.dataset.final = el.textContent.trim()));
      const n = { v: from };
      track(gsap.fromTo(n, { v: from }, {
        v: to, ease: 'none',
        onUpdate: () => { el.textContent = String(Math.round(n.v)); },
        scrollTrigger: { trigger: el, ...zone('top 98%', 'top 40%') },
      }));
    });
    document.querySelectorAll('[data-drift]').forEach((el) => {
      track(gsap.fromTo(el, { y: mobile ? 30 : 90 }, {
        y: mobile ? -20 : -60, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      }));
    });

    // The dark chapter opens like a curtain from the middle of the screen.
    document.querySelectorAll('[data-curtain]').forEach((el) => {
      track(gsap.fromTo(el, { clipPath: `inset(0% ${mobile ? 6 : 12}% 0% ${mobile ? 6 : 12}%)` }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 25%', scrub: 0.8 },
      }));
    });
  }


  // Keyframes depend on the layout, so they are measured again after load and on resize.
  const start = () => { story(); build(); ScrollTrigger.refresh(); };
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
