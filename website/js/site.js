// Shared by every page: the side menu, the contact links, the lead form and the small
// entrance animations. Everything works without GSAP; GSAP only adds the motion.
(() => {
  const cfg = window.EUP_CONFIG || {};
  const hasGsap = !!window.gsap;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lenis = () => window.__lenis || null;

  // ---------- Enable accessibility widget ----------
  // Loaded from the installation address in js/config.js (the site's own Enable licence).
  // Until that address is set, nothing is loaded; the accessibility statement does not depend on it.
  if (cfg.enableScript && /^https:\/\/([a-z0-9-]+\.)*enable\.co\.il\//.test(cfg.enableScript)) {
    const s = document.createElement('script');
    s.src = cfg.enableScript;
    s.async = true;
    document.head.append(s);
  }

  // ---------- WhatsApp links, from one setting ----------
  const wa = (text) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text || cfg.whatsappText || '')}`;
  document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    a.href = wa(a.dataset.whatsapp);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // ---------- Side menu ----------
  // Closed by default. Opens from the menu button, closes on the close button, the veil,
  // Escape or a link. While open the page behind is inert and focus stays in the menu.
  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('side-menu');
  const veil = document.getElementById('menu-veil');
  if (btn && menu && veil) {
    const page = [...document.body.children].filter((el) => el !== menu && el !== veil && el !== btn && el.tagName !== 'SCRIPT');
    const links = [...menu.querySelectorAll('.sm-list a')];
    let open = false;
    let tl = null;

    const setOpen = (on, { focus = true } = {}) => {
      if (on === open) return;
      open = on;
      btn.setAttribute('aria-expanded', String(on));
      btn.classList.toggle('is-open', on);
      page.forEach((el) => { el.inert = on; });
      tl?.kill();
      if (on) {
        menu.hidden = false;
        veil.hidden = false;
        lenis()?.stop();
        document.documentElement.classList.add('menu-open');
        if (hasGsap) {
          tl = gsap.timeline()
            .fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'none' }, 0)
            .fromTo(menu, { xPercent: -100 }, { xPercent: 0, duration: reduceMotion ? 0.35 : 0.6, ease: 'power3.out' }, 0)
            .fromTo(links, { x: -28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.045 }, 0.15)
            .fromTo(menu.querySelector('.sm-foot'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, 0.4);
        }
        if (focus) (menu.querySelector('[aria-current="true"]') || links[0])?.focus({ preventScroll: true });
      } else {
        const done = () => { menu.hidden = true; veil.hidden = true; };
        lenis()?.start();
        document.documentElement.classList.remove('menu-open');
        if (hasGsap) {
          tl = gsap.timeline({ onComplete: done })
            .to(menu, { xPercent: -100, duration: reduceMotion ? 0.3 : 0.45, ease: 'power3.in' }, 0)
            .to(veil, { opacity: 0, duration: 0.35, ease: 'none' }, 0.05);
        } else done();
        if (focus) btn.focus({ preventScroll: true });
      }
    };

    btn.addEventListener('click', () => setOpen(!open));
    veil.addEventListener('click', () => setOpen(false));
    menu.querySelector('.sm-close').addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      // Keep Tab inside the menu.
      const f = [...menu.querySelectorAll('a, button')].filter((el) => !el.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // In-page links: close first, then glide to the section.
    links.forEach((a) => a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash.startsWith('#')) { setOpen(false, { focus: false }); return; }
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      setOpen(false, { focus: false });
      const go = () => {
        if (lenis()) lenis().scrollTo(target, { duration: 1.4 });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', hash);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      };
      setTimeout(go, hasGsap ? 260 : 0);
    }));

    // The section on screen is marked in the menu.
    const marks = links.map((a) => [a, a.getAttribute('href').startsWith('#') ? document.querySelector(a.getAttribute('href')) : null]).filter(([, t]) => t);
    if (marks.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          marks.forEach(([a, t]) => { if (t === en.target) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      marks.forEach(([, t]) => io.observe(t));
    }

    // The button turns dark on light sections and light on dark ones.
    const dark = [...document.querySelectorAll('[data-dark]')];
    const tone = () => {
      const y = 36;
      btn.classList.toggle('on-dark', dark.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
    };
    window.addEventListener('scroll', tone, { passive: true });
    tone();
  }

  // ---------- The lead form: one card per step ----------
  document.querySelectorAll('[data-lead]').forEach((form) => {
    const steps = [...form.querySelectorAll('.lf-step')];
    const bar = form.querySelector('.lf-bar i');
    const counter = form.querySelector('.lf-now');
    // Each field is tied to its error line, so a screen reader reads the error with the field.
    form.querySelectorAll('[data-rule]').forEach((field, i) => {
      const err = field.querySelector('.lf-err');
      err.id ||= `${form.closest('[id]')?.id || 'lf'}-err-${i}`;
      field.querySelectorAll('input:not([type=hidden])').forEach((inp) => {
        if (inp.name === 'relationOther') return;
        inp.setAttribute('aria-describedby', err.id);
        if (inp.type !== 'radio') inp.setAttribute('aria-required', 'true');
      });
    });
    const status = form.querySelector('.lf-status');
    const KEY = 'eup-lead';
    let at = 0;
    let busy = false;

    // Answers survive a step back, a reload or a move to another page in this tab.
    const save = () => {
      try { sessionStorage.setItem(KEY, JSON.stringify(Object.fromEntries(new FormData(form)))); } catch (e) { /* storage blocked */ }
    };
    try {
      const old = JSON.parse(sessionStorage.getItem(KEY) || '{}');
      Object.entries(old).forEach(([k, v]) => {
        const els = form.elements[k];
        if (!els) return;
        if (els instanceof RadioNodeList) [...els].forEach((r) => { r.checked = r.value === v; });
        else if (els.type !== 'hidden') els.value = v;
      });
    } catch (e) { /* nothing saved */ }
    form.addEventListener('input', save);
    form.addEventListener('change', save);
    // A field marked wrong is cleared as soon as it is put right.
    const recheck = (e) => {
      const field = e.target.closest('[data-rule]');
      if (!field || !field.classList.contains('is-bad')) return;
      const input = field.querySelector('input');
      if (rules[field.dataset.rule](input?.value || '')) return;
      field.classList.remove('is-bad');
      field.querySelector('.lf-err').textContent = '';
      field.querySelectorAll('input').forEach((i) => i.setAttribute('aria-invalid', 'false'));
    };
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    const rules = {
      name: (v) => (v.trim().length >= 2 ? '' : 'נא לכתוב שם מלא'),
      phone: (v) => (/^(?:\+?972-?|0)(?:[23489]|5\d|7\d)-?\d{3}-?\d{4}$/.test(v.replace(/[\s()]/g, '')) ? '' : 'נא לכתוב מספר טלפון תקין, למשל 050-1234567'),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'נא לכתוב כתובת אימייל תקינה'),
      relation: () => {
        const v = form.elements.relation?.value;
        if (!v) return 'נא לבחור מי במשפחה הגיע מרומניה';
        if (v === 'אחר' && !form.elements.relationOther.value.trim()) return 'נא לפרט מי במשפחה הגיע מרומניה';
        return '';
      },
    };

    function check(step) {
      let firstBad = null;
      step.querySelectorAll('[data-rule]').forEach((field) => {
        const rule = field.dataset.rule;
        const input = field.querySelector('input');
        const msg = rules[rule](input?.value || '');
        const err = field.querySelector('.lf-err');
        field.classList.toggle('is-bad', !!msg);
        err.textContent = msg;
        field.querySelectorAll('input').forEach((i) => i.setAttribute('aria-invalid', String(!!msg)));
        if (msg && !firstBad) firstBad = field.querySelector('input:not([type=radio]), input[type=radio]');
        if (msg && hasGsap && !reduceMotion) gsap.fromTo(field, { x: 0 }, { keyframes: { x: [0, -8, 7, -4, 0] }, duration: 0.4, ease: 'none' });
      });
      firstBad?.focus();
      return !firstBad;
    }

    function show(next, dir) {
      const from = steps[at];
      const to = steps[next];
      at = next;
      if (counter) counter.textContent = String(Math.min(next + 1, steps.length - 1));
      if (bar) bar.style.transform = `scaleX(${Math.min(next + 1, steps.length - 1) / (steps.length - 1)})`;
      const focusIn = () => (to.querySelector('input:not([type=hidden]), button, h3') || to).focus({ preventScroll: true });
      to.hidden = false;
      if (!hasGsap) { from.hidden = true; focusIn(); return; }
      // RTL: forward moves the old card out to the left and brings the new one in from the right.
      const out = dir > 0 ? -1 : 1;
      gsap.timeline({ onComplete: () => { from.hidden = true; gsap.set([from, to], { clearProps: 'all' }); focusIn(); } })
        .set(to, { position: 'absolute', inset: 0 })
        .to(from, { xPercent: out * (reduceMotion ? 12 : 60), rotation: reduceMotion ? 0 : out * -6, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0)
        .fromTo(to, { xPercent: -out * (reduceMotion ? 12 : 60), rotation: reduceMotion ? 0 : -out * -6, opacity: 0 }, { xPercent: 0, rotation: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.32)
        .set(to, { position: 'relative', inset: 'auto' });
    }

    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-go]');
      if (!b || busy) return;
      e.preventDefault();
      const dir = b.dataset.go === 'next' ? 1 : -1;
      if (dir > 0 && !check(steps[at])) return;
      show(at + dir, dir);
    });
    // Enter moves on, as "המשך" does, until the last card.
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
      const next = steps[at].querySelector('[data-go="next"]');
      if (next) { e.preventDefault(); next.click(); }
    });
    // "אחר" opens a short text field.
    const other = form.querySelector('.lf-other');
    const syncOther = () => { if (other) other.hidden = form.elements.relation?.value !== 'אחר'; };
    form.addEventListener('change', syncOther);
    syncOther();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy || !check(steps[at])) return;
      if (form.elements.website?.value) return; // a bot filled the hidden field
      const data = Object.fromEntries(new FormData(form));
      delete data.website;
      if (data.relation === 'אחר') data.relation = `אחר: ${data.relationOther || ''}`;
      delete data.relationOther;
      data.page = location.pathname.split('/').pop() || 'index.html';
      data.sentAt = new Date().toISOString();
      status.textContent = '';
      status.classList.remove('is-error');

      if (!cfg.leadEndpoint) {
        status.classList.add('is-error');
        status.innerHTML = '';
        status.append('הטופס עדיין לא מחובר למערכת קבלת הפניות, ולכן הפרטים לא נשלחו. אפשר לפנות אלינו ');
        const a = document.createElement('a');
        a.href = wa(`שלום, אני ${data.name}. טלפון: ${data.phone}. אימייל: ${data.email}. מי במשפחה הגיע מרומניה: ${data.relation}`);
        a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'בוואטסאפ';
        status.append(a, ' או בטלפון 074-7444000.');
        console.warn('EU Passport: set leadEndpoint in js/config.js to deliver leads.');
        return;
      }

      busy = true;
      form.classList.add('is-busy');
      try {
        const res = await fetch(cfg.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error(String(res.status));
        try { sessionStorage.removeItem(KEY); } catch (err) { /* ignore */ }
        const name = form.querySelector('.lf-thanks-name');
        if (name) name.textContent = data.name.trim().split(/\s+/)[0];
        show(steps.length - 1, 1);
        form.reset();
      } catch (err) {
        status.classList.add('is-error');
        status.textContent = 'השליחה לא הצליחה. נסו שוב בעוד רגע, או התקשרו אלינו: 074-7444000.';
      } finally {
        busy = false;
        form.classList.remove('is-busy');
      }
    });
  });

  // ---------- Footer: this year, and a quiet entrance ----------
  document.querySelectorAll('.ft-year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  if (hasGsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.site-foot').forEach((foot) => {
      gsap.from(foot.querySelectorAll('[data-foot] > *, .ft-grid > *'), {
        y: reduceMotion ? 12 : 40, opacity: 0, duration: reduceMotion ? 0.5 : 0.9, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: foot, start: 'top 85%', once: true },
      });
      // The outlined wordmark drifts sideways as the footer comes up.
      gsap.fromTo(foot.querySelector('.ft-word'), { xPercent: -42 }, {
        xPercent: -58, ease: 'none',
        scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    });
  }

  // ---------- Small entrances for pages without the scroll story ----------
  if (hasGsap && window.ScrollTrigger && document.querySelector('[data-enter]')) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('[data-enter]').forEach((el) => {
      gsap.from(el.children.length && el.dataset.enter === 'kids' ? el.children : el, {
        y: reduceMotion ? 12 : 36, opacity: 0, duration: reduceMotion ? 0.5 : 0.9, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }
})();
