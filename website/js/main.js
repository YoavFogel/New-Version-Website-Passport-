// EU Passport: the passport leaves the man's hand on scroll and travels down the page.
// One element (#passport) does the whole journey; everything is tied to the scroll position,
// so scrolling back up plays the same path in reverse (except in the journey section, where it
// runs on its own clock; see below). At the very top the passport docks
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

  // One controller, two sources. The scroll timeline writes `scrollPose`, the journey writes
  // `journey.pose()`, and render() blends them by `journey.mix` (0 = scroll, 1 = journey) and is
  // the only thing that ever moves the passport. So the hand-off between modes never jumps.
  const scrollPose = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
  let trigger = null;
  let scrollTl = null;
  let floatWidth = 0;
  let floatHeight = 0;
  let docked = true;

  // Docked: the passport is a plain layer of the photo (positioned by style.css).
  function dock() {
    if (docked) return;
    docked = true;
    passport.classList.remove('is-floating');
    gsap.set(passport, { clearProps: 'transform,width,opacity' });
  }
  // Floating: the same element, fixed to the viewport and moved by render().
  function undock() {
    if (!docked) return;
    docked = false;
    passport.classList.add('is-floating');
    gsap.set(passport, { width: floatWidth });
  }

  const set = {
    x: gsap.quickSetter(passport, 'x', 'px'),
    y: gsap.quickSetter(passport, 'y', 'px'),
    // quickSetter does not apply the 'scale' shorthand, so both axes are set.
    scale: ((sx, sy) => (v) => { sx(v); sy(v); })(gsap.quickSetter(passport, 'scaleX'), gsap.quickSetter(passport, 'scaleY')),
    rotation: gsap.quickSetter(passport, 'rotation', 'deg'),
    opacity: gsap.quickSetter(passport, 'opacity'),
  };
  function render() {
    // At the very top, after the scrub has caught up, the passport docks back into the photo.
    const atTop = scrollTl && scrollTl.time() <= 0.5 && journey.mix === 0;
    if (atTop) { dock(); return; }
    undock();
    const m = journey.mix;
    const j = m > 0 ? journey.pose() : null;
    for (const k of ['x', 'y', 'scale', 'rotation']) {
      set[k](j ? scrollPose[k] + (j[k] - scrollPose[k]) * m : scrollPose[k]);
    }
    // Opacity follows the mix more steeply, so a passport passing between a hidden rest and the
    // journey shows up only near its stage and never drifts half-faded over the text.
    set.opacity(j ? scrollPose.opacity + (j.opacity - scrollPose.opacity) * m ** 3 : scrollPose.opacity);
  }
  gsap.ticker.add(render);

  function build() {
    trigger?.kill();
    trigger = null;
    docked = false;
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
    floatHeight = ph;
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
    // On a phone it lifts up and to the left while the photo is still on screen, then fades
    // before the next title arrives.
    if (phone) keys.push(at(vh * 0.35, edge + (pw * 1.1) / 2 + 10, vh * 0.34, 1.1, 0));
    else keys.push(at(vh * 0.5, hand.cx + vw * 0.14, vh * 0.4, 1.28, 4));

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
    tl.set(scrollPose, { x: first.x, y: first.y, scale: first.scale, rotation: first.rotation, opacity: 1 }, 0);
    rest.forEach((k, i) => {
      const prev = keys[i];
      const duration = Math.max(k.s - prev.s, 1);
      tl.to(scrollPose, {
        x: k.x, y: k.y, scale: k.scale, rotation: k.rotation,
        duration, ease: i === 0 ? 'power1.out' : 'sine.inOut',
      }, prev.s);
      // A fade takes only a short stretch of scroll: out right after it leaves a rest, in just
      // before it reaches one, so it is never seen half-faded in the middle of the text.
      if (k.opacity !== prev.opacity) {
        const win = Math.min(duration, vh * 0.15);
        tl.to(scrollPose, { opacity: k.opacity, duration: win, ease: 'power1.inOut' }, k.opacity > prev.opacity ? k.s - win : prev.s);
      }
    });
    if (tl.duration() < max) tl.to({}, { duration: max - tl.duration() }, tl.duration());
    scrollTl = tl;

    trigger = ScrollTrigger.create({
      start: 0,
      end: () => max,
      // A phone follows the thumb closely; a lag there reads as the passport sliding off course.
      scrub: phone ? 0.35 : reduceMotion ? 0.3 : 1,
      animation: tl,
    });
    tl.progress(trigger.progress);
    journey.layout(phone);
    render();
  }

  // ---------- The journey: nine stages on the passport's own clock ----------
  // Scroll only decides whether the visitor is here. While the stages are in view the passport
  // leaves its scroll path (mix 0 -> 1), travels stage to stage on a timer, and when the last
  // stage has been shown, or the visitor scrolls away early, it rejoins the scroll (mix -> 0).
  const journey = (() => {
    const wrap = document.getElementById('tl');
    const svg = wrap?.querySelector('.tl-path');
    const track = svg?.querySelector('.tl-track');
    const done = svg?.querySelector('.tl-done');
    const stages = wrap ? [...wrap.querySelectorAll('.stage')] : [];
    const MOVE = reduceMotion ? 0.7 : 0.9;   // seconds between stages
    const HOLD = 1.35;                       // seconds on each stage, long enough to read the title
    const ACTIVE = 1.24;                     // matches .stage.is-active .tl-circle in style.css
    const api = { mix: 0, len: 0 };
    let nodes = [];
    let total = 0;
    let phone = false;
    let runTl = null;
    let mixTween = null;
    let state = 'idle';                      // idle | running | stopped | done (any but running can start)
    let reached = 0;                         // next stage to show when resuming
    let watch = null;

    // Position of an element inside an ancestor, without transforms (layout only).
    function offsetIn(el, anc) {
      let x = 0, y = 0, n = el;
      while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y };
    }

    // A smooth curve through the stage centres (Catmull-Rom as cubic Béziers).
    function pathThrough(pts) {
      let d = `M${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const t = 0.5 / 3;
        d += ` C${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
      }
      return d;
    }

    api.layout = (isPhone) => {
      if (!wrap) return;
      phone = isPhone;
      const pts = stages.map((st) => {
        const c = st.querySelector('.tl-circle');
        const o = offsetIn(c, wrap);
        return { x: o.x + c.offsetWidth / 2, y: o.y + c.offsetHeight / 2, r: c.offsetWidth / 2 };
      });
      svg.setAttribute('viewBox', `0 0 ${wrap.offsetWidth} ${wrap.offsetHeight}`);
      const d = pathThrough(pts);
      track.setAttribute('d', d);
      done.setAttribute('d', d);
      total = track.getTotalLength();
      done.style.strokeDasharray = `${total}`;
      // Where on the path each stage sits.
      nodes = pts.map((p) => {
        let best = 0, bestD = Infinity;
        for (let l = 0; l <= total; l += 2) {
          const q = track.getPointAtLength(l);
          const dd = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (dd < bestD) { bestD = dd; best = l; }
        }
        return best;
      });
      api.radius = pts[0].r;
      if (state === 'done') api.len = total;
      api.len = Math.min(api.len || nodes[0], total);
      paint();
    };

    function paint() { if (done) done.style.strokeDashoffset = `${total - api.len}`; }

    // The passport's pose on the path, in viewport coordinates: above the circle on desktop,
    // on the circle's outer shoulder on a phone. Small enough to leave the title clear.
    api.pose = () => {
      const box = svg.getBoundingClientRect();
      const sx = box.width / (wrap.offsetWidth || 1);
      const q = track.getPointAtLength(api.len);
      const R = api.radius * ACTIVE;
      const targetW = phone ? R * 0.95 : R * 1.0;
      const scale = targetW / floatWidth;
      const h = floatHeight * scale;
      const cx = box.left + q.x * sx + (phone ? R * 0.9 : 0);
      const cy = box.top + q.y * sx - (phone ? R * 0.55 : R + h / 2 + 8);
      return { x: cx - floatWidth / 2, y: cy - floatHeight / 2, scale, rotation: 0, opacity: 1 };
    };

    function setActive(i) {
      stages.forEach((st, k) => {
        st.classList.toggle('is-active', k === i);
        if (k < i) st.classList.add('is-visited');
      });
    }

    function mixTo(v, dur) {
      mixTween?.kill();
      mixTween = gsap.to(api, { mix: v, duration: dur, ease: 'power2.inOut' });
      return mixTween;
    }

    // Entering: a short step out and back resumes where it stopped; any other return plays the
    // journey again from stage 1. The passport always glides along the path to its starting
    // stage, so a return in the middle of an exit never jumps.
    let leftAt = 0;
    function run() {
      runTl?.kill();
      const resume = state === 'stopped' && performance.now() - leftAt < 1500;
      const from = resume ? reached : 0;
      if (!resume) {
        reached = 0;
        stages.forEach((st) => st.classList.remove('is-active', 'is-visited'));
      }
      state = 'running';
      const visible = api.mix > 0.05;
      if (!visible) { api.len = nodes[from]; paint(); }
      mixTo(1, 1.0);
      runTl = gsap.timeline();
      if (visible) runTl.to(api, { len: nodes[from], duration: MOVE, ease: 'power2.inOut', onUpdate: paint });
      else runTl.to({}, { duration: 0.85 });
      runTl.call(() => setActive(from));
      for (let i = from; i < nodes.length; i++) {
        runTl.to({}, { duration: HOLD });
        if (i < nodes.length - 1) {
          runTl.call(() => { stages[i].classList.remove('is-active'); stages[i].classList.add('is-visited'); reached = i + 1; });
          runTl.to(api, { len: nodes[i + 1], duration: MOVE, ease: 'power2.inOut', onUpdate: paint });
          runTl.call(() => setActive(i + 1));
        }
      }
      // After the last stage: it lifts off the path and rejoins the scroll.
      runTl.call(() => { stages.at(-1).classList.remove('is-active'); stages.at(-1).classList.add('is-visited'); reached = nodes.length; state = 'done'; mixTo(0, 1.2); });
    }

    function leave() {
      if (state !== 'running') return;
      runTl?.kill();
      state = 'stopped';
      leftAt = performance.now();
      stages.forEach((st) => st.classList.remove('is-active'));
      mixTo(0, phone ? 0.6 : 0.9);
    }

    api.watch = () => {
      if (!wrap) return;
      watch?.kill();
      watch = ScrollTrigger.create({
        trigger: wrap,
        // Running while most of the stages are in view, in either scroll direction.
        start: () => (phone ? 'top 75%' : 'top 70%'),
        end: () => (phone ? 'bottom 25%' : 'bottom 30%'),
        onToggle: (self) => { if (self.isActive) run(); else leave(); },
      });
    };
    return api;
  })();
  journey.watch();

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
      // Words stay inline (no transform), so the spaces between them always render.
      track(gsap.fromTo(p.querySelectorAll('.word'), { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: p, ...zone('top 85%', 'bottom 45%') },
      }));
    });

    // The year counts up to 2019 as it rises, slower than the page.
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


  // ---------- What you get from us ----------
  // Same rule as the story: everything is scrubbed to the scroll, nothing waits on a timer and
  // nothing pins the page. The map is the one elaborate move; the rest is type and small lines.
  function services() {
    const mobile = window.innerWidth <= 900;
    const calm = reduceMotion;
    const scrub = 0.8;

    // The principle: the lead-in first, then the line itself rises larger out of its mask.
    const pr = document.getElementById('principle');
    if (pr) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: pr, start: 'top 88%', end: mobile ? 'bottom 55%' : 'bottom 50%', scrub } });
      tl.fromTo(pr.querySelector('.pr-a'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'none', duration: 0.35 })
        .fromTo(pr.querySelector('.pr-in'), { yPercent: 105, scale: calm ? 0.96 : 0.9 }, { yPercent: 0, scale: 1, ease: 'power2.out', duration: 0.65 }, 0.3);
      track(tl);
    }

    // Highlights drawn one after another while the line is read.
    document.querySelectorAll('[data-markers]').forEach((p) => {
      track(gsap.fromTo(p.querySelectorAll('.marker'), { backgroundSize: '0% 0.32em' }, {
        backgroundSize: '100% 0.32em', ease: 'none', stagger: 0.5,
        scrollTrigger: { trigger: p, start: 'top 85%', end: mobile ? 'bottom 50%' : 'bottom 45%', scrub },
      }));
      track(gsap.fromTo(p, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: p, start: 'top 95%', end: 'top 75%', scrub } }));
    });

    // 01: the thread is drawn down beside the paragraphs as they are read.
    document.querySelectorAll('.sv-thread').forEach((th) => {
      track(gsap.fromTo(th, { '--p': 0 }, {
        '--p': 1, ease: 'none',
        scrollTrigger: { trigger: th.parentNode, start: 'top 75%', end: 'bottom 55%', scrub },
      }));
    });

    // 02: six loose papers, scattered, settle into one file and the file closes over them.
    const docs = document.getElementById('sv-docs');
    if (docs) {
      const papers = [...docs.querySelectorAll('.doc')];
      const spread = calm ? 0.55 : 1;
      const from = [[-38, -30, -14], [34, -34, 11], [-44, 12, 8], [40, 6, -9], [-14, 36, -6], [16, -6, 16]];
      const tl = gsap.timeline({ scrollTrigger: { trigger: docs, start: 'top 85%', end: mobile ? 'bottom 50%' : 'center 40%', scrub } });
      papers.forEach((d, i) => {
        const [x, y, r] = from[i];
        tl.fromTo(d, { xPercent: x * 2.2 * spread, yPercent: y * 1.6 * spread, rotation: r * spread, opacity: 0 }, {
          xPercent: (i - 2.5) * 6, yPercent: -i * 3, rotation: (i - 2.5) * 2, opacity: 1, ease: 'power2.inOut', duration: 1,
        }, i * 0.08);
      });
      tl.fromTo(docs.querySelector('.folder-back'), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: 'none', duration: 0.4 }, 0.5)
        .fromTo(docs.querySelector('.folder-front'), { yPercent: 70, opacity: 0, rotationX: calm ? 0 : -50 }, { yPercent: 0, opacity: 1, rotationX: 0, ease: 'power2.out', duration: 0.5 }, 1.0);
      track(tl);
    }

    // 03: the flight from Israel to Bucharest, then the four teams, Bucharest first.
    const map = document.getElementById('sv-map');
    if (map) {
      const route = map.querySelector('#map-route');
      const plane = map.querySelector('#map-plane');
      const len = route.getTotalLength();
      const cities = ['buc', 'ias', 'chi', 'cze'].map((c) => ({
        dot: map.querySelector(`[data-city="${c}"]`),
        label: map.querySelector(`[data-label="${c}"]`),
      }));
      const links = [...map.querySelectorAll('.link')];
      links.forEach((l) => { const n = l.getTotalLength(); l.style.strokeDasharray = `${n}`; l.dataset.len = n; });
      route.style.strokeDasharray = `${len}`;
      const fly = { p: 0 };
      const placePlane = () => {
        const p = Math.min(fly.p, 0.999);
        const a = route.getPointAtLength(p * len);
        const b = route.getPointAtLength(Math.min(p * len + 2, len));
        const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        // It grows as it climbs and settles as it lands.
        const s = 1 + Math.sin(Math.PI * fly.p) * (calm ? 0.1 : 0.35);
        plane.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang}) scale(${s})`);
        plane.style.opacity = fly.p >= 1 ? 0 : 1;
        route.style.strokeDashoffset = `${len * (1 - fly.p)}`;
      };
      const st = mobile
        ? { trigger: map, start: 'top 80%', end: 'bottom 80%', scrub }
        : { trigger: map.parentNode, start: 'top 25%', end: 'bottom 92%', scrub };
      const tl = gsap.timeline({ scrollTrigger: st });
      tl.fromTo(map.querySelector('.map-base'), { opacity: 0.35, scale: calm ? 1 : 1.06 }, { opacity: 1, scale: 1, ease: 'none', duration: 0.12 }, 0)
        .fromTo(map.querySelector('.map-origin'), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.04)
        .fromTo(fly, { p: 0 }, { p: 1, ease: 'power1.inOut', duration: 0.42, onUpdate: placePlane }, 0.08);
      cities.forEach((c, i) => {
        const at = 0.5 + i * 0.12;
        if (i > 0) tl.fromTo(links[i - 1], { strokeDashoffset: links[i - 1].dataset.len }, { strokeDashoffset: 0, ease: 'none', duration: 0.08 }, at - 0.07);
        tl.fromTo(c.dot, { scale: 0, transformOrigin: '50% 50%' }, {
          scale: 1, ease: calm ? 'none' : 'back.out(2.4)', duration: 0.06,
          onComplete: () => c.dot.classList.add('is-on'),
          onReverseComplete: () => c.dot.classList.remove('is-on'),
        }, at)
          .fromTo(c.label, { opacity: 0, y: 8 }, { opacity: 1, y: 0, ease: 'none', duration: 0.06 }, at + 0.02);
      });
      tl.to({}, { duration: 0.08 });
      placePlane();
      track(tl);
    }

    // 04: the file is carried across on one unbroken line, and handed over at the far end.
    const relay = document.getElementById('sv-relay');
    if (relay) {
      const file = relay.querySelector('.relay-file');
      const tl = gsap.timeline({ scrollTrigger: { trigger: relay, start: 'top 80%', end: mobile ? 'bottom 35%' : 'bottom 45%', scrub } });
      tl.fromTo(relay.querySelector('.relay-line i'), { '--p': 0 }, { '--p': 1, ease: 'none', duration: 1 }, 0)
        .fromTo(file, { x: 0 }, { x: () => -(relay.offsetWidth - 16), ease: 'none', duration: 1 }, 0)
        .fromTo(file, { y: 0 }, { keyframes: { y: [0, calm ? -4 : -10, 0] }, ease: 'sine.inOut', duration: 1 }, 0)
        .fromTo(relay.querySelector('.relay-to b'), { scale: 1 }, { scale: 1.5, ease: 'back.out(3)', duration: 0.12 }, 0.92);
      track(tl);
    }

    // 05: the last line rises out of its mask, and the passport it speaks of is underlined.
    document.querySelectorAll('[data-final]').forEach((el) => {
      const lines = [...el.querySelectorAll('.fl')].map((fl) => {
        let inner = fl.querySelector(':scope > .fl-in');
        if (!inner) { inner = document.createElement('span'); inner.className = 'fl-in'; inner.append(...fl.childNodes); fl.append(inner); }
        return inner;
      });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', end: mobile ? 'bottom 45%' : 'bottom 50%', scrub } });
      tl.fromTo(lines, { yPercent: 108 }, { yPercent: 0, ease: 'power2.out', stagger: 0.25, duration: 0.6 })
        .fromTo(el.querySelector('.marker'), { backgroundSize: '0% 0.3em' }, { backgroundSize: '100% 0.3em', ease: 'none', duration: 0.4 }, 0.6);
      track(tl);
    });
  }


  // ---------- Questions and answers: a wheel of cards ----------
  // The cards stand on a half circle. One value, `rot`, says which card is at the top; every
  // card's place on the arc follows from it, so arrows, keys, a drag or a click on a side card
  // all just move `rot`. The card at the top turns over on a click to show its answer.
  // The scroll only opens the fan as the section arrives; it never moves the wheel itself.
  const faq = (() => {
    const section = document.getElementById('faq');
    const wheel = document.getElementById('qa-wheel');
    const api = { build() {} };
    if (!section || !wheel) return api;
    const items = [...wheel.querySelectorAll('.qa')];
    const N = items.length;
    const now = section.querySelector('.qa-now');
    const st = { rot: 0, fan: 0 };
    let geo = { R: 1100, step: 17, px: 330 };
    let active = 0;
    let spin = null;
    section.classList.add('is-wheel');

    const wrap = (d) => ((((d + N / 2) % N) + N) % N) - N / 2;

    function render() {
      items.forEach((it, i) => {
        const d = wrap(i - st.rot);
        const ad = Math.abs(d);
        // RTL: the next question waits on the left.
        const a = -d * geo.step * st.fan * Math.PI / 180;
        const x = geo.R * Math.sin(a);
        const y = geo.R * (1 - Math.cos(a)) + (1 - st.fan) * 60;
        const scale = (1 - Math.min(ad, 3) * 0.07) * (0.92 + 0.08 * st.fan);
        const op = Math.max(0, Math.min(1, 2.6 - ad)) * (ad < 0.5 ? 1 : st.fan);
        it.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(a * 180 / Math.PI).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        it.style.opacity = op.toFixed(3);
        it.style.zIndex = String(100 - Math.round(ad * 10));
        it.style.visibility = op < 0.02 ? 'hidden' : 'visible';
      });
    }

    function setActive(i) {
      if (i === active && items[i].classList.contains('is-active')) return;
      items.forEach((it, k) => {
        const on = k === i;
        it.classList.toggle('is-active', on);
        const btn = it.querySelector('.qa-card');
        btn.tabIndex = on ? 0 : -1;
        if (!on && it.classList.contains('is-flipped')) flip(it, false);
      });
      active = i;
      if (now) now.textContent = String(i + 1).padStart(2, '0');
    }

    function flip(it, on) {
      it.classList.toggle('is-flipped', on);
      it.querySelector('.qa-card').setAttribute('aria-expanded', String(on));
    }

    // Turn the wheel to card i by the short way round.
    function go(i, dur = reduceMotion ? 0.5 : 0.75) {
      const target = st.rot + wrap(i - st.rot);
      spin?.kill();
      spin = gsap.to(st, { rot: target, duration: dur, ease: 'power3.out', onUpdate: render, onComplete: () => { st.rot = ((Math.round(st.rot) % N) + N) % N; render(); } });
      setActive(((Math.round(target) % N) + N) % N);
    }

    section.querySelector('.qa-next').addEventListener('click', () => go(active + 1));
    section.querySelector('.qa-prev').addEventListener('click', () => go(active - 1));
    section.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      go(active + (e.key === 'ArrowLeft' ? 1 : -1));
      items[active].querySelector('.qa-card').focus({ preventScroll: true });
    });

    // A drag turns the wheel with the finger; a flick carries on to the next card.
    let drag = null;
    let dragged = false;
    wheel.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      spin?.kill();
      drag = { x: e.clientX, y: e.clientY, rot: st.rot, t: performance.now(), lastX: e.clientX, v: 0, id: e.pointerId, on: false };
      dragged = false;
    });
    wheel.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.on) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - drag.y)) return;
        drag.on = true;
        wheel.classList.add('is-dragging');
        wheel.setPointerCapture(e.pointerId);
      }
      const t = performance.now();
      drag.v = (e.clientX - drag.lastX) / Math.max(t - drag.t, 1);
      drag.t = t; drag.lastX = e.clientX;
      st.rot = drag.rot - dx / geo.px;
      render();
    });
    const release = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.on) {
        dragged = true;
        wheel.classList.remove('is-dragging');
        const fling = -drag.v * 0.35; // px per ms -> cards
        go(Math.round(st.rot + Math.max(-1, Math.min(1, fling))));
      }
      drag = null;
    };
    wheel.addEventListener('pointerup', release);
    wheel.addEventListener('pointercancel', release);

    items.forEach((it, i) => {
      const btn = it.querySelector('.qa-card');
      btn.addEventListener('click', () => {
        if (dragged) { dragged = false; return; }
        if (i === active) flip(it, !it.classList.contains('is-flipped'));
        else go(i);
      });
      // Keyboard focus brings a card to the top; a pointer press is left to the click.
      btn.addEventListener('focus', () => { if (i !== active && btn.matches(':focus-visible')) go(i); });
    });

    api.build = () => {
      const phone = window.innerWidth <= 900;
      const cw = items[0].offsetWidth;
      // Neighbours stand a card's width (plus a gap) to the side.
      const step = phone ? 12 : 16;
      const px = cw * (phone ? 1.06 : 1.1);
      geo = { step, px, R: px / Math.sin(step * Math.PI / 180) };
      setActive(active);
      // The fan opens as the cards arrive on screen, from one stack into the arc.
      track(gsap.fromTo(st, { fan: 0 }, {
        fan: 1, ease: 'none', onUpdate: render,
        scrollTrigger: { trigger: wheel, start: 'top 92%', end: phone ? 'top 45%' : 'top 40%', scrub: 0.6 },
      }));
      render();
    };
    return api;
  })();


  // Keyframes depend on the layout, so they are measured again after load and on resize.
  const start = () => { story(); services(); faq.build(); build(); ScrollTrigger.refresh(); };
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
