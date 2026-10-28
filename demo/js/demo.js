// EU Passport demo. Every part works without this file; it only adds the live check, the
// accordion, the cards, the video players and the motion layer.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);

// Smooth scroll (Lenis), driven by GSAP's ticker so ScrollTrigger stays in sync.
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({ autoRaf: !hasGsap, anchors: true, lerp: 0.1 });
  if (hasGsap) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

// ---------- Hero: the record becomes the file becomes the passport ----------
const states = [...document.querySelectorAll('[data-crossfade] figure')];
const stepLabels = [...document.querySelectorAll('.object-steps li')];
if (states.length > 1 && !reduceMotion) {
  let i = 0;
  let timer = null;
  const next = () => {
    states[i].classList.remove('is-on');
    stepLabels[i]?.classList.remove('is-on');
    i = (i + 1) % states.length;
    states[i].classList.add('is-on');
    stepLabels[i]?.classList.add('is-on');
  };
  const start = () => { if (!timer) timer = setInterval(next, 5600); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

// ---------- The live check ----------
const form = document.getElementById('check-form');
const verdict = document.getElementById('r-verdict');
const chain = document.getElementById('r-chain');
const note = document.getElementById('r-note');

const origin = {
  self: 'תעודת הלידה הרומנית שלכם',
  parent: 'רישום הלידה של ההורה',
  grand: 'רישום הלידה של סבא או סבתא',
  great: 'הרישומים של הדור הקודם',
};
const place = {
  ro: 'נאתר אותו בארכיונים ברומניה, עם הצוותים שלנו ביאשי ובבוקרשט',
  md: 'נאתר אותו בארכיונים במולדובה, עם הצוות שלנו שם',
  ua: 'נאתר אותו בבוקובינה, עם הצוות שלנו באוקראינה',
  unknown: 'נבדוק יחד את ההיסטוריה המשפחתית ונמצא איפה הרישום שמור',
};
const middle = {
  self: 'המסמכים הישראליים שלכם',
  parent: 'תעודת הלידה שלכם',
  grand: 'תעודות הלידה של ההורה ושלכם',
  great: 'שרשרת התעודות עד אליכם',
};

function item(title, detail) {
  const li = document.createElement('li');
  const span = document.createElement('span');
  const b = document.createElement('b');
  const small = document.createElement('small');
  b.textContent = title;
  small.textContent = detail;
  span.append(b, small);
  li.append(span);
  return li;
}

function renderCheck() {
  const data = new FormData(form);
  const who = data.get('who');
  const where = data.get('where');
  const age = data.get('age');
  verdict.textContent = who === 'great' ? 'שווה לבדוק אישית' : 'ייתכן שאתם זכאים';
  chain.replaceChildren(
    item(origin[who], place[where]),
    item(middle[who], 'את המסמכים הישראליים נוציא בשבילכם, עם אפוסטיל'),
    item('הדרכון הרומני', 'אחרי שבועת האמונים, בקונסוליה בישראל'),
  );
  const lang = age === 'senior'
    ? 'בני 65 ומעלה פטורים מתעודת השפה B1.'
    : 'ומה עם הרומנית? מאז מרץ 2025 רוב המבקשים הבגירים צריכים תעודת B1, רמה בינונית ולא שטף מלא.';
  const far = who === 'great' ? ' בדור רחוק יותר זה תלוי בפרטי המקרה, ולכן נבדוק אותו איתכם.' : '';
  note.textContent = `${lang} ילדים מתחת לגיל 18 יכולים להיכלל בבקשה שלכם.${far}`;
  if (hasGsap && !reduceMotion) {
    gsap.fromTo(chain.children, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' });
  }
}
form?.addEventListener('change', renderCheck);
form?.addEventListener('submit', (e) => e.preventDefault());

// ---------- Accordion of stages ----------
const stages = [...document.querySelectorAll('.stage')];
stages.forEach((stage) => {
  stage.querySelector('.stage-toggle').addEventListener('click', () => {
    stages.forEach((s) => {
      const open = s === stage;
      s.classList.toggle('is-open', open);
      s.querySelector('.stage-toggle').setAttribute('aria-expanded', String(open));
    });
  });
});

// ---------- Index cards: one open at a time ----------
const cards = [...document.querySelectorAll('.card')];
cards.forEach((card) => {
  card.querySelector('.card-q').addEventListener('click', () => {
    const wasOpen = card.classList.contains('is-open');
    cards.forEach((c) => {
      const open = c === card && !wasOpen;
      c.classList.toggle('is-open', open);
      c.querySelector('.card-q').setAttribute('aria-expanded', String(open));
    });
    if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 400);
  });
});

// ---------- Video facades: the player loads only on click ----------
// Drive embeds are a temporary source; swap driveEmbed() when videos move to a video host.
const driveEmbed = (id) => `https://drive.google.com/file/d/${id}/preview`;
const driveThumb = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
const modal = document.getElementById('video-modal');
const modalFrame = modal.querySelector('.modal-frame');

function makeIframe(id, title) {
  const iframe = document.createElement('iframe');
  iframe.src = driveEmbed(id);
  iframe.title = title;
  iframe.allow = 'autoplay; fullscreen';
  iframe.allowFullscreen = true;
  return iframe;
}

document.querySelectorAll('.video[data-drive-id]').forEach((el) => {
  const id = el.dataset.driveId;
  el.style.setProperty('--thumb', `url("${driveThumb(id)}")`);
  el.querySelector('.video-play').addEventListener('click', () => {
    if (el.dataset.modal === 'true') {
      modalFrame.replaceChildren(makeIframe(id, el.dataset.title));
      modal.showModal();
      lenis?.stop();
    } else {
      el.replaceChildren(makeIframe(id, el.dataset.title));
    }
  });
});
modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => { modalFrame.replaceChildren(); lenis?.start(); });
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

// ---------- Motion layer ----------
if (hasGsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // Hero: the counter assembles once on load.
  gsap.from(['.object', '.hero h1', '.hero-lede', '.hero-row'], {
    opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1,
  });

  // Every section: heading, then text, then picture, staggered as it enters.
  document.querySelectorAll('main section').forEach((section) => {
    const parts = section.querySelectorAll('.reveal');
    if (!parts.length) return;
    gsap.from(parts, {
      opacity: 0, y: 28, duration: 0.8, ease: 'power3.out', stagger: 0.075,
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
    });
  });

  // The menu items arrive line by line, like a list being written.
  gsap.from('.menu-item', {
    opacity: 0, x: 16, duration: 0.5, ease: 'power2.out', stagger: 0.04,
    scrollTrigger: { trigger: '.menu', start: 'top 70%', once: true },
  });

  // The table rows of the branches, then the route on the map draws itself.
  gsap.from('.branches-table tbody tr', {
    opacity: 0, y: 16, duration: 0.5, ease: 'power2.out', stagger: 0.07,
    scrollTrigger: { trigger: '.branches-table', start: 'top 85%', once: true },
  });
  gsap.from('.map .city', {
    scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)', stagger: 0.12,
    scrollTrigger: { trigger: '.map', start: 'top 75%', once: true },
  });

  // The footer blocks rise to their heights.
  gsap.from('.blocks span', {
    scaleY: 0, transformOrigin: '50% 100%', duration: 0.8, ease: 'power3.out', stagger: 0.04,
    scrollTrigger: { trigger: '.blocks', start: 'top 90%', once: true },
  });

  // One moving picture: the passport in the hand drifts closer as the close arrives.
  gsap.fromTo('[data-drift]', { scale: 1.12, yPercent: 4 }, {
    scale: 1, yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.close', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}
